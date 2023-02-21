import { Request, Response } from '@frontastic/extension-types';
import { ActionContext } from '@frontastic/extension-types';
import { LineItem, LineItemReturnItemDraft } from '@b2bdemo/types/types/cart/LineItem';
import { Address } from '@b2bdemo/types/types/account/Address';
import { ShippingMethod } from '@b2bdemo/types/types/cart/ShippingMethod';
import { AddressDraft } from '@commercetools/platform-sdk';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { CartApi } from '../apis/CartApi';
import { CartFetcher } from '../utils/CartFetcher';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export const addToCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

  const body: {
    variant?: { sku?: string; count: number };
  } = JSON.parse(request.body);

  const lineItem: LineItem = {
    variant: {
      sku: body.variant?.sku || undefined,
      price: undefined,
    },
    count: +body.variant?.count || 1,
  };

  const distributionChannel = request.sessionData.organization?.distributionChannel?.id;

  let cart = await CartFetcher.fetchCart(request, actionContext);
  cart = await cartApi.addToCart(cart, lineItem, distributionChannel);

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
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

  const body: {
    list?: { sku?: string; count: number }[];
  } = JSON.parse(request.body);

  const lineItems: LineItem[] = body.list?.map((variant) => ({
    variant: {
      sku: variant.sku || undefined,
      price: undefined,
    },
    count: +variant.count || 1,
  }));

  const distributionChannel = request.sessionData.organization?.distributionChannel?.id;

  let cart = await CartFetcher.fetchCart(request, actionContext);
  cart = await cartApi.addItemsToCart(cart, lineItems, distributionChannel);

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
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

  let response: Response;

  try {
    const { orderNumber, returnLineItems }: { orderNumber: string; returnLineItems: LineItemReturnItemDraft[] } =
      JSON.parse(request.body);
    const res = await cartApi.returnItems(orderNumber, returnLineItems);
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
      error: e?.message,
      errorCode: 500,
    };
  }

  return response;
};

export const setShippingMethod: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  let cart = await CartFetcher.fetchCart(request, actionContext);

  const shippingMethod: ShippingMethod = {
    shippingMethodId: request.query.shippingMethodId,
  };

  cart = await cartApi.setShippingMethod(cart, shippingMethod);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(cart),
    sessionData: {
      ...request.sessionData,
      cartId: cart.cartId,
    },
  };

  return response;
};

export const replicateCart: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
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
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));
  const cart = await CartFetcher.fetchCart(request, actionContext);

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
      await cartApi.addItemShippingAddress(cart, address);
    }
  }

  const target = body.data.map((item) => ({ addressKey: item.address.id, quantity: item.quantity }));

  const cartData = await cartApi.updateLineItemShippingDetails(cart.cartId, body.lineItemId, target);

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