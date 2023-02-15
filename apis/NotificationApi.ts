import { BaseApi } from 'cofe-ct-ecommerce/apis/BaseApi';
import axios from 'axios';

export class NotificationApi extends BaseApi {
  getToken: (username: string, password: string) => Promise<string> = async (username: string, password: string) => {
    try {
      const config = this.frontasticContext?.project?.configuration?.notifications;

      if (!config || !config.accessTokenService) {
        return '';
      }

      try {
        const response = await axios.get(config.accessTokenService, {
          params: { identity: username, password: password },
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return Promise.reject(error.response.data ?? 'Authentication error.');
        }
      }
    } catch (error) {
      throw error;
    }
  };
}
