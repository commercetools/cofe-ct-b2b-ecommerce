import { Account } from '@commercetools/frontend-domain-types/account/Account';
import { Customer as commercetoolsCustomer } from '@commercetools/platform-sdk';
import { Locale } from 'cofe-ct-ecommerce/interfaces/Locale';
import { AccountMapper as BaseAccountMapper } from 'cofe-ct-ecommerce/mappers/AccontMapper';

export class AccountMapper extends BaseAccountMapper {
  static commercetoolsCustomerToAccount(commercetoolsCustomer: commercetoolsCustomer, locale: Locale): Account {
    return {
      accountId: commercetoolsCustomer.id,
      email: commercetoolsCustomer.email,
      salutation: commercetoolsCustomer?.salutation,
      firstName: commercetoolsCustomer?.firstName,
      lastName: commercetoolsCustomer?.lastName,
      birthday: commercetoolsCustomer?.dateOfBirth ? new Date(commercetoolsCustomer.dateOfBirth) : undefined,
      confirmed: commercetoolsCustomer.isEmailVerified,
      addresses: this.commercetoolsCustomerToAddresses(commercetoolsCustomer, locale),
    } as Account;
  }
}

// Override the BaseMapper with new Mapper functions
Object.getOwnPropertyNames(AccountMapper).forEach((key) => {
  if (typeof AccountMapper[key] === 'function') {
    BaseAccountMapper[key] = AccountMapper[key];
  }
});
