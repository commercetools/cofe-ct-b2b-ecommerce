import { Request, Response } from '@frontastic/extension-types';
import { ActionContext } from '@frontastic/extension-types';
import { AccountApi } from '../apis/AccountApi';
import { Account } from '@b2bdemo/types/types/account/Account';
import { Address } from '@b2bdemo/types/types/account/Address';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { CartFetcher } from '../utils/CartFetcher';
import { EmailApi } from '../apis/EmailApi';
import { BusinessUnitApi } from '../apis/BusinessUnitApi';

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

  const cart = await CartFetcher.fetchCart(request, actionContext);

  try {
    const accountRes = await accountApi.login(account, cart, reverify);
    const organization = await businessUnitApi.getOrganization(accountRes.accountId);

    return { account: accountRes, organization };
  } catch (e) {
    throw e;
  }
}

function parseBirthday(accountRegisterBody: AccountRegisterBody): Date | undefined {
  if (accountRegisterBody.birthdayYear) {
    return new Date(
      +accountRegisterBody.birthdayYear,
      +accountRegisterBody?.birthdayMonth ?? 1,
      +accountRegisterBody?.birthdayDay ?? 1,
    );
  }

  return null;
}

function mapRequestToAccount(request: Request): Account {
  const accountRegisterBody: AccountRegisterBody = JSON.parse(request.body);

  const account: Account = {
    email: accountRegisterBody?.email,
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

    account.addresses.push(accountRegisterBody.billingAddress);
  }

  if (accountRegisterBody.shippingAddress) {
    accountRegisterBody.shippingAddress.isDefaultShippingAddress = true;
    accountRegisterBody.shippingAddress.isDefaultBillingAddress = !(accountRegisterBody.billingAddress !== undefined);

    account.addresses.push(accountRegisterBody.shippingAddress);
  }

  return account;
}

export const register: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request));
  const emailApi = new EmailApi(actionContext.frontasticContext.project.configuration.smtp);

  const accountData = mapRequestToAccount(request);
  const host = JSON.parse(request.body).host;

  const cart = await CartFetcher.fetchCart(request, actionContext).catch(() => undefined);

  let response: Response;

  try {
    const account = await accountApi.create(accountData, cart);

    if (!account.confirmed) await emailApi.sendVerificationEmail(account, host);
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

export const resendVerificationEmail: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const data = JSON.parse(request.body) as Account;
  const host = JSON.parse(request.body).host;

  const emailApi = new EmailApi(actionContext.frontasticContext.project.configuration.smtp);

  const reverify = true; //Will not login the account instead will send a reverification email..

  const { account } = await loginAccount(request, actionContext, data, reverify);

  await emailApi.sendVerificationEmail(account, host);

  const response: Response = {
    statusCode: 200,
  };

  return response;
};

export const login: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const accountLoginBody: AccountLoginBody = JSON.parse(request.body);

  const loginInfo = {
    email: accountLoginBody.email,
    password: accountLoginBody.password,
  } as Account;

  let response: Response;

  try {
    const { account, organization } = await loginAccount(request, actionContext, loginInfo);
    response = {
      statusCode: 200,
      body: JSON.stringify(account),
      sessionData: {
        ...request.sessionData,
        account,
        organization,
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
 * Request new reset token
 */
export const requestReset: ActionHook = async (request: Request, actionContext: ActionContext) => {
  type AccountRequestResetBody = {
    email?: string;
    host?: string;
  };

  const accountApi = new AccountApi(actionContext.frontasticContext, getLocale(request));
  const emailApi = new EmailApi(actionContext.frontasticContext.project.configuration.smtp);

  const accountRequestResetBody: AccountRequestResetBody = JSON.parse(request.body);

  const passwordResetToken = await accountApi.generatePasswordResetToken(accountRequestResetBody.email);

  await emailApi.sendPasswordResetEmail(
    passwordResetToken.confirmationToken,
    accountRequestResetBody.email,
    accountRequestResetBody.host,
  );

  return {
    statusCode: 200,
    body: JSON.stringify({}),
    sessionData: {
      ...request.sessionData,
      // TODO: should we redirect to logout rather to unset the account?
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
