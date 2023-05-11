# CoFe B2B extensions
## Installation
```
yarn add cofe-ct-ecommerce cofe-ct-b2b-ecommerce
```
## How to use it
In order to use B2B extensions, edit `commerce-commercetools/index.ts`
```
import { QuoteAction, AssociateAction, AccountAction, ... } from 'cofe-ct-b2b-ecommerce';

export default {
    ...
    actions: {
        account: AccountAction,
        quote: QuoteAction,
    ...
    }
}
```

## How to extend
### Action
If you plan to extend the login method in the `AccountAction`, create the file `AccountController.ts`
```
// this line has to be the first line at the top
export * from 'cofe-ct-b2b-ecommerce/actionControllers/AccountController';
import { Request, Response } from '@frontastic/extension-types';
...

export const login: ActionHook = async (request: Request, actionContext: ActionContext) => {
    // implement you code here
}
```
### API
If you plan to extend createCart endpoint in Cart, create a file `CartApi.ts`
```
// your imports
import { CartApi as B2BCartApi } from 'cofe-ct-b2b-ecommerce/apis/CartApi';

export class CartApi extends B2BCartApi {
    createCart: (...args) => Cart {
        // your implementation
    }
}
```

## Configuration
### Variables to set
1. project.yml`
```
wishlistSharing:
    wishlistSharingCustomType: b2b-list
    wishlistSharingCustomField: business-unit-keys // string(set)
associateRoles:
    defaultAdminRoleKey: admin // key of default admin role
    defaultBuyerRoleKey: buyer // key of default buyer role
    defaultSuperUserRoleKey: super-user // key of default superUser role
```
