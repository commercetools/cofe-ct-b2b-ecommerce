import {
  Cart as CommercetoolsCart,
  LineItem as CommercetoolsLineItem,
  Order as CommercetoolsOrder,
  ReturnInfo as CommercetoolsReturnInfo,
} from '@commercetools/platform-sdk';
import { Order, ReturnInfo } from '../types/cart/Order';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { CartMapper as BaseCartMapper } from 'cofe-ct-ecommerce/mappers/CartMapper';
import { ProductRouter } from '../utils/ProductRouter';
import { ProductMapper } from './ProductMapper';
import { Cart } from '../types/cart/Cart';
import { LineItem } from '../types/cart/LineItem';

// @ts-ignore
export class CartMapper extends BaseCartMapper {
  static commercetoolsCartToCart(commercetoolsCart: CommercetoolsCart, locale: Locale): Cart {
    return {
      cartId: commercetoolsCart.id,
      customerId: commercetoolsCart.customerId,
      cartVersion: commercetoolsCart.version.toString(),
      lineItems: this.commercetoolsLineItemsToLineItems(commercetoolsCart.lineItems, locale),
      email: commercetoolsCart?.customerEmail,
      sum: ProductMapper.commercetoolsMoneyToMoney(commercetoolsCart.totalPrice),
      shippingAddress: this.commercetoolsAddressToAddress(commercetoolsCart.shippingAddress),
      billingAddress: this.commercetoolsAddressToAddress(commercetoolsCart.billingAddress),
      shippingInfo: this.commercetoolsShippingInfoToShippingInfo(commercetoolsCart.shippingInfo, locale),
      payments: this.commercetoolsPaymentInfoToPayments(commercetoolsCart.paymentInfo, locale),
      discountCodes: this.commercetoolsDiscountCodesInfoToDiscountCodes(commercetoolsCart.discountCodes, locale),
      directDiscounts: commercetoolsCart.directDiscounts?.length,
      taxed: this.commercetoolsTaxedPriceToTaxed(commercetoolsCart.taxedPrice, locale),
      itemShippingAddresses: commercetoolsCart.itemShippingAddresses,
      origin: commercetoolsCart.origin,
      store: commercetoolsCart.store?.key,
      businessUnit: commercetoolsCart.businessUnit?.key,
    };
  }

  static commercetoolsLineItemsToLineItems(
    commercetoolsLineItems: CommercetoolsLineItem[],
    locale: Locale,
  ): LineItem[] {
    const lineItems: LineItem[] = [];

    commercetoolsLineItems?.forEach((commercetoolsLineItem) => {
      const item: LineItem = {
        lineItemId: commercetoolsLineItem.id,
        name: commercetoolsLineItem?.name[locale.language] || '',
        type: 'variant',
        count: commercetoolsLineItem.quantity,
        price: ProductMapper.commercetoolsMoneyToMoney(commercetoolsLineItem.price?.value),
        discountedPrice: ProductMapper.commercetoolsMoneyToMoney(commercetoolsLineItem.price?.discounted?.value),
        discountTexts: this.commercetoolsDiscountedPricesPerQuantityToDiscountTexts(
          commercetoolsLineItem.discountedPricePerQuantity,
          locale,
        ),
        discounts: this.commercetoolsDiscountedPricesPerQuantityToDiscounts(
          commercetoolsLineItem.discountedPricePerQuantity,
          locale,
        ),
        totalPrice: ProductMapper.commercetoolsMoneyToMoney(commercetoolsLineItem.totalPrice),
        custom: commercetoolsLineItem.custom,
        variant: ProductMapper.commercetoolsProductVariantToVariant(
          commercetoolsLineItem.variant,
          locale,
          commercetoolsLineItem.distributionChannel?.id,
          commercetoolsLineItem.supplyChannel?.id,
        ),
        isGift:
          commercetoolsLineItem?.lineItemMode !== undefined && commercetoolsLineItem.lineItemMode === 'GiftLineItem',
        shippingDetails: commercetoolsLineItem.shippingDetails,
      };
      item._url = ProductRouter.generateUrlFor(item);
      lineItems.push(item);
    });

    return lineItems;
  }

  static commercetoolsOrderToOrder(commercetoolsOrder: CommercetoolsOrder, locale: Locale): Order {
    return {
      cartId: commercetoolsOrder.id,
      customerId: commercetoolsOrder.customerId,
      origin: commercetoolsOrder.origin,
      orderState: commercetoolsOrder.orderState,
      orderId: commercetoolsOrder.orderNumber,
      orderVersion: commercetoolsOrder.version.toString(),
      lineItems: this.commercetoolsLineItemsToLineItems(commercetoolsOrder.lineItems, locale),
      email: commercetoolsOrder?.customerEmail,
      shippingAddress: this.commercetoolsAddressToAddress(commercetoolsOrder.shippingAddress),
      billingAddress: this.commercetoolsAddressToAddress(commercetoolsOrder.billingAddress),
      sum: ProductMapper.commercetoolsMoneyToMoney(commercetoolsOrder.totalPrice),
      businessUnit: commercetoolsOrder.businessUnit?.key,
      createdAt: new Date(commercetoolsOrder.createdAt),
      shippingInfo: this.commercetoolsShippingInfoToShippingInfo(commercetoolsOrder.shippingInfo, locale),
      returnInfo: this.commercetoolsReturnInfoToReturnInfo(commercetoolsOrder.returnInfo),
      purchaseOrderNumber: commercetoolsOrder.purchaseOrderNumber,
      subtotal: ProductMapper.commercetoolsMoneyToMoney(commercetoolsOrder.taxedPrice.totalNet),
      taxed: commercetoolsOrder.taxedPrice.taxPortions[0],
      payments: this.commercetoolsPaymentInfoToPayments(commercetoolsOrder.paymentInfo, locale),
      shipmentState: commercetoolsOrder.shipmentState ?? 'Pending',
    };
  }

  static commercetoolsReturnInfoToReturnInfo(commercetoolsReturnInfo: CommercetoolsReturnInfo[]): ReturnInfo[] {
    return commercetoolsReturnInfo.map((ctReturnInfo) => ({
      returnDate: ctReturnInfo.returnDate,
      returnTrackingId: ctReturnInfo.returnTrackingId,
      items: ctReturnInfo.items.map((item) => ({
        comment: item.comment,
        createdAt: item.createdAt,
        // @ts-ignore
        lineItemId: item.lineItemId,
        returnInfoId: item.id,
        quantity: item.quantity,
        shipmentState: item.shipmentState,
      })),
    }));
  }
}
// Override the BaseMapper with new Mapper functions
Object.getOwnPropertyNames(CartMapper).forEach((key) => {
  if (typeof CartMapper[key] === 'function') {
    BaseCartMapper[key] = CartMapper[key];
  }
});
