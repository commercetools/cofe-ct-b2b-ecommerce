import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { TermFacet as QueryTermFacet } from '@commercetools/frontend-domain-types/query/TermFacet';
import { RangeFacet as QueryRangeFacet } from '@commercetools/frontend-domain-types/query/RangeFacet';
import { Facet as QueryFacet } from '@commercetools/frontend-domain-types/query/Facet';
import { Facet } from '@commercetools/frontend-domain-types/result/Facet';
import { FacetDefinition } from '@commercetools/frontend-domain-types/product/FacetDefinition';
import { FilterTypes } from '@commercetools/frontend-domain-types/query/Filter';
import { FacetResultGraphQl, SearchFacetInput, SearchFilterInput } from '../types/query/ProductQuery';
import {
  ProductVariantAvailability,
  Attribute as CommercetoolsAttribute,
  Price,
  Money as CommercetoolsMoney,
  TypedMoney,
  RangeFacetResult as CommercetoolsRangeFacetResult,
  TermFacetResult as CommercetoolsTermFacetResult,
} from '@commercetools/platform-sdk';
import { Product } from 'cofe-ct-b2b-ecommerce/types/product/Product';
import {
  CategoryReferenceGraphQl,
  CommercetoolsGraphQlProductProjection,
  CommercetoolsProductVariantGraphQl,
} from '../types/product/Product';
import { Variant } from 'cofe-ct-b2b-ecommerce/types/product/Variant';
import { Category } from 'cofe-ct-b2b-ecommerce/types/product/Category';
import { Attributes } from '@commercetools/frontend-domain-types/product/Attributes';
import { Money } from '@commercetools/frontend-domain-types/product/Money';
import { ProductRouter } from '../utils/ProductRouter';
import { ProductQuery } from 'cofe-ct-b2b-ecommerce/types/query/ProductQuery';
import { ProductMapper as B2BProductMapper } from 'cofe-ct-b2b-ecommerce/mappers/ProductMapper';

export class ProductMapper {
  static commercetoolsProductProjectionGraphQlToProduct(
    commercetoolsProduct: CommercetoolsGraphQlProductProjection,
    distributionChannelId?: string,
    supplyChannelId?: string,
  ): Product {
    const product: Product = {
      productId: commercetoolsProduct.id,
      version: commercetoolsProduct?.version?.toString(),
      name: commercetoolsProduct?.name,
      slug: commercetoolsProduct?.slug,
      description: commercetoolsProduct?.description,
      categories: this.commercetoolsCategoryReferencesToCategories(commercetoolsProduct.categories),
      variants: this.commercetoolsProductProjectionToVariants(
        commercetoolsProduct,
        distributionChannelId,
        supplyChannelId,
      ),
    };

    product._url = ProductRouter.generateUrlFor(product);

    return product;
  }

  static commercetoolsCategoryReferencesToCategories(
    commercetoolsCategoryReferences: CategoryReferenceGraphQl[],
  ): Category[] {
    const categories: Category[] = [];

    commercetoolsCategoryReferences.forEach((commercetoolsCategory) => {
      const category: Category = {
        categoryId: commercetoolsCategory.id,
        name: commercetoolsCategory.name ?? undefined,
        slug: commercetoolsCategory.slug ?? undefined,
        depth: commercetoolsCategory.ancestors.length,
        path:
          commercetoolsCategory.ancestors.length > 0
            ? `/${commercetoolsCategory.ancestors
                .map((ancestor) => {
                  return ancestor.id;
                })
                .join('/')}/${commercetoolsCategory.id}`
            : `/${commercetoolsCategory.id}`,
      };

      categories.push(category);
    });

    return categories;
  }

  static commercetoolsCategoryToCategory(commercetoolsCategory: CategoryReferenceGraphQl): Category {
    return {
      categoryId: commercetoolsCategory.id,
      name: commercetoolsCategory.name ?? undefined,
      slug: commercetoolsCategory.slug ?? undefined,
      depth: commercetoolsCategory.ancestors.length,
      path:
        commercetoolsCategory.ancestors.length > 0
          ? `/${commercetoolsCategory.ancestors
              .map((ancestor) => {
                return ancestor.id;
              })
              .join('/')}/${commercetoolsCategory.id}`
          : `/${commercetoolsCategory.id}`,
    };
  }

