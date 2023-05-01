import { Variant as DomainVariant } from '@commercetools/frontend-domain-types/product/Variant';
export interface Variant extends DomainVariant {
  supplyChannelId?: string;
  distributionChannelId?: string;
  availability?: {
    availableQuantity: number;
    restockableInDays: number;
  };
}
