import { BusinessUnit as CommercetoolsBusinessUnit } from '@commercetools/platform-sdk';
import { BusinessUnit } from '../types/business-unit/BusinessUnit';
import { Store } from '../types/store/store';

export class BusinessUnitMappers {
  static mapBusinessUnitToBusinessUnit(
    businessUnit: CommercetoolsBusinessUnit,
    allStores: Store[],
    accountId: string,
    adminRoleKey: string,
  ): BusinessUnit {
    const businessUnitWithAssociates = this.mapReferencedAssociates(businessUnit);

    const businessUnitWithStores = this.mapStoreRefs(businessUnitWithAssociates, allStores);

    const businessUnitWithFlags = accountId
      ? this.addBUsinessUnitAdminFlags(businessUnitWithStores, accountId, adminRoleKey)
      : businessUnitWithStores;

    return this.trimBusinessUnit(businessUnitWithFlags);
  }

  static trimBusinessUnit(businessUnit: BusinessUnit): BusinessUnit {
    return {
      topLevelUnit: businessUnit.topLevelUnit,
      key: businessUnit.key,
      stores: businessUnit.stores,
      name: businessUnit.name,
      isRootAdmin: businessUnit.isRootAdmin,
      isAdmin: businessUnit.isAdmin,
      parentUnit: businessUnit.parentUnit,
      storeMode: businessUnit.storeMode,
      associates: businessUnit.associates?.map((associate) => ({
        associateRoleAssignments: associate.associateRoleAssignments?.map((role) => ({
          associateRole: { key: role.associateRole.key },
        })),
        customer: { id: associate.customer.id },
      })),
    };
  }

  static isUserAdminInBusinessUnit(businessUnit: BusinessUnit, accountId: string, adminRoleKey: string): boolean {
    const currentUserAssociate = businessUnit.associates?.find((associate) => associate.customer.id === accountId);
    return currentUserAssociate?.associateRoleAssignments.some((role) => role.associateRole.key === adminRoleKey);
  }

  static isUserRootAdminInBusinessUnit(businessUnit: BusinessUnit, accountId: string, adminRoleKey: string): boolean {
    if (this.isUserAdminInBusinessUnit(businessUnit, accountId, adminRoleKey)) {
      return !businessUnit.parentUnit;
    }
    return false;
  }

  static addBUsinessUnitAdminFlags(businessUnit: BusinessUnit, accountId = '', adminRoleKey: string): BusinessUnit {
    businessUnit.isAdmin = this.isUserAdminInBusinessUnit(businessUnit, accountId, adminRoleKey);
    businessUnit.isRootAdmin = this.isUserRootAdminInBusinessUnit(businessUnit, accountId, adminRoleKey);
    return businessUnit;
  }

  static mapReferencedAssociates(businessUnit: CommercetoolsBusinessUnit): BusinessUnit {
    return {
      ...businessUnit,
      associates: businessUnit.associates?.map((associate) => {
        if (associate.customer?.obj) {
          return {
            // @ts-ignore
            associateRoleAssignments: associate.associateRoleAssignments,
            customer: {
              id: associate.customer.id,
              typeId: 'customer',
              firstName: associate.customer?.obj?.firstName,
              lastName: associate.customer?.obj?.lastName,
              email: associate.customer?.obj?.email,
            },
          };
        }
        return associate;
      }),
    };
  }

  static mapStoreRefs(businessUnit: BusinessUnit, allStores: Store[]): BusinessUnit {
    return {
      ...businessUnit,
      stores: businessUnit.stores?.map((store) => {
        const storeObj = allStores.find((s) => s.key === store.key);
        return storeObj
          ? {
              name: storeObj.name,
              key: storeObj.key,
              typeId: 'store',
              id: storeObj.id,
            }
          : store;
      }),
    };
  }
}
