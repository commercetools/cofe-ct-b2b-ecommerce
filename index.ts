import { ActionHandler } from '@frontastic/extension-types';
import * as AccountControllerBase from 'cofe-ct-ecommerce/actionControllers/AccountController';
import * as AccountController from './actionControllers/AccountController';
import * as CartControllerBase from 'cofe-ct-ecommerce/actionControllers/CartController';
import * as CartController from './actionControllers/CartController';

export const extender = (source: any, target: any) => {
  if (!target) {
    return source;
  }
  return {
    ...source,
    ...target,
  };
};

export const AccountAction: typeof AccountController &
  typeof AccountControllerBase & { [actionIdentifier: string]: ActionHandler } = extender(
  AccountControllerBase,
  AccountController,
);

export const CartAction: typeof CartController &
  typeof CartControllerBase & { [actionIdentifier: string]: ActionHandler } = extender(
    CartControllerBase,
    CartController,
);
