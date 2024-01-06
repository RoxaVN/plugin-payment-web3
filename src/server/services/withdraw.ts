import {
  type InferApiRequest,
  constants as coreConstants,
  formulaUtils,
  BadRequestException,
} from '@roxavn/core';
import {
  AuthUser,
  BaseService,
  inject,
  type InferContext,
} from '@roxavn/core/server';
import {
  CreateProjectService,
  CreateSubtaskService,
  GetTaskApiService,
  GetProjectsApiService,
  GetProjectRootTaskApiService,
  GetSubtasksApiService,
  AssignTaskService,
  RejectTaskApiService,
} from '@roxavn/module-project/server';
import {
  GetOrCreateUserService,
  GetUserIdentitiesApiService,
} from '@roxavn/module-user/server';
import { NotFoundProviderException } from '@roxavn/module-web3/base';
import { GetWeb3ProvidersApiService } from '@roxavn/module-web3/server';
import {
  constants as web3AuthConstants,
  NotLinkedAddressException,
} from '@roxavn/plugin-web3-auth/base';
import { CreatePaymentTransactionService } from '@roxavn/plugin-payment/server';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { erc20ABI } from 'wagmi';

import { serverModule } from '../module.js';
import { constants, transactionApi } from '../../base/index.js';
import { GetWeb3WithdrawSettingApiService } from './setting.js';

@serverModule.injectable()
export class GetRootTaskForWithdrawService extends BaseService {
  task?: { id: string; expiryDate: Date };

  constructor(
    @inject(GetOrCreateUserService)
    protected getOrCreateUserService: GetOrCreateUserService,
    @inject(GetProjectsApiService)
    protected getProjectsApiService: GetProjectsApiService,
    @inject(CreateProjectService)
    protected createProjectService: CreateProjectService,
    @inject(GetProjectRootTaskApiService)
    protected getProjectRootTaskApiService: GetProjectRootTaskApiService,
    @inject(AssignTaskService)
    protected assignTaskService: AssignTaskService
  ) {
    super();
  }

  async handle() {
    if (!this.task) {
      const user = await this.getOrCreateUserService.handle({
        username: coreConstants.User.SYSTEM,
      });
      const { items } = await this.getProjectsApiService.handle({
        type: constants.Transaction.WEB3_WITHDRAW,
      });
      let project: { id: string } = items[0];
      if (!project) {
        project = await this.createProjectService.handle({
          name: 'web3 withdraw',
          duration: 365 * 100, // expire after 100 years
          isPublic: false,
          userId: user.id,
          type: constants.Transaction.WEB3_WITHDRAW,
        });
      }
      const task = await this.getProjectRootTaskApiService.handle({
        projectId: project.id,
      });
      if (!task.assignee) {
        await this.assignTaskService.handle({
          taskId: task.id,
          userId: user.id,
        });
      }
      this.task = task;
    }
    return this.task;
  }
}

@serverModule.useApi(transactionApi.createWithdrawOrder)
export class CreateWithdrawOrderApiService extends BaseService {
  constructor(
    @inject(GetWeb3WithdrawSettingApiService)
    protected getWeb3WithdrawSettingApiService: GetWeb3WithdrawSettingApiService,
    @inject(GetRootTaskForWithdrawService)
    protected getRootTaskForWithdrawService: GetRootTaskForWithdrawService,
    @inject(CreatePaymentTransactionService)
    protected createPaymentTransactionService: CreatePaymentTransactionService,
    @inject(CreateSubtaskService)
    protected createSubtaskService: CreateSubtaskService
  ) {
    super();
  }

  async handle(
    request: InferApiRequest<typeof transactionApi.createWithdrawOrder>,
    @AuthUser authUser: InferContext<typeof AuthUser>
  ) {
    // make sure currency is allowed to be withdrawn
    await this.getWeb3WithdrawSettingApiService.get({
      currencyId: request.currencyId,
    });

    await this.createPaymentTransactionService.handle({
      account: {
        userId: authUser.id,
        amount: -request.amount,
      },
      currencyId: request.currencyId,
      type: constants.Transaction.WEB3_WITHDRAW,
    });

    const rootTask = await this.getRootTaskForWithdrawService.handle();
    return this.createSubtaskService.handle({
      taskId: rootTask.id,
      expiryDate: rootTask.expiryDate,
      userId: authUser.id,
      title: `Withdraw ${request.amount}`,
      metadata: {
        currencyId: request.currencyId,
        amount: request.amount,
      },
    });
  }
}

