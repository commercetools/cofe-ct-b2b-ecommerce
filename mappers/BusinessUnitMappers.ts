import { BusinessUnit } from '@b2bdemo/types/types/business-unit/BusinessUnit';
import { BusinessUnit as CommercetoolsBusinessUnit } from '@commercetools/platform-sdk';
import { Store } from '@b2bdemo/types/types/store/store';

export const mapBusinessUnitToBusinessUnit = (
  businessUnit: CommercetoolsBusinessUnit,
  allStores: Store[],
  accountId: string,
  adminRoleKey: string,
): BusinessUnit => {
  const businessUnitWithAssociates = mapReferencedAssociates(businessUnit);

  const businessUnitWithStores = mapStoreRefs(businessUnitWithAssociates, allStores);

  const businessUnitWithFlags = accountId
    ? addBUsinessUnitAdminFlags(businessUnitWithStores, accountId, adminRoleKey)
    : businessUnitWithStores;

  return trimBusinessUnit(businessUnitWithFlags);
};

const trimBusinessUnit = (businessUnit: BusinessUnit): BusinessUnit => {
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
};

export const isUserAdminInBusinessUnit = (
  businessUnit: BusinessUnit,
  accountId: string,
  adminRoleKey: string,
): boolean => {
  const currentUserAssociate = businessUnit.associates?.find((associate) => associate.customer.id === accountId);
  return currentUserAssociate?.associateRoleAssignments.some((role) => role.associateRole.key === adminRoleKey);
};

export const isUserRootAdminInBusinessUnit = (
  businessUnit: BusinessUnit,
  accountId: string,
  adminRoleKey: string,
): boolean => {
  if (isUserAdminInBusinessUnit(businessUnit, accountId, adminRoleKey)) {
    return !businessUnit.parentUnit;
  }
  return false;
};

export const addBUsinessUnitAdminFlags = (
  businessUnit: BusinessUnit,
  accountId = '',
  adminRoleKey: string,
): BusinessUnit => {
  businessUnit.isAdmin = isUserAdminInBusinessUnit(businessUnit, accountId, adminRoleKey);
  businessUnit.isRootAdmin = isUserRootAdminInBusinessUnit(businessUnit, accountId, adminRoleKey);
  return businessUnit;
};

export const mapReferencedAssociates = (businessUnit: CommercetoolsBusinessUnit): BusinessUnit => {
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
};

export const mapStoreRefs = (businessUnit: BusinessUnit, allStores: Store[]): BusinessUnit => {
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
};
