import { Context, Request } from '@frontastic/extension-types';
import { ProductApi } from '../apis/ProductApi';
import { CategoryRouter as BaseCategoryRouter } from 'cofe-ct-ecommerce/utils/CategoryRouter';
import { getLocale, getPath } from 'cofe-ct-ecommerce/utils/Request';
import { ProductQueryFactory } from './ProductQueryFactory';
import { CategoryQuery } from '@commercetools/frontend-domain-types/query/CategoryQuery';
import { Result } from '@commercetools/frontend-domain-types/product/Result';
import { Category } from '@commercetools/frontend-domain-types/product/Category';

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

  static loadFor = async (request: Request, frontasticContext: Context): Promise<Result | null> => {
    const productApi = new ProductApi(frontasticContext, getLocale(request));
    const urlMatches = getPath(request)?.match(/[^\/]+/);

    if (urlMatches) {
      const categoryQuery: CategoryQuery = {
        slug: urlMatches[0],
      };

      const categoryQueryResult = await productApi.queryCategories(categoryQuery);

      if (categoryQueryResult.items.length == 0) return null;
      request.query.category = (categoryQueryResult.items[0] as Category).categoryId;

      const productQuery = ProductQueryFactory.queryFromParams({
        ...request,
      });

      const additionalQueryArgs = {};
      const distributionChannelId =
        request.query?.['distributionChannelId'] || request.sessionData?.organization?.distributionChannel?.id;

      const additionalFacets = [
        {
          attributeId: 'categories.id',
        },
      ];

      if (distributionChannelId) {
        // @ts-ignore
        additionalQueryArgs.priceChannel = distributionChannelId;
        additionalFacets.push({
          attributeId: `variants.availability.availableQuantity`,
        });
      }

      return await productApi.query(productQuery, additionalQueryArgs, additionalFacets);
    }

    return null;
  };

  static loadPreviewFor = async (request: Request, frontasticContext: Context): Promise<Result | null> => {
    const productApi = new ProductApi(frontasticContext, getLocale(request));
    const urlMatches = getPath(request)?.match(/\/preview\/(.+)/);

    if (urlMatches) {
      const categoryQuery: CategoryQuery = {
        slug: urlMatches[1],
      };

      const categoryQueryResult = await productApi.queryCategories(categoryQuery);

      if (categoryQueryResult.items.length == 0) return null;
      request.query.category = (categoryQueryResult.items[0] as Category).categoryId;

      const productQuery = ProductQueryFactory.queryFromParams({
        ...request,
      });

      const additionalQueryArgs = {
        staged: true,
      };
      const distributionChannelId =
        request.query?.['distributionChannelId'] || request.sessionData?.organization?.distributionChannel?.id;

      if (distributionChannelId) {
        // @ts-ignore
        additionalQueryArgs.priceChannel = distributionChannelId;
      }

      const additionalFacets = [
        {
          attributeId: 'published',
          attributeType: 'boolean',
        },
        {
          attributeId: 'categories.id',
        },
      ];

      return await productApi.query(productQuery, additionalQueryArgs, additionalFacets);
    }

    return null;
  };
}
