import {
  AccountController as AccountControllerBase,
  AccountControllerType as AccountControllerBaseType,
} from 'cofe-ct-ecommerce/actionControllers/AccountController';
import { AccountController, AccountControllerType } from './actionControllers/AccountController';

export const extender = (args: object) => (source: any, target: any) => {
  if (!target) {
    return source;
  }
  return {
    ...source(args),
    ...target(args),
  };
};

export const AccountAction: (args: object) => AccountControllerType & AccountControllerBaseType = (args: object) =>
  extender(args)(AccountControllerBase, AccountController);
