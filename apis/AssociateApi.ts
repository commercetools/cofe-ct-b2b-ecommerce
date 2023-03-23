import { BaseApi } from 'cofe-ct-ecommerce/apis/BaseApi';
import { AssociateRole } from '../types/associate/Associate';
import { AssociateMappers } from '../mappers/AssociateMappers';

export class AssociateApi extends BaseApi {
  getAllAssociateRoles: () => Promise<AssociateRole[]> = async () => {
    try {
      return this.getApiForProject()
        .associateRoles()
        .get()
        .execute()
        .then((response) => {
          return response.body.results
            .filter((associateRole) => associateRole.buyerAssignable)
            .map((associateRole) => AssociateMappers.mapCommercetoolsAssociateRoleToAssociateRole(associateRole));
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };
}
