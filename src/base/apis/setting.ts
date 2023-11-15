import {
  accessManager,
  ApiSource,
  ExactProps,
  IsPositive,
  MinLength,
} from '@roxavn/core/base';
import { SettingResponse, permissions } from '@roxavn/module-utils/base';

import { baseModule } from '../module.js';

const settingSource = new ApiSource<SettingResponse>(
  [accessManager.scopes.Setting],
  baseModule
);

export class UpdateWeb3DepositSettingRequest extends ExactProps<UpdateWeb3DepositSettingRequest> {
  @MinLength(1)
  contractAddress: `0x${string}`;

  @MinLength(1)
  networkId: string;

  @MinLength(1)
  recipientAddress: `0x${string}`;

  @MinLength(1)
  currencyId: string;

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
