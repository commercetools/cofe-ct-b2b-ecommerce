import { Product } from '@commercetools/frontend-domain-types/product/Product';
import { Context, Request } from '@frontastic/extension-types';
import { ProductQuery } from '@commercetools/frontend-domain-types/query/ProductQuery';
import { ProductApi } from '../apis/ProductApi';
import { LineItem } from '@commercetools/frontend-domain-types/cart/LineItem';
import { LineItem as WishlistItem } from '@commercetools/frontend-domain-types/wishlist/LineItem';
import { getLocale, getPath } from 'cofe-ct-ecommerce/utils/Request';

export class ProductRouter {
  private static isProduct(product: Product | LineItem | WishlistItem): product is Product {
    return (product as Product).productId !== undefined;
  }

  static generateUrlFor(item: Product | LineItem | WishlistItem) {
    if (ProductRouter.isProduct(item)) {
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

  static getSubscriptionBundles = async (
    request: Request,
    frontasticContext: Context,
    product: Product,
  ): Promise<Product[]> => {
    const urlMatches = getPath(request)?.match(/\/p\/([^\/]+)/);

    const attributeNames = frontasticContext?.project?.configuration?.subscriptions
      ?.subscriptionAttributeNameOnBundledProduct as string;
    if (urlMatches && attributeNames) {
      const sku = urlMatches[1];
      const variant = product.variants.find((variant) => variant.sku === sku);
      if (variant) {
        const bundleAttributeNames = attributeNames.split(',');
        const attributeKeys = Object.keys(variant.attributes).filter((attributeKey) =>
          bundleAttributeNames.includes(attributeKey),
        );
        if (attributeKeys?.length) {
          const productApi = new ProductApi(frontasticContext, getLocale(request));
          const productIds = attributeKeys.map((attributeKey) => variant.attributes[attributeKey]?.id);
          return productApi.query({ productIds }).then((result) => result.items as Product[]);
        }
      }
    }
    return [];
  };
}
