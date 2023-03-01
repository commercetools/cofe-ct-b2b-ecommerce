import { ProductQuery as DomainProductQuery } from '@commercetools/frontend-domain-types/query/ProductQuery';
export interface ProductQuery extends DomainProductQuery {
    rootCategoryId?: string;
}
