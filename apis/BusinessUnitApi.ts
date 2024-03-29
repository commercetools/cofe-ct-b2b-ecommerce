import { BaseApi } from 'cofe-ct-ecommerce/apis/BaseApi';
import { BusinessUnit, StoreMode } from '../types/business-unit/BusinessUnit';
import { BusinessUnit as CommercetoolsBusinessUnit, BusinessUnitPagedQueryResponse } from '@commercetools/platform-sdk';
import { BusinessUnitMappers } from '../mappers/BusinessUnitMappers';
import { StoreApi } from './StoreApi';
import { StoreMappers } from '../mappers/StoreMappers';
import { Organization } from '../types/organization/organization';
import { StoreKeyReference } from '../types/store/store';

const MAX_LIMIT = 50;

export class BusinessUnitApi extends BaseApi {
  getOrganizationByBusinessUnit = async (businessUnit: BusinessUnit): Promise<Organization> => {
    const organization: Organization = {} as Organization;

    organization.businessUnit = businessUnit;
    if (businessUnit.stores?.[0]) {
      const storeApi = new StoreApi(this.frontasticContext, this.locale, this.currency);
      const store = await storeApi.get(businessUnit.stores?.[0].key);
      organization.store = StoreMappers.mapStoreToSmallerStore(store);
    }

    return organization;
  };

  getOrganization: (accountId: string, businessUnitKey?: string) => Promise<Organization> = async (
    accountId: string,
    businessUnitKey?: string,
  ): Promise<Organization> => {
    const organization: Organization = {} as Organization;
    if (accountId) {
      let businessUnit: BusinessUnit;

      if (businessUnitKey) {
        businessUnit = await this.get(businessUnitKey, accountId);
      } else {
        businessUnit = await this.getMe(accountId);
      }
      if (businessUnit?.key) {
        return this.getOrganizationByBusinessUnit(businessUnit);
      }
    }

    return organization;
  };

  create: (data: any) => Promise<CommercetoolsBusinessUnit> = async (data: any) => {
    try {
      return this.requestBuilder()
        .businessUnits()
        .post({
          body: data,
        })
        .execute()
        .then((res) => res.body as CommercetoolsBusinessUnit);
    } catch (e) {
      throw e;
    }
  };

  delete: (key: string) => Promise<any> = async (key: string) => {
    try {
      return this.getByKey(key).then((bu) => {
        return this.requestBuilder()
          .businessUnits()
          .withKey({ key })
          .delete({
            queryArgs: {
              version: bu.version,
            },
          })
          .execute()
          .then((res) => res.body);
      });
    } catch (e) {
      throw e;
    }
  };

  update: (key: string, actions: any[]) => Promise<any> = async (key: string, actions: any[]) => {
    try {
      return this.getByKey(key).then((res) => {
        return this.requestBuilder()
          .businessUnits()
          .withKey({ key })
          .post({
            body: {
              version: res.version,
              actions,
            },
          })
          .execute()
          .then((res) => res.body);
      });
    } catch (e) {
      console.log(e);

      throw e;
    }
  };

  query: (where: string, expand?: string | string[]) => Promise<BusinessUnitPagedQueryResponse> = async (
    where: string,
    expand?: string | string[],
  ) => {
    try {
      return this.requestBuilder()
        .businessUnits()
        .get({
          queryArgs: {
            where,
            expand,
            limit: MAX_LIMIT,
          },
        })
        .execute()
        .then((res) => res.body as BusinessUnitPagedQueryResponse);
    } catch (e) {
      throw e;
    }
  };

