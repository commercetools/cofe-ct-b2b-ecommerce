import { BaseApi } from 'cofe-ct-ecommerce/apis/BaseApi';
import { Account } from '@b2bdemo/types/types/account/Account';

export class CustomerApi extends BaseApi {
  get: (email: string) => Promise<Account | null> = async (email: string) => {
    const {
      body: { results },
    } = await this.getApiForProject()
      .customers()
      .get({
        queryArgs: {
          where: `email="${email}"`,
          limit: 1,
        },
      })
      .execute();
    return results.length ? results[0] : null;
  };
  getCustomerById: (id: string) => Promise<Account | null> = async (id: string) => {
    const { body } = await this.getApiForProject().customers().withId({ ID: id }).get().execute();
    return body;
  };
}
