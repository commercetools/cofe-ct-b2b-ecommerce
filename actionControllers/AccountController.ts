import { Request, Response } from '@frontastic/extension-types';
import { ActionContext } from '@frontastic/extension-types';
import { AccountExtended as Account } from 'cofe-ct-ecommerce/interfaces/AccountExtended';
import { Address } from '@commercetools/frontend-domain-types/account/Address';
import { CartFetcher } from 'cofe-ct-ecommerce/utils/CartFetcher';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { parseBirthday } from 'cofe-ct-ecommerce/utils/parseBirthday';
import { BusinessUnitApi } from '../apis/BusinessUnitApi';
import { NotificationApi } from '../apis/NotificationApi';
import { assertIsAuthenticated } from 'cofe-ct-ecommerce/utils/assertIsAuthenticated';
import { fetchAccountFromSession } from 'cofe-ct-ecommerce/utils/fetchAccountFromSession';
import { AccountApi } from '../apis/AccountApi';
import { EmailApi } from 'cofe-ct-ecommerce/apis/EmailApi';
type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export type AccountRegisterBody = {
  email?: string;
  confirmed?: boolean;
  password?: string;
  salutation?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  birthdayYear?: string;
  birthdayMonth?: string;
  birthdayDay?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
};

type AccountLoginBody = {
  email?: string;
  password?: string;
};

async function loginAccount(request: Request, actionContext: ActionContext, account: Account, reverify = false) {
  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request));
  const businessUnitApi = new BusinessUnitApi(actionContext.frontasticContext, getLocale(request));
  const notificationApi = new NotificationApi(actionContext.frontasticContext, getLocale(request));

  const cart = await CartFetcher.fetchCart(request, actionContext);

  try {
    const accountRes = await accountApi.login(account, cart, reverify);
    const organization = await businessUnitApi.getOrganization(accountRes.accountId);
    const token = await notificationApi.getToken(account.email, account.password);

    return { account: accountRes, organization, token };
  } catch (e) {
    throw e;
  }
}

function mapRequestToAccount(request: Request): Account {
  const accountRegisterBody: AccountRegisterBody = JSON.parse(request.body);

  const account: Account = {
    email: accountRegisterBody?.email ?? '',
    confirmed: accountRegisterBody?.confirmed,
    password: accountRegisterBody?.password,
    salutation: accountRegisterBody?.salutation,
    firstName: accountRegisterBody?.firstName,
    lastName: accountRegisterBody?.lastName,
    company: accountRegisterBody?.company,
    birthday: parseBirthday(accountRegisterBody),
    addresses: [],
  };

  if (accountRegisterBody.billingAddress) {
    accountRegisterBody.billingAddress.isDefaultBillingAddress = true;
    accountRegisterBody.billingAddress.isDefaultShippingAddress = !(accountRegisterBody.shippingAddress !== undefined);

    account.addresses!.push(accountRegisterBody.billingAddress);
  }

  if (accountRegisterBody.shippingAddress) {
    accountRegisterBody.shippingAddress.isDefaultShippingAddress = true;
    accountRegisterBody.shippingAddress.isDefaultBillingAddress = !(accountRegisterBody.billingAddress !== undefined);

    account.addresses!.push(accountRegisterBody.shippingAddress);
  }

  return account;
}

export const register: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const locale = getLocale(request);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request));

  const accountData = mapRequestToAccount(request);

  const cart = await CartFetcher.fetchCart(request, actionContext).catch(() => undefined);

  let response: Response;

  try {
    const account = await accountApi.create(accountData, cart);

    if (EmailApi) {
      const emailApi = new EmailApi(actionContext.frontasticContext, locale);
      if (!account.confirmed) await emailApi.sendAccountVerificationEmail(account);
    }

    response = {
      statusCode: 200,
      body: JSON.stringify({ accountId: account.accountId }),
      sessionData: {
        ...request.sessionData,
      },
    };
  } catch (e) {
    response = {
      statusCode: 400,
      // @ts-ignore
      error: e?.message,
      errorCode: 500,
    };
  }
  return response;
};

export const login: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const accountLoginBody: AccountLoginBody = JSON.parse(request.body);
  const config = actionContext.frontasticContext?.project?.configuration?.storeContext;

  const loginInfo = {
    email: accountLoginBody.email,
    password: accountLoginBody.password,
  } as Account;

  let response: Response;

  try {
    const { account, organization, token } = await loginAccount(request, actionContext, loginInfo);
    console.debug('set in session', token);
    response = {
      statusCode: 200,
      body: JSON.stringify(account),
      sessionData: {
        ...request.sessionData,
        account,
        organization,
        // @ts-ignore
        rootCategoryId: organization.store?.custom?.fields?.[config?.rootCategoryCustomField]?.id,
        notificationToken: token,
      },
    };
  } catch (e) {
    response = {
      statusCode: 400,
      // @ts-ignore
      error: e?.message,
      errorCode: 500,
    };
  }

  return response;
};

export const logout: ActionHook = async (request: Request, actionContext: ActionContext) => {
  return {
    statusCode: 200,
    body: JSON.stringify({}),
    sessionData: {
      ...request.sessionData,
      organization: undefined,
      account: undefined,
    },
  } as Response;
};

/**
 * Reset password
 */
export const reset: ActionHook = async (request: Request, actionContext: ActionContext) => {
  type AccountResetBody = {
    token?: string;
    newPassword?: string;
  };

  const accountResetBody: AccountResetBody = JSON.parse(request.body);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request));

  const newAccount = await accountApi.resetPassword(accountResetBody.token, accountResetBody.newPassword);
  newAccount.password = accountResetBody.newPassword;

  // TODO: do we need to log in the account after creation?
  // TODO: handle exception when customer can't login if email is not confirmed
  const { account, organization } = await loginAccount(request, actionContext, newAccount);

  return {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account,
      organization,
    },
  } as Response;
};

export const addAddress: ActionHook = async (request: Request, actionContext: ActionContext) => {
  assertIsAuthenticated(request);

  let account = fetchAccountFromSession(request);

  const address: Address = JSON.parse(request.body);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request));

  account = await accountApi.addAddress(account, address);

  return {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account,
    },
  } as Response;
};

export const updateAddress: ActionHook = async (request: Request, actionContext: ActionContext) => {
  assertIsAuthenticated(request);

  let account = fetchAccountFromSession(request);

  const address: Address = JSON.parse(request.body);

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request));

  account = await accountApi.updateAddress(account, address);

  return {
    statusCode: 200,
    body: JSON.stringify(account),
    sessionData: {
      ...request.sessionData,
      account,
    },
  } as Response;
};
