import { Category } from '@commercetools/frontend-domain-types/product/Category';
import { Product } from '../types/product/Product';
import { Variant } from '../types/product/Variant';
import {
  Category as CommercetoolsCategory,
  ProductProjection as CommercetoolsProductProjection,
  ProductVariant as CommercetoolsProductVariant,
  ProductVariantAvailability,
  Price,
} from '@commercetools/platform-sdk';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { ProductMapper as BaseProductMapper } from 'cofe-ct-ecommerce/mappers/ProductMapper';
import { ProductRouter } from '../../utils/ProductRouter';
import { Money } from '@commercetools/frontend-domain-types/product/Money';
import { TermFacet as QueryTermFacet } from '@commercetools/frontend-domain-types/query/TermFacet';
import { RangeFacet as QueryRangeFacet } from '@commercetools/frontend-domain-types/query/RangeFacet';
import { Facet as QueryFacet } from '@commercetools/frontend-domain-types/query/Facet';
import { FacetDefinition } from '@commercetools/frontend-domain-types/product/FacetDefinition';
import { FilterTypes } from '@commercetools/frontend-domain-types/query/Filter';
import { SearchFacetInput, SearchFilterInput } from '../../types/graph-ql/query/ProductQuery';

export class ProductMapper extends BaseProductMapper {
  static commercetoolsProductProjectionToProduct(
    commercetoolsProduct: CommercetoolsProductProjection,
    locale: Locale,
    distributionChannelId?: string,
    supplyChannelId?: string,
  ): Product {
    const product: Product = {
      productId: commercetoolsProduct.id,
      version: commercetoolsProduct?.version?.toString(),
      name: commercetoolsProduct?.name?.[locale.language],
      slug: commercetoolsProduct?.slug?.[locale.language],
      description: commercetoolsProduct?.description?.[locale.language],
      categories: this.commercetoolsCategoryReferencesToCategories(commercetoolsProduct.categories, locale),
      variants: this.commercetoolsProductProjectionToVariants(
        commercetoolsProduct,
        locale,
        distributionChannelId,
        supplyChannelId,
      ),
    };

    product._url = ProductRouter.generateUrlFor(product);

    return product;
  }