  static facetDefinitionsToGraphQlFilterFacets(
    queryFacets: QueryFacet[],
    facetDefinitions: FacetDefinition[],
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
          if ((queryFacet as QueryRangeFacet).min && (queryFacet as QueryRangeFacet).max) {
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
          }
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
                path: `${queryFacet.identifier}.label`,
                values: [(queryFacet as QueryTermFacet).terms.join('","')],
              },
            },
          });
          break;
        case 'ltext':
          filterFacets.push({
            model: {
              value: {
                path: `${queryFacet.identifier}`,
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
          } else if ((queryFacet as QueryRangeFacet).min && (queryFacet as QueryRangeFacet).max) {
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

  static commercetoolsAttributesToAttributes(commercetoolsAttributes?: CommercetoolsAttribute[]): Attributes {
    const attributes: Attributes = {};

    commercetoolsAttributes?.forEach((commercetoolsAttribute) => {
      attributes[commercetoolsAttribute.name] = commercetoolsAttribute.value;
    });

    return attributes;
  }

  static getAvailability(
    variant: CommercetoolsProductVariantGraphQl,
    supplyChannelId?: string,
  ): { availability: ProductVariantAvailability; supplyChannelId?: string } {
    if (supplyChannelId && variant.availability?.channels?.results?.length) {
      const availabilityChannel = variant.availability.channels.results.find(
        (channel) => channel.channel.id === supplyChannelId,
      );
      if (availabilityChannel) {
        return { availability: availabilityChannel.availability, supplyChannelId };
      }
    }
    return { availability: variant.availability.noChannel };
  }

  static commercetoolsProductVariantToVariant(
    commercetoolsVariant: CommercetoolsProductVariantGraphQl,
    distributionChannelId?: string,
    supplyChannelId?: string,
  ): Variant {
    const attributes = this.commercetoolsAttributesToAttributes(commercetoolsVariant.attributes);
    const pricesAndDiscounts = this.extractPriceAndDiscounts(commercetoolsVariant, distributionChannelId);

    const variantAvailability = this.getAvailability(commercetoolsVariant, supplyChannelId);

    return {
      id: commercetoolsVariant.id?.toString(),
      sku: commercetoolsVariant.sku?.toString(),
      images: [
        ...commercetoolsVariant.assets.map((asset) => asset.sources?.[0].uri),
        ...commercetoolsVariant.images.map((image) => image.url),
      ],
      groupId: attributes?.baseId || undefined,
      attributes: attributes,
      price: pricesAndDiscounts.price,
      distributionChannelId: pricesAndDiscounts.distributionChannelId,
      supplyChannelId: variantAvailability.supplyChannelId,
      discountedPrice: pricesAndDiscounts.discountedPrice,
      discounts: pricesAndDiscounts.discounts,
      availability: variantAvailability.availability,
      isOnStock: variantAvailability.availability?.isOnStock || undefined,
    } as Variant;
  }

  static extractPriceAndDiscounts(
    commercetoolsVariant: CommercetoolsProductVariantGraphQl,
    distributionChannelId?: string,
  ) {
    let price: Money | undefined;
    let discountedPrice: Money | undefined;
    let discounts: string[] | undefined;

    if (commercetoolsVariant?.scopedPrice) {
      price = this.commercetoolsMoneyToMoney(commercetoolsVariant.scopedPrice?.value);
      distributionChannelId = commercetoolsVariant.scopedPrice?.channel?.id;
      if (commercetoolsVariant.scopedPrice?.discounted?.value) {
        discountedPrice = this.commercetoolsMoneyToMoney(commercetoolsVariant.scopedPrice?.discounted?.value);
      }

      // @ts-ignore
      if (commercetoolsVariant.scopedPrice?.discounted?.discount?.description) {
        // @ts-ignore
        discounts = [commercetoolsVariant.scopedPrice?.discounted?.discount?.description];
      }

      return { price, discountedPrice, discounts, distributionChannelId };
    }

    // Price with correct channel id has the priority
    if (commercetoolsVariant?.prices) {
      let commercetoolsPrice: Price;
      if (distributionChannelId) {
        commercetoolsPrice = commercetoolsVariant?.prices.find(
          (price: Price) => price.hasOwnProperty('channel') && price.channel?.id === distributionChannelId,
        );
        if (commercetoolsPrice) {
          price = this.commercetoolsMoneyToMoney(commercetoolsPrice?.value);

          if (commercetoolsPrice?.discounted?.value) {
            discountedPrice = this.commercetoolsMoneyToMoney(commercetoolsPrice?.discounted?.value);
          }

          // @ts-ignore
          if (commercetoolsPrice?.discounted?.discount?.description) {
            // @ts-ignore
            discounts = [commercetoolsPrice?.discounted?.discount?.description];
          }

          return { price, discountedPrice, discounts, distributionChannelId };
        }
      }
    }

    if (commercetoolsVariant?.price) {
      price = this.commercetoolsMoneyToMoney(commercetoolsVariant.price?.value);
      distributionChannelId = commercetoolsVariant.price?.channel?.id;
      if (commercetoolsVariant.price?.discounted?.value) {
        discountedPrice = this.commercetoolsMoneyToMoney(commercetoolsVariant.price?.discounted?.value);
      }
      // @ts-ignore
      if (commercetoolsVariant.price?.discounted?.discount?.description) {
        // @ts-ignore
        discounts = [commercetoolsVariant.price?.discounted?.discount?.description];
      }

      return { price, discountedPrice, discounts, distributionChannelId };
    }

    if (commercetoolsVariant?.prices) {
      let commercetoolsPrice: Price;
      //Filter price by country and currency and if we don't find one, then filter only by currency
      commercetoolsPrice = commercetoolsVariant?.prices.find((price: Price) => {
        return !price.hasOwnProperty('channel') && !price.hasOwnProperty('customerGroup');
      });

      if (!commercetoolsPrice) {
        commercetoolsPrice = commercetoolsVariant?.prices.find((price: Price) => {
          return (
            !price.hasOwnProperty('channel') &&
            !price.hasOwnProperty('customerGroup') &&
            !price.hasOwnProperty('country')
          );
        });
      }

      price = this.commercetoolsMoneyToMoney(commercetoolsPrice?.value);
      distributionChannelId = commercetoolsPrice?.channel?.id;

      if (commercetoolsPrice?.discounted?.value) {
        discountedPrice = this.commercetoolsMoneyToMoney(commercetoolsPrice?.discounted?.value);
      }
      // @ts-ignore
      if (commercetoolsPrice?.discounted?.discount?.description) {
        // @ts-ignore
        discounts = [commercetoolsPrice?.discounted?.discount?.description];
      }

      return { price, discountedPrice, discounts, distributionChannelId };
    }

    return { price, discountedPrice, discounts, distributionChannelId };
  }
  static commercetoolsMoneyToMoney(commercetoolsMoney: CommercetoolsMoney | TypedMoney): Money | undefined {
    if (commercetoolsMoney === undefined) {
      return undefined;
    }

    return {
      fractionDigits:
        commercetoolsMoney.hasOwnProperty('fractionDigits') &&
        (commercetoolsMoney as TypedMoney).fractionDigits !== undefined
          ? (commercetoolsMoney as TypedMoney).fractionDigits
          : 2,
      centAmount: commercetoolsMoney.centAmount,
      currencyCode: commercetoolsMoney.currencyCode,
    };
  }

  static commercetoolsProductProjectionToVariants(
    commercetoolsProduct: CommercetoolsGraphQlProductProjection,
    distributionChannelId?: string,
    supplyChannelId?: string,
  ): Variant[] {
    const variants: Variant[] = [];

    if (commercetoolsProduct?.masterVariant) {
      variants.push(
        this.commercetoolsProductVariantToVariant(
          commercetoolsProduct.masterVariant,
          distributionChannelId,
          supplyChannelId,
        ),
      );
    }

    for (let i = 0; i < commercetoolsProduct.variants.length; i++) {
      variants.push(
        this.commercetoolsProductVariantToVariant(
          commercetoolsProduct.variants[i],
          distributionChannelId,
          supplyChannelId,
        ),
      );
    }

    return variants;
  }

  static commercetoolsFacetResultsToFacets(
    commercetoolsFacetResults: FacetResultGraphQl[],
    productQuery: ProductQuery,
  ): Facet[] {
    const facets: Facet[] = [];

    commercetoolsFacetResults.forEach((facet) => {
      const facetQuery = this.findFacetQuery(productQuery, facet.facet);

      switch (facet.value.type) {
        case 'range':
          facets.push(
            B2BProductMapper.commercetoolsRangeFacetResultToRangeFacet(
              facet.facet,
              facet.value as CommercetoolsRangeFacetResult,
              facetQuery as QueryRangeFacet | undefined,
            ),
          );
          break;

        case 'terms':
          if (facet.value.dataType === 'number') {
            facets.push(
              B2BProductMapper.commercetoolsTermNumberFacetResultToRangeFacet(
                facet.facet,
                facet.value as CommercetoolsTermFacetResult,
                facetQuery as QueryRangeFacet | undefined,
              ),
            );
            break;
          }

          facets.push(
            B2BProductMapper.commercetoolsTermFacetResultToTermFacet(
              facet.facet,
              facet.value as CommercetoolsTermFacetResult,
              facetQuery as QueryTermFacet | undefined,
            ),
          );
          break;
        case 'filter': // Currently, we are not mapping FilteredFacetResult
        default:
          break;
      }
    });

    return facets;
  }

  private static findFacetQuery(productQuery: ProductQuery, facetKey: string) {
    if (productQuery.facets !== undefined) {
      for (const facet of productQuery.facets) {
        if (facet.identifier === facetKey) {
          return facet;
        }
      }
    }

    return undefined;
  }
}
