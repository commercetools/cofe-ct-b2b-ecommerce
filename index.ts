import * as AccountSourceActions from 'cofe-ct-ecommerce/actionControllers/AccountController';
import * as AccountTargetActions from './actionControllers/AccountController';

export const extender= <T, R>(source: T, target: R):  R | T => {
  if (!target) {
    return source;
  }
  return {
    ...source,
    ...target,
  };
};

export const AccountAction = extender<typeof AccountSourceActions, typeof AccountTargetActions>(AccountSourceActions, AccountTargetActions);
