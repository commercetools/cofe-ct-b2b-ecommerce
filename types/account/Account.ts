import { Account as DomainAccount } from '@commercetools/frontend-domain-types/account/Account';

export interface Account extends DomainAccount {
  company?: string;
  isSubscribed?: boolean;
}

export interface CustomerReference {
  obj?: any;
  id: string;
  typeId: 'customer';
}
