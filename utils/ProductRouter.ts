import { Context, Request } from '@frontastic/extension-types';
import { ProductQuery } from '../types/query/ProductQuery';
import { LineItem as WishlistItem } from '@commercetools/frontend-domain-types/wishlist/LineItem';
import { ProductRouter as BaseProductRouter } from 'cofe-ct-ecommerce/utils/ProductRouter';
import { ProductApi } from '../apis/ProductApi';
import { getPath, getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { LineItem } from '@commercetools/frontend-domain-types/cart/LineItem';
import { Product } from '../types/product/Product';

export class ProductRouter extends BaseProductRouter {
  static isProduct(product: Product | LineItem | WishlistItem): product is Product {
    return (product as Product).variants !== undefined;
  }

  static generateUrlFor(item: Product | LineItem | WishlistItem) {
    if (this.isProduct(item)) {
      return `/${item.slug}/p/${item.variants?.[0]?.sku}`;
    }
    return `/slug/p/${item.variant?.sku}`;
  }

  static identifyFrom(request: Request) {
    if (getPath(request)?.match(/\/p\/([^\/]+)/)) {
      return true;
    }

    return false;
  }

  static identifyPreviewFrom(request: Request) {
    if (getPath(request)?.match(/\/preview\/.+\/p\/([^\/]+)/)) {
      return true;
    }

    return false;
  }

  static loadFor = async (request: Request, frontasticContext: Context): Promise<Product> => {
    const productApi = new ProductApi(frontasticContext, getLocale(request));

    const urlMatches = getPath(request)?.match(/\/p\/([^\/]+)/);

    if (urlMatches) {
      const productQuery: ProductQuery = {
        skus: [urlMatches[1]],
      };
      const additionalQueryArgs = {};
      const distributionChannelId =
        request.query?.['distributionChannelId'] || request.sessionData?.organization?.distributionChannel?.id;

      if (distributionChannelId) {
        // @ts-ignore
        additionalQueryArgs.priceChannel = distributionChannelId;
      }

      return productApi.getProduct(productQuery, additionalQueryArgs);
    }

    return null;
  };

  static loadPreviewFor = async (request: Request, frontasticContext: Context): Promise<Product> => {
    const productApi = new ProductApi(frontasticContext, getLocale(request));

    const urlMatches = getPath(request)?.match(/\/preview\/.+\/p\/([^\/]+)/);

    if (urlMatches) {
      const productQuery: ProductQuery = {
        skus: [urlMatches[1]],
      };

      const additionalQueryArgs = { staged: true };
      const distributionChannelId =
        request.query?.['distributionChannelId'] || request.sessionData?.organization?.distributionChannel?.id;

      if (distributionChannelId) {
        // @ts-ignore
        additionalQueryArgs.priceChannel = distributionChannelId;
      }
      return productApi.getProduct(productQuery, additionalQueryArgs);
    }

    return null;
  };
}
