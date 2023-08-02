import { BaseApi } from 'cofe-ct-ecommerce/apis/BaseApi';
import axios from 'axios';
import { getConfig } from 'cofe-ct-ecommerce/utils/GetConfig';
import { Buffer } from 'buffer';
import { Context } from '@frontastic/extension-types';
import { Organization } from '../types/organization/organization';
import { Account } from '../types/account/Account';
import { ApprovalFlow, DomainApprovalFlow } from '../types/approval/Flow';
import { ApprovalFlowMapper } from '../mappers/ApprovalFlowMapper';
export class ApprovalFlowApi extends BaseApi {
  protected organization?: Organization;
  protected account?: Account;
  protected associateEndpoints?;

  constructor(
    frontasticContext: Context,
    locale: string,
    currency: string,
    organization?: Organization,
    account?: Account,
  ) {
    super(frontasticContext, locale, currency);
    this.account = account;
    this.organization = organization;

    this.associateEndpoints =
      account && organization
        ? `/as-associate/${account.accountId}/in-business-unit/key=${organization.businessUnit.key}`
        : '/';
  }

  protected throwError: (e: any) => never = (e: any) => {
    throw (
      e.response?.data?.message + e.response?.data?.errors?.map((error: any) => error.detailedErrorMessage)?.join(', ')
    );
  };

  getAccessToken: () => Promise<string> = async (): Promise<string> => {
    const clientSettings = getConfig(this.frontasticContext.projectConfiguration);

    const response = await axios
      .post(
        `${clientSettings.authUrl}/oauth/token?grant_type=client_credentials&scope=manage_project:${clientSettings.projectKey}`,
        null,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(clientSettings.clientId + ':' + clientSettings.clientSecret).toString(
              'base64',
            )}`,
          },
        },
      )
      .catch(this.throwError);
    return response.data.access_token;
  };

  query: () => Promise<ApprovalFlow[]> = async (): Promise<ApprovalFlow[]> => {
    const accessToken = await this.getAccessToken();
    const clientSettings = getConfig(this.frontasticContext.projectConfiguration);

    const response = await axios
      .get(
        `${clientSettings.hostUrl}/${clientSettings.projectKey}${this.associateEndpoints}/approval-flows?sort=createdAt desc`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      .catch(this.throwError);
    return response.data?.results;
  };

  get: (id: string) => Promise<DomainApprovalFlow> = async (id: string): Promise<DomainApprovalFlow> => {
    const accessToken = await this.getAccessToken();
    const clientSettings = getConfig(this.frontasticContext.projectConfiguration);

    const locale = await this.getCommercetoolsLocal();

    const response = await axios
      .get(
        `${clientSettings.hostUrl}/${clientSettings.projectKey}${this.associateEndpoints}/approval-flows/${id}?expand=order`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      .catch(this.throwError);
    return ApprovalFlowMapper.mapCommercetoolsFlowToDomainFlow(response.data, locale);
  };

  getFlowByOrderId: (orderId: string) => Promise<ApprovalFlow> = async (orderId: string): Promise<ApprovalFlow> => {
    const accessToken = await this.getAccessToken();
    const clientSettings = getConfig(this.frontasticContext.projectConfiguration);

    const query = encodeURIComponent(`order(id="${orderId}")`);

    const response = await axios
      .get(
        `${clientSettings.hostUrl}/${clientSettings.projectKey}${this.associateEndpoints}/approval-flows?where=${query}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      .catch(this.throwError);
    if (response.data.total !== 1) {
      throw 'Order not found';
    }
    return response.data.results[0];
  };

  update: (id: string, updateActions: any[]) => Promise<ApprovalFlow> = async (
    id: string,
    updateActions: any[],
  ): Promise<ApprovalFlow> => {
    const accessToken = await this.getAccessToken();
    const clientSettings = getConfig(this.frontasticContext.projectConfiguration);

    const response = await this.get(id).then(async (approvalFlow) => {
      const res = await axios
        .post(
          `${clientSettings.hostUrl}/${clientSettings.projectKey}${this.associateEndpoints}/approval-flows/${id}`,
          {
            version: approvalFlow.version,
            actions: updateActions,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        .catch(this.throwError);
      return res.data;
    });
    return response.data;
  };
}
