export * from 'cofe-ct-ecommerce/actionControllers/WishlistController';
import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { ApprovalRuleApi } from '../apis/ApprovalRuleApi';
import { ApprovalFlowApi } from '../apis/ApprovalFlowApi';
import { getLocale } from 'cofe-ct-ecommerce/utils/Request';
import { ApprovalRuleDraft, ApprovalRuleUpdateActionSetStatus } from '../types/approval/Rule';
type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export const getApprovalRules: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const approvalRuleApi = new ApprovalRuleApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );
  try {
    const res = await approvalRuleApi.query();
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const getApprovalRule: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const approvalFlowId = request.query?.['approvalRuleId'];
  const approvalRuleApi = new ApprovalRuleApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );
  try {
    const res = await approvalRuleApi.get(approvalFlowId);
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const createApprovalRule: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const approvalRuleApi = new ApprovalRuleApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );

  try {
    const body: ApprovalRuleDraft = JSON.parse(request.body);
    const res = await approvalRuleApi.create(body);
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const activateApprovalRule: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const approvalRuleId = request.query?.['approvalRuleId'];

  const approvalRuleApi = new ApprovalRuleApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );

  try {
    const updateAction: ApprovalRuleUpdateActionSetStatus = {
      action: 'setStatus',
      status: 'Active',
    };
    const res = await approvalRuleApi.update(approvalRuleId, [updateAction]);
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const deactivateApprovalRule: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const approvalRuleId = request.query?.['approvalRuleId'];

  const approvalRuleApi = new ApprovalRuleApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );

  try {
    const updateAction: ApprovalRuleUpdateActionSetStatus = {
      action: 'setStatus',
      status: 'Inactive',
    };
    const res = await approvalRuleApi.update(approvalRuleId, [updateAction]);
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const updateApprovalRule: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const approvalRuleId = request.query?.['approvalRuleId'];

  const approvalRuleApi = new ApprovalRuleApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );

  try {
    const {
      requesterKeys,
      predicate,
      name,
      description,
    }: { requesterKeys?: string[]; predicate?: string; name?: string; description?: string } = JSON.parse(request.body);

    const updateActions = [];

    const approvalRule = await approvalRuleApi.get(approvalRuleId);

    if (name && name !== approvalRule.name) {
      updateActions.push({
        action: 'setName',
        name,
      });
    }

    if (description && description !== approvalRule.description) {
      updateActions.push({
        action: 'setDescription',
        description,
      });
    }

    if (requesterKeys) {
      updateActions.push({
        action: 'setRequesters',
        requesters: requesterKeys.map((key) => ({
          associateRole: {
            typeId: 'associate-role',
            key,
          },
        })),
      });
    }

    if (predicate && predicate !== approvalRule.predicate) {
      updateActions.push({
        action: 'setPredicate',
        predicate,
      });
    }

    const res = await approvalRuleApi.update(approvalRuleId, updateActions);
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const getApprovalFlows: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const approvalFlowApi = new ApprovalFlowApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );
  try {
    const res = await approvalFlowApi.query();
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const getApprovalFlow: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const approvalFlowId = request.query?.['approvalFlowId'];
  const approvalFlowApi = new ApprovalFlowApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );
  try {
    const res = await approvalFlowApi.get(approvalFlowId);
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const getApprovalFlowByOrderId: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const orderId = request.query?.['orderId'];
  const approvalFlowApi = new ApprovalFlowApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );
  try {
    const res = await approvalFlowApi.getFlowByOrderId(orderId);
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const approveFlow: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const approvalFlowId = request.query?.['approvalFlowId'];

  const approvalRuleApi = new ApprovalFlowApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );

  try {
    const updateAction = {
      action: 'approve',
    };
    const res = await approvalRuleApi.update(approvalFlowId, [updateAction]);
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};

export const rejectFlow: ActionHook = async (request: Request, actionContext) => {
  const businessUnitKey = request.query?.['key'];
  const approvalFlowId = request.query?.['approvalFlowId'];

  const approvalRuleApi = new ApprovalFlowApi(
    actionContext.frontasticContext,
    getLocale(request),
    { ...request.sessionData?.organization, businessUnit: { key: businessUnitKey } },
    request.sessionData?.account,
  );

  try {
    const { reason }: { reason: string } = JSON.parse(request.body);
    const updateAction = {
      action: 'reject',
      reason,
    };
    const res = await approvalRuleApi.update(approvalFlowId, [updateAction]);
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      sessionData: request.sessionData,
    };
  } catch (error) {
    const response: Response = {
      statusCode: 401,
      // @ts-ignore
      body: JSON.stringify(error.message || error.body?.message || error),
    };
    return response;
  }
};
