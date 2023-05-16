import { DataSourceConfiguration, Request } from '@frontastic/extension-types';
import { SortAttributes, SortOrder } from '@commercetools/frontend-domain-types/query/ProductQuery';
import { Filter, FilterTypes } from '@commercetools/frontend-domain-types/query/Filter';
import { RangeFilter } from '@commercetools/frontend-domain-types/query/RangeFilter';
import { TermFilter } from '@commercetools/frontend-domain-types/query/TermFilter';
import { FilterFieldTypes } from '@commercetools/frontend-domain-types/product/FilterField';
import { ProductQueryFactory as BaseProductQueryFactory } from 'cofe-ct-ecommerce/utils/ProductQueryFactory';
import { ProductQuery } from 'cofe-ct-b2b-ecommerce/types/query/ProductQuery';

export class ProductQueryFactory extends BaseProductQueryFactory {
  static queryFromParams(request: Request, config?: DataSourceConfiguration): ProductQuery {
    let queryParams;
    const filters: Filter[] = [];
    const productQuery: ProductQuery = {
      productIds: [],
      skus: [],
    };

    // Selected ID/SKUs filter from the studio
    const productIds = config?.configuration?.productIds?.split(',').map((val: string) => val.trim());
    const productSkus = config?.configuration?.productSkus?.split(',').map((val: string) => val.trim());

    /**
     * Merge params
     */
    if (request?.query) {
      queryParams = request.query;
    }

    if (config?.configuration) {
      queryParams = {
        ...queryParams,
        ...config.configuration,
      };
    }

    // Add SKUs and IDs if they are there
    if (productSkus && productSkus.length > 0) queryParams.skus = productSkus;
    if (productIds && productIds.length > 0) queryParams.productIds = productIds;

    /**
     * Map query
     */
    productQuery.query = queryParams?.query || undefined;

    /**
     * Map Category
     *
     * Category could be overwritten by category configuration from Frontastic Studio
     */
    productQuery.category = queryParams?.category || undefined;

    /* Root category (for store selection) */
    productQuery.rootCategoryId = request.sessionData?.rootCategoryId;

    /**
     * Map productIds
     */
    if (queryParams?.productIds && Array.isArray(queryParams?.productIds)) {
      queryParams?.productIds.map((productId: string | number) => {
        productQuery.productIds.push(productId.toString());
      });
    }

    /**
     * Map skus
     */
    if (queryParams?.skus && Array.isArray(queryParams?.skus)) {
      queryParams?.skus.map((sku: string | number) => {
        productQuery.skus.push(sku.toString());
      });
    }

    /**
     * Map filters and category
     *
     * Since filters and values might be returned in separated arrays we are using
     * the following method to merge both, filters and values, in a single array.
     */
    const configFiltersData: any[] = [];
    configFiltersData.push(...this.mergeProductFiltersAndValues(queryParams));
    configFiltersData.push(...this.mergeCategoryFiltersAndValues(queryParams));

    let key: any;
    let configFilterData: any;

    if (configFiltersData instanceof Array) {
      for ([key, configFilterData] of Object.entries(configFiltersData)) {
        if (configFilterData?.field === 'categoryId') {
          // Overwrite category with any value that has been set from Frontastic Studio
          productQuery.category = configFilterData.values[0]; // TODO: should change if category is a single value
          continue;
        }

        switch (configFilterData.type) {
          case FilterFieldTypes.NUMBER:
            const rangeFilter: RangeFilter = {
              identifier: configFilterData?.field,
              type: FilterTypes.RANGE,
              min: +configFilterData?.min || undefined,
              max: +configFilterData?.max || undefined,
            };
            filters.push(rangeFilter);
            break;
          case FilterFieldTypes.ENUM:
            const enumFilter: TermFilter = {
              identifier: configFilterData?.field,
              type: FilterTypes.TERM,
              terms: configFilterData?.values.map((term: string | number) => term),
            };
            filters.push(enumFilter);
            break;
          case FilterFieldTypes.BOOLEAN:
            const booleanFilter: TermFilter = {
              identifier: configFilterData?.field,
              type: FilterTypes.BOOLEAN,
              terms: [configFilterData?.values[0]],
            };
            filters.push(booleanFilter);
            break;
          default:
            break;
        }
      }

      productQuery.filters = filters;
    }

    /**
     * Map facets
     */
    if (queryParams.facets) {
      productQuery.facets = this.queryParamsToFacets(queryParams);
    }

    /**
     * Map sort attributes
     */
    if (queryParams.sortAttributes) {
      const sortAttributes: SortAttributes = {};
      let sortAttribute;

      for (sortAttribute of Object.values(queryParams.sortAttributes)) {
        const key = Object.keys(sortAttribute)[0];
        sortAttributes[key] = sortAttribute[key] ? sortAttribute[key] : SortOrder.ASCENDING;
      }
      productQuery.sortAttributes = sortAttributes;
    }

    /**
     * Map page limit
     */
    productQuery.limit = queryParams?.limit || undefined;

    /**
     * Map page cursor
     */
    productQuery.cursor = queryParams?.cursor || undefined;

    return productQuery;
  }
}
