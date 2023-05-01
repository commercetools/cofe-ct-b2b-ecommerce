import { AddressDraft, CartDraft, CartUpdateAction } from '@commercetools/platform-sdk';
import { LineItemReturnItemDraft } from '../types/cart/LineItem';
import { Cart as CommercetoolsCart } from '@commercetools/platform-sdk';
import {
  CartAddLineItemAction,
  CartSetCustomerIdAction,
  CartUpdate,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/cart';
import { OrderFromCartDraft } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/order';
import { Organization } from '../types/organization/organization';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { CartApi as BaseCartApi } from 'cofe-ct-ecommerce/apis/CartApi';
import { isReadyForCheckout } from 'cofe-ct-ecommerce/utils/Cart';
import { CartMapper } from '../mappers/CartMapper';
import { Account } from '@commercetools/frontend-domain-types/account/Account';
import { Cart } from '../types/cart/Cart';
import { Order } from '../types/cart/Order';
import { LineItem } from '../types/cart/LineItem';
import { Context } from '@frontastic/extension-types';

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export class CartApi extends BaseCartApi {
  protected organization?: Organization;
  protected account?: Account;
  protected associateEndpoints?;
  constructor(frontasticContext: Context, locale: string, organization?: Organization, account?: Account) {
    super(frontasticContext, locale);
    this.account = account;
    this.organization = organization;
    this.associateEndpoints =
      account && organization
        ? this.getApiForProject()
            .asAssociate()
            .withAssociateIdValue({ associateId: account.accountId })
            .inBusinessUnitKeyWithBusinessUnitKeyValue({ businessUnitKey: organization.businessUnit.key })
        : this.getApiForProject();
  }

  getForUser: (account?: Account, organization?: Organization) => Promise<Cart> = async (
    account: Account = this.account,
    organization: Organization = this.organization,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const allCarts = await this.getAllCarts(account, organization);
      if (allCarts.length >= 1) {
        const cart = (await this.buildCartWithAvailableShippingMethods(allCarts[0], locale)) as Cart;
        if (this.assertCartOrganization(cart, organization)) {
          return cart;
        }
      }

      return (await this.createCart(account.accountId, organization)) as Cart;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getForUser failed. ${error}`);
    }
  };

  getAllCarts: (account?: Account, organization?: Organization) => Promise<CommercetoolsCart[]> = async (
    account: Account = this.account,
    organization: Organization = this.organization,
  ) => {
    try {
      const where = [`cartState="Active"`, `store(key="${organization.store?.key}")`];

      if (!organization.superUserBusinessUnitKey) {
        where.push(`customerId="${account.accountId}"`);
      }

      const response = await this.associateEndpoints
        .carts()
        .get({
          queryArgs: {
            limit: 15,
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
            where,
            sort: 'createdAt desc',
          },
        })
        .execute();

      if (response.body.count >= 1) {
        return response.body.results;
      }
      return [];
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getForUser failed. ${error}`);
    }
  };

  getAllForSuperUser: (account?: Account, organization?: Organization) => Promise<Cart[]> = async (
    account: Account = this.account,
    organization: Organization = this.organization,
  ) => {
    const locale = await this.getCommercetoolsLocal();
    const allCarts = await this.getAllCarts(account, organization);
    if (allCarts.length >= 1) {
      return allCarts.map((cart) => CartMapper.commercetoolsCartToCart(cart, locale));
    }
    return [];
  };

  createCart: (customerId?: string, organization?: Organization) => Promise<Cart> = async (
    customerId: string = this.account?.accountId,
    organization: Organization = this.organization,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartDraft: Writeable<CartDraft> = {
        currency: locale.currency,
        country: locale.country,
        locale: locale.language,
        store: {
          key: organization.store?.key,
          typeId: 'store',
        },
        inventoryMode: 'ReserveOnOrder',
      };

      if (!organization.superUserBusinessUnitKey) {
        cartDraft.customerId = customerId;
      } else {
        cartDraft.origin = 'Merchant';
      }

      const commercetoolsCart = await this.associateEndpoints
        .carts()
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartDraft,
        })
        .execute();

      return (await this.buildCartWithAvailableShippingMethods(commercetoolsCart.body, locale)) as Cart;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw error;
    }
  };

  // @ts-ignore
  addToCart: (cart: Cart, lineItem: LineItem) => Promise<Cart> = async (cart: Cart, lineItem: LineItem) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'addLineItem',
            sku: lineItem.variant.sku,
            quantity: +lineItem.count,
          },
        ],
      };
      if (lineItem.variant.distributionChannelId) {
        (cartUpdate.actions[0] as Writeable<CartAddLineItemAction>).distributionChannel = {
          id: lineItem.variant.distributionChannelId,
          typeId: 'channel',
        };
      }
      if (lineItem.variant.supplyChannelId) {
        (cartUpdate.actions[0] as Writeable<CartAddLineItemAction>).supplyChannel = {
          id: lineItem.variant.supplyChannelId,
          typeId: 'channel',
        };
      }

      const oldLineItem = cart.lineItems?.find((li) => li.variant?.sku === lineItem.variant.sku);
      if (oldLineItem) {
        cartUpdate.actions.push({
          action: 'setLineItemShippingDetails',
          lineItemId: oldLineItem.lineItemId,
          shippingDetails: null,
        });
      }

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return (await this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale)) as Cart;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`addToCart failed. ${error}`);
    }
  };

  // @ts-ignore
  addItemsToCart: (cart: Cart, lineItems: LineItem[]) => Promise<Cart> = async (cart: Cart, lineItems: LineItem[]) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const actions: CartUpdateAction[] = [];
      lineItems.forEach((lineItem) => {
        const action: Writeable<CartUpdateAction> = {
          action: 'addLineItem',
          sku: lineItem.variant.sku,
          quantity: +lineItem.count,
        };
        if (lineItem.variant.distributionChannelId) {
          action.distributionChannel = {
            id: lineItem.variant.distributionChannelId,
            typeId: 'channel',
          };
        }
        if (lineItem.variant.supplyChannelId) {
          action.supplyChannel = {
            id: lineItem.variant.supplyChannelId,
            typeId: 'channel',
          };
        }
        actions.push(action);
        const oldLineItem = cart.lineItems?.find((li) => li.variant?.sku === lineItem.variant.sku);
        if (oldLineItem) {
          actions.push({
            action: 'setLineItemShippingDetails',
            lineItemId: oldLineItem.lineItemId,
            shippingDetails: null,
          });
        }
      });
      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions,
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`addToCart failed. ${error}`);
    }
  };

  // @ts-ignore
  updateLineItem: (cart: Cart, lineItem: Omit<LineItem, 'variant'>) => Promise<Cart> = async (cart: Cart, lineItem: LineItem) => {
    const locale = await this.getCommercetoolsLocal();

    const cartUpdate: CartUpdate = {
      version: +cart.cartVersion,
      actions: [
        {
          action: 'changeLineItemQuantity',
          lineItemId: lineItem.lineItemId,
          quantity: +lineItem.count,
        },
      ],
    };

    const oldLineItem = cart.lineItems?.find((li) => li.lineItemId === lineItem.lineItemId);
    if (oldLineItem) {
      cartUpdate.actions.push({
        action: 'setLineItemShippingDetails',
        lineItemId: oldLineItem.lineItemId,
        shippingDetails: null,
      });
    }

    const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

    return (await this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale)) as Cart;
  };

  // @ts-ignore
  removeAllLineItems: (cart: Cart) => Promise<Cart> = async (cart: Cart) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: cart.lineItems.map((lineItem) => ({
          action: 'removeLineItem',
          lineItemId: lineItem.lineItemId,
        })),
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`removeLineItem failed. ${error}`);
    }
  };

  // @ts-ignore
  setCustomerId: (cart: Cart, customerId: string) => Promise<Cart> = async (cart: Cart, customerId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setCustomerId',
            customerId,
          } as CartSetCustomerIdAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setCustomerId failed. ${error}`);
    }
  };

  // @ts-ignore
  order: (cart: Cart, payload?: any) => Promise<Order> = async (cart: Cart, payload?: any) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const date = new Date();

      const orderFromCartDraft: OrderFromCartDraft = {
        id: cart.cartId,
        version: +cart.cartVersion,
        orderNumber: `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}-${String(Date.now()).slice(
          -6,
          -1,
        )}`,
        orderState: 'Confirmed',
      };
      if (typeof payload === 'object' && payload?.poNumber) {
        // @ts-ignore
        orderFromCartDraft.purchaseOrderNumber = payload.poNumber;
      }

      if (!isReadyForCheckout(cart)) {
        throw new Error('Cart not complete yet.');
      }

      const response = await this.associateEndpoints
        .orders()
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: orderFromCartDraft,
        })
        .execute();

      return CartMapper.commercetoolsOrderToOrder(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`order failed. ${error}`);
    }
  };

  getOrder: (orderNumber: string) => Promise<Order> = async (orderNumber: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.associateEndpoints
        .orders()
        .withOrderNumber({ orderNumber })
        .get({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
        })
        .execute();

      return CartMapper.commercetoolsOrderToOrder(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`get orders failed. ${error}`);
    }
  };

  updateOrderState: (orderNumber: string, orderState: string) => Promise<Order> = async (
    orderNumber: string,
    orderState: string,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getOrder(orderNumber).then((order) => {
        if (order.orderState === 'Complete') {
          throw 'Cannot cancel a Completed order.';
        }
        return this.associateEndpoints
          .orders()
          .withOrderNumber({ orderNumber })
          .post({
            body: {
              version: +order.orderVersion,
              actions: [
                {
                  action: 'changeOrderState',
                  orderState,
                },
              ],
            },
            queryArgs: {
              expand: [
                'lineItems[*].discountedPrice.includedDiscounts[*].discount',
                'discountCodes[*].discountCode',
                'paymentInfo.payments[*]',
              ],
            },
          })
          .execute();
      });

      return CartMapper.commercetoolsOrderToOrder(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`get orders failed. ${error}`);
    }
  };

  protected async updateCart(cartId: string, cartUpdate: CartUpdate, locale: Locale): Promise<CommercetoolsCart> {
    return await this.associateEndpoints
      .carts()
      .withId({
        ID: cartId,
      })
      .post({
        queryArgs: {
          expand: [
            'lineItems[*].discountedPrice.includedDiscounts[*].discount',
            'discountCodes[*].discountCode',
            'paymentInfo.payments[*]',
          ],
        },
        body: cartUpdate,
      })
      .execute()
      .then((response) => {
        return response.body;
      })
      .catch((error) => {
        throw new Error(`Update cart failed ${error}`);
      });
  }

  returnItems: (orderNumber: string, returnLineItems: LineItemReturnItemDraft[]) => Promise<Order> = async (
    orderNumber: string,
    returnLineItems: LineItemReturnItemDraft[],
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getOrder(orderNumber).then((order) => {
        return this.associateEndpoints
          .orders()
          .withOrderNumber({ orderNumber })
          .post({
            body: {
              version: +order.orderVersion,
              actions: [
                {
                  action: 'addReturnInfo',
                  items: returnLineItems,
                  returnDate: new Date().toISOString(),
                  returnTrackingId: new Date().getTime().toString(),
                },
              ],
            },
          })
          .execute();
      });

      return CartMapper.commercetoolsOrderToOrder(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw error;
    }
  };

  getBusinessUnitOrders: (keys: string) => Promise<Order[]> = async (keys: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .orders()
        .get({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
            where: `businessUnit(key in (${keys}))`,
            sort: 'createdAt desc',
          },
        })
        .execute();

      return response.body.results.map((order) => CartMapper.commercetoolsOrderToOrder(order, locale));
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`get orders failed. ${error}`);
    }
  };

  freezeCart: (cart: Cart) => Promise<Cart> = async (cart: Cart) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'freezeCart',
          } as any,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return (await this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale)) as Cart;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`freeze error failed. ${error}`);
    }
  };

  unfreezeCart: (cart: Cart) => Promise<Cart> = async (cart: Cart) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'unfreezeCart',
          } as any,
        ],
      };
      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return (await this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale)) as Cart;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`freeze error failed. ${error}`);
    }
  };

  setCartExpirationDays: (cart: Cart, deleteDaysAfterLastModification: number) => Promise<Cart> = async (
    cart: Cart,
    deleteDaysAfterLastModification: number,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setDeleteDaysAfterLastModification',
            deleteDaysAfterLastModification,
          } as any,
        ],
      };
      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return (await this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale)) as Cart;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`freeze error failed. ${error}`);
    }
  };

  setCustomType: (cart: Cart, type: string, fields: any) => Promise<Cart> = async (
    cart: Cart,
    type: string,
    fields: any,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setCustomType',
            type: {
              typeId: 'type',
              key: type,
            },
            fields,
          } as any,
        ],
      };
      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return (await this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale)) as Cart;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`freeze error failed. ${error}`);
    }
  };

  protected recreate: (primaryCommercetoolsCart: CommercetoolsCart, locale: Locale) => Promise<Cart> = async (
    primaryCommercetoolsCart: CommercetoolsCart,
    locale: Locale,
  ) => {
    const primaryCartId = primaryCommercetoolsCart.id;
    const cartVersion = primaryCommercetoolsCart.version;
    const lineItems = primaryCommercetoolsCart.lineItems;

    const cartDraft: CartDraft = {
      currency: locale.currency,
      country: locale.country,
      locale: locale.language,
    };

    // TODO: implement a logic that hydrate cartDraft with commercetoolsCart
    // for (const key of Object.keys(commercetoolsCart)) {
    //   if (cartDraft.hasOwnProperty(key) && cartDraft[key] !== undefined) {
    //     cartDraft[key] = commercetoolsCart[key];
    //   }
    // }

    const propertyList = [
      'customerId',
      'customerEmail',
      'customerGroup',
      'anonymousId',
      'store',
      'inventoryMode',
      'taxMode',
      'taxRoundingMode',
      'taxCalculationMode',
      'shippingAddress',
      'billingAddress',
      'shippingMethod',
      'externalTaxRateForShippingMethod',
      'deleteDaysAfterLastModification',
      'origin',
      'shippingRateInput',
      'itemShippingAddresses',
    ];

    for (const key of propertyList) {
      if (primaryCommercetoolsCart.hasOwnProperty(key)) {
        cartDraft[key] = primaryCommercetoolsCart[key];
      }
    }

    let replicatedCommercetoolsCart = await this.associateEndpoints
      .carts()
      .post({
        queryArgs: {
          expand: [
            'lineItems[*].discountedPrice.includedDiscounts[*].discount',
            'discountCodes[*].discountCode',
            'paymentInfo.payments[*]',
          ],
        },
        body: cartDraft,
      })
      .execute()
      .then((response) => {
        return response.body;
      });

    // Add line items to the replicated cart one by one to handle the exception
    // if an item is not available on the new currency.
    for (const lineItem of lineItems) {
      try {
        const cartUpdate: CartUpdate = {
          version: +replicatedCommercetoolsCart.version,
          actions: [
            {
              action: 'addLineItem',
              sku: lineItem.variant.sku,
              quantity: +lineItem.quantity,
            },
          ],
        };

        replicatedCommercetoolsCart = await this.updateCart(replicatedCommercetoolsCart.id, cartUpdate, locale);
      } catch (error) {
        // Ignore that a line item could not be added due to missing price, etc
      }
    }

    // Delete previous cart
    await this.deleteCart(primaryCartId, cartVersion);

    return CartMapper.commercetoolsCartToCart(replicatedCommercetoolsCart, locale);
  };

  deleteCart: (primaryCartId: string, cartVersion: number) => Promise<void> = async (
    primaryCartId: string,
    cartVersion: number,
  ) => {
    await this.associateEndpoints
      .carts()
      .withId({
        ID: primaryCartId,
      })
      .delete({
        queryArgs: {
          version: cartVersion,
        },
      })
      .execute();
  };

  replicateCart: (orderId: string) => Promise<Cart> = async (orderId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const response = await this.associateEndpoints
        .carts()
        .replicate()
        .post({
          body: {
            reference: {
              id: orderId,
              typeId: 'order',
            },
          },
        })
        .execute();
      return (await this.buildCartWithAvailableShippingMethods(response.body, locale)) as Cart;
    } catch (e) {
      throw `cannot replicate ${e}`;
    }
  };

  addItemShippingAddress: (originalCart: Cart, address: AddressDraft) => Promise<any> = async (
    originalCart: Cart,
    address: AddressDraft,
  ) => {
    const locale = await this.getCommercetoolsLocal();

    const cartUpdate: CartUpdate = {
      version: +originalCart.cartVersion,
      actions: [
        {
          action: 'addItemShippingAddress',
          address: {
            ...address,
            key: address.id,
          },
        },
      ],
    };
    return this.updateCart(originalCart.cartId, cartUpdate, locale);
  };

  updateLineItemShippingDetails: (
    cart: Cart,
    lineItemId: string,
    targets?: { addressKey: string; quantity: number }[],
  ) => Promise<Cart> = async (cart: Cart, lineItemId: string, targets?: { addressKey: string; quantity: number }[]) => {
    const locale = await this.getCommercetoolsLocal();

    const cartUpdate: CartUpdate = {
      version: +cart.cartVersion,
      actions: [
        {
          action: 'setLineItemShippingDetails',
          lineItemId,
          shippingDetails: targets?.length ? { targets } : null,
        },
      ],
    };
    const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);
    return (await this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale)) as Cart;
  };

  assertCartOrganization: (cart: Cart, organization: Organization) => boolean = (
    cart: Cart,
    organization: Organization,
  ) => {
    return (
      !!cart.businessUnit &&
      !!cart.store &&
      cart.businessUnit === organization.businessUnit?.key &&
      cart.store === organization.store?.key
    );
  };
}
