import { Address } from '@commercetools/frontend-domain-types/account/Address';
import { LineItem } from '@commercetools/frontend-domain-types/cart/LineItem';
import { Money } from '@commercetools/frontend-domain-types/product/Money';
import { CustomerReference } from '../account/Account';
import { BusinessUnitResourceIdentifier } from '../business-unit/BusinessUnit';
import { StoreKeyReference } from '../store/store';
import { QuoteRequestReference } from './QuoteRequest';
import { StagedQuoteReference } from './StagedQuote';

export interface Quote {
  readonly id: string;
  readonly version: number;
  readonly key?: string;
  readonly createdAt: string;
  readonly lastModifiedAt: string;
  readonly quoteRequest?: QuoteRequestReference;
  readonly stagedQuote: StagedQuoteReference;
  readonly customer?: CustomerReference;
  readonly sellerComment?: string;
  readonly buyerComment?: string;
  readonly store?: StoreKeyReference;
  readonly lineItems: LineItem[];
  readonly totalPrice: Money;
  readonly shippingAddress?: Address;
  readonly billingAddress?: Address;
  readonly country?: string;
  readonly itemShippingAddresses?: Address[];
  readonly directDiscounts?: any[];
  quoteState?: string;
  readonly businessUnit?: BusinessUnitResourceIdentifier;
}
