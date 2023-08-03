import {
  QuoteRequest as CommercetoolsQuoteRequest,
  QuoteRequestDraft,
  Quote as CommercetoolsQuote,
  StagedQuote as CommercetoolsStagedQuote,
  QuoteState,
  QuoteRequestState
} from '@commercetools/platform-sdk';
import { BaseApi } from 'cofe-ct-ecommerce/apis/BaseApi';
import { QuoteRequest } from '../types/quotes/QuoteRequest';
import { Quote } from '../types/quotes/Quote';
import { StagedQuote } from '../types/quotes/StagedQuote';
import { QuoteMappers } from '../mappers/QuoteMappers';
import { Organization } from '../types/organization/organization';

export class QuoteApi extends BaseApi {
  createQuoteRequest: (
    quoteRequest: QuoteRequestDraft,
    accountId?: string,
    organization?: Organization,
  ) => Promise<CommercetoolsQuoteRequest> = async (
    quoteRequest: QuoteRequestDraft,
    accountId?: string,
    organization?: Organization,
  ) => {
    try {
      const endpoint = organization?.superUserBusinessUnitKey
        ? this.requestBuilder()
            .asAssociate()
            .withAssociateIdValue({ associateId: accountId })
            .inBusinessUnitKeyWithBusinessUnitKeyValue({ businessUnitKey: organization?.businessUnit?.key })
            .quoteRequests()
        : this.requestBuilder().quoteRequests();
      return endpoint
        .post({
          body: {
            ...quoteRequest,
          },
        })
        .execute()
        .then((response) => {
          return response.body;
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };
  getStagedQuote: (ID: string) => Promise<CommercetoolsStagedQuote> = async (ID: string) => {
    try {
      return this.requestBuilder()
        .stagedQuotes()
        .withId({ ID })
        .get({
          queryArgs: {
            expand: ['customer', 'quotationCart'],
            sort: 'createdAt desc',
          },
        })
        .execute()
        .then((response) => {
          return response.body;
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };
  getQuoteRequest: (ID: string) => Promise<CommercetoolsQuoteRequest> = async (ID: string) => {
    try {
      return this.requestBuilder()
        .quoteRequests()
        .withId({ ID })
        .get({
          queryArgs: {
            expand: ['customer'],
            sort: 'createdAt desc',
          },
        })
        .execute()
        .then((response) => {
          return response.body;
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };
  getQuote: (ID: string) => Promise<CommercetoolsQuote> = async (ID: string) => {
    try {
      return this.requestBuilder()
        .quotes()
        .withId({ ID })
        .get()
        .execute()
        .then((response) => {
          return response.body;
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };

  getQuoteRequestsByCustomer: (customerId: string) => Promise<QuoteRequest[]> = async (customerId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      return this.requestBuilder()
        .quoteRequests()
        .get({
          queryArgs: {
            where: `customer(id="${customerId}")`,
            expand: 'customer',
            sort: 'createdAt desc',
            limit: 50,
          },
        })
        .execute()
        .then((response) => {
          return QuoteMappers.mapCommercetoolsQuoteRequest(response.body.results, locale);
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };

  getStagedQuotesByCustomer: (customerId: string) => Promise<StagedQuote[]> = async (customerId: string) => {
    const locale = await this.getCommercetoolsLocal();
    try {
      return this.requestBuilder()
        .stagedQuotes()
        .get({
          queryArgs: {
            where: `customer(id="${customerId}")`,
            expand: ['customer', 'quotationCart'],
            sort: 'createdAt desc',
            limit: 50,
          },
        })
        .execute()
        .then((response) => {
          return QuoteMappers.mapCommercetoolsStagedQuote(response.body.results, locale);
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };

  getQuotesByCustomer: (customerId: string) => Promise<Quote[]> = async (customerId: string) => {
    const locale = await this.getCommercetoolsLocal();
    try {
      return this.requestBuilder()
        .quotes()
        .get({
          queryArgs: {
            where: `customer(id="${customerId}")`,
            expand: 'customer',
            sort: 'createdAt desc',
            limit: 50,
          },
        })
        .execute()
        .then((response) => {
          return QuoteMappers.mapCommercetoolsQuote(response.body.results, locale);
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };

  getQuoteRequestsByBusinessUnit: (businessUnitKeys: string) => Promise<QuoteRequest[]> = async (
    businessUnitKeys: string,
  ) => {
    const locale = await this.getCommercetoolsLocal();
    try {
      return this.requestBuilder()
        .quoteRequests()
        .get({
          queryArgs: {
            where: `businessUnit(key in (${businessUnitKeys}))`,
            expand: 'customer',
            sort: 'createdAt desc',
            limit: 50,
          },
        })
        .execute()
        .then((response) => {
          return QuoteMappers.mapCommercetoolsQuoteRequest(response.body.results, locale);
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };

  getStagedQuotesByBusinessUnit: (businessUnitKeys: string) => Promise<StagedQuote[]> = async (
    businessUnitKeys: string,
  ) => {
    const locale = await this.getCommercetoolsLocal();
    try {
      return this.requestBuilder()
        .stagedQuotes()
        .get({
          queryArgs: {
            where: `businessUnit(key in (${businessUnitKeys}))`,
            expand: ['customer', 'quotationCart'],
            sort: 'createdAt desc',
            limit: 50,
          },
        })
        .execute()
        .then((response) => {
          return QuoteMappers.mapCommercetoolsStagedQuote(response.body.results, locale);
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };

  getQuotesByBusinessUnit: (businessUnitKeys: string) => Promise<Quote[]> = async (businessUnitKeys: string) => {
    const locale = await this.getCommercetoolsLocal();
    try {
      return this.requestBuilder()
        .quotes()
        .get({
          queryArgs: {
            where: `businessUnit(key in (${businessUnitKeys}))`,
            expand: 'customer',
            sort: 'createdAt desc',
            limit: 50,
          },
        })
        .execute()
        .then((response) => {
          return QuoteMappers.mapCommercetoolsQuote(response.body.results, locale);
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };

  updateQuoteState: (ID: string, quoteState: QuoteState) => Promise<CommercetoolsQuote> = async (
    ID: string,
    quoteState: QuoteState,
  ) => {
    try {
      return this.getQuote(ID).then((quote) => {
        return this.requestBuilder()
          .quotes()
          .withId({ ID })
          .post({
            body: {
              actions: [
                {
                  action: 'changeQuoteState',
                  quoteState: quoteState,
                },
              ],
              version: quote.version,
            },
          })
          .execute()
          .then((response) => {
            return response.body;
          })
          .catch((error) => {
            throw error;
          });
      });
    } catch {
      throw '';
    }
  };  
  
  updateQuoteRequestState: (ID: string, quoteRequestState: QuoteRequestState) => Promise<CommercetoolsQuoteRequest> = async (
    ID: string,
    quoteRequestState: QuoteRequestState,
  ) => {
    try {
      return this.getQuoteRequest(ID).then((quoteRequest) => {
        return this.requestBuilder()
          .quoteRequests()
          .withId({ ID })
          .post({
            body: {
              actions: [
                {
                  action: 'changeQuoteRequestState',
                  quoteRequestState,
                },
              ],
              version: quoteRequest.version,
            },
          })
          .execute()
          .then((response) => {
            return response.body;
          })
          .catch((error) => {
            throw error;
          });
      });
    } catch {
      throw '';
    }
  };
}
