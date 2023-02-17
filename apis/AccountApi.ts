import { AccountMapper } from 'cofe-ct-ecommerce/mappers/AccontMapper';
import { CartResourceIdentifier } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/cart';
import { AccountApi as BaseAccountApi } from 'cofe-ct-ecommerce/apis/AccountApi';
import { Account } from '@commercetools/frontend-domain-types/account/Account';
import { Cart } from '@commercetools/frontend-domain-types/cart/Cart';

export class AccountApi extends BaseAccountApi {
  login: (account: Account, cart: Cart | undefined, reverify?: boolean) => Promise<Account> = async (
    account: Account,
    cart: Cart | undefined,
    reverify = false,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      account = await this.getApiForProject()
        .login()
        .post({
          body: {
            email: account.email,
            password: account.password!,
            anonymousCart:
              cart !== undefined
                ? ({
                    typeId: 'cart',
                    id: cart.cartId,
                  } as CartResourceIdentifier)
                : undefined,
          },
        })
        .execute()
        .then((response) => {
          return AccountMapper.commercetoolsCustomerToAccount(response.body.customer, locale);
        })
        .catch((error) => {
          if (error.code && error.code === 400) {
            if (error.body && error.body?.errors?.[0]?.code === 'InvalidCredentials') {
              throw new Error(`Invalid credentials to login with the account ${account.email}`);
            }

            /*
             * The cart might already belong to another user, so we try to log in without the cart.
             */
            if (cart) {
              return this.login(account, undefined, reverify);
            }
          }

          throw new Error(`Failed to login account  ${account.email}.`);
        });

      if (reverify) {
        const token = await this.getConfirmationToken(account);
        account.confirmationToken = token;
      } else if (!account.confirmed) {
        throw new Error(`Your account ${account.email} is not activated yet!`);
      }

      return account;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw error;
    }
  };
}
