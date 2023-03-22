import { AssociateRole as CommercetoolsAssociateRole } from '@commercetools/platform-sdk';
import { AssociateRole } from '../types/associate/Associate';

export class AssociateMappers {
  static mapCommercetoolsAssociateRoleToAssociateRole(associateRole: CommercetoolsAssociateRole): AssociateRole {
    return {
      name: associateRole.name,
      id: associateRole.id,
      key: associateRole.key,
      buyerAssignable: associateRole.buyerAssignable,
    };
  }
}
