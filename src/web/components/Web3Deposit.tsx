import { Button, NumberInput, TextInput } from '@mantine/core';
import { Api, ValidationException } from '@roxavn/core';
import {
  ApiForm,
  useApi,
  webModule as coreWebModule,
  ApiFormGroup,
} from '@roxavn/core/web';
import { settingApi } from '@roxavn/module-utils/base';
import { webModule as currencyWebModule } from '@roxavn/module-currency/web';
import { webModule as web3WebModule } from '@roxavn/module-web3/web';
import { webModule as paymentWebModule } from '@roxavn/plugin-payment/web';
import { IconCoin } from '@tabler/icons-react';
import {
  writeContract,
  readContract,
  switchNetwork,
  getNetwork,
  waitForTransaction,
} from '@wagmi/core';
import { erc20ABI } from 'wagmi';

import {
  UpdateWeb3DepositSettingRequest,
  constants,
  transactionApi,
} from '../../base/index.js';
import { webModule } from '../module.js';

export const Web3Deposit = () => {
  const settingResp = useApi(settingApi.getPublic, {
    module: currencyWebModule.name,
    name: constants.WEB3_DEPOSIT_SETTING,
  });
  const settingData =
    settingResp.data as UpdateWeb3DepositSettingRequest | null;
  const tPayment = paymentWebModule.useTranslation().t;

  if (settingData) {
    return (
      <ApiForm
        api={
          transactionApi.deposit as Api<{
            transactionHash: string;
            amount: number;
          }>
        }
        onBeforeSubmit={async (values) => {
          if (values.amount && values.amount > 0) {
            const network = await getNetwork();
            if (network.chain?.id !== parseInt(settingData.networkId)) {
              await switchNetwork({ chainId: parseInt(settingData.networkId) });
            }
            const decimals = await readContract({
              address: settingData.contractAddress,
              abi: erc20ABI,
              functionName: 'decimals',
            });
            const { hash } = await writeContract({
              address: settingData.contractAddress,
              abi: erc20ABI,
              functionName: 'transfer',
              args: [
                settingData.recipientAddress,
                BigInt(values.amount) * BigInt(10) ** BigInt(decimals as any),
              ] as [`0x${string}`, bigint],
            });
            await waitForTransaction({ hash });
            return { transactionHash: hash };
          }
          throw new ValidationException({
            amount: {
              key: 'Validation.IsPositive',
              ns: coreWebModule.escapedName,
            },
          });
        }}
        formRender={(form) => (
          <>
            <NumberInput
              label={tPayment('depositAmount')}
              {...form.getInputProps('amount')}
            />
            <NumberInput
              mt="md"
              readOnly
              label={tPayment('receivedAmount')}
              value={
                form.values.amount
                  ? form.values.amount * settingData.exchangeRate
                  : 0
              }
            />
            <Button
              mt="md"
              leftIcon={<IconCoin size="1rem" />}
              type="submit"
              fullWidth
            >
              {tPayment('deposit')}
            </Button>
          </>
        )}
      ></ApiForm>
    );
  }
};

export const Web3Redeposit = () => {
  const { t } = webModule.useTranslation();
  const tWeb3 = web3WebModule.useTranslation().t;

  return (
    <ApiFormGroup
      api={transactionApi.deposit}
      fields={[
        {
          name: 'transactionHash',
          input: (
            <TextInput
              label={t('redepositHint')}
              placeholder={tWeb3('transactionHash')}
            ></TextInput>
          ),
        },
      ]}
    ></ApiFormGroup>
  );
};
