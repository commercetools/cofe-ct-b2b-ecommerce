import { Category } from '@commercetools/frontend-domain-types/product/Category';
import { Variant } from '@commercetools/frontend-domain-types/product/Variant';
import {
  Category as CommercetoolsCategory,
  Price,
  ProductVariant as CommercetoolsProductVariant,
  ProductVariantAvailability,
} from '@commercetools/platform-sdk';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { ProductMapper as BaseProductMapper } from 'cofe-ct-ecommerce/mappers/ProductMapper';

export class ProductMapper extends BaseProductMapper {
  static commercetoolsProductVariantToVariant(
    commercetoolsVariant: CommercetoolsProductVariant,
    locale: Locale,
    productPrice?: Price,
  ): Variant {
    const attributes = this.commercetoolsAttributesToAttributes(commercetoolsVariant.attributes, locale);
    const { price, discountedPrice, discounts } = this.extractPriceAndDiscounts(commercetoolsVariant, locale);

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
      availability: this.getPriceChannelAvailability(commercetoolsVariant, productPrice),
      isOnStock: commercetoolsVariant.availability?.isOnStock || undefined,
    } as Variant;
  }

  static getPriceChannelAvailability(
    variant: CommercetoolsProductVariant,
    productPrice?: Price,
  ): ProductVariantAvailability {
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

