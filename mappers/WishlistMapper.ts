import { Wishlist, WishlistDraft } from '@b2bdemo/types/types/wishlist/Wishlist';
import { CustomFields, ShoppingList, ShoppingListLineItem } from '@commercetools/platform-sdk';
import { ShoppingListDraft } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/shopping-list';
import { LineItem } from '@b2bdemo/types/types/wishlist/LineItem';
import { Store, StoreKeyReference } from '@b2bdemo/types/types/store/store';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { WishlistMapper as BaseWishlistMapper } from 'cofe-ct-ecommerce/mappers/WishlistMapper';
import { ProductRouter } from '../utils/ProductRouter';

export class WishlistMapper extends BaseWishlistMapper {
  static commercetoolsShoppingListToWishlist = (
    commercetoolsShoppingList: ShoppingList,
    locale: Locale,
    config?: Record<string, string>,
  ): Wishlist => {
    return {
      wishlistId: commercetoolsShoppingList.id,
      wishlistVersion: commercetoolsShoppingList.version.toString(),
      anonymousId: commercetoolsShoppingList.anonymousId,
      accountId: commercetoolsShoppingList.customer?.id ?? undefined,
      name: commercetoolsShoppingList.name[locale.language],
      description: commercetoolsShoppingList.description?.[locale.language],
      lineItems: (commercetoolsShoppingList.lineItems || []).map((lineItem) =>
        this.commercetoolsLineItemToLineItem(lineItem, locale),
      ),
      store: this.commercetoolsStoreRefToStore(commercetoolsShoppingList.store),
      shared: this.commercetoolsCustomToShared(commercetoolsShoppingList.custom, config),
    };
  };

  private static commercetoolsCustomToShared = (
    commercetoolsCustom: CustomFields,
    config?: Record<string, string>,
  ): string[] => {
    if (!config) {
      return [];
    }
    return commercetoolsCustom?.fields?.[config.wishlistSharingCustomField];
  };

  private static commercetoolsStoreRefToStore = (commercetoolsStoreRef: StoreKeyReference): Store => {
    return {
      id: commercetoolsStoreRef?.id,
      key: commercetoolsStoreRef?.key,
      // @ts-ignore
      ...commercetoolsStoreRef?.obj,
    };
  };

  private static commercetoolsLineItemToLineItem = (
    commercetoolsLineItem: ShoppingListLineItem,
    locale: Locale,
  ): LineItem => {
    const lineItem: LineItem = {
      lineItemId: commercetoolsLineItem.id,
      name: commercetoolsLineItem.name[locale.language],
      type: 'variant',
      addedAt: new Date(commercetoolsLineItem.addedAt),
      count: commercetoolsLineItem.quantity,
      variant: {
        sku: commercetoolsLineItem.variant.sku,
        images: commercetoolsLineItem.variant?.images?.map((image) => image.url),
      },
    };
    lineItem._url = ProductRouter.generateUrlFor(lineItem);
    return lineItem;
  };

  static wishlistToCommercetoolsShoppingListDraft = (
    accountId: string,
    storeKey: string,
    wishlist: WishlistDraft,
    locale: Locale,
  ): ShoppingListDraft => {
    return {
      customer: !accountId ? undefined : { typeId: 'customer', id: accountId },
      name: { [locale.language]: wishlist.name || '' },
      description: { [locale.language]: wishlist.description || '' },
      store: !storeKey ? undefined : { typeId: 'store', key: storeKey },
    };
  };
}
