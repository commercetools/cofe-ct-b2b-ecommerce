import { Account } from '../account/Account';

interface AssociateCustomerReference extends Partial<Account> {
  id: string;
  typeId?: string;
}

export enum AssociateRoleInheritanceMode {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
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
  inheritance: AssociateRoleInheritanceMode | string;
}

export interface Associate {
  /**
   * @deprecated roles
   */
  roles?: string[];
  customer: AssociateCustomerReference;
  associateRoleAssignments?: AssociateRoleAssignment[];
}
