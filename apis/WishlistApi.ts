import { Wishlist, WishlistDraft } from '../types/wishlist/Wishlist';
import { WishlistApi as BaseWishlistApi } from 'cofe-ct-ecommerce/apis/WishlistApi';
import { WishlistMapper } from '../mappers/WishlistMapper';

const expandVariants = ['lineItems[*].variant', 'store'];

export class WishlistApi extends BaseWishlistApi {
  getForAccount = async (accountId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD =
        this.frontasticContext?.projectConfiguration.EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD;

      const response = await this.requestBuilder()
        .shoppingLists()
        .get({
          queryArgs: {
            where: `customer(id="${accountId}")`,
            expand: expandVariants,
          },
        })
        .execute();

      return response.body.results.map((shoppingList) =>
        WishlistMapper.commercetoolsShoppingListToWishlist(
          shoppingList,
          locale,
          EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD,
        ),
      );
    } catch (error) {
      throw new Error(`Get wishlist for account failed: ${error}`);
    }
  };

  getForAccountStore = async (accountId: string, storeKey: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const response = await this.requestBuilder()
        .inStoreKeyWithStoreKeyValue({ storeKey })
        .shoppingLists()
        .get({
          queryArgs: {
            where: [`customer(id="${accountId}")`],
            expand: expandVariants,
          },
        })
        .execute();

      return response.body.results.map((shoppingList) =>
        WishlistMapper.commercetoolsShoppingListToWishlist(shoppingList, locale),
      );
    } catch (error) {
      throw new Error(`Get wishlist for account failed: ${error}`);
    }
  };

  getForBusinessUnit = async (businessUnitKey: string, accountId: string): Promise<Wishlist[]> => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD =
        this.frontasticContext?.projectConfiguration.EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD;

      const response = await this.requestBuilder()
        .shoppingLists()
        .get({
          queryArgs: {
            where: [
              `custom(fields(${EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD} contains any ("${businessUnitKey}")))`,
              `customer(id!="${accountId}")`,
            ],
            expand: expandVariants,
          },
        })
        .execute();

      return response.body.results.map((shoppingList) =>
        WishlistMapper.commercetoolsShoppingListToWishlist(shoppingList, locale),
      );
    } catch (error) {
      throw new Error(`Get wishlist for BU failed: ${error}`);
    }
  };

  getByIdForAccount = async (wishlistId: string, accountId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD =
        this.frontasticContext?.projectConfiguration.EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD;

      const response = await this.requestBuilder()
        .shoppingLists()
        .withId({ ID: wishlistId })
        .get({
          queryArgs: {
            where: `customer(id="${accountId}")`,
            expand: expandVariants,
          },
        })
        .execute();

      return WishlistMapper.commercetoolsShoppingListToWishlist(response.body, locale, EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD);
    } catch (error) {
      // @ts-ignore
      throw error;
    }
  };

  // @ts-ignore
  create = async (accountId: string, storeKey: string, wishlist: WishlistDraft) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const body = WishlistMapper.wishlistToCommercetoolsShoppingListDraft(wishlist, locale, accountId);
      const response = await this.requestBuilder()
        .inStoreKeyWithStoreKeyValue({ storeKey })
        .shoppingLists()
        .post({
          body: body,
          queryArgs: {
            expand: expandVariants,
          },
        })
        .execute();

      return WishlistMapper.commercetoolsShoppingListToWishlist(response.body, locale);
    } catch (error) {
      throw new Error(`Create wishlist failed: ${error}`);
    }
  };

  delete = async (wishlist: Wishlist, storeKey: string) => {
    try {
      await this.requestBuilder()
        .inStoreKeyWithStoreKeyValue({ storeKey })
        .shoppingLists()
        .withId({ ID: wishlist.wishlistId })
        .delete({
          queryArgs: {
            version: +wishlist.wishlistVersion,
          },
        })
        .execute();
    } catch (error) {
      throw new Error(`Delete wishlist failed: ${error}`);
    }
  };

  rename = async (wishlist: Wishlist, name: string) => {
    const locale = await this.getCommercetoolsLocal();

    try {
      const response = await this.requestBuilder()
        .shoppingLists()
        .withId({ ID: wishlist.wishlistId })
        .post({
          body: {
            version: +wishlist.wishlistVersion,
            actions: [
              {
                action: 'changeName',
                name: {
                  [locale.language]: name,
                },
              },
            ],
          },
          queryArgs: {
            expand: expandVariants,
          },
        })
        .execute();
      return WishlistMapper.commercetoolsShoppingListToWishlist(response.body, locale);
    } catch (error) {
      throw new Error(`Rename wishlist failed: ${error}`);
    }
  };

  share = async (wishlist: Wishlist, businessUnitKey: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_TYPE =
        this.frontasticContext?.projectConfiguration.EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_TYPE;
      const EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD =
        this.frontasticContext?.projectConfiguration.EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD;

      // @ts-ignore
      let currentSharedBUs: string[] = wishlist?.shared || [];

      if (currentSharedBUs.includes(businessUnitKey)) {
        currentSharedBUs = currentSharedBUs.filter((item) => item !== businessUnitKey);
      } else {
        currentSharedBUs.push(businessUnitKey);
      }

      const response = await this.requestBuilder()
        .shoppingLists()
        .withId({ ID: wishlist.wishlistId })
        .post({
          body: {
            version: +wishlist.wishlistVersion,
            actions: [
              {
                action: 'setCustomType',
                type: {
                  key: EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_TYPE,
                  typeId: 'type',
                },
                fields: {
                  [EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD]: currentSharedBUs,
                },
              },
            ],
          },
          queryArgs: {
            expand: expandVariants,
          },
        })
        .execute();

      return WishlistMapper.commercetoolsShoppingListToWishlist(response.body, locale);
    } catch (error) {
      throw error;
    }
  };
}
