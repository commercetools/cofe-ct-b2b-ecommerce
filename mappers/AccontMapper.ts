import { Customer as commercetoolsCustomer } from '@commercetools/platform-sdk';
import { Account } from '@b2bdemo/types/types/account/Account';
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
Object.getOwnPropertyNames(BaseAccountMapper).forEach((key) => {
  if (typeof BaseAccountMapper[key] === 'function') {
    BaseAccountMapper[key] = AccountMapper[key];
  }
});