  getHighestNodesWithAssociation: (
    businessUnits: CommercetoolsBusinessUnit[],
    accountId: string,
    filterAdmin?: boolean,
  ) => CommercetoolsBusinessUnit[] = (
    businessUnits: CommercetoolsBusinessUnit[],
    accountId: string,
    filterAdmin?: boolean,
  ) => {
    if (!businessUnits.length) {
      return [];
    }

    const { EXTENSION_B2B_DEFAULT_ADMIN_ROLE } = this.frontasticContext?.projectConfiguration;
    if (!EXTENSION_B2B_DEFAULT_ADMIN_ROLE) {
      throw new Error('Configuration error. No "EXTENSION_B2B_DEFAULT_ADMIN_ROLE" exists');
    }

    const rootNode = businessUnits.filter((bu) => !bu.parentUnit);
    if (rootNode.length) {
      return rootNode;
    }

    const justParents = businessUnits
      // filter out the ones that their parent is also in the list
      .filter((bu) => {
        return businessUnits.findIndex((sbu) => sbu.key === bu.parentUnit?.key) === -1;
      });

    return filterAdmin
      ? justParents.filter((bu) =>
          BusinessUnitMappers.isUserAdminInBusinessUnit(bu, accountId, EXTENSION_B2B_DEFAULT_ADMIN_ROLE),
        )
      : justParents
          // sort by Admin first
          .sort((a, b) =>
            BusinessUnitMappers.isUserAdminInBusinessUnit(a, accountId, EXTENSION_B2B_DEFAULT_ADMIN_ROLE)
              ? -1
              : BusinessUnitMappers.isUserAdminInBusinessUnit(b, accountId, EXTENSION_B2B_DEFAULT_ADMIN_ROLE)
              ? 1
              : 0,
          );
  };

  getMe: (accountId: string) => Promise<BusinessUnit> = async (accountId: string) => {
    try {
      const storeApi = new StoreApi(this.frontasticContext, this.locale, this.currency);
      const { EXTENSION_B2B_DEFAULT_ADMIN_ROLE, EXTENSION_B2B_DEFAULT_SUPERUSER_ROLE } =
        this.frontasticContext?.projectConfiguration;

      if (!EXTENSION_B2B_DEFAULT_ADMIN_ROLE || !EXTENSION_B2B_DEFAULT_SUPERUSER_ROLE) {
        throw new Error('Configuration error. No "EXTENSION_B2B_DEFAULT_ADMIN_ROLE" exists');
      }
      const results = await this.getAssociatedBusinessUnits(accountId);
      const highestNodes = this.getHighestNodesWithAssociation(results, accountId);

      const superUserList = highestNodes.filter((bu) =>
        BusinessUnitMappers.isUserAdminInBusinessUnit(bu, accountId, EXTENSION_B2B_DEFAULT_SUPERUSER_ROLE),
      );

      if (superUserList.length >= 1) {
        throw new Error('superuser');
      }

      if (highestNodes.length) {
        const bu = await this.setStoresByBusinessUnit(highestNodes[0] as CommercetoolsBusinessUnit);
        const storeKeys = bu?.stores?.map((store) => `"${store.key}"`).join(' ,');
        const allStores = await storeApi.query(`key in (${storeKeys})`);
        return BusinessUnitMappers.mapBusinessUnitToBusinessUnit(
          bu as CommercetoolsBusinessUnit,
          allStores,
          accountId,
          EXTENSION_B2B_DEFAULT_ADMIN_ROLE,
        );
      }
      return BusinessUnitMappers.mapBusinessUnitToBusinessUnit(results?.[0], [],accountId, EXTENSION_B2B_DEFAULT_ADMIN_ROLE);
    } catch (e) {
      throw e;
    }
  };

  get: (key: string, accountId?: string) => Promise<BusinessUnit> = async (key: string, accountId?: string) => {
    const { EXTENSION_B2B_DEFAULT_ADMIN_ROLE } = this.frontasticContext?.projectConfiguration;

    if (!EXTENSION_B2B_DEFAULT_ADMIN_ROLE) {
      throw new Error('Configuration error. No "EXTENSION_B2B_DEFAULT_ADMIN_ROLE" exists');
    }
    const storeApi = new StoreApi(this.frontasticContext, this.locale, this.currency);
    try {
      const bu = await this.requestBuilder()
        .businessUnits()
        .withKey({ key })
        .get()
        .execute()
        .then((res) => this.setStoresByBusinessUnit(res.body as CommercetoolsBusinessUnit));
      const storeKeys = bu?.stores?.map((store) => `"${store.key}"`).join(' ,');
      const allStores = await storeApi.query(`key in (${storeKeys})`);
      return BusinessUnitMappers.mapBusinessUnitToBusinessUnit(
        bu as CommercetoolsBusinessUnit,
        allStores,
        accountId,
        EXTENSION_B2B_DEFAULT_ADMIN_ROLE,
      );
    } catch (e) {
      throw e;
    }
  };

