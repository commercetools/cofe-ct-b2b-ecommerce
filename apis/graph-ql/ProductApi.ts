import { ProductMapper } from '../../mappers/graph-ql/ProductMapper';
import { Result } from '@commercetools/frontend-domain-types/product/Result';
import { ProductQuery } from '@commercetools/frontend-domain-types/query/ProductQuery';
import { FilterTypes } from '@commercetools/frontend-domain-types/query/Filter';
import { FacetDefinition } from '@commercetools/frontend-domain-types/product/FacetDefinition';
import { TermFilter } from '@commercetools/frontend-domain-types/query/TermFilter';
import { RangeFilter } from '@commercetools/frontend-domain-types/query/RangeFilter';
import { SearchFilterInput } from '../../types/graph-ql/query/ProductQuery';
import { ProductApi as RestProductApi } from '../ProductApi';
import { productProjectionSearchQuery } from '../../queries/ProductProjectionSearch';
import { AdditionalQueryArgs } from '../../types/query/ProductQuery';
import { ProductProjection } from '@commercetools/platform-sdk';
export class ProductApi extends RestProductApi {
  getGraphQlFilterQuery: (productQuery: ProductQuery) => SearchFilterInput[] = (productQuery: ProductQuery) => {
    const filterQuery: SearchFilterInput[] = [];
    if (productQuery.productIds !== undefined && productQuery.productIds.length !== 0) {
      filterQuery.push({ model: { value: { path: 'id', values: productQuery.productIds } } });
    }

    if (productQuery.skus !== undefined && productQuery.skus.length !== 0) {
      filterQuery.push({ model: { value: { path: 'variants.sku', values: productQuery.skus } } });
    }

    if (productQuery.category !== undefined && productQuery.category !== '') {
      filterQuery.push({
        model: { tree: { path: 'categories.id', subTreeValues: [productQuery.category], rootValues: [] } },
      });
    }

    if (productQuery.filters !== undefined) {
      productQuery.filters.forEach((filter) => {
        switch (filter.type) {
          case FilterTypes.TERM:
            filterQuery.push({
              model: { value: { path: `${filter.identifier}.key`, values: (filter as TermFilter).terms || [] } },
            });

            break;
          case FilterTypes.BOOLEAN:
            filterQuery.push({
              model: { exists: { path: filter.identifier } },
            });
            break;
          case FilterTypes.RANGE:
            if (filter.identifier === 'price') {
              // The scopedPrice filter is a commercetools price filter of a product variant selected
              // base on the price scope. The scope used is currency and country.
              filterQuery.push({
                model: {
                  range: {
                    path: 'variants.scopedPrice.value.centAmount',
                    ranges: [
                      {
                        from: (filter as RangeFilter).min?.toString() ?? '*',
                        to: (filter as RangeFilter).max?.toString() ?? '*',
                      },
                    ],
                  },
                },
              });
            }
            break;
        }
      });
    }
    return filterQuery;
  };

  getGraphQlFilterFacets: (
    productQuery: ProductQuery,
    facetDefinitions: FacetDefinition[],
  ) => Promise<SearchFilterInput[]> = async (productQuery: ProductQuery, facetDefinitions: FacetDefinition[]) => {
    const filterFacets: SearchFilterInput[] = [];
    const locale = await this.getCommercetoolsLocal();
    if (productQuery.facets !== undefined) {
      filterFacets.push(
        ...ProductMapper.facetDefinitionsToGraphQlFilterFacets(productQuery.facets, facetDefinitions, locale),
      );
    }
    return filterFacets;
  };

  query: (
    productQuery: ProductQuery,
    additionalQueryArgs?: AdditionalQueryArgs,
    additionalFacets?: object[],
  ) => Promise<Result> = async (
    productQuery: ProductQuery,
    additionalQueryArgs?: AdditionalQueryArgs,
    additionalFacets: object[] = [],
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const limit = productQuery.limit || 24;
      const { distributionChannelId, supplyChannelId, ...additionalArgs } = additionalQueryArgs || {};

      const facetDefinitions: FacetDefinition[] = [
        ...ProductMapper.commercetoolsProductTypesToFacetDefinitions(await this.getProductTypes(), locale),
        ...additionalFacets,
        // Include Scoped Price facet
        {
          attributeId: 'variants.scopedPrice.value',
          attributeType: 'money',
        },
        // Include Price facet
        {
          attributeId: 'variants.price',
          attributeType: 'money',
        },
      ];
      const filterFacets = await this.getGraphQlFilterFacets(productQuery, facetDefinitions);
      const queryArgFacets = ProductMapper.facetDefinitionsToGraphQlArgFacets(facetDefinitions, locale);
      const filterQuery = this.getGraphQlFilterQuery(productQuery);

      const variables = {
        locale: locale.language,
        currency: locale.currency,
      };

      const parameters: any = {
        limit: limit,
        sort: this.getSortAttributes(productQuery),
        offset: this.getOffsetFromCursor(productQuery.cursor),
        priceSelector: {
          currency: locale.currency,
          country: locale.country,
        },
        text: productQuery.query, //TODO: if text then add $locale
        filter: filterFacets.length > 0 ? filterFacets : undefined,
        'filter.facets': filterFacets.length > 0 ? filterFacets : undefined,
        facet: queryArgFacets.length > 0 ? queryArgFacets : undefined,
        'filter.query': filterQuery.length > 0 ? filterQuery : undefined,
      };

      if (additionalArgs.storeProjection) {
        parameters.storeProjection = additionalArgs.storeProjection;
      }

      if (additionalArgs.storeProjection) {
        parameters.storeProjection = additionalArgs.storeProjection;
      }

      console.debug('variables', variables);

      return await this.getApiForProject()
        .graphql()
        .post({
          body: {
            query: productProjectionSearchQuery(parameters),
            variables,
            operationName: 'productProjectionSearch',
          },
        })
        .execute()
        .then((response) => {
          console.debug('response', response);
          const items = response.body.data.productProjectionSearch.results.map((product: ProductProjection) =>
            ProductMapper.commercetoolsProductProjectionToProduct(
              product,
              locale,
              distributionChannelId,
              supplyChannelId,
            ),
          );

          const result: Result = {
            total: response.body.data.productProjectionSearch.total,
            items,
            count: response.body.data.productProjectionSearch.count,
            facets: ProductMapper.commercetoolsFacetResultsToFacets(
              response.body.data.productProjectionSearch.facets,
              productQuery,
              locale,
            ),
            previousCursor: ProductMapper.calculatePreviousCursor(
              response.body.data.productProjectionSearch.offset,
              response.body.data.productProjectionSearch.count,
            ),
            nextCursor: ProductMapper.calculateNextCursor(
              response.body.data.productProjectionSearch.offset,
              response.body.data.productProjectionSearch.count,
              response.body.data.productProjectionSearch.total,
            ),
            query: productQuery,
          };

          return result;
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`query failed. ${error}`);
    }
  };
}
