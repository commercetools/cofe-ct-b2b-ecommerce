import { Money } from '@commercetools/frontend-domain-types/product/Money';
import { TaxPortion } from './TaxPortion';

export interface Tax {
  amount: Money;
  name?: string;
  taxPortions?: TaxPortion[];
}
