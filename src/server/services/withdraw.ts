import { type InferApiRequest, constants as coreConstants } from '@roxavn/core';
import {
  AuthUser,
  BaseService,
  inject,
  type InferContext,
} from '@roxavn/core/server';
import {
  CreateProjectService,
  CreateSubtaskService,
  GetProjectsApiService,
  GetProjectRootTaskApiService,
} from '@roxavn/module-project/server';
import { GetSettingService } from '@roxavn/module-utils/server';
import { GetOrCreateUserService } from '@roxavn/module-user/server';
import { serverModule as web3ServerModule } from '@roxavn/module-web3/server';
import { CreatePaymentTransactionService } from '@roxavn/plugin-payment/server';

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
          duration: 365 * 100,
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
    @inject(CreatePaymentTransactionService)
    protected createPaymentTransactionService: CreatePaymentTransactionService,
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
    await this.createSubtaskService.handle({
      taskId: rootTask.id,
      expiryDate: rootTask.expiryDate,
      userId: authUser.id,
      title: `Withdraw ${request.amount}`,
      metadata: {
        ...settingItem,
        amount: request.amount,
      },
    });

    return this.createPaymentTransactionService.handle({
      account: {
        userId: authUser.id,
        amount: request.amount,
      },
      currencyId: request.currencyId,
      type: constants.Transaction.WEB3_WITHDRAW,
    });
  }
}
