import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { getCurrency, getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { AssociateApi } from '../apis/AssociateApi';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export const getAllAssociateRoles: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const associateApi = new AssociateApi(actionContext.frontasticContext, getLocale(request), getCurrency(request));
  const associateRoles = await associateApi.getAllAssociateRoles();

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(associateRoles),
    sessionData: request.sessionData,
  };

  return response;
};