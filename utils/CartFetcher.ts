import { ActionContext, Request } from '@frontastic/extension-types';
import { Cart } from '@commercetools/frontend-domain-types/cart/Cart';
import { CartApi } from '../apis/CartApi';
import { Guid } from 'cofe-ct-ecommerce/utils/Guid';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';

export class CartFetcher {
  static async fetchCart(request: Request, actionContext: ActionContext): Promise<Cart> {
    const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

    if (request.sessionData?.account !== undefined) {
      return await cartApi.getForUser(request.sessionData.account);
    }

    if (request.sessionData?.cartId !== undefined) {
      try {
        return await cartApi.getById(request.sessionData.cartId);
      } catch (error) {
        console.info(`Error fetching the cart ${request.sessionData.cartId}, creating a new one. ${error}`);
      }
    }

    return await cartApi.getAnonymous(Guid.newGuid());
  }
}