@serverModule.useApi(transactionApi.rejectWithdrawOrder)
export class RejectWithdrawOrderApiService extends BaseService {
  constructor(
    @inject(GetTaskApiService)
    protected getTaskApiService: GetTaskApiService,
    @inject(RejectTaskApiService)
    protected rejectTaskApiService: RejectTaskApiService,
    @inject(AssignTaskService)
    protected assignTaskService: AssignTaskService,
    @inject(CreatePaymentTransactionService)
    protected createPaymentTransactionService: CreatePaymentTransactionService
  ) {
    super();
  }

  async handle(
    request: InferApiRequest<typeof transactionApi.rejectWithdrawOrder>,
    @AuthUser authUser: InferContext<typeof AuthUser>
  ) {
    await this.rejectTaskApiService.handle({
      taskId: request.taskId,
    });
    await this.assignTaskService.handle({
      taskId: request.taskId,
      userId: authUser.id,
    });
    const task = await this.getTaskApiService.handle({
      taskId: request.taskId,
    });
    await this.createPaymentTransactionService.handle({
      account: {
        userId: task.userId,
        amount: task.metadata?.amount,
      },
      currencyId: task.metadata?.currencyId,
      type: constants.Transaction.WEB3_WITHDRAW,
    });
    return {};
  }
}

@serverModule.useApi(transactionApi.acceptWithdrawOrder)
export class AcceptWithdrawOrderApiService extends BaseService {
  constructor(
    @inject(GetTaskApiService)
    protected getTaskApiService: GetTaskApiService,
    @inject(GetUserIdentitiesApiService)
    protected getUserIdentitiesApiService: GetUserIdentitiesApiService,
    @inject(GetWeb3WithdrawSettingApiService)
    protected getWeb3WithdrawSettingApiService: GetWeb3WithdrawSettingApiService,
    @inject(GetWeb3ProvidersApiService)
    protected getWeb3ProvidersApiService: GetWeb3ProvidersApiService,
    @inject(AssignTaskService)
    protected assignTaskService: AssignTaskService
  ) {
    super();
  }

  async handle(
    request: InferApiRequest<typeof transactionApi.acceptWithdrawOrder>,
    @AuthUser authUser: InferContext<typeof AuthUser>
  ) {
    const task = await this.getTaskApiService.handle({
      taskId: request.taskId,
    });
    const setting = await this.getWeb3WithdrawSettingApiService.get({
      currencyId: task.metadata?.currencyId,
    });
    await this.assignTaskService.handle({
      taskId: task.id,
      userId: authUser.id,
    });

    const providers = await this.getWeb3ProvidersApiService.handle({
      networkId: setting.networkId,
    });
    if (providers.items.length < 1) {
      throw new NotFoundProviderException(setting.networkId);
    }

    const identities = await this.getUserIdentitiesApiService.handle({
      userId: task.userId,
      type: web3AuthConstants.identityTypes.WEB3_ADDRESS,
    });
    if (identities.items.length < 1) {
      throw new NotLinkedAddressException();
    }
    const amount = formulaUtils.getResult(
      [task.metadata?.amount],
      setting.formula
    );
    if (typeof amount !== 'number' || amount <= 0) {
      throw new BadRequestException();
    }

    const account = privateKeyToAccount(setting.senderPrivateKey);
    const client = createWalletClient({
      account,
      chain: '' as any,
      transport: http(providers.items[0].url),
    }).extend(publicActions);
    const decimal = await client.readContract({
      address: setting.contractAddress,
      abi: erc20ABI,
      functionName: 'decimals',
    });

    const tokenAmount =
      BigInt(parseInt(amount as any)) * BigInt(10) ** BigInt(decimal);

    const hash = await client.writeContract({
      address: setting.contractAddress,
      abi: erc20ABI,
      functionName: 'transfer',
      args: [identities.items[0].subject as any, tokenAmount],
      chain: undefined,
    });

    await client.waitForTransactionReceipt({ hash });
    return {};
  }
}

@serverModule.useApi(transactionApi.getWithdrawOrders)
export class GetWithdrawOrdersApiService extends BaseService {
  constructor(
    @inject(GetRootTaskForWithdrawService)
    protected getRootTaskForWithdrawService: GetRootTaskForWithdrawService,
    @inject(GetSubtasksApiService)
    protected getSubtasksApiService: GetSubtasksApiService
  ) {
    super();
  }

  async handle(
    request: InferApiRequest<typeof transactionApi.getWithdrawOrders>
  ) {
    const task = await this.getRootTaskForWithdrawService.handle();
    return this.getSubtasksApiService.handle({
      taskId: task.id,
      ...request,
      metadataFilters: request.currencyId
        ? [{ name: 'currencyId', value: request.currencyId }]
        : undefined,
      orderBy: [{ attribute: 'id', direction: 'DESC' }],
    });
  }
}