  static commercetoolsProductProjectionToVariants(
    commercetoolsProduct: CommercetoolsProductProjection,
    locale: Locale,
    distributionChannelId?: string,
    supplyChannelId?: string,
  ): Variant[] {
    const variants: Variant[] = [];

    if (commercetoolsProduct?.masterVariant) {
      variants.push(
        this.commercetoolsProductVariantToVariant(
          commercetoolsProduct.masterVariant,
          locale,
          distributionChannelId,
          supplyChannelId,
        ),
      );
    }

    for (let i = 0; i < commercetoolsProduct.variants.length; i++) {
      variants.push(
        this.commercetoolsProductVariantToVariant(
          commercetoolsProduct.variants[i],
          locale,
          distributionChannelId,
          supplyChannelId,
        ),
      );
    }

    return variants;
  }
  static commercetoolsProductVariantToVariant(
    commercetoolsVariant: CommercetoolsProductVariant,
    locale: Locale,
    distributionChannelId?: string,
    supplyChannelId?: string,
  ): Variant {
    const attributes = this.commercetoolsAttributesToAttributes(commercetoolsVariant.attributes, locale);
    const pricesAndDiscounts = this.extractPriceAndDiscounts(commercetoolsVariant, locale, distributionChannelId);

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
    commercetoolsVariant: CommercetoolsProductVariant,
    locale: Locale,
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

      // TODO: no .obj
      if (commercetoolsVariant.scopedPrice?.discounted?.discount?.obj?.description?.[locale.language]) {
        discounts = [commercetoolsVariant.scopedPrice?.discounted?.discount?.obj?.description[locale.language]];
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

          // TODO: no .obj
          if (commercetoolsPrice?.discounted?.discount?.obj?.description?.[locale.language]) {
            discounts = [commercetoolsPrice?.discounted?.discount?.obj?.description[locale.language]];
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

      // TODO: no .obj
      if (commercetoolsVariant.price?.discounted?.discount?.obj?.description?.[locale.language]) {
        discounts = [commercetoolsVariant.price?.discounted?.discount?.obj?.description[locale.language]];
      }

      return { price, discountedPrice, discounts, distributionChannelId };
    }

    if (commercetoolsVariant?.prices) {
      let commercetoolsPrice: Price;
      //Filter price by country and currency and if we don't find one, then filter only by currency
      commercetoolsPrice = commercetoolsVariant?.prices.find((price: Price) => {
        return (
          !price.hasOwnProperty('channel') &&
          !price.hasOwnProperty('customerGroup') &&
          price.country === locale.country &&
          price.value.currencyCode === locale.currency
        );
      });

      if (!commercetoolsPrice) {
        commercetoolsPrice = commercetoolsVariant?.prices.find((price: Price) => {
          return (
            !price.hasOwnProperty('channel') &&
            !price.hasOwnProperty('customerGroup') &&
            !price.hasOwnProperty('country') &&
            price.value.currencyCode === locale.currency
          );
        });
      }

      price = this.commercetoolsMoneyToMoney(commercetoolsPrice?.value);
      distributionChannelId = commercetoolsPrice?.channel?.id;

      if (commercetoolsPrice?.discounted?.value) {
        discountedPrice = this.commercetoolsMoneyToMoney(commercetoolsPrice?.discounted?.value);
      }

      // TODO: no .obj
      if (commercetoolsPrice?.discounted?.discount?.obj?.description?.[locale.language]) {
        discounts = [commercetoolsPrice?.discounted?.discount?.obj?.description[locale.language]];
      }

      return { price, discountedPrice, discounts, distributionChannelId };
    }

    return { price, discountedPrice, discounts, distributionChannelId };
  }

  static facetDefinitionsToFilterFacets(
    queryFacets: QueryFacet[],
    facetDefinitions: FacetDefinition[],
    locale: Locale,
  ): SearchFilterInput[] {
    const filterFacets: SearchFilterInput[] = [];
    const typeLookup: { [key: string]: string } = {};

    if (facetDefinitions.length === 0) {
      return filterFacets;
    }

    facetDefinitions.forEach((facetDefinition) => {
      typeLookup[facetDefinition.attributeId] = facetDefinition.attributeType;
    });

    queryFacets.forEach((queryFacet) => {
      if (!typeLookup?.hasOwnProperty(queryFacet.identifier)) {
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

  static facetDefinitionsToCommercetoolsQueryArgFacets(
    facetDefinitions: FacetDefinition[],
    locale: Locale,
  ): SearchFacetInput[] {
    const queryArgFacets: SearchFacetInput[] = [];

    facetDefinitions?.forEach((facetDefinition) => {
      switch (facetDefinition.attributeType) {
        case 'money':
          queryArgFacets.push({
            model: {
              range: {
                countProducts: true,
                path: `${facetDefinition.attributeId}.centAmount`,
                range: [{ from: '0', to: '*' }],
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

  static getAvailability(
    variant: CommercetoolsProductVariant,
    supplyChannelId?: string,
  ): { availability: ProductVariantAvailability; supplyChannelId?: string } {
    if (supplyChannelId && variant.availability?.channels) {
      if (variant.availability.channels[supplyChannelId]) {
        return { availability: variant.availability.channels[supplyChannelId], supplyChannelId };
      }
    }
    return { availability: variant.availability };
  }

  static commercetoolsCategoryToCategory: (commercetoolsCategory: CommercetoolsCategory, locale: Locale) => Category = (
    commercetoolsCategory: CommercetoolsCategory,
    locale: Locale,
  ) => {
    return {
      categoryId: commercetoolsCategory.id,
      parentId: commercetoolsCategory.parent?.id ? commercetoolsCategory.parent.id : undefined,
      ancestors: commercetoolsCategory.ancestors?.length ? commercetoolsCategory.ancestors : undefined,
      name: commercetoolsCategory.name?.[locale.language] ?? undefined,
      slug: commercetoolsCategory.slug?.[locale.language] ?? undefined,
      depth: commercetoolsCategory.ancestors.length,
      subCategories: (commercetoolsCategory as any).subCategories?.map((subCategory: CommercetoolsCategory) =>
        this.commercetoolsCategoryToCategory(subCategory, locale),
      ),
      path:
        commercetoolsCategory.ancestors.length > 0
          ? `/${commercetoolsCategory.ancestors
              .map((ancestor) => {
                return ancestor.id;
              })
              .join('/')}/${commercetoolsCategory.id}`
          : `/${commercetoolsCategory.id}`,
    };
  };

  static extractAttributeValue(commercetoolsAttributeValue: unknown, locale: Locale): unknown {
    if (commercetoolsAttributeValue['key'] !== undefined && commercetoolsAttributeValue['label'] !== undefined) {
      return {
        key: commercetoolsAttributeValue['key'],
        label: this.extractAttributeValue(commercetoolsAttributeValue['label'], locale),
      };
    }

    if (commercetoolsAttributeValue instanceof Array) {
      return commercetoolsAttributeValue.map((value) => this.extractAttributeValue(value, locale));
    }

    return commercetoolsAttributeValue[locale.language] || commercetoolsAttributeValue;
  }
}

// Override the BaseMapper with new Mapper functions
Object.getOwnPropertyNames(ProductMapper).forEach((key) => {
  if (typeof ProductMapper[key] === 'function') {
    BaseProductMapper[key] = ProductMapper[key];
  }
});
