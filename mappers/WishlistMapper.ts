import { Wishlist, WishlistDraft } from '../types/wishlist/Wishlist';
import { CustomFields, ShoppingList } from '@commercetools/platform-sdk';
import { ShoppingListDraft } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/shopping-list';
import { Store, StoreKeyReference } from '../types/store/store';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { WishlistMapper as BaseWishlistMapper } from 'cofe-ct-ecommerce/mappers/WishlistMapper';

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

  static wishlistToCommercetoolsShoppingListDraft = (
    wishlist: WishlistDraft,
    locale: Locale,
    accountId?: string,
    storeKey?: string,
  ): ShoppingListDraft => {
    return {
      customer: !accountId ? undefined : { typeId: 'customer', id: accountId },
      name: { [locale.language]: wishlist.name || '' },
      description: { [locale.language]: wishlist.description || '' },
      store: !storeKey ? undefined : { typeId: 'store', key: storeKey },
    };
  };
}

// Override the BaseMapper with new Mapper functions
Object.getOwnPropertyNames(WishlistMapper).forEach((key) => {
  if (typeof WishlistMapper[key] === 'function') {
    BaseWishlistMapper[key] = WishlistMapper[key];
  }
});
