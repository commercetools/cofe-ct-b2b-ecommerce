import { ActionContext, Request } from '@frontastic/extension-types';
import { Cart } from '../types/cart/Cart';
import { CartFetcher as BaseCartFetcher } from 'cofe-ct-ecommerce/utils/CartFetcher';
import { CartApi } from '../apis/CartApi';
import { getCurrency, getLocale } from 'cofe-ct-ecommerce/utils/Request';

export class CartFetcher extends BaseCartFetcher {
  static async fetchCart(request: Request, actionContext: ActionContext): Promise<Cart> {
    const cartApi = new CartApi(
      actionContext.frontasticContext,
      getLocale(request),
      getCurrency(request),
      request.sessionData?.organization,
      request.sessionData?.account,
    );

    if (request.sessionData?.cartId !== undefined) {
      try {
        const cart = (await cartApi.getById(request.sessionData.cartId)) as Cart;
        if (cartApi.assertCartOrganization(cart, request.sessionData.organization)) {
          return cart;
        }
      } catch (error) {
        console.info(`Error fetching the cart ${request.sessionData.cartId}, creating a new one. ${error}`);
      }
    }

    if (request.sessionData?.account !== undefined) {
      return (await cartApi.getForUser()) as Cart;
    }

    // @ts-ignore
    return {};
  }
}

// Override the BaseMapper with new Mapper functions
Object.getOwnPropertyNames(CartFetcher).forEach((key) => {
  if (typeof CartFetcher[key] === 'function') {
    BaseCartFetcher[key] = CartFetcher[key];
  }
});
