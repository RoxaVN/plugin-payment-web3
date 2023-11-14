import {
  accessManager,
  ApiSource,
  ExactProps,
  IsPositive,
  Min,
  MinLength,
} from '@roxavn/core/base';
import { SettingResponse, permissions } from '@roxavn/module-utils/base';

import { baseModule } from '../module.js';

const settingSource = new ApiSource<SettingResponse>(
  [accessManager.scopes.Setting],
  baseModule
);

class UpdateWeb3DepositSettingRequest extends ExactProps<UpdateWeb3DepositSettingRequest> {
  @MinLength(1)
  contractId: string;

  @MinLength(1)
  recipientAddress: `0x${string}`;

  @Min(1)
  currencyId: number;

  @IsPositive()
  exchangeRate: number;
}

export const settingApi = {
  updateWeb3DepositSetting: settingSource.custom({
    method: 'POST',
    path: settingSource.apiPath() + '/web3-deposit',
    validator: UpdateWeb3DepositSettingRequest,
    permission: permissions.UpdateSetting,
  }),
};
