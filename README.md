# CoFe B2B extensions

## NOTE:
This is **NOT** an official B2B extension code and **NOT** production ready. Use it at your own risk

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
### project configuration schema
```
{
  "schema": [
    {
      "name": "B2B configuration",
      "fields": [
        {
          "label": "Default admin role key",
          "field": "EXTENSION_B2B_DEFAULT_ADMIN_ROLE",
          "type": "string",
          "translatable": false,
          "required": true
        },
        {
          "label": "Default buyer role key",
          "field": "EXTENSION_B2B_DEFAULT_BUYER_ROLE",
          "type": "string",
          "translatable": false,
          "required": true
        },
        {
          "label": "Default superuser role key",
          "field": "EXTENSION_B2B_DEFAULT_SUPERUSER_ROLE",
          "type": "string",
          "translatable": false,
          "required": true
        },
        {
          "label": "Wishlist sharing custom type",
          "field": "EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_TYPE",
          "type": "string",
          "translatable": false,
          "required": false
        },
        {
          "label": "Wishlist sharing custom field",
          "field": "EXTENSION_B2B_WISHLIST_SHARING_CUSTOM_FIELD",
          "type": "string",
          "translatable": false,
          "required": false
        },
      ]
    }
  ]
}
```