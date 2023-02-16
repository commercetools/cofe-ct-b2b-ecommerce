import * as AccountActions from './AccountController';
const extendFIle = async () => {
    const blsh = await import('cofe-ct-ecommerce/actionControllers/AccountController');
    return {
        ...blsh,
        ...AccountActions
    }
}

export const actions = {
  account: await extendFIle(),
};
