import {
  LineItem as CommercetoolsLineItem,
  Order as CommercetoolsOrder,
  ReturnInfo as CommercetoolsReturnInfo,
} from '@commercetools/platform-sdk';
import { ReturnInfo } from '@b2bdemo/types/types/cart/Order';
import { CartMapper as BaseCartMapper } from 'cofe-ct-ecommerce/mappers/CartMapper';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { Order } from '@b2bdemo/types/types/cart/Order';
import { LineItem } from '@b2bdemo/types/types/cart/LineItem';
import { ProductRouter } from '../utils/ProductRouter';
import { ProductMapper } from './ProductMapper';

// @ts-ignore
export class CartMapper extends BaseCartMapper {
  static commercetoolsLineItemsToLineItems: (
    commercetoolsLineItems: CommercetoolsLineItem[],
    locale: Locale,
  ) => LineItem[] = (commercetoolsLineItems: CommercetoolsLineItem[], locale: Locale) => {
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
        parentId: commercetoolsLineItem.custom?.fields?.parentId,
        variant: ProductMapper.commercetoolsProductVariantToVariant(
          commercetoolsLineItem.variant,
          locale,
          commercetoolsLineItem.price,
        ),
        isGift:
          commercetoolsLineItem?.lineItemMode !== undefined && commercetoolsLineItem.lineItemMode === 'GiftLineItem',
        shippingDetails: commercetoolsLineItem.shippingDetails,
      };
      item._url = ProductRouter.generateUrlFor(item);
      lineItems.push(item);
    });

    return lineItems;
  };

  static commercetoolsOrderToOrder: (
    commercetoolsOrder: CommercetoolsOrder,
    locale: Locale,
    config?: Record<string, string>,
  ) => Order = (commercetoolsOrder: CommercetoolsOrder, locale: Locale, config?: Record<string, string>) => {
    return {
      cartId: commercetoolsOrder.id,
      orderState: commercetoolsOrder.orderState,
      orderId: commercetoolsOrder.orderNumber,
      orderVersion: commercetoolsOrder.version.toString(),
      // createdAt:
      lineItems: this.commercetoolsLineItemsToLineItems(commercetoolsOrder.lineItems, locale),
      email: commercetoolsOrder?.customerEmail,
      shippingAddress: this.commercetoolsAddressToAddress(commercetoolsOrder.shippingAddress),
      billingAddress: this.commercetoolsAddressToAddress(commercetoolsOrder.billingAddress),
      sum: ProductMapper.commercetoolsMoneyToMoney(commercetoolsOrder.totalPrice),
      businessUnit: commercetoolsOrder.businessUnit?.key,
      createdAt: commercetoolsOrder.createdAt,
      shippingInfo: this.commercetoolsShippingInfoToShippingInfo(commercetoolsOrder.shippingInfo, locale),
      returnInfo: this.commercetoolsReturnInfoToReturnInfo(commercetoolsOrder.returnInfo),
      //sum: commercetoolsOrder.totalPrice.centAmount,
      // payments:
      // discountCodes:
      // taxed:
    } as Order;
  };

  static commercetoolsReturnInfoToReturnInfo: (commercetoolsReturnInfo: CommercetoolsReturnInfo[]) => ReturnInfo[] = (
    commercetoolsReturnInfo: CommercetoolsReturnInfo[],
  ) => {
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
  };
}