  getByKey: (key: string) => Promise<CommercetoolsBusinessUnit> = async (key: string) => {
    try {
      return this.requestBuilder()
        .businessUnits()
        .withKey({ key })
        .get()
        .execute()
        .then((res) => res.body as CommercetoolsBusinessUnit);
    } catch (e) {
      throw e;
    }
  };

  setStoresByBusinessUnit: (businessUnit: CommercetoolsBusinessUnit) => Promise<CommercetoolsBusinessUnit> = async (
    businessUnit: CommercetoolsBusinessUnit,
  ) => {
    if (businessUnit.storeMode === StoreMode.Explicit) {
      return businessUnit;
    }
    let parentBU: CommercetoolsBusinessUnit = { ...businessUnit };
    while (parentBU.storeMode === StoreMode.FromParent && !!parentBU.parentUnit) {
      const { body } = await this.requestBuilder()
        .businessUnits()
        .withKey({ key: parentBU.parentUnit.key })
        .get()
        .execute();
      parentBU = body as CommercetoolsBusinessUnit;
    }
    if (parentBU.storeMode === StoreMode.Explicit) {
      return {
        ...businessUnit,
        stores: parentBU.stores,
      };
    }
    return businessUnit;
  };

  getAssociatedBusinessUnits: (accoundId: string) => Promise<CommercetoolsBusinessUnit[]> = async (
    accountId: string,
  ) => {
    const response = await this.query(`associates(customer(id="${accountId}")) or inheritedAssociates(customer(id="${accountId}"))`, ['associates[*].customer', 'inheritedAssociates[*].customer']);
    return response.results;
  };

  getTree: (accoundId: string) => Promise<BusinessUnit[]> = async (accountId: string) => {
    let tree: CommercetoolsBusinessUnit[] = [];
    const storeApi = new StoreApi(this.frontasticContext, this.locale, this.currency);
    const { EXTENSION_B2B_DEFAULT_ADMIN_ROLE } = this.frontasticContext?.projectConfiguration;

    if (!EXTENSION_B2B_DEFAULT_ADMIN_ROLE) {
      throw new Error('Configuration error. No "EXTENSION_B2B_DEFAULT_ADMIN_ROLE" exists');
    }
    if (accountId) {
      const results = await this.getAssociatedBusinessUnits(accountId);
      tree = this.getHighestNodesWithAssociation(results, accountId, false).map((bu) => ({
        ...bu,
        parentUnit: null,
      }));
      if (tree.length) {
        // get the whole organization nodes
        const { results } = await this.query(
          `topLevelUnit(key="${tree[0].topLevelUnit.key}")`,
          ['associates[*].customer', 'inheritedAssociates[*].customer'],
        );
        const tempParents = [...tree];

        // filter results and add nodes to tree if they are descendents of tree nodes
        while (tempParents.length) {
          const [item] = tempParents.splice(0, 1);
          const children = results.filter((bu) => bu.parentUnit?.key === item.key);
          if (children.length) {
            children.forEach((child) => {
              tempParents.push(child);
              tree.push(child);
            });
          }
        }
      }
    }
    const storeKeys = tree
      .reduce((prev: StoreKeyReference[], curr) => {
        prev = prev.concat(curr.stores || []);
        return prev;
      }, [])
      ?.map((store) => `"${store.key}"`)
      .join(' ,');
    const allStores = storeKeys ? await storeApi.query(`key in (${storeKeys})`) : [];
    return tree.map((bu) =>
      BusinessUnitMappers.mapBusinessUnitToBusinessUnitTreeItem(
        bu,
        allStores,
        accountId,
        EXTENSION_B2B_DEFAULT_ADMIN_ROLE,
      ),
    );
  };
}
