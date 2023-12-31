import {
  accessManager,
  ApiSource,
  ArrayMinSize,
  ExactProps,
  IsArray,
  IsFormula,
  MinLength,
  TransformType,
  ValidateNested,
} from '@roxavn/core/base';
import { SettingResponse, permissions } from '@roxavn/module-utils/base';

import { baseModule } from '../module.js';

const settingSource = new ApiSource<SettingResponse>(
  [accessManager.scopes.Setting],
  baseModule
);

class Web3DepositSettingItem {
  @MinLength(1)
  contractAddress: `0x${string}`;

  @MinLength(1)
  networkId: string;

  @MinLength(1)
  recipientAddress: `0x${string}`;

  @MinLength(1)
  currencyId: string;

  @IsFormula([100], 'number')
  formula: string;
}

export class UpdateWeb3DepositSettingRequest extends ExactProps<UpdateWeb3DepositSettingRequest> {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @TransformType(() => Web3DepositSettingItem)
  items: Web3DepositSettingItem[];
}

export const settingApi = {
  updateWeb3DepositSetting: settingSource.custom({
    method: 'POST',
    path: settingSource.apiPath() + '/web3-deposit',
    validator: UpdateWeb3DepositSettingRequest,
    permission: permissions.UpdateSetting,
  }),
};
