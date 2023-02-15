import { BaseApi } from 'cofe-ct-ecommerce/apis/BaseApi';
import { Store, StoreDraft } from '@commercetools/platform-sdk';
import { mapCommercetoolsStoreToStore } from '../mappers/StoreMappers';

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
    const config = this.frontasticContext?.project?.configuration?.preBuy;

    try {
      return this.getApiForProject()
        .stores()
        .withKey({ key })
        .get()
        .execute()
        .then((response) => {
          return mapCommercetoolsStoreToStore(response.body, locale.language, config);
        });
    } catch (e) {
      console.log(e);

      throw '';
    }
  };

  query: (where?: string) => Promise<Store[]> = async (where?: string): Promise<Store[]> => {
    const locale = await this.getCommercetoolsLocal();
    const config = this.frontasticContext?.project?.configuration?.preBuy;

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
          return response.body.results.map((store) => mapCommercetoolsStoreToStore(store, locale.language, config));
        });
    } catch (e) {
      console.log(e);
      return [];
    }
  };
}
