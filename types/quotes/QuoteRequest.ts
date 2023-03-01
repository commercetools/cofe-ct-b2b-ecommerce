import { StagedQuote } from './StagedQuote';
import { Quote } from './Quote';
import { CustomerReference } from '../account/Account';
import { StoreKeyReference } from '../store/store';
import { BusinessUnitResourceIdentifier } from '../business-unit/BusinessUnit';
import { LineItem } from '@commercetools/frontend-domain-types/cart/LineItem';
import { Money } from '@commercetools/frontend-domain-types/product/Money';
import { Address } from '@commercetools/frontend-domain-types/account/Address';

export interface QuoteRequestReference {
  id: string;
  typeId: 'quote-request';
  obj?: QuoteRequest;
}
export interface QuoteRequest {
  readonly id: string;

  readonly version: number;

  readonly key?: string;

  readonly createdAt: string;

  readonly lastModifiedAt: string;

  readonly quoteRequestState: string;

  readonly comment?: string;

  readonly customer: CustomerReference;

  readonly store?: StoreKeyReference;

  readonly lineItems: LineItem[];

  readonly totalPrice: Money;

  readonly shippingAddress?: Address;

  readonly billingAddress?: Address;

  readonly country?: string;

  readonly itemShippingAddresses?: Address[];

  readonly directDiscounts?: any[];

  readonly businessUnit?: BusinessUnitResourceIdentifier;
  staged?: StagedQuote;
  quoted?: Quote;
}
