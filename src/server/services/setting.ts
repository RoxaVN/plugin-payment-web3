import { InferApiRequest } from '@roxavn/core/base';
import { BaseService, inject } from '@roxavn/core/server';
import {
  GetSettingService,
  UpsertSettingService,
} from '@roxavn/module-utils/server';
import { serverModule as currencyServerModule } from '@roxavn/module-currency/server';

import {
  NotFoundWeb3WithdrawSettingException,
  UpdateWeb3WithdrawSettingRequest,
  constants,
  settingApi,
} from '../../base/index.js';
import { serverModule } from '../module.js';

@serverModule.useApi(settingApi.updateWeb3DepositSetting)
export class UpdateWeb3DepositSettingApiService extends BaseService {
  constructor(
    @inject(UpsertSettingService)
    private updateSettingService: UpsertSettingService
  ) {
    super();
  }

  async handle(
    request: InferApiRequest<typeof settingApi.updateWeb3DepositSetting>
  ) {
    return this.updateSettingService.handle({
      module: currencyServerModule.name,
      name: constants.WEB3_DEPOSIT_SETTING,
      metadata: request,
      type: 'public',
    });
  }
}

@serverModule.useApi(settingApi.updateWeb3WithdrawSetting)
export class UpdateWeb3WithdrawSettingApiService extends BaseService {
  constructor(
    @inject(UpsertSettingService)
    private updateSettingService: UpsertSettingService
  ) {
    super();
  }

  async handle(
    request: InferApiRequest<typeof settingApi.updateWeb3WithdrawSetting>
  ) {
    return this.updateSettingService.handle({
      module: currencyServerModule.name,
      name: constants.WEB3_WITHDRAW_SETTING,
      metadata: request,
      type: 'private',
    });
  }
}

@serverModule.useApi(settingApi.getWeb3WithdrawSetting)
export class GetWeb3WithdrawSettingApiService extends BaseService {
  constructor(
    @inject(GetSettingService)
    private getSettingService: GetSettingService
  ) {
    super();
  }

  async get(
    request: InferApiRequest<typeof settingApi.getWeb3WithdrawSetting>
  ) {
    const setting = (await this.getSettingService.handle({
      module: currencyServerModule.name,
      name: constants.WEB3_WITHDRAW_SETTING,
    })) as UpdateWeb3WithdrawSettingRequest;
    const settingItem = setting.items.find(
      (item) => item.currencyId === request.currencyId
    );
    if (!settingItem) {
      throw new NotFoundWeb3WithdrawSettingException(request.currencyId);
    }
    return settingItem;
  }

  async handle(
    request: InferApiRequest<typeof settingApi.getWeb3WithdrawSetting>
  ) {
    const item = await this.get(request);
    delete (item as any).senderPrivateKey;
    return item;
  }
}
