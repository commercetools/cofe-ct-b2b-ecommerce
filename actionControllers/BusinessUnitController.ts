import { ActionContext, Request, Response } from '@frontastic/extension-types';
import {
  BusinessUnit,
  BusinessUnitStatus,
  BusinessUnitType,
  StoreMode,
} from '../types/business-unit/BusinessUnit';
import { Store, StoreKeyReference } from '../types/store/store';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { BusinessUnitMappers } from '../mappers/BusinessUnitMappers';
import { AccountRegisterBody } from './AccountController';
import { BusinessUnitApi } from '../apis/BusinessUnitApi';
import { CartApi } from '../apis/CartApi';
import { AccountApi } from '../apis/AccountApi';
import { StoreApi } from '../apis/StoreApi';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export interface BusinessUnitRequestBody {
  account: AccountRegisterBody;
  store?: Store;
  parentBusinessUnit?: string;
  customer: {
    accountId: string;
  };
}

export const getMe: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const organization = request.sessionData?.organization;
  let businessUnit = organization?.businessUnit;

  if (request.sessionData?.account?.accountId && !businessUnit) {
    const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));
    businessUnit = await businessUnitApi.getMe(request.sessionData?.account?.accountId);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(businessUnit),
  };
};

export const setMe: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));
  const data = JSON.parse(request.body);

  const businessUnit = await businessUnitApi.get(data.key, request.sessionData?.account?.accountId);
  const organization = await businessUnitApi.getOrganizationByBusinessUnit(businessUnit);
  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(businessUnit),
    sessionData: {
      ...request.sessionData,
      organization,
    },
  };

  return response;
};

export const getMyOrganization: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));

  const allOrganization = await businessUnitApi.getTree(request.sessionData?.account?.accountId);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(allOrganization),
    sessionData: request.sessionData,
  };

  return response;
};

export const getSuperUserBusinessUnits: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const config = actionContext.frontasticContext?.project?.configuration?.associateRoles;
  if (!config?.defaultSuperUserRoleKey) {
    throw new Error('Configuration error. No "defaultSuperUserRoleKey" exists');
  }
  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request));
  const customerAccount = await accountApi.getCustomerByEmail(request.query.email);
  if (customerAccount) {
    const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));
    const results = await businessUnitApi.getAssociatedBusinessUnits(customerAccount.id);
    const highestNodes = businessUnitApi.getHighestNodesWithAssociation(results, customerAccount.id);

    const businessUnitsWithSuperUser = highestNodes.filter((bu) =>
      BusinessUnitMappers.isUserAdminInBusinessUnit(bu, customerAccount.id, config.defaultSuperUserRoleKey),
    );

    return {
      statusCode: 200,
      body: JSON.stringify(businessUnitsWithSuperUser),
    };
  } else {
    return {
      statusCode: 400,
      errorCode: 400,
      error: 'Customer not found',
    };
  }
};

export const getBusinessUnitOrders: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const cartApi = new CartApi(actionContext.frontasticContext, getLocale(request));

  const keys = request?.query?.['keys'];
  if (!keys) {
    throw new Error('No keys');
  }

  const orders = await cartApi.getBusinessUnitOrders(keys);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(orders),
    sessionData: request.sessionData,
  };

  return response;
};

export const create: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));
  const config = actionContext.frontasticContext?.project?.configuration?.associateRoles;
  if (!config?.defaultBuyerRoleKey || !config?.defaultAdminRoleKey) {
    return {
      statusCode: 400,
      error: 'No associateRoles context defined',
      errorCode: 400,
    };
  }
  const data = mapRequestToBusinessUnit(request, config);

  const store = await businessUnitApi.create(data);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(store),
    sessionData: request.sessionData,
  };

  return response;
};

export const addAssociate: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));
  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request));
  const addUserBody: { email: string; roles: string[] } = JSON.parse(request.body);

  const account = await accountApi.getCustomerByEmail(addUserBody.email);
  if (!account) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'User not found' }),
      sessionData: request.sessionData,
    };
  }

  const businessUnit = await businessUnitApi.update(request.query['key'], [
    {
      action: 'addAssociate',
      associate: {
        customer: {
          typeId: 'customer',
          id: account.id,
        },
        associateRoleAssignments: addUserBody.roles.map((role) => ({
          associateRole: {
            typeId: 'associate-role',
            key: role,
          },
        })),
      },
    },
  ]);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(businessUnit),
    sessionData: request.sessionData,
  };

  return response;
};

