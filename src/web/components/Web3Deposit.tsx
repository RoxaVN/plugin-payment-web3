import { Button, NumberInput, Divider, TextInput, Alert } from '@mantine/core';
import {
  Api,
  InferApiResponse,
  ValidationException,
  formulaUtils,
} from '@roxavn/core';
import {
  ApiForm,
  useApi,
  webModule as coreWebModule,
  ApiFormGroup,
  ApiError,
} from '@roxavn/core/web';
import { settingApi } from '@roxavn/module-utils/base';
import { webModule as currencyWebModule } from '@roxavn/module-currency/web';
import { webModule as web3WebModule } from '@roxavn/module-web3/web';
import { webModule as paymentWebModule } from '@roxavn/plugin-payment/web';
import { IconAlertCircle, IconCoin } from '@tabler/icons-react';
import { useMemo } from 'react';
import {
  writeContract,
  readContract,
  switchNetwork,
  getNetwork,
  waitForTransaction,
} from '@wagmi/core';
import { erc20ABI } from 'wagmi';

import {
  NotFoundWeb3DepositSettingException,
  UpdateWeb3DepositSettingRequest,
  constants,
  transactionApi,
} from '../../base/index.js';
import { webModule } from '../module.js';

export interface Web3TokenDepositProps {
  networkId: string;
  contractAddress: `0x${string}`;
  onSuccess?: (data: InferApiResponse<typeof transactionApi.deposit>) => void;
}

export const Web3TokenDeposit = (props: Web3TokenDepositProps) => {
  const settingResp = useApi(settingApi.getPublic, {
    module: currencyWebModule.name,
    name: constants.WEB3_DEPOSIT_SETTING,
  });
  const settingItem = useMemo(() => {
    return (
      settingResp.data &&
      (settingResp.data as UpdateWeb3DepositSettingRequest).items.find(
        (item) =>
          item.contractAddress === props.contractAddress &&
          item.networkId === props.networkId
      )
    );
  }, [settingResp]);
  const tPayment = paymentWebModule.useTranslation().t;

  if (settingItem) {
    return (
      <ApiForm
        api={
          transactionApi.deposit as Api<{
            transactionHash: string;
            contractAddress: string;
            networkId: string;
            amount: number;
          }>
        }
        onSuccess={props.onSuccess}
        onBeforeSubmit={async (values) => {
          if (values.amount && values.amount > 0) {
            const network = await getNetwork();
            if (network.chain?.id !== parseInt(props.networkId)) {
              await switchNetwork({ chainId: parseInt(props.networkId) });
            }
            const decimals = await readContract({
              address: props.contractAddress,
              abi: erc20ABI,
              functionName: 'decimals',
            });
            const { hash } = await writeContract({
              address: props.contractAddress,
              abi: erc20ABI,
              functionName: 'transfer',
              args: [
                settingItem.recipientAddress,
                BigInt(values.amount) * BigInt(10) ** BigInt(decimals as any),
              ] as [`0x${string}`, bigint],
            });
            await waitForTransaction({ hash });
            return {
              transactionHash: hash,
              contractAddress: props.contractAddress,
              networkId: props.networkId,
            };
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
                  ? parseInt(
                      formulaUtils.getResult(
                        [form.values.amount],
                        settingItem.formula
                      ) as any
                    )
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
  return (
    <Alert color="red" icon={<IconAlertCircle size="1rem" />}>
      <ApiError
        error={
          new NotFoundWeb3DepositSettingException(
            props.contractAddress,
            props.networkId
          )
        }
      />
    </Alert>
  );
};

export type Web3RedepositProps = Web3TokenDepositProps;

export const Web3Redeposit = (props: Web3RedepositProps) => {
  const { t } = webModule.useTranslation();
  const tWeb3 = web3WebModule.useTranslation().t;

  return (
    <ApiFormGroup
      api={transactionApi.deposit}
      apiParams={{
        contractAddress: props.contractAddress,
        networkId: props.networkId,
      }}
      onSuccess={props.onSuccess}
      fields={[
        {
          name: 'transactionHash',
          input: (
            <TextInput
              label={tWeb3('transactionHash')}
              description={t('redepositHint')}
            ></TextInput>
          ),
        },
      ]}
    ></ApiFormGroup>
  );
};

export type Web3DepositProps = Web3TokenDepositProps;

export const Web3Deposit = (props: Web3DepositProps) => {
  const tCore = coreWebModule.useTranslation().t;

  return (
    <>
      <Web3TokenDeposit {...props}></Web3TokenDeposit>
      <Divider size="xs" label={tCore('or')} labelPosition="center" my="md" />
      <Web3Redeposit {...props}></Web3Redeposit>
    </>
  );
};
