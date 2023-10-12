export * from 'cofe-ct-ecommerce/actionControllers/WishlistController';
import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { WishlistApi } from '../apis/WishlistApi';
import { getCurrency, getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { Account } from '@commercetools/frontend-domain-types/account/Account';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

function getWishlistApi(request: Request, actionContext: ActionContext) {
  return new WishlistApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));
}

function fetchStoreFromSession(request: Request): string {
  const store = request.sessionData?.organization?.store?.key;
  if (!store) {
    throw 'No organization in session';
  }
  return store;
}

function fetchAccountFromSession(request: Request): Account | undefined {
  return request.sessionData?.account;
}

function fetchAccountFromSessionEnsureLoggedIn(request: Request): Account {
  const account = fetchAccountFromSession(request);
  if (!account) {
    throw new Error('Not logged in.');
  }
  return account;
}

async function fetchWishlist(request: Request, wishlistApi: WishlistApi) {
  const account = fetchAccountFromSessionEnsureLoggedIn(request);
  const wishlistId = request.query.id;
  if (wishlistId !== undefined) {
    return await wishlistApi.getByIdForAccount(wishlistId, account.accountId);
  }
  return null;
}

export const getStoreWishlists: ActionHook = async (request, actionContext) => {
  const account = fetchAccountFromSessionEnsureLoggedIn(request);
  const wishlistApi = getWishlistApi(request, actionContext);
  const storeKey = fetchStoreFromSession(request);
  try {
    const wishlists = await wishlistApi.getForAccountStore(account.accountId, storeKey);

    return {
      statusCode: 200,
      body: JSON.stringify(wishlists),
      sessionData: request.sessionData,
    };
  } catch (error: any) {
    const response: Response = {
      statusCode: 401,
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const getAllWishlists: ActionHook = async (request, actionContext) => {
  const account = fetchAccountFromSessionEnsureLoggedIn(request);

  const wishlistApi = getWishlistApi(request, actionContext);
  const wishlists = await wishlistApi.getForAccount(account.accountId);

  return {
    statusCode: 200,
    body: JSON.stringify(wishlists),
    sessionData: request.sessionData,
  };
};

export const getSharedWishlists: ActionHook = async (request, actionContext) => {
  const businessUnit = request.sessionData?.organization?.businessUnit?.key;
  const { EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_TYPE, EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD } =
    actionContext.frontasticContext?.projectConfiguration;
  const account = fetchAccountFromSessionEnsureLoggedIn(request);

  if (!businessUnit || !EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_TYPE || !EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD) {
    return {
      statusCode: 400,
      sessionData: request.sessionData,
      error: new Error('No context or custom field'),
      errorCode: 400,
    };
  }
  const wishlistApi = getWishlistApi(request, actionContext);
  const wishlists = await wishlistApi.getForBusinessUnit(businessUnit, account.accountId);

  return {
    statusCode: 200,
    body: JSON.stringify(wishlists),
    sessionData: request.sessionData,
  };
};

export const getWishlist: ActionHook = async (request, actionContext) => {
  const wishlistApi = getWishlistApi(request, actionContext);
  try {
    const wishlist = await fetchWishlist(request, wishlistApi);
    return {
      statusCode: 200,
      body: JSON.stringify(wishlist),
      sessionData: request.sessionData,
    };
  } catch (error: any) {
    const response: Response = {
      statusCode: 401,
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const createWishlist: ActionHook = async (request, actionContext) => {
  const wishlistApi = getWishlistApi(request, actionContext);

  const { wishlist } = JSON.parse(request.body);

  const account = fetchAccountFromSessionEnsureLoggedIn(request);

  const store = fetchStoreFromSession(request);

  const wishlistRes = await wishlistApi.create(account.accountId, store, wishlist);

  return {
    statusCode: 200,
    body: JSON.stringify(wishlistRes),
    sessionData: request.sessionData,
  };
};

export const share: ActionHook = async (request, actionContext) => {
  const wishlistApi = getWishlistApi(request, actionContext);
  const { EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_TYPE, EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD } =
    actionContext.frontasticContext?.projectConfiguration;
  if (!EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_TYPE || !EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD) {
    return {
      statusCode: 400,
      sessionData: request.sessionData,
      error: new Error('No context or custom field'),
      errorCode: 400,
    };
  }
  const wishlist = await fetchWishlist(request, wishlistApi);

  try {
    const wishlistRes = await wishlistApi.share(wishlist, request.query['business-unit-key']);

    return {
      statusCode: 200,
      body: JSON.stringify(wishlistRes),
      sessionData: request.sessionData,
    };
  } catch (error) {
    throw error;
  }
};

export const deleteWishlist: ActionHook = async (request, actionContext) => {
  const wishlistApi = getWishlistApi(request, actionContext);
  const wishlist = await fetchWishlist(request, wishlistApi);
  const storeKey = fetchStoreFromSession(request);

  const deletedWishlist = await wishlistApi.delete(wishlist, storeKey);

  return {
    statusCode: 200,
    body: JSON.stringify(deletedWishlist),
    sessionData: request.sessionData,
  };
};

export const renameWishlist: ActionHook = async (request, actionContext) => {
  const wishlistApi = getWishlistApi(request, actionContext);
  let wishlist = await fetchWishlist(request, wishlistApi);

  const { name } = JSON.parse(request.body);

  wishlist = await wishlistApi.rename(wishlist, name);

  return {
    statusCode: 200,
    body: JSON.stringify(wishlist),
    sessionData: request.sessionData,
  };
};

export const updateLineItemCount: ActionHook = async (request, actionContext) => {
  const wishlistApi = getWishlistApi(request, actionContext);
  const wishlist = await fetchWishlist(request, wishlistApi);

  const body: {
    lineItem?: { id?: string };
    count?: number;
  } = JSON.parse(request.body);

  const updatedWishlist = await wishlistApi.updateLineItemCount(
    wishlist,
    body.lineItem?.id ?? undefined,
    body.count || 1,
  );

  return {
    statusCode: 200,
    body: JSON.stringify(updatedWishlist),
    sessionData: {
      ...request.sessionData,
      wishlistId: updatedWishlist.wishlistId,
    },
  };
};
