import { ActionHandler } from '@frontastic/extension-types';
import * as AccountControllerBase from 'cofe-ct-ecommerce/actionControllers/AccountController';
import * as AccountController from './actionControllers/AccountController';

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
