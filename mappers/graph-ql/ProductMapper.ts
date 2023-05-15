import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { ProductMapper as B2BProductMapper } from '../ProductMapper';
import { TermFacet as QueryTermFacet } from '@commercetools/frontend-domain-types/query/TermFacet';
import { RangeFacet as QueryRangeFacet } from '@commercetools/frontend-domain-types/query/RangeFacet';
import { Facet as QueryFacet } from '@commercetools/frontend-domain-types/query/Facet';
import { FacetDefinition } from '@commercetools/frontend-domain-types/product/FacetDefinition';
import { FilterTypes } from '@commercetools/frontend-domain-types/query/Filter';
import { SearchFacetInput, SearchFilterInput } from '../../types/graph-ql/query/ProductQuery';
import {
  Category as CommercetoolsCategory,
  ProductProjection as CommercetoolsProductProjection,
  ProductVariant as CommercetoolsProductVariant,
  ProductVariantAvailability,
  ProductVariantChannelAvailabilityMap,
  Price,
} from '@commercetools/platform-sdk';
import { Product } from '../../types/product/Product';

interface ChannelsAvailability {
  results?: {
    channel: { id: string };
    availability: { isOnStock: boolean; availableQuantity: number; id: string; version: string };
  }[];
}

export class ProductMapper extends B2BProductMapper {
  static facetDefinitionsToGraphQlFilterFacets(
    queryFacets: QueryFacet[],
    facetDefinitions: FacetDefinition[],
    locale: Locale,
  ): SearchFilterInput[] {
    const filterFacets: SearchFilterInput[] = [];
    const typeLookup: Record<string, string> = {};

    if (facetDefinitions.length === 0) {
      return filterFacets;
    }

    facetDefinitions.forEach((facetDefinition) => {
      typeLookup[facetDefinition.attributeId] = facetDefinition.attributeType;
    });

    queryFacets.forEach((queryFacet) => {
      if (!queryFacet || !typeLookup?.hasOwnProperty(queryFacet.identifier)) {
        return;
      }

      switch (typeLookup[queryFacet.identifier]) {
        case 'money':
          filterFacets.push({
            model: {
              range: {
                path: `${queryFacet.identifier}.centAmount`,
                ranges: [
                  { from: `${(queryFacet as QueryRangeFacet).min}`, to: `${(queryFacet as QueryRangeFacet).max}` },
                ],
              },
            },
          });
          break;
        case 'enum':
          filterFacets.push({
            model: {
              value: {
                path: `${queryFacet.identifier}.label`,
                values: [(queryFacet as QueryTermFacet).terms.join('","')],
              },
            },
          });
          break;
        case 'lenum':
          filterFacets.push({
            model: {
              value: {
                path: `${queryFacet.identifier}.label.${locale.language}`,
                values: [(queryFacet as QueryTermFacet).terms.join('","')],
              },
            },
          });
          break;
        case 'ltext':
          filterFacets.push({
            model: {
              value: {
                path: `${queryFacet.identifier}.${locale.language}`,
                values: [(queryFacet as QueryTermFacet).terms.join('","')],
              },
            },
          });
          break;
        case 'number':
        case 'boolean':
        case 'text':
        case 'reference':
        default:
          if (queryFacet.type === FilterTypes.TERM || queryFacet.type === FilterTypes.BOOLEAN) {
            filterFacets.push({
              model: {
                value: {
                  path: `${queryFacet.identifier}`,
                  values: [(queryFacet as QueryTermFacet).terms.join('","')],
                },
              },
            });
          } else {
            filterFacets.push({
              model: {
                range: {
                  path: `${queryFacet.identifier}`,
                  ranges: [
                    { from: `${(queryFacet as QueryRangeFacet).min}`, to: `${(queryFacet as QueryRangeFacet).max}` },
                  ],
                },
              },
            });
          }
          break;
      }
    });

    return filterFacets;
  }

