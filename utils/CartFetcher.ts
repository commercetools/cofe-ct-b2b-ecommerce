import { ActionContext, Request } from '@frontastic/extension-types';
import { Cart } from '@b2bdemo/types/types/cart/Cart';
import { CartFetcher as BaseCartFetcher } from 'cofe-ct-ecommerce/utils/CartFetcher';
import { CartApi } from '../apis/CartApi';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';

export class CartFetcher extends BaseCartFetcher {
  static async fetchCart(request: Request, actionContext: ActionContext): Promise<Cart> {
    const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

    if (request.sessionData?.account !== undefined) {
      return await cartApi.getForUser(request.sessionData.account, request.sessionData.organization);
    }

    if (request.sessionData?.cartId !== undefined) {
      try {
        return await cartApi.getById(request.sessionData.cartId);
      } catch (error) {
        console.info(`Error fetching the cart ${request.sessionData.cartId}, creating a new one. ${error}`);
      }
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
