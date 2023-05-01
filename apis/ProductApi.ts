import { ProductApi as BaseProductApi } from 'cofe-ct-ecommerce/apis/ProductApi';
import { ProductMapper } from '../mappers/ProductMapper';
import { Result } from '@commercetools/frontend-domain-types/product/Result';
import { ProductQuery } from '@commercetools/frontend-domain-types/query/ProductQuery';
import { Product } from '../types/product/Product';
import { FilterTypes } from '@commercetools/frontend-domain-types/query/Filter';
import { FacetDefinition } from '@commercetools/frontend-domain-types/product/FacetDefinition';
import { TermFilter } from '@commercetools/frontend-domain-types/query/TermFilter';
import { RangeFilter } from '@commercetools/frontend-domain-types/query/RangeFilter';
import { Category } from '../types/product/Category';
export class ProductApi extends BaseProductApi {
  query: (productQuery: ProductQuery, additionalQueryArgs?: object, additionalFacets?: object[]) => Promise<Result> =
    async (productQuery: ProductQuery, additionalQueryArgs?: object, additionalFacets: object[] = []) => {
      try {
        const locale = await this.getCommercetoolsLocal();

        // TODO: get default from constant
        const limit = +productQuery.limit || 24;

        const filterQuery: string[] = [];
        const filterFacets: string[] = [];
        const sortAttributes: string[] = [];
         // @ts-ignore
         const {distributionChannelId, supplyChannelId, ...additionalArgs} = additionalQueryArgs || {};

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

        const queryArgFacets = ProductMapper.facetDefinitionsToCommercetoolsQueryArgFacets(facetDefinitions, locale);

        if (productQuery.productIds !== undefined && productQuery.productIds.length !== 0) {
          filterQuery.push(`id:"${productQuery.productIds.join('","')}"`);
        }

        if (productQuery.skus !== undefined && productQuery.skus.length !== 0) {
          filterQuery.push(`variants.sku:"${productQuery.skus.join('","')}"`);
        }

        if (productQuery.category !== undefined && productQuery.category !== '') {
          filterQuery.push(`categories.id:subtree("${productQuery.category}")`);
        }

        if (productQuery.filters !== undefined) {
          productQuery.filters.forEach((filter) => {
            switch (filter.type) {
              case FilterTypes.TERM:
                filterQuery.push(`${filter.identifier}.key:"${(filter as TermFilter).terms.join('","')}"`);
                break;
              case FilterTypes.BOOLEAN:
                filterQuery.push(
                  `${filter.identifier}:${(filter as TermFilter).terms[0]?.toString().toLowerCase() === 'true'}`,
                );
                break;
              case FilterTypes.RANGE:
                if (filter.identifier === 'price') {
                  // The scopedPrice filter is a commercetools price filter of a product variant selected
                  // base on the price scope. The scope used is currency and country.
                  filterQuery.push(
                    `variants.scopedPrice.value.centAmount:range (${(filter as RangeFilter).min ?? '*'} to ${
                      (filter as RangeFilter).max ?? '*'
                    })`,
                  );
                }
                break;
            }
          });
        }

        if (productQuery.facets !== undefined) {
          filterFacets.push(
            ...ProductMapper.facetDefinitionsToFilterFacets(productQuery.facets, facetDefinitions, locale),
          );
        }

        if (productQuery.sortAttributes !== undefined) {
          Object.keys(productQuery.sortAttributes).map((field, directionIndex) => {
            sortAttributes.push(`${field} ${Object.values(productQuery.sortAttributes)[directionIndex]}`);
          });
        } else {
          // default sort
          sortAttributes.push(`variants.attributes.salesRank asc`);
        }

        const methodArgs = {
          queryArgs: {
            sort: sortAttributes,
            limit: limit,
            offset: this.getOffsetFromCursor(productQuery.cursor),
            priceCurrency: locale.currency,
            priceCountry: locale.country,
            facet: queryArgFacets.length > 0 ? queryArgFacets : undefined,
            filter: filterFacets.length > 0 ? filterFacets : undefined,
            expand: 'categories[*]',
            'filter.facets': filterFacets.length > 0 ? filterFacets : undefined,
            'filter.query': filterQuery.length > 0 ? filterQuery : undefined,
            [`text.${locale.language}`]: productQuery.query,
            ...additionalArgs,
          },
        };

        return await this.getApiForProject()
          .productProjections()
          .search()
          .get(methodArgs)
          .execute()
          .then((response) => {
            const items = response.body.results.map((product) =>
              ProductMapper.commercetoolsProductProjectionToProduct(product, locale, distributionChannelId, supplyChannelId),
            );

            const result: Result = {
              total: response.body.total,
              items,
              count: response.body.count,
              facets: ProductMapper.commercetoolsFacetResultsToFacets(response.body.facets, productQuery, locale),
              previousCursor: ProductMapper.calculatePreviousCursor(response.body.offset, response.body.count),
              nextCursor: ProductMapper.calculateNextCursor(
                response.body.offset,
                response.body.count,
                response.body.total,
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

  getProduct: (productQuery: ProductQuery, additionalQueryArgs?: object) => Promise<Product> = async (
    productQuery: ProductQuery,
    additionalQueryArgs?: object,
  ) => {
    try {
      const result = await this.query(productQuery, additionalQueryArgs);

      return result.items.shift() as Product;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getProduct failed. ${error}`);
    }
  };

  getAttributeGroup: (key: string) => Promise<string[]> = async (key: string) => {
    try {
      const { body } = await this.getApiForProject().attributeGroups().withKey({ key }).get().execute();

      return ProductMapper.commercetoolsAttributeGroupToString(body);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`get attributeGroup failed. ${error}`);
    }
  };

  getNavigationCategories: () => Promise<Category[]> = async () => {
    const { items }: { items: any[] } = await this.queryCategories({ limit: 500 });

    let categories: Category[] = [];

    categories = items.filter((item: Category) => !item.ancestors?.length);

    return categories as Category[];
  };
}
