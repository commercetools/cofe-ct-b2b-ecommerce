import { Tax } from './Tax';
import { Cart as DomainCart} from '@commercetools/frontend-domain-types/cart/Cart'
import { Address } from '@commercetools/frontend-domain-types/account/Address';
import { LineItem } from './LineItem';
import { Money } from '@commercetools/frontend-domain-types/product/Money';

export interface CartReference {
  id: string;
  typeId: 'cart';
  obj?: Cart;
}

export interface Cart extends DomainCart {
  customerId: string;
  lineItems?: LineItem[];
  directDiscounts?: number | undefined;
  taxed?: Tax;
  subtotal?: Money;
  origin?: string;
  businessUnit?: string;
  itemShippingAddresses?: Address[];
	store?: string;
}