export const removeAssociate: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));

  const { id } = JSON.parse(request.body);

  const businessUnit = await businessUnitApi.update(request.query['key'], [
    {
      action: 'removeAssociate',
      customer: {
        typeId: 'customer',
        id,
      },
    },
  ]);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(businessUnit),
    sessionData: request.sessionData,
  };

  return response;
};

export const updateAssociate: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));

  const { id, roles }: { id: string; roles: string[] } = JSON.parse(request.body);

  const businessUnit = await businessUnitApi.update(request.query['key'], [
    {
      action: 'changeAssociate',
      associate: {
        customer: {
          typeId: 'customer',
          id,
        },
        associateRoleAssignments: roles.map((role) => ({
          associateRole: {
            typeId: 'associate-role',
            key: role,
          },
        })),
      },
    },
  ]);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(businessUnit),
    sessionData: request.sessionData,
  };

  return response;
};

export const update: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));
  const { key, actions } = JSON.parse(request.body);

  const businessUnit = await businessUnitApi.update(key, actions);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(businessUnit),
    sessionData: {
      ...request.sessionData,
      organization: {
        // TODO
        ...request.sessionData?.organization,
        businessUnit,
      },
    },
  };

  return response;
};

export const getByKey: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));
  try {
    const businessUnit = await businessUnitApi.getByKey(request.query?.['key']);

    const response: Response = {
      statusCode: 200,
      body: JSON.stringify(businessUnit),
      sessionData: request.sessionData,
    };

    return response;
  } catch {
    const response: Response = {
      statusCode: 400,
      // @ts-ignore
      error: new Error('Business unit not found'),
      errorCode: 400,
    };

    return response;
  }
};

export const remove: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));
  const key = request.query?.['key'];

  let response: Response;

  try {
    const businessUnit = await businessUnitApi.delete(key);
    response = {
      statusCode: 200,
      body: JSON.stringify(businessUnit),
      sessionData: request.sessionData,
    };
  } catch (e) {
    response = {
      statusCode: 400,
      sessionData: request.sessionData,
      // @ts-ignore
      error: e?.body?.message,
      errorCode: 500,
    };
  }

  return response;
};

export const query: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));

  let where = '';
  if ('where' in request.query) {
    where += [request.query['where']];
  }
  const store = await businessUnitApi.query(where);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(store),
    sessionData: request.sessionData,
  };

  return response;
};

function mapRequestToBusinessUnit(request: Request, config: Record<string, string>): BusinessUnit {
  const businessUnitBody: BusinessUnitRequestBody = JSON.parse(request.body);
  const normalizedName = businessUnitBody.account.company.toLowerCase().replace(/ /g, '_');
  const key = businessUnitBody.parentBusinessUnit
    ? `${businessUnitBody.parentBusinessUnit}_div_${normalizedName}`
    : `business_unit_${normalizedName}`;

  let storeMode = StoreMode.Explicit;
  let unitType = BusinessUnitType.Company;
  const stores: StoreKeyReference[] = [];

  if (businessUnitBody.parentBusinessUnit && !businessUnitBody.store) {
    storeMode = StoreMode.FromParent;
  }

  if (businessUnitBody.parentBusinessUnit) {
    unitType = BusinessUnitType.Division;
  }

  if (businessUnitBody.store) {
    stores.push({
      typeId: 'store',
      id: businessUnitBody.store.id,
    });
  }

  const businessUnit: BusinessUnit = {
    key,
    name: businessUnitBody.account.company,
    status: BusinessUnitStatus.Active,
    stores,
    storeMode,
    unitType,
    contactEmail: businessUnitBody.account.email,
    associates: [
      {
        associateRoleAssignments: [
          {
            associateRole: {
              key: config.defaultBuyerRoleKey,
              typeId: 'associate-role',
            },
          },
          {
            associateRole: {
              key: config.defaultAdminRoleKey,
              typeId: 'associate-role',
            },
          },
        ],
        customer: {
          id: businessUnitBody.customer.accountId,
          typeId: 'customer',
        },
      },
    ],
  };

  if (businessUnitBody.parentBusinessUnit) {
    businessUnit.parentUnit = {
      key: businessUnitBody.parentBusinessUnit,
      typeId: 'business-unit',
    };
  }

  return businessUnit;
}
