import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { Account } from '@b2bdemo/types/types/account/Account';
import { WishlistApi } from '../apis/WishlistApi';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

function getWishlistApi(request: Request, actionContext: ActionContext) {
  return new WishlistApi(actionContext.frontasticContext, getLocale(request));
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
  try {
    const account = fetchAccountFromSessionEnsureLoggedIn(request);
    const wishlistApi = getWishlistApi(request, actionContext);
    const storeKey = fetchStoreFromSession(request);
    const wishlists = await wishlistApi.getForAccountStore(account.accountId, storeKey);

    return {
      statusCode: 200,
      body: JSON.stringify(wishlists),
      sessionData: request.sessionData,
    };
  } catch (e) {
    const response: Response = {
      statusCode: 400,
      // @ts-ignore
      error: e,
      errorCode: 400,
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
  const config = actionContext.frontasticContext?.project?.configuration?.wishlistSharing;
  const account = fetchAccountFromSessionEnsureLoggedIn(request);

  if (!businessUnit || !config?.wishlistSharingCustomType || !config?.wishlistSharingCustomField) {
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
  } catch (e) {
    return {
      statusCode: 400,
      sessionData: request.sessionData,
      // @ts-ignore
      error: e?.body?.message,
      errorCode: 500,
    };
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
  const config = actionContext.frontasticContext?.project?.configuration?.wishlistSharing;
  if (!config?.wishlistSharingCustomType || !config?.wishlistSharingCustomField) {
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



export const removeLineItem: ActionHook = async (request, actionContext) => {
  const wishlistApi = getWishlistApi(request, actionContext);
  const wishlist = await fetchWishlist(request, wishlistApi);

  const body: {
    lineItem?: { id?: string };
  } = JSON.parse(request.body);

  const updatedWishlist = await wishlistApi.removeLineItem(wishlist, body.lineItem?.id ?? undefined);

  return {
    statusCode: 200,
    body: JSON.stringify(updatedWishlist),
    sessionData: request.sessionData,
  };
};


