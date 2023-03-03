import {
  CustomerReference,
  LineItem as CommercetoolsLineItem,
  QuoteRequest as CommercetoolsQuoteRequest,
  StagedQuote as CommercetoolsStagedQuote,
  Quote as CommercetoolsQuote,
  CartReference,
} from '@commercetools/platform-sdk';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { CartMapper } from './CartMapper';
import { QuoteRequest } from '../types/quotes/QuoteRequest';
import { Cart } from '../types/cart/Cart';
import { LineItem } from '../types/cart/LineItem';

export class QuoteMappers {
  static mapCommercetoolsQuoteRequest(results: CommercetoolsQuoteRequest[], locale: Locale): QuoteRequest[] {
    return results?.map((quote) => ({
      ...quote,
      customer: this.mapCustomerReferences(quote.customer),
      lineItems: this.mapCommercetoolsLineitems(quote.lineItems, locale),
    }));
  }

  static mapCommercetoolsQuote(results: CommercetoolsQuote[], locale: Locale): any[] {
    return results?.map((quote) => ({
      ...quote,
      customer: this.mapCustomerReferences(quote.customer),
      lineItems: this.mapCommercetoolsLineitems(quote.lineItems, locale),
    }));
  }

  static mapCommercetoolsStagedQuote(results: CommercetoolsStagedQuote[], locale: Locale): any[] {
    return results.map((stagedQuote) => ({
      ...stagedQuote,
      quotationCart: this.mapQuotationCartReference(stagedQuote.quotationCart, locale),
    }));
  }

  static mapCustomerReferences(customer: CustomerReference): CustomerReference {
    return {
      id: customer.id,
      typeId: 'customer',
      ...customer.obj,
    };
  }

  static mapQuotationCartReference(cartReference: CartReference, locale: Locale): Cart | CartReference {
    return cartReference.obj ? CartMapper.commercetoolsCartToCart(cartReference.obj, locale) : cartReference;
  }

  static mapCommercetoolsLineitems(lineitems: CommercetoolsLineItem[], locale: Locale): LineItem[] {
    return CartMapper.commercetoolsLineItemsToLineItems(lineitems, locale);
  }
}
