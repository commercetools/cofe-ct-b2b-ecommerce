import {
  AddressDraft,
  CartDraft,
  CartSetLocaleAction,
} from '@commercetools/platform-sdk';
import { CartMapper } from '../mappers/CartMapper';
import { LineItem } from '@commercetools/frontend-domain-types/cart/LineItem';
import {
  CartAddLineItemAction,
  CartRemoveLineItemAction,
  CartSetCustomerIdAction,
  CartUpdate,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/cart';
import { Order } from '@commercetools/frontend-domain-types/cart/Order';
import { Account } from '@commercetools/frontend-domain-types/account/Account';
import { Organization } from '@b2bdemo/types/types/organization/organization';
import { CartApi as BaseCartApi } from 'cofe-ct-ecommerce/apis/CartApi';
import { Cart } from '@commercetools/frontend-domain-types/cart/Cart';
export class CartApi extends BaseCartApi {
  getForUser: (account: Account, organization?: Organization) => Promise<Cart> = async (
    account: Account,
    organization?: Organization,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const where = [`customerId="${account.accountId}"`, `cartState="Active"`];
      if (organization) {
        where.push(`businessUnit(key="${organization.businessUnit.key}")`);
        where.push(`store(key="${organization.store.key}")`);
      }

      const response = await this.getApiForProject()
        .carts()
        .get({
          queryArgs: {
            limit: 1,
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
        return this.buildCartWithAvailableShippingMethods(response.body.results[0], locale);
      }

      return this.createCart(account.accountId, organization);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getForUser failed. ${error}`);
    }
  };

  createCart: (customerId: string, organization: Organization) => Promise<Cart> = async (
    customerId: string,
    organization: Organization,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartDraft: CartDraft = {
        currency: locale.currency,
        country: locale.country,
        locale: locale.language,
        customerId,
        // @ts-ignore
        businessUnit: {
          key: organization.businessUnit.key,
          typeId: 'business-unit',
        },
        store: {
          key: organization.store.key,
          typeId: 'store',
        },
        inventoryMode: 'ReserveOnOrder',
      };

      const commercetoolsCart = await this.getApiForProject()
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

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw error;
    }
  };

  addToCart: (cart: Cart, lineItem: LineItem, distributionChannel?: string) => Promise<Cart> = async (
    cart: Cart,
    lineItem: LineItem,
    distributionChannel?: string,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'addLineItem',
            sku: lineItem.variant.sku,
            quantity: +lineItem.count,
          } as CartAddLineItemAction,
        ],
      };

      if (distributionChannel) {
        // @ts-ignore
        cartUpdate.actions[0].distributionChannel = { id: distributionChannel, typeId: 'channel' };
      }

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`addToCart failed. ${error}`);
    }
  };

  addSubscriptionsToCart: (cart: Cart, lineItems: LineItem[]) => Promise<Cart> = async (
    cart: Cart,
    lineItems: LineItem[],
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate = {
        version: +cart.cartVersion,
        actions: lineItems.map((subscription) => {
          return {
            action: 'addLineItem',
            sku: subscription.variant.sku,
            quantity: +subscription.count,
            custom: subscription.custom,
          } as CartAddLineItemAction;
        }),
      };

      // TODO: make it into one api call
      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`addToCart failed. ${error}`);
    }
  };

  addItemsToCart: (cart: Cart, lineItems: LineItem[], distributionChannel: string) => Promise<Cart> = async (
    cart: Cart,
    lineItems: LineItem[],
    distributionChannel: string,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: lineItems.map((lineItem) => ({
          action: 'addLineItem',
          sku: lineItem.variant.sku,
          quantity: +lineItem.count,
          distributionChannel: { id: distributionChannel, typeId: 'channel' },
        })),
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`addToCart failed. ${error}`);
    }
  };

  removeLineItem: (cart: Cart, lineItem: LineItem) => Promise<Cart> = async (cart: Cart, lineItem: LineItem) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const subscriptions = cart.lineItems.filter((lineitem) => {
        return lineitem.parentId === lineItem.lineItemId;
      });

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'removeLineItem',
            lineItemId: lineItem.lineItemId,
          } as CartRemoveLineItemAction,
        ],
      };
      if (subscriptions?.length) {
        // @ts-ignore
        cartUpdate.actions = cartUpdate.actions.concat(
          subscriptions.map(
            (bundledItem) =>
              ({
                action: 'removeLineItem',
                lineItemId: bundledItem.lineItemId,
              } as CartRemoveLineItemAction),
          ),
        );
      }

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`removeLineItem failed. ${error}`);
    }
  };

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

  setLocale: (cart: Cart, localeCode: string) => Promise<Cart> = async (cart: Cart, localeCode: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setLocale',
            locale: localeCode,
          } as CartSetLocaleAction,
        ],
      };

      const commercetoolsCart = await this.updateCart(cart.cartId, cartUpdate, locale);

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setLocale failed. ${error}`);
    }
  };

  getOrders: (account: Account) => Promise<Order[]> = async (account: Account) => {
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
            where: `customerId="${account.accountId}"`,
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

  getOrder: (orderNumber: string) => Promise<Order> = async (orderNumber: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
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

  returnItems: (orderNumber: string, returnLineItems: LineItemReturnItemDraft[]) => Promise<Order> = async (
    orderNumber: string,
    returnLineItems: LineItemReturnItemDraft[],
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getOrder(orderNumber).then((order) => {
        return this.getApiForProject()
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

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
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

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
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

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
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

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`freeze error failed. ${error}`);
    }
  };

  deleteCart: (primaryCartId: string, cartVersion: number) => Promise<void> = async (
    primaryCartId: string,
    cartVersion: number,
  ) => {
    await this.getApiForProject()
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
      const response = await this.getApiForProject()
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
      return this.buildCartWithAvailableShippingMethods(response.body, locale);
    } catch (e) {
      throw `cannot replicate ${e}`;
    }
  };

  addItemShippingAddress: (originalCart: Cart, address: AddressDraft) => Promise<any> = async (
    originalCart: Cart,
    address: AddressDraft,
  ) => {
    return this.getById(originalCart.cartId).then((cart) => {
      return this.getApiForProject()
        .carts()
        .withId({
          ID: cart.cartId,
        })
        .post({
          body: {
            version: +cart.cartVersion,
            actions: [
              {
                action: 'addItemShippingAddress',
                address: {
                  ...address,
                  key: address.id,
                },
              },
            ],
          },
        })
        .execute();
    });
  };

  updateLineItemShippingDetails: (
    cartId: string,
    lineItemId: string,
    targets: { addressKey: string; quantity: number }[],
  ) => Promise<any> = async (
    cartId: string,
    lineItemId: string,
    targets: { addressKey: string; quantity: number }[],
  ) => {
    return this.getById(cartId).then((cart) => {
      return this.getApiForProject()
        .carts()
        .withId({
          ID: cart.cartId,
        })
        .post({
          body: {
            version: +cart.cartVersion,
            actions: [
              {
                action: 'setLineItemShippingDetails',
                lineItemId,
                shippingDetails: {
                  targets,
                },
              },
            ],
          },
        })
        .execute();
    });
  };
}
