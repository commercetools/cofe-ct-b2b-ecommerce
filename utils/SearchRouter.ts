import { Context, Request } from '@frontastic/extension-types';
import { SearchRouter as BaseSearchRouter } from 'cofe-ct-ecommerce/utils/SearchRouter';
import { ProductApi } from '../apis/ProductApi';
import { getLocale, getPath } from 'cofe-ct-ecommerce/utils/Request';
import { Result } from '@commercetools/frontend-domain-types/product/Result';
import { ProductQueryFactory } from 'cofe-ct-ecommerce/utils/ProductQueryFactory';

export class SearchRouter extends BaseSearchRouter {
  static identifyFrom(request: Request) {
    const urlMatches = getPath(request)?.match(/^\/search/);

    if (urlMatches) {
      return true;
    }

    return false;
  }

  static loadFor = async (request: Request, frontasticContext: Context): Promise<Result | null> => {
    const productApi = new ProductApi(frontasticContext, getLocale(request));

    const urlMatches = getPath(request)?.match(/\/search/);

    const additionalQueryArgs = {};
    const additionalFacets: any[] = [];
    const storeKey = request.query?.['storeKey'] || request.sessionData?.organization?.store?.key;

    if (storeKey) {
      // @ts-ignore
      additionalQueryArgs.storeProjection = storeKey;
      additionalFacets.push({
        attributeId: `variants.availability.availableQuantity`,
      });
    }

    if (urlMatches) {
      const productQuery = ProductQueryFactory.queryFromParams({
        ...request,
        query: { ...request.query, query: request.query.query || request.query.q },
      });
      return productApi.query(productQuery, additionalQueryArgs, additionalFacets);
    }

    return null;
  };
}
