import { Account } from '@commercetools/frontend-domain-types/account/Account';
import { Customer as commercetoolsCustomer } from '@commercetools/platform-sdk';
import { AccountMapper as BaseAccountMapper } from 'cofe-ct-ecommerce/mappers/AccountMapper';

export class AccountMapper extends BaseAccountMapper {
  static commercetoolsCustomerToSmallerAccount(commercetoolsCustomer: commercetoolsCustomer): Account {
    return {
      accountId: commercetoolsCustomer.id,
      email: commercetoolsCustomer.email,
      salutation: commercetoolsCustomer?.salutation,
      firstName: commercetoolsCustomer?.firstName,
      lastName: commercetoolsCustomer?.lastName,
      confirmed: commercetoolsCustomer.isEmailVerified,
    };
  }
}

// Override the BaseMapper with new Mapper functions
Object.getOwnPropertyNames(AccountMapper).forEach((key) => {
  if (typeof AccountMapper[key] === 'function') {
    BaseAccountMapper[key] = AccountMapper[key];
  }
});
