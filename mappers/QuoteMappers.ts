import {
  CustomerReference,
  LineItem as CommercetoolsLineItem,
  QuoteRequest as CommercetoolsQuoteRequest,
  StagedQuote as CommercetoolsStagedQuote,
  Quote as CommercetoolsQuote,
  CartReference,
} from '@commercetools/platform-sdk';
import { LineItem } from '@b2bdemo/types/types/cart/LineItem';
import { CartMapper } from './CartMapper';
import { QuoteRequest } from '@b2bdemo/types/types/quotes/QuoteRequest';
import { Cart } from '@b2bdemo/types/types/cart/Cart';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';

export const mapCommercetoolsQuoteRequest = (results: CommercetoolsQuoteRequest[], locale: Locale): QuoteRequest[] => {
  return results?.map((quote) => ({
    ...quote,
    customer: mapCustomerReferences(quote.customer),
    lineItems: mapCommercetoolsLineitems(quote.lineItems, locale),
  }));
};

export const mapCommercetoolsQuote = (results: CommercetoolsQuote[], locale: Locale): any[] => {
  return results?.map((quote) => ({
    ...quote,
    customer: mapCustomerReferences(quote.customer),
    lineItems: mapCommercetoolsLineitems(quote.lineItems, locale),
  }));
};

export const mapCommercetoolsStagedQuote = (results: CommercetoolsStagedQuote[], locale: Locale): any[] => {
  return results.map((stagedQuote) => ({
    ...stagedQuote,
    quotationCart: mapQuotationCartReference(stagedQuote.quotationCart, locale),
  }));
};

export const mapCustomerReferences = (customer: CustomerReference): CustomerReference => {
  return {
    id: customer.id,
    typeId: 'customer',
    ...customer.obj,
  };
};

export const mapQuotationCartReference = (cartReference: CartReference, locale: Locale): Cart | CartReference => {
  return cartReference.obj ? CartMapper.commercetoolsCartToCart(cartReference.obj, locale) : cartReference;
};

export const mapCommercetoolsLineitems = (lineitems: CommercetoolsLineItem[], locale: Locale): LineItem[] => {
  return CartMapper.commercetoolsLineItemsToLineItems(lineitems, locale);
};
