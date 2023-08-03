export * from 'cofe-ct-ecommerce/actionControllers/ProductController';
import { Request, Response } from '@frontastic/extension-types';
import { ActionContext } from '@frontastic/extension-types';
import { getCurrency, getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { ProductApi } from '../apis/ProductApi';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export const getAttributeGroup: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const productApi = new ProductApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));

  let queryResult: string[] = [];
  try {
    queryResult = await productApi.getAttributeGroup(request.query?.['key']);
  } catch (e) {
    console.log(e);
  }

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(queryResult),
    sessionData: request.sessionData,
  };

  return response;
};