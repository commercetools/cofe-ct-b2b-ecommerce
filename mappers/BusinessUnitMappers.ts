import { BusinessUnit as CommercetoolsBusinessUnit, StoreKeyReference } from '@commercetools/platform-sdk';
import { BusinessUnit } from '../types/business-unit/BusinessUnit';
import { Store } from '../types/store/store';
import { Associate } from '../types/associate/Associate';

export class BusinessUnitMappers {
  static mapBusinessUnitToBusinessUnit(
    businessUnit: CommercetoolsBusinessUnit,
    allStores: Store[],
    accountId: string,
    adminRoleKey: string,
  ): BusinessUnit {
    return {
      topLevelUnit: businessUnit.topLevelUnit,
      key: businessUnit.key,
      name: businessUnit.name,
      parentUnit: businessUnit.parentUnit,
      storeMode: businessUnit.storeMode,
      stores: this.mapReferencedStoresToStores(businessUnit, allStores),
      associates: this.mapReferencedAssociatesToAssociate(businessUnit),
      isAdmin: this.isUserAdminInBusinessUnit(businessUnit, accountId, adminRoleKey),
      isRootAdmin: this.isUserRootAdminInBusinessUnit(businessUnit, accountId, adminRoleKey),
    };
  }

  static mapBusinessUnitToBusinessUnitTreeItem(
    businessUnit: CommercetoolsBusinessUnit,
    allStores: Store[],
  ): BusinessUnit {
    return {
      topLevelUnit: businessUnit.topLevelUnit,
      key: businessUnit.key,
      name: businessUnit.name,
      parentUnit: businessUnit.parentUnit,
      storeMode: businessUnit.storeMode,
      stores: this.mapReferencedStoresToStores(businessUnit, allStores),
      associates: this.mapReferencedAssociatesToAssociate(businessUnit),
      custom: businessUnit.custom,
    };
  }

  static trimBusinessUnit(businessUnit: BusinessUnit, accountId: string): BusinessUnit {
    return {
      ...businessUnit,
      stores: businessUnit.stores.map((store) => ({ key: store.key, typeId: 'store' })),
      associates: businessUnit.associates
        ?.filter((associate) => associate.customer.id === accountId)
        ?.map((associate) => ({
          associateRoleAssignments: associate.associateRoleAssignments?.map((role) => ({
            associateRole: { key: role.associateRole.key },
          })),
          customer: { id: associate.customer.id },
        })),
    };
  }

  static isUserAdminInBusinessUnit(
    businessUnit: CommercetoolsBusinessUnit,
    accountId: string,
    adminRoleKey: string,
  ): boolean {
    const currentUserAssociate = businessUnit.associates?.find((associate) => associate.customer.id === accountId);
    return currentUserAssociate?.associateRoleAssignments.some((role) => role.associateRole.key === adminRoleKey);
  }

  static isUserRootAdminInBusinessUnit(
    businessUnit: CommercetoolsBusinessUnit,
    accountId: string,
    adminRoleKey: string,
  ): boolean {
    if (this.isUserAdminInBusinessUnit(businessUnit, accountId, adminRoleKey)) {
      return !businessUnit.parentUnit;
    }
    return false;
  }

  static mapReferencedAssociatesToAssociate(businessUnit: CommercetoolsBusinessUnit): Associate[] {
    return businessUnit.associates?.map((associate) => {
      if (associate.customer?.obj) {
        return {
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
    });
  }

  static mapReferencedStoresToStores(businessUnit: CommercetoolsBusinessUnit, allStores: Store[]): StoreKeyReference[] {
    return businessUnit.stores?.map((store) => {
      const storeObj = allStores.find((s) => s.key === store.key);
      return storeObj
        ? {
            name: storeObj.name,
            key: storeObj.key,
            typeId: 'store',
            id: storeObj.id,
          }
        : (store as StoreKeyReference);
    });
  }
}
