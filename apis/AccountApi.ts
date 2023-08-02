import { Account } from '../types/account/Account';
import { Customer } from '@commercetools/platform-sdk';
import { CustomerDraft } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/customer';
import { CartResourceIdentifier } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/cart';
import { AccountApi as BaseAccountApi } from 'cofe-ct-ecommerce/apis/AccountApi';
import { AccountMapper } from '../mappers/AccountMapper';
import { Cart } from '@commercetools/frontend-domain-types/cart/Cart';

export class AccountApi extends BaseAccountApi {
  create: (account: Account, cart: Cart | undefined) => Promise<Account> = async (
    account: Account,
    cart: Cart | undefined,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const {
        commercetoolsAddresses,
        billingAddresses,
        shippingAddresses,
        defaultBillingAddress,
        defaultShippingAddress,
      } = this.extractAddresses(account);

      const customerDraft: CustomerDraft = {
        email: account.email,
        password: account.password,
        salutation: account?.salutation,
        firstName: account?.firstName,
        lastName: account?.lastName,
        companyName: account.company,
        dateOfBirth: account?.birthday
          ? account.birthday.getFullYear() + '-' + account.birthday.getMonth() + '-' + account.birthday.getDate()
          : undefined,
        isEmailVerified: account?.confirmed,
        addresses: commercetoolsAddresses.length > 0 ? commercetoolsAddresses : undefined,
        defaultBillingAddress: defaultBillingAddress,
        defaultShippingAddress: defaultShippingAddress,
        billingAddresses: billingAddresses.length > 0 ? billingAddresses : undefined,
        shippingAddresses: shippingAddresses.length > 0 ? shippingAddresses : undefined,
        anonymousCart:
          cart !== undefined
            ? ({
                typeId: 'cart',
                id: cart.cartId,
              } as CartResourceIdentifier)
            : undefined,
      };

      account = await this.requestBuilder()
        .customers()
        .post({
          body: customerDraft,
        })
        .execute()
        .then((response) => {
          return AccountMapper.commercetoolsCustomerToAccount(response.body.customer, locale);
        })
        .catch((error) => {
          if (error.code && error.code === 400) {
            if (error.body && error.body?.errors?.[0]?.code === 'DuplicateField') {
              throw new Error(`The account ${account.email} does already exist.`);
            }

            /*
             * The cart might already belong to another user, so we try to create tje account without the cart.
             */
            if (cart) {
              return this.create(account, undefined);
            }
          }

          throw error;
        });

      const token = await this.getConfirmationToken(account);

      if (token) {
        account.confirmationToken = token;
      }

      return account;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw error;
    }
  };

  login: (account: Account, cart: Cart | undefined, reverify?: boolean) => Promise<Account> = async (
    account: Account,
    cart: Cart | undefined,
    reverify = false,
  ) => {
    try {
      account = await this.requestBuilder()
        .login()
        .post({
          body: {
            email: account.email,
            password: account.password,
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
          return AccountMapper.commercetoolsCustomerToSmallerAccount(response.body.customer);
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

  getCustomerByEmail: (email: string) => Promise<Customer | null> = async (email: string) => {
    const {
      body: { results },
    } = await this.requestBuilder()
      .customers()
      .get({
        queryArgs: {
          where: `email="${email}"`,
          limit: 1,
        },
      })
      .execute();
    return results.length ? results[0] : null;
  };
  getCustomerById: (id: string) => Promise<Account | null> = async (id: string) => {
    const { body } = await this.requestBuilder().customers().withId({ ID: id }).get().execute();
    return body;
  };
}
