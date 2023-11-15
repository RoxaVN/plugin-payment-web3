import { NumberInput, TextInput } from '@mantine/core';
import { ApiFormGroup, ModuleT } from '@roxavn/core/web';
import { webModule as currencyWebModule } from '@roxavn/module-currency/web';
import { webModule as web3WebModule } from '@roxavn/module-web3/web';

import { constants, settingApi } from '../base/index.js';
import { webModule } from './module.js';

export default function () {
  currencyWebModule.adminSettings[constants.WEB3_DEPOSIT_SETTING] = {
    title: <ModuleT module={webModule} k="web3DepositSetting" />,
    form: (
      <ApiFormGroup
        api={settingApi.updateWeb3DepositSetting}
        fields={[
          {
            name: 'contractAddress',
            input: (
              <TextInput
                label={<ModuleT module={web3WebModule} k="contractAddress" />}
              />
            ),
          },
          {
            name: 'networkId',
            input: (
              <TextInput
                label={<ModuleT module={web3WebModule} k="networkId" />}
              />
            ),
          },
          {
            name: 'recipientAddress',
            input: (
              <TextInput
                label={<ModuleT module={webModule} k="recipientAddress" />}
              />
            ),
          },
          {
            name: 'currencyId',
            input: (
              <TextInput
                label={<ModuleT module={currencyWebModule} k="currencyId" />}
              />
            ),
          },
          {
            name: 'exchangeRate',
            input: (
              <NumberInput
                label={<ModuleT module={currencyWebModule} k="exchangeRate" />}
              />
            ),
          },
        ]}
      />
    ),
  };
}
