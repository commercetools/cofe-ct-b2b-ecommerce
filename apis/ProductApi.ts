import { Result } from '@commercetools/frontend-domain-types/product/Result';
import { ProductMapper } from '../mappers/ProductMapper';
import { ProductQuery } from '@commercetools/frontend-domain-types/query/ProductQuery';
import { Product } from '@commercetools/frontend-domain-types/product/Product';
import { FilterTypes } from '@commercetools/frontend-domain-types/query/Filter';
import { TermFilter } from '@commercetools/frontend-domain-types/query/TermFilter';
import { RangeFilter } from '@commercetools/frontend-domain-types/query/RangeFilter';
import { CategoryQuery } from '@commercetools/frontend-domain-types/query/CategoryQuery';
import { FacetDefinition } from '@commercetools/frontend-domain-types/product/FacetDefinition';
import { ProductApi as BaseProductApi } from 'cofe-ct-ecommerce/apis/ProductApi';

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
            ...additionalQueryArgs,
          },
        };

        return await this.getApiForProject()
          .productProjections()
          .search()
          .get(methodArgs)
          .execute()
          .then((response) => {
            const items = response.body.results.map((product) =>
              ProductMapper.commercetoolsProductProjectionToProduct(product, locale),
            );

            const result: Result = {
              total: response.body.total,
              items: items,
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

  queryCategories: (categoryQuery: CategoryQuery) => Promise<Result> = async (categoryQuery: CategoryQuery) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      // TODO: get default from constant
      const limit = +categoryQuery.limit || 24;
      const where: string[] = [];

      if (categoryQuery.slug) {
        where.push(`slug(${locale.language}="${categoryQuery.slug}")`);
      }

      if (categoryQuery.parentId) {
        where.push(`parent(id="${categoryQuery.parentId}")`);
      }

      const methodArgs = {
        queryArgs: {
          limit: limit,
          offset: this.getOffsetFromCursor(categoryQuery.cursor),
          where: where.length > 0 ? where : undefined,
          sort: 'orderHint',
        },
      };

      return await this.getApiForProject()
        .categories()
        .get(methodArgs)
        .execute()
        .then((response) => {
          const categories = response.body.results;

          const nodes = {};

          for (let i = 0; i < categories.length; i++) {
            (categories[i] as any).subCategories = [];
            nodes[categories[i].id] = categories[i];
          }

          for (let i = 0; i < categories.length; i++) {
            if (categories[i].parent) {
              nodes[categories[i].parent.id].subCategories.push(categories[i]);
            }
          }
          const nodesQueue = [categories];

          while (nodesQueue.length > 0) {
            const currentCategories = nodesQueue.pop();
            currentCategories.sort((a, b) => +b.orderHint - +a.orderHint);
            currentCategories.forEach((category) => nodesQueue.push(nodes[category.id].subCategories));
          }

          const items = categories.map((category) => ProductMapper.commercetoolsCategoryToCategory(category, locale));

          const result: Result = {
            total: response.body.total,
            items: items,
            count: response.body.count,
            previousCursor: ProductMapper.calculatePreviousCursor(response.body.offset, response.body.count),
            nextCursor: ProductMapper.calculateNextCursor(
              response.body.offset,
              response.body.count,
              response.body.total,
            ),
            query: categoryQuery,
          };

          return result;
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`queryCategories failed. ${error}`);
    }
  };
}
