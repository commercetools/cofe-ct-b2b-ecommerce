/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
import * as AccountSourceActions from './actionControllers/AccountController';

export const extender = (sourcePath: string, target: any): typeof module => {
  const source = require(sourcePath);
  if (!target) {
    return source;
  }
  return {
    ...source,
    ...target,
  };
};

export const AccountAction = extender('cofe-ct-ecommerce/actionControllers/AccountController', AccountSourceActions);
