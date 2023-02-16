/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
import * as AccountSourceActions from './actionControllers/AccountController';

export const extender= <T>(sourcePath: string, target: T): T => {
  const source = require(sourcePath);
  if (!target) {
    return source;
  }
  return {
    ...source,
    ...target,
  };
};

export const AccountAction = extender<typeof AccountSourceActions>('cofe-ct-ecommerce/actionControllers/AccountController', AccountSourceActions);
