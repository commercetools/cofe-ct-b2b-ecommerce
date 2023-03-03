import { Variant } from './Variant';
import { Category } from './Category';
import { Product as DomainProduct } from '@commercetools/frontend-domain-types/product/Product';

export interface Product extends DomainProduct {
  categories?: Category[];
  variants: Variant[];
}
