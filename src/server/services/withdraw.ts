import {
  type InferApiRequest,
  constants as coreConstants,
  formulaUtils,
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
} from '@roxavn/module-project/server';
import { GetSettingService } from '@roxavn/module-utils/server';
import {
  GetOrCreateUserService,
  GetUserIdentitiesApiService,
} from '@roxavn/module-user/server';
import { NotFoundProviderException } from '@roxavn/module-web3/base';
import {
  GetWeb3ProvidersApiService,
  serverModule as web3ServerModule,
} from '@roxavn/module-web3/server';
import {
  constants as web3AuthConstants,
  NotLinkedAddressException,
} from '@roxavn/plugin-web3-auth/base';
import { CreatePaymentTransactionService } from '@roxavn/plugin-payment/server';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { erc20ABI } from 'wagmi';

import { serverModule } from '../module.js';
import {
  NotFoundWeb3WithdrawSettingException,
  UpdateWeb3WithdrawSettingRequest,
  constants,
  transactionApi,
} from '../../base/index.js';

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
    protected getProjectRootTaskApiService: GetProjectRootTaskApiService
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
        });
      }
      this.task = await this.getProjectRootTaskApiService.handle({
        projectId: project.id,
      });
    }
    return this.task;
  }
}

@serverModule.useApi(transactionApi.withdraw)
export class WithdrawTransactionApiService extends BaseService {
  constructor(
    @inject(GetSettingService)
    protected getSettingService: GetSettingService,
    @inject(GetRootTaskForWithdrawService)
    protected getRootTaskForWithdrawService: GetRootTaskForWithdrawService,
    @inject(CreateSubtaskService)
    protected createSubtaskService: CreateSubtaskService
  ) {
    super();
  }

  async handle(
    request: InferApiRequest<typeof transactionApi.withdraw>,
    @AuthUser authUser: InferContext<typeof AuthUser>
  ) {
    const setting = (await this.getSettingService.handle({
      module: web3ServerModule.name,
      name: constants.WEB3_WITHDRAW_SETTING,
    })) as UpdateWeb3WithdrawSettingRequest;
    const settingItem = setting.items.find(
      (item) => item.currencyId === request.currencyId
    );
    if (!settingItem) {
      throw new NotFoundWeb3WithdrawSettingException(request.currencyId);
    }

    const rootTask = await this.getRootTaskForWithdrawService.handle();
    return this.createSubtaskService.handle({
      taskId: rootTask.id,
      expiryDate: rootTask.expiryDate,
      userId: authUser.id,
      title: `Withdraw ${request.amount}`,
      metadata: {
        ...settingItem,
        amount: request.amount,
      },
    });
  }
}

@serverModule.useApi(transactionApi.acceptWithdraw)
export class AcceptWithdrawTransactionApiService extends BaseService {
  constructor(
    @inject(GetTaskApiService)
    protected getTaskApiService: GetTaskApiService,
    @inject(CreatePaymentTransactionService)
    protected createPaymentTransactionService: CreatePaymentTransactionService,
    @inject(GetUserIdentitiesApiService)
    protected getUserIdentitiesApiService: GetUserIdentitiesApiService,
    @inject(GetWeb3ProvidersApiService)
    protected getWeb3ProvidersApiService: GetWeb3ProvidersApiService
  ) {
    super();
  }

  async handle(request: InferApiRequest<typeof transactionApi.acceptWithdraw>) {
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

    const providers = await this.getWeb3ProvidersApiService.handle({
      networkId: task.metadata?.networkId,
    });
    if (providers.items.length < 1) {
      throw new NotFoundProviderException(task.metadata?.networkId);
    }

    const identities = await this.getUserIdentitiesApiService.handle({
      userId: task.userId,
      type: web3AuthConstants.identityTypes.WEB3_ADDRESS,
    });
    if (identities.items.length < 1) {
      throw new NotLinkedAddressException();
    }

    const account = privateKeyToAccount(task.metadata?.senderPrivateKey);
    const client = createWalletClient({
      account,
      chain: '' as any,
      transport: http(providers.items[0].url),
    }).extend(publicActions);
    const decimal = await client.readContract({
      address: task.metadata?.contractAddress,
      abi: erc20ABI,
      functionName: 'decimals',
    });
    let amount: any = formulaUtils.getResult(
      [task.metadata?.amount],
      task.metadata?.formula
    );
    amount = BigInt(Number(amount)) * BigInt(10) ** BigInt(decimal);

    const hash = await client.writeContract({
      address: task.metadata?.contractAddress,
      abi: erc20ABI,
      functionName: 'transfer',
      args: [identities.items[0].subject as any, amount],
      chain: undefined,
    });

    await client.waitForTransactionReceipt({ hash });
    return {};
  }
}