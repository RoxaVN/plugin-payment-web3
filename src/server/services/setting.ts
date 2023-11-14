import { InferApiRequest } from '@roxavn/core/base';
import { BaseService, inject } from '@roxavn/core/server';
import { UpsertSettingService } from '@roxavn/module-utils/server';
import { serverModule as currencyServerModule } from '@roxavn/module-currency/server';

import { constants, settingApi } from '../../base/index.js';
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
      type: 'private',
    });
  }
}
