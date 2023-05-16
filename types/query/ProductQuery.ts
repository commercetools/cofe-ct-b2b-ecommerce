import { ProductQuery as DomainProductQuery } from '@commercetools/frontend-domain-types/query/ProductQuery';
import { FacetResult } from '@commercetools/platform-sdk';
export interface ProductQuery extends DomainProductQuery {
    rootCategoryId?: string;
}

export interface AdditionalQueryArgs {
    supplyChannelId?: string;
    distributionChannelId?: string;
    storeProjection?: string;
}

export interface FacetResultGraphQl {
    facet: string;
    value: FacetResult;
}

