import {
  AttributeGroup,
  Category as CommercetoolsCategory,
  CategoryReference,
  Price,
  ProductProjection as CommercetoolsProductProjection,
  ProductVariant as CommercetoolsProductVariant,
  ProductVariantAvailability,
} from '@commercetools/platform-sdk';
import { Variant } from '@commercetools/frontend-domain-types/product/Variant';
import { Category } from '@commercetools/frontend-domain-types/product/Category';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { ProductMapper as BaseProductMaper } from 'cofe-ct-ecommerce/mappers/ProductMapper';
import { Product } from '@commercetools/frontend-domain-types/product/Product';
import { ProductRouter } from '../utils/ProductRouter';

export class ProductMapper extends BaseProductMaper {
  static commercetoolsProductProjectionToProduct: (
    commercetoolsProduct: CommercetoolsProductProjection,
    locale: Locale,
  ) => Product = (commercetoolsProduct: CommercetoolsProductProjection, locale: Locale) => {
    const product: Product = {
      productId: commercetoolsProduct.id,
      version: commercetoolsProduct?.version?.toString(),
      name: commercetoolsProduct?.name?.[locale.language],
      slug: commercetoolsProduct?.slug?.[locale.language],
      description: commercetoolsProduct?.description?.[locale.language],
      categories: this.commercetoolsCategoryReferencesToCategories(commercetoolsProduct.categories, locale),
      variants: this.commercetoolsProductProjectionToVariants(commercetoolsProduct, locale),
    };

    product._url = ProductRouter.generateUrlFor(product);

    return product;
  };
  static commercetoolsProductVariantToVariant: (
    commercetoolsVariant: CommercetoolsProductVariant,
    locale: Locale,
    productPrice?: Price,
  ) => Variant = (commercetoolsVariant: CommercetoolsProductVariant, locale: Locale, productPrice?: Price) => {
    const attributes = ProductMapper.commercetoolsAttributesToAttributes(commercetoolsVariant.attributes, locale);
    const { price, discountedPrice, discounts } = ProductMapper.extractPriceAndDiscounts(commercetoolsVariant, locale);
    return {
      id: commercetoolsVariant.id?.toString(),
      sku: commercetoolsVariant.sku?.toString(),
      images: [
        ...commercetoolsVariant.assets.map((asset) => asset.sources?.[0].uri),
        ...commercetoolsVariant.images.map((image) => image.url),
      ],
      groupId: attributes?.baseId || undefined,
      attributes: attributes,
      price: price,
      discountedPrice: discountedPrice,
      discounts: discounts,
      availability: ProductMapper.getPriceChannelAvailability(commercetoolsVariant, productPrice),
      isOnStock: commercetoolsVariant.availability?.isOnStock || undefined,
    } as Variant;
  };

  static getPriceChannelAvailability: (
    variant: CommercetoolsProductVariant,
    productPrice?: Price,
  ) => ProductVariantAvailability = (variant: CommercetoolsProductVariant, productPrice?: Price) => {
    let channelId = '';
    if (productPrice) {
      channelId = productPrice.channel?.id;
    } else {
      channelId = variant.scopedPrice?.channel?.id || variant.price?.channel?.id;
    }
    if (!channelId) {
      return variant.availability;
    }
    if (!variant.availability?.channels?.[channelId]) {
      return variant.availability;
    }
    return variant.availability.channels[channelId];
  };

  static commercetoolsCategoryReferencesToCategories: (
    commercetoolsCategoryReferences: CategoryReference[],
    locale: Locale,
  ) => Category[] = (commercetoolsCategoryReferences: CategoryReference[], locale: Locale) => {
    const categories: Category[] = [];

    commercetoolsCategoryReferences.forEach((commercetoolsCategory) => {
      let category: Category = {
        categoryId: commercetoolsCategory.id,
      };

      if (commercetoolsCategory.obj) {
        category = this.commercetoolsCategoryToCategory(commercetoolsCategory.obj, locale);
      }

      categories.push(category);
    });
    categories.sort((a, b) => b.depth - a.depth);
    return categories;
  };

  static commercetoolsAttributeGroupToString(body: AttributeGroup): string[] {
    return body.attributes.map((attribute) => attribute.key);
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
}
