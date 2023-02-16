import { Account } from '@commercetools/frontend-domain-types/account/Account';
interface AssociateCustomerReference extends Partial<Account> {
  id: string;
  typeId?: string;
}

export interface AssociateRole {
  id: string;
  key: string;
  buyerAssignable: boolean;
  name?: string;
}

export interface AssociateRoleAssignment {
  associateRole: {
    id?: string;
    key?: string;
    typeId?: 'associate-role';
  };
}

export interface Associate {
  /**
   * @deprecated roles
   */
  roles?: string[];
  customer: AssociateCustomerReference;
  associateRoleAssignments?: AssociateRoleAssignment[];
}
