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
  ProductVariant,
} from '@commercetools/platform-sdk';
import { Product } from '../../types/product/Product';

interface ChannelsAvailability {
  results?: {
    channel: { id: string };
    availability: { isOnStock: boolean; availableQuantity: number; id: string; version: string };
  }[];
}

interface NoChannelAvailability {
  noChannel: {
    isOnStock: boolean;
    availableQuantity: number;
    id: string;
    version: string;
  };
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
      return (availability.channels as ChannelsAvailability).results.reduce((prev, item) => {
        prev[item.channel.id] = item.availability;
        return prev;
      }, {});
    }
    return {};
  }

  static commercetoolsProductProjectionVariantToVariantsWithUnifiedAvailability(
    commercetoolsProductVariant: ProductVariant,
  ): ProductVariant {
    return {
      ...commercetoolsProductVariant,
      availability: {
        ...(commercetoolsProductVariant.availability as NoChannelAvailability)?.noChannel || {},
        channels: commercetoolsProductVariant.availability
          ? this.getChannelsAvailability(commercetoolsProductVariant.availability)
          : {},
      },
    }
  }

  static commercetoolsProductProjectionToProductWithUnifiedAvailability(
    commercetoolsProduct: CommercetoolsProductProjection,
  ): CommercetoolsProductProjection {
    const product = {
      ...commercetoolsProduct,
      masterVariant: this.commercetoolsProductProjectionVariantToVariantsWithUnifiedAvailability(commercetoolsProduct.masterVariant) ,
      variants: commercetoolsProduct.variants.map(variant => this.commercetoolsProductProjectionVariantToVariantsWithUnifiedAvailability(variant)),
    };
    return product;
  }
  static commercetoolsProductProjectionGraphQlToProduct(
    commercetoolsProduct: CommercetoolsProductProjection,
    locale: Locale,
    distributionChannelId?: string,
    supplyChannelId?: string,
  ): Product {
    const transitionProduct: CommercetoolsProductProjection =
      this.commercetoolsProductProjectionToProductWithUnifiedAvailability(commercetoolsProduct);
    //   console.debug(transitionProduct);
    return this.commercetoolsProductProjectionToProduct(
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
