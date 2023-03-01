import { Category as DomainCategory } from '@commercetools/frontend-domain-types/product/Category';

export interface Category extends DomainCategory {
  parentId?: string;
  ancestors?: { id: string }[];
  children?: Category[];
  path?: string;
}
