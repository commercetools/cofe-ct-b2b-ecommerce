export * from 'cofe-ct-ecommerce/actionControllers/CartController';
import { Request, Response } from '@frontastic/extension-types';
import { ActionContext } from '@frontastic/extension-types';
import { LineItemReturnItemDraft } from '../types/cart/LineItem';
import { AddressDraft } from '@commercetools/platform-sdk';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { CartApi } from '../apis/CartApi';
import { CartFetcher } from '../utils/CartFetcher';
import { LineItem } from '../types/cart/LineItem';
import { Cart } from '../types/cart/Cart';
import { Address } from '@commercetools/frontend-domain-types/account/Address';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

async function updateCartFromRequest(request: Request, actionContext: ActionContext): Promise<Cart> {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );
  let cart = await CartFetcher.fetchCart(request, actionContext);

  if (request?.body === undefined || request?.body === '') {
    return cart;
  }

  const body: {
    account?: { email?: string };
    shipping?: Address;
    billing?: Address;
  } = JSON.parse(request.body);

  if (body?.account?.email !== undefined) {
    cart = (await cartApi.setEmail(cart, body.account.email)) as Cart;
  }

  if (body?.shipping !== undefined || body?.billing !== undefined) {
    const shippingAddress = body?.shipping !== undefined ? body.shipping : body.billing;
    const billingAddress = body?.billing !== undefined ? body.billing : body.shipping;

    cart = (await cartApi.setShippingAddress(cart, shippingAddress)) as Cart;
    cart = (await cartApi.setBillingAddress(cart, billingAddress)) as Cart;
  }

  return cart;
}

export const getCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  try {
    const cart = await CartFetcher.fetchCart(request, actionContext);
    const cartId = cart.cartId;
  
    const response: Response = {
      statusCode: 200,
      body: JSON.stringify(cart),
      sessionData: {
        ...request.sessionData,
        cartId,
      },
    };
    return response;
  } catch (error: any) {
    const response: Response = {
      statusCode: 401,
      body: JSON.stringify(error.message || error.body?.message || error),
    }
    return response;
  }
};

export const getCartById: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );

  const id = request.query?.id;
  try {
    const cart = await cartApi.getById(id);
    const cartId = cart.cartId;
  
    const response: Response = {
      statusCode: 200,
      body: JSON.stringify(cart),
      sessionData: {
        ...request.sessionData,
        cartId,
      },
    };
    return response;
  } catch (error: any) {
    const response: Response = {
      statusCode: 401,
      body: JSON.stringify(error.message || error.body?.message || error),
    }
    return response;
  }
};

export const getAllSuperUserCarts: ActionHook = async (request: Request, actionContext: ActionContext) => {
  let carts: Cart[] = [];

  if (request.sessionData?.organization?.superUserBusinessUnitKey) {
    const cartApi = new CartApi(
      actionContext.frontasticContext,
      getLocale(request),
      request.sessionData?.organization,
      request.sessionData?.account,
    );
    carts = (await cartApi.getAllForSuperUser()) as Cart[];
  }

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(carts),
  };

  return response;
};

