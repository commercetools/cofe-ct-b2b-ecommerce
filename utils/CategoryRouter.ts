import { Context, Request } from '@frontastic/extension-types';
import { ProductApi } from '../apis/ProductApi';
import { CategoryRouter as BaseCategoryRouter } from 'cofe-ct-ecommerce/utils/CategoryRouter';
import { getLocale, getPath } from 'cofe-ct-ecommerce/utils/Request';
import { Result } from '@commercetools/frontend-domain-types/product/Result';
import { Category } from '@commercetools/frontend-domain-types/product/Category';
import { ProductQueryFactory } from 'cofe-ct-ecommerce/utils/ProductQueryFactory';
import { AdditionalQueryArgs } from '../types/query/ProductQuery';

export class CategoryRouter extends BaseCategoryRouter {
  static identifyPreviewFrom(request: Request) {
    if (getPath(request)?.match(/\/preview\/(.+)/)) {
      return true;
    }

    return false;
  }
  static identifyFrom(request: Request) {
    if (getPath(request)?.match(/[^\/]+/)) {
      return true;
    }

    return false;
  }

  static loadFor = async (request: Request, frontasticContext: Context): Promise<Result> => {
    const productApi = new ProductApi(frontasticContext, getLocale(request));

    const chunks = getPath(request)?.split('/').filter(Boolean);

    if (chunks) {
      const slug = chunks[chunks.length - 1];

      const response = await productApi.queryCategories({ slug });

      request.query.categories = [(response.items[0] as Category).categoryId];

      const productQuery = ProductQueryFactory.queryFromParams({
        ...request,
      });
      const additionalQueryArgs = {};
      const storeKey = request.query?.['storeKey'] || request.sessionData?.organization?.store?.key;

      const additionalFacets: any[] = [];

      if (storeKey) {
        // @ts-ignore
        additionalQueryArgs.storeProjection = storeKey;
        additionalFacets.push({
          attributeId: `variants.availability.availableQuantity`,
        });
      }

      return await productApi.query(productQuery, additionalQueryArgs, additionalFacets);
    }

    // @ts-ignore
    return null;
  };

  static loadPreviewFor = async (request: Request, frontasticContext: Context): Promise<Result> => {
    const productApi = new ProductApi(frontasticContext, getLocale(request));
    const urlMatches = getPath(request)?.match(/\/preview\/(.+)/);

    if (urlMatches) {
      const slug = urlMatches[1];
     

      const response = await productApi.queryCategories({ slug });

      request.query.categories = [(response.items[0] as Category).categoryId];

      const productQuery = ProductQueryFactory.queryFromParams({
        ...request,
      });

      const additionalQueryArgs: AdditionalQueryArgs = {
        staged: true,
      };
      const storeKey = request.query?.['storeKey'] || request.sessionData?.organization?.store?.key;

      if (storeKey) {
        // @ts-ignore
        additionalQueryArgs.storeProjection = storeKey;
      }

      const additionalFacets = [
        {
          attributeId: 'published',
          attributeType: 'boolean',
        }
      ];

      return await productApi.query(productQuery, additionalQueryArgs, additionalFacets);
    }

    // @ts-ignore
    return null;
  };
}
