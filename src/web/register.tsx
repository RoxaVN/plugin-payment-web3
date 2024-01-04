import { TextInput } from '@mantine/core';
import {
  ApiFormGroup,
  ArrayInput,
  FormulaInput,
  ModuleT,
  webModule as coreWebModule,
} from '@roxavn/core/web';
import { webModule as currencyWebModule } from '@roxavn/module-currency/web';
import { webModule as web3WebModule } from '@roxavn/module-web3/web';
import { webModule as paymentWebModule } from '@roxavn/plugin-payment/web';

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
            name: 'items',
            input: (
              <ArrayInput
                layout="vertical"
                fields={[
                  <TextInput
                    label={
                      <ModuleT module={web3WebModule} k="contractAddress" />
                    }
                    name="contractAddress"
                  />,
                  <TextInput
                    label={<ModuleT module={web3WebModule} k="networkId" />}
                    name="networkId"
                  />,
                  <TextInput
                    label={<ModuleT module={webModule} k="recipientAddress" />}
                    name="recipientAddress"
                  />,
                  <TextInput
                    label={
                      <ModuleT module={currencyWebModule} k="currencyId" />
                    }
                    name="currencyId"
                  />,
                  <FormulaInput
                    label={<ModuleT module={coreWebModule} k="formula" />}
                    columns={[
                      <ModuleT module={paymentWebModule} k="depositAmount" />,
                    ]}
                    name="formula"
                  />,
                ]}
              ></ArrayInput>
            ),
          },
        ]}
      />
    ),
  };

  currencyWebModule.adminSettings[constants.WEB3_WITHDRAW_SETTING] = {
    title: <ModuleT module={webModule} k="web3WithdrawSetting" />,
    form: (
      <ApiFormGroup
        api={settingApi.updateWeb3WithdrawSetting}
        fields={[
          {
            name: 'items',
            input: (
              <ArrayInput
                layout="vertical"
                fields={[
                  <TextInput
                    label={
                      <ModuleT module={web3WebModule} k="contractAddress" />
                    }
                    name="contractAddress"
                  />,
                  <TextInput
                    label={<ModuleT module={web3WebModule} k="networkId" />}
                    name="networkId"
                  />,
                  <TextInput
                    label={<ModuleT module={webModule} k="senderPrivateKey" />}
                    name="senderPrivateKey"
                  />,
                  <TextInput
                    label={
                      <ModuleT module={currencyWebModule} k="currencyId" />
                    }
                    name="currencyId"
                  />,
                  <FormulaInput
                    label={<ModuleT module={coreWebModule} k="formula" />}
                    columns={[
                      <ModuleT module={paymentWebModule} k="depositAmount" />,
                    ]}
                    name="formula"
                  />,
                ]}
              ></ArrayInput>
            ),
          },
        ]}
      />
    ),
  };
}
