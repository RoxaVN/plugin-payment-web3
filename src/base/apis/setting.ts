import {
  accessManager,
  ApiSource,
  ArrayMinSize,
  ExactProps,
  IsArray,
  IsEthereumAddress,
  IsFormula,
  MinLength,
  NotFoundException,
  TransformType,
  ValidateNested,
} from '@roxavn/core/base';
import { SettingResponse, permissions } from '@roxavn/module-utils/base';
import { IsEthereumPrivateKey } from '@roxavn/module-web3/base';

import { baseModule } from '../module.js';

const settingSource = new ApiSource<SettingResponse>(
  [accessManager.scopes.Setting],
  baseModule
);

class Web3DepositSettingItem {
  @IsEthereumAddress()
  contractAddress: `0x${string}`;

  @MinLength(1)
  networkId: string;

  @IsEthereumAddress()
  recipientAddress: `0x${string}`;

  @MinLength(1)
  currencyId: string;

  @IsFormula([100], 'number')
  formula: string;
}

class Web3WithdrawSettingItem {
  @IsEthereumAddress()
  contractAddress: `0x${string}`;

  @MinLength(1)
  networkId: string;

  @IsEthereumPrivateKey()
  senderPrivateKey: `0x${string}`;

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

export class UpdateWeb3WithdrawSettingRequest extends ExactProps<UpdateWeb3WithdrawSettingRequest> {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @TransformType(() => Web3WithdrawSettingItem)
  items: Web3WithdrawSettingItem[];
}

export class GetWeb3WithdrawSettingRequest extends ExactProps<GetWeb3WithdrawSettingRequest> {
  @MinLength(1)
  currencyId: string;
}

export const settingApi = {
  updateWeb3DepositSetting: settingSource.custom({
    method: 'POST',
    path: settingSource.apiPath() + '/web3-deposit',
    validator: UpdateWeb3DepositSettingRequest,
    permission: permissions.UpdateSetting,
  }),
  updateWeb3WithdrawSetting: settingSource.custom({
    method: 'POST',
    path: settingSource.apiPath() + '/web3-withdraw',
    validator: UpdateWeb3WithdrawSettingRequest,
    permission: permissions.UpdateSetting,
  }),
  getWeb3WithdrawSetting: settingSource.custom<
    GetWeb3WithdrawSettingRequest,
    Omit<Web3WithdrawSettingItem, 'senderPrivateKey'>,
    NotFoundException
  >({
    method: 'GET',
    path: settingSource.apiPath() + '/web3-withdraw',
    validator: GetWeb3WithdrawSettingRequest,
  }),
};
