# CoFe B2B extensions using GraphQl
## NOTE:
This is **NOT** an official B2B extension code and **NOT** production ready. Use it at your own risk
## Installation
```
yarn add cofe-ct-ecommerce cofe-ct-b2b-ecommerce cofe-ct-graphql-b2b-ecommerce
```
## How to use it
In order to use B2B extensions, edit `commerce-commercetools/index.ts`
```
import { QuoteAction, AssociateAction, AccountAction, ... } from 'cofe-ct-b2b-ecommerce';
import { ProductAction } from 'cofe-ct-graphql-b2b-ecommerce';

export default {
    ...
    actions: {
        product: ProductAction
    ...
    }
}
```

## How to extend
### Action
If you plan to extend the login method in the `AccountAction`, create the file `AccountController.ts`
```
// this line has to be the first line at the top
export * from 'cofe-ct-graphql-b2b-ecommerce/actionControllers/ProductController';
import { Request, Response } from '@frontastic/extension-types';
...

export const query: ActionHook = async (request: Request, actionContext: ActionContext) => {
    // implement you code here
}
```
### API
If you plan to extend createCart endpoint in Cart, create a file `ProductApi.ts`
```
// your imports
import { ProductApi as GraphQlProductApi } from 'cofe-ct-graphql-b2b-ecommerce/apis/ProductApi';

export class ProductApi extends GraphQlProductApi {
    query: (...args) => Cart {
        // your implementation
    }
}
```

### GraphQl Queries
Modify the graphQl query passed to commercetools-sdk
```
class ProductApi {
    ...
    query: () => {
        ...
        return this.getApiForProject()
        .graphql()
        .post({
          body: {
            query: `<write your own query here>`,
            variables,
          },
        })
    }
}

```