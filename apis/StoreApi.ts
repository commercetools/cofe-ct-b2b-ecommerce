import { BaseApi } from './BaseApi';
import { Store } from '@b2bdemo/types/types/store/store';
import { StoreDraft } from '@commercetools/platform-sdk';
import { StoreMappers } from '../mappers/StoreMappers';

const convertStoreToBody = (store: StoreDraft, locale: string): StoreDraft => {
  return {
    ...store,
    // @ts-ignore
    name: {
      [locale]: store.name,
    },
  };
};

export class StoreApi extends BaseApi {
  create: (store: StoreDraft) => Promise<any> = async (store: StoreDraft) => {
    const locale = await this.getCommercetoolsLocal();
    const body = convertStoreToBody(store, locale.language);

    try {
      return this.getApiForProject()
        .stores()
        .post({
          body,
        })
        .execute()
        .then((response) => {
          return response.body;
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      throw error;
    }
  };

  get: (key: string) => Promise<any> = async (key: string): Promise<Store> => {
    const locale = await this.getCommercetoolsLocal();

    try {
      return this.getApiForProject()
        .stores()
        .withKey({ key })
        .get()
        .execute()
        .then((response) => {
          return mapCommercetoolsStoreToStore(response.body, locale.language);
        });
    } catch (e) {
      console.log(e);

      throw '';
    }
  };

  query: (where?: string) => Promise<any> = async (where: string): Promise<Store[]> => {
    const locale = await this.getCommercetoolsLocal();

    const queryArgs = where
      ? {
          where,
        }
      : {};

    try {
      return this.getApiForProject()
        .stores()
        .get({
          queryArgs,
        })
        .execute()
        .then((response) => {
          return response.body.results.map((store) => StoreMappers.mapCommercetoolsStoreToStore(store, locale.language));
        });
    } catch (e) {
      console.log(e);

      throw '';
    }
  };
}
