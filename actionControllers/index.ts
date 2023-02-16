/* eslint-disable @typescript-eslint/no-var-requires */
import * as AccountActions from './AccountController';
const extendFIle = async () => {
    const blsh = require('cofe-ct-ecommerce/actionControllers/AccountController');
    return {
        ...blsh,
        ...AccountActions
    }
}

export const actions = {
  account: await extendFIle(),
};
