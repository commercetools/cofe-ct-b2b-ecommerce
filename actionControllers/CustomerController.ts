import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { CustomerApi } from '../apis/CustomerApi';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export const getById: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const customerApi = new CustomerApi(actionContext.frontasticContext, getLocale(request));

  const customer = await customerApi.getCustomerById(request.query['id']);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(customer),
    sessionData: request.sessionData,
  };

  return response;
};
