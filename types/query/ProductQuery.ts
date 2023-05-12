import { ProductQuery as DomainProductQuery } from '@commercetools/frontend-domain-types/query/ProductQuery';
export interface ProductQuery extends DomainProductQuery {
    rootCategoryId?: string;
}

export interface AdditionalQueryArgs {
    supplyChannelId?: string;
    distributionChannelId?: string;
    storeProjection?: string;
}