  static facetDefinitionsToGraphQlArgFacets(facetDefinitions: FacetDefinition[], locale: Locale): SearchFacetInput[] {
    const queryArgFacets: SearchFacetInput[] = [];

    facetDefinitions?.forEach((facetDefinition) => {
      switch (facetDefinition.attributeType) {
        case 'money':
          queryArgFacets.push({
            model: {
              range: {
                countProducts: true,
                path: `${facetDefinition.attributeId}.centAmount`,
                ranges: [{ from: '0', to: '*' }],
                alias: facetDefinition.attributeId,
              },
            },
          });

          break;

        case 'enum':
          queryArgFacets.push({
            model: {
              terms: {
                countProducts: true,
                path: `${facetDefinition.attributeId}.label`,
                alias: facetDefinition.attributeId,
              },
            },
          });
          break;

        case 'lenum':
          queryArgFacets.push({
            model: {
              terms: {
                countProducts: true,
                path: `${facetDefinition.attributeId}.label.${locale.language}`,
                alias: facetDefinition.attributeId,
              },
            },
          });
          break;

        case 'ltext':
          queryArgFacets.push({
            model: {
              terms: {
                countProducts: true,
                path: `${facetDefinition.attributeId}.${locale.language}`,
                alias: facetDefinition.attributeId,
              },
            },
          });
          break;

        case 'number':
        case 'boolean':
        case 'text':
        case 'reference':
        default:
          queryArgFacets.push({
            model: {
              terms: {
                countProducts: true,
                path: `${facetDefinition.attributeId}`,
                alias: facetDefinition.attributeId,
              },
            },
          });
          break;
      }
    });

    return queryArgFacets;
  }

  static getChannelsAvailability(availability?: ProductVariantAvailability): ProductVariantChannelAvailabilityMap {
    if (availability?.channels?.results) {
      // @ts-ignore
      return (availability.channels as ChannelsAvailability).results
        .reduce((prev, item) => {
          prev[item.channel.id] = item.availability;
          return prev;
        }, {});
    }
    return {};
  }

  static commercetoolsProductProjectionToVariantsWithUnifiedAvailability(
    commercetoolsProduct: CommercetoolsProductProjection,
  ): CommercetoolsProductVariant[] {
    const variants: CommercetoolsProductVariant[] = [];

    if (commercetoolsProduct?.masterVariant) {
      variants.push({
        ...commercetoolsProduct?.masterVariant,
        availability: {
          ...commercetoolsProduct?.masterVariant.availability,
          channels: commercetoolsProduct?.masterVariant.availability
            ? this.getChannelsAvailability(commercetoolsProduct?.masterVariant.availability)
            : {},
        },
      });
    }

    for (let i = 0; i < commercetoolsProduct.variants.length; i++) {
      variants.push({
        ...commercetoolsProduct?.variants[i],
        availability: {
          ...commercetoolsProduct?.variants[i].availability,
          channels: commercetoolsProduct?.variants[i]?.availability
            ? this.getChannelsAvailability(commercetoolsProduct?.variants[i].availability)
            : {},
        },
      });
    }

    return variants;
  }

  static commercetoolsProductProjectionToProductWithUnifiedAvailability(
    commercetoolsProduct: CommercetoolsProductProjection,
  ): CommercetoolsProductProjection {
    return {
      ...commercetoolsProduct,
      variants: this.commercetoolsProductProjectionToVariantsWithUnifiedAvailability(commercetoolsProduct),
    };
  }
  static commercetoolsProductProjectionToProduct(
    commercetoolsProduct: CommercetoolsProductProjection,
    locale: Locale,
    distributionChannelId?: string,
    supplyChannelId?: string,
  ): Product {
    const transitionProduct: CommercetoolsProductProjection =
      this.commercetoolsProductProjectionToProductWithUnifiedAvailability(commercetoolsProduct);
    return super.commercetoolsProductProjectionToProduct(
      transitionProduct,
      locale,
      distributionChannelId,
      supplyChannelId,
    );
  }
}

// Override the BaseMapper with new Mapper functions
Object.getOwnPropertyNames(ProductMapper).forEach((key) => {
  if (typeof ProductMapper[key] === 'function') {
    B2BProductMapper[key] = ProductMapper[key];
  }
});
