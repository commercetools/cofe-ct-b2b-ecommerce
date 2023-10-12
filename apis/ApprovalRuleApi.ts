import { BaseApi } from 'cofe-ct-ecommerce/apis/BaseApi';
import axios from 'axios';
import { getConfig } from 'cofe-ct-ecommerce/utils/GetConfig';
import { Buffer } from 'buffer';
import { Context } from '@frontastic/extension-types';
import { Organization } from '../types/organization/organization';
import { Account } from '../types/account/Account';
import { ApprovalRule, ApprovalRuleDraft } from '../types/approval/Rule';
export class ApprovalRuleApi extends BaseApi {
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

  query: () => Promise<ApprovalRule[]> = async (): Promise<ApprovalRule[]> => {
    const accessToken = await this.getAccessToken();
    const clientSettings = getConfig(this.frontasticContext.projectConfiguration);

    const response = await axios
      .get(
        `${clientSettings.hostUrl}/${clientSettings.projectKey}${this.associateEndpoints}/approval-rules?sort=createdAt desc`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      .catch(this.throwError);
    return response.data?.results;
  };

  get: (id: string) => Promise<ApprovalRule> = async (id: string): Promise<ApprovalRule> => {
    const accessToken = await this.getAccessToken();
    const clientSettings = getConfig(this.frontasticContext.projectConfiguration);

    const response = await axios
      .get(`${clientSettings.hostUrl}/${clientSettings.projectKey}${this.associateEndpoints}/approval-rules/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .catch(this.throwError);
    return response.data;
  };

  create: (data: ApprovalRuleDraft) => Promise<ApprovalRule> = async (
    data: ApprovalRuleDraft,
  ): Promise<ApprovalRule> => {
    const accessToken = await this.getAccessToken();
    const clientSettings = getConfig(this.frontasticContext.projectConfiguration);

    const response = await axios
      .post(`${clientSettings.hostUrl}/${clientSettings.projectKey}${this.associateEndpoints}/approval-rules`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .catch(this.throwError);
    return response.data;
  };

  duplicate: (businessUnitKey: string, data: ApprovalRuleDraft) => Promise<ApprovalRule> = async (
    businessUnitKey: string,
    data: ApprovalRuleDraft,
  ): Promise<ApprovalRule> => {
    const accessToken = await this.getAccessToken();
    const clientSettings = getConfig(this.frontasticContext.projectConfiguration);

    const response = await axios
      .post(
        `${clientSettings.hostUrl}/${clientSettings.projectKey}/as-associate/${this.account.accountId}/in-business-unit/key=${businessUnitKey}/approval-rules`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      .catch(this.throwError);
    return response.data;
  };

  update: (id: string, updateActions: any[]) => Promise<ApprovalRule> = async (
    id: string,
    updateActions: any[],
  ): Promise<ApprovalRule> => {
    const accessToken = await this.getAccessToken();
    const clientSettings = getConfig(this.frontasticContext.projectConfiguration);

    const response = await this.get(id).then(async (approvalRule) => {
      const res = await axios
        .post(
          `${clientSettings.hostUrl}/${clientSettings.projectKey}${this.associateEndpoints}/approval-rules/${id}`,
          {
            version: approvalRule.version,
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
