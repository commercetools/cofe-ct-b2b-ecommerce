import {
  CategoryReference,
  ProductProjection as CommercetoolsProductProjection,
  ProductVariant as CommercetoolsProductVariant,
  ProductVariantChannelAvailability,
} from '@commercetools/platform-sdk';

export interface CommercetoolsGraphQlProductProjection
  extends Omit<CommercetoolsProductProjection, 'name' | 'slug' | 'description' | 'masterVariant' | 'variants'> {
  name: string;
  slug?: string;
  description?: string;
  categories: CategoryReferenceGraphQl[];
  masterVariant: CommercetoolsProductVariantGraphQl;
  variants: CommercetoolsProductVariantGraphQl[];
}

export interface CategoryReferenceGraphQl extends Omit<CategoryReference, 'obj'> {
  name: string;
  slug: string;
  readonly ancestors: CategoryReference[];
}

export interface CommercetoolsProductVariantGraphQl extends Omit<CommercetoolsProductVariant, 'availability'> {
  availability: CommercetoolsProductVariantAvailabilityGraphQl;
}

export interface CommercetoolsProductVariantAvailabilityGraphQl {
  channels: { results: { channel: { id: string }; availability: ProductVariantChannelAvailability }[] };
  noChannel: ProductVariantChannelAvailability;
}