export const createCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  let cart: Cart;
  let cartId = request.sessionData?.cartId;

  if (request.sessionData?.organization?.superUserBusinessUnitKey) {
    const cartApi = new CartApi(
      actionContext.frontasticContext,
      getLocale(request),
      request.sessionData?.organization,
      request.sessionData?.account,
    );
    cart = (await cartApi.createCart()) as Cart;
    cartId = cart.cartId;
  }

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const checkout: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );

  const body: { payload: any } = JSON.parse(request.body);

  const cart = await updateCartFromRequest(request, actionContext);
  const order = await cartApi.order(cart, body.payload);

  // Unset the cartId
  const cartId: string = undefined;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(order),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const removeLineItem: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );

  const body: {
    lineItem?: { id?: string };
  } = JSON.parse(request.body);

  const lineItem: LineItem = {
    lineItemId: body.lineItem?.id,
    variant: {
      sku: '',
    },
  };

  let cart = await CartFetcher.fetchCart(request, actionContext);
  cart = (await cartApi.removeLineItem(cart, lineItem)) as Cart;

  const cartId = cart.cartId;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const addToCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );

  const body: {
    variant?: { sku?: string; count: number; supplyChannelId?: string; distributionChannelId?: string };
  } = JSON.parse(request.body);

  const lineItem: LineItem = {
    variant: {
      sku: body.variant?.sku || undefined,
      price: undefined,
      distributionChannelId: body.variant?.distributionChannelId,
      supplyChannelId: body.variant?.supplyChannelId,
    },
    count: +body.variant?.count || 1,
  };

  let cart = await CartFetcher.fetchCart(request, actionContext);
  cart = (await cartApi.addToCart(cart, lineItem)) as Cart;

  const cartId = cart.cartId;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const addItemsToCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );

  const body: {
    list?: { sku?: string; count: number; supplyChannelId?: string; distributionChannelId?: string }[];
  } = JSON.parse(request.body);

  const lineItems: LineItem[] = body.list?.map((variant) => ({
    variant: {
      sku: variant.sku || undefined,
      distributionChannelId: variant.distributionChannelId,
      supplyChannelId: variant.supplyChannelId,
      price: undefined,
    },
    count: +variant.count || 1,
  }));

  let cart = await CartFetcher.fetchCart(request, actionContext);
  cart = (await cartApi.addItemsToCart(cart, lineItems)) as Cart;

  const cartId = cart.cartId;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const updateLineItem: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );

  const body: {
    lineItem?: { id?: string; count: number };
  } = JSON.parse(request.body);

  const lineItem: Omit<LineItem, 'variant'> = {
    lineItemId: body.lineItem?.id,
    count: +body.lineItem?.count || 1,
  };

  let cart = await CartFetcher.fetchCart(request, actionContext);
  cart = (await cartApi.updateLineItem(cart, lineItem)) as Cart;

  const cartId = cart.cartId;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};

export const returnItems: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );

  const { orderNumber, returnLineItems }: { orderNumber: string; returnLineItems: LineItemReturnItemDraft[] } =
    JSON.parse(request.body);
  try {
    const res = await cartApi.returnItems(orderNumber, returnLineItems);
    const response: Response = {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  
    return response;
  } catch (error: any) {
    const response: Response = {
      statusCode: 401,
      body: JSON.stringify(error.message || error.body?.message || error),
    }
    return response;
  }
};

export const updateOrderState: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );

  let response: Response;

  try {
    const { orderNumber, orderState }: { orderNumber: string; orderState: string } = JSON.parse(request.body);
    const res = await cartApi.updateOrderState(orderNumber, orderState);
    response = {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (e) {
    response = {
      statusCode: 400,
      sessionData: request.sessionData,
      // @ts-ignore
      error: e?.message ? e.message : e,
      errorCode: 500,
    };
  }

  return response;
};

export const replicateCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );
  const orderId = request.query?.['orderId'];
  try {
    if (orderId) {
      const cart = await cartApi.replicateCart(orderId);
      const order = await cartApi.order(cart);
      const response: Response = {
        statusCode: 200,
        body: JSON.stringify(order),
        sessionData: {
          ...request.sessionData,
        },
      };
      return response;
    }
    throw new Error('Order not found');
  } catch (e) {
    const response: Response = {
      statusCode: 400,
      sessionData: request.sessionData,
      // @ts-ignore
      error: e?.message,
      errorCode: 500,
    };

    return response;
  }
};

export const splitLineItem: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );
  let cart = await CartFetcher.fetchCart(request, actionContext);

  const body: {
    lineItemId?: string;
    data: { address: AddressDraft; quantity: number }[];
  } = JSON.parse(request.body);

  const cartItemsShippingAddresses = cart.itemShippingAddresses || [];
  const remainingAddresses = body.data
    .map((item) => item.address)
    .filter(
      (addressSplit) =>
        // @ts-ignore
        cartItemsShippingAddresses.findIndex((address: Address) => address.key === addressSplit.id) === -1,
    );

  if (remainingAddresses.length) {
    for await (const address of remainingAddresses) {
      cart = await cartApi.addItemShippingAddress(cart, address);
    }
  }

  const target = body.data.map((item) => ({ addressKey: item.address.id, quantity: item.quantity }));

  const cartData = await cartApi.updateLineItemShippingDetails(cart, body.lineItemId, target);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cartData),
    sessionData: {
      ...request.sessionData,
      cartId: cart.cartId,
    },
  };

  return response;
};

export const reassignCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  let cart = await CartFetcher.fetchCart(request, actionContext);
  const cartId = cart.cartId;

  const cartApi = new CartApi(
    actionContext.frontasticContext,
    getLocale(request),
    request.sessionData?.organization,
    request.sessionData?.account,
  );
  cart = await cartApi.setCustomerId(cart, request.query?.customerId);
  cart = (await cartApi.setEmail(cart, request.query?.email)) as Cart;

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId,
    },
  };

  return response;
};
