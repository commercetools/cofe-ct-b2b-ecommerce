import { Tax } from './Tax';
import { Cart as DomainCart} from '@commercetools/frontend-domain-types/cart/Cart'
import { Address } from '@commercetools/frontend-domain-types/account/Address';
import { LineItem } from './LineItem';

export interface CartReference {
  id: string;
  typeId: 'cart';
  obj?: Cart;
}

export interface Cart extends DomainCart {
  lineItems?: LineItem[];
  directDiscounts?: number | undefined;
  taxed?: Tax;
  origin?: string;
  businessUnit?: string;
  isPreBuyCart?: boolean;
  itemShippingAddresses?: Address[];
}
