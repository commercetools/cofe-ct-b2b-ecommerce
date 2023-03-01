import { BaseApi } from 'cofe-ct-ecommerce/apis/BaseApi';
import { DashboardCustomObjectDraft, DashboardCustomObject } from '../types/dashboard/Dashboard';

export class DashboardApi extends BaseApi {
  create: (dashboard: DashboardCustomObjectDraft) => Promise<DashboardCustomObject> = async (
    dashboard: DashboardCustomObjectDraft,
  ) => {
    try {
      return this.getApiForProject()
        .customObjects()
        .post({
          body: dashboard,
        })
        .execute()
        .then((response) => {
          return response.body;
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };
  get: (key: string, container: string) => Promise<DashboardCustomObject> = async (key: string, container: string) => {
    try {
      return this.getApiForProject()
        .customObjects()
        .withContainerAndKey({ container, key })
        .get()
        .execute()
        .then((response) => {
          return response.body;
        })
        .catch((error) => {
          throw error;
        });
    } catch {
      throw '';
    }
  };
}
