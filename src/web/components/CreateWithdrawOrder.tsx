import { Alert, Button, Group, Loader, NumberInput } from '@mantine/core';
import { InferApiResponse, formulaUtils } from '@roxavn/core';
import {
  ApiError,
  ApiForm,
  useApi,
  webModule as coreWebModule,
} from '@roxavn/core/web';
import { webModule as paymentWebModule } from '@roxavn/plugin-payment/web';
import { IconAlertCircle, IconCoin } from '@tabler/icons-react';

import {
  NotFoundWeb3WithdrawSettingException,
  settingApi,
  transactionApi,
} from '../../base/index.js';

export function CreateWithdrawOrder(props: {
  currencyId: string;
  onSuccess?: (
    data: InferApiResponse<typeof transactionApi.createWithdrawOrder>
  ) => void;
}) {
  const tPayment = paymentWebModule.useTranslation().t;
  const tCore = coreWebModule.useTranslation().t;
  const { data, loading } = useApi(settingApi.getWeb3WithdrawSetting, {
    currencyId: props.currencyId,
  });

  return loading ? (
    <Group position="center">
      <Loader />
    </Group>
  ) : data ? (
    <ApiForm
      api={transactionApi.createWithdrawOrder}
      apiParams={{ currencyId: props.currencyId }}
      onSuccess={props.onSuccess}
      formRender={(form) => (
        <>
          <NumberInput
            label={tPayment('withdrawAmount')}
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
                      data.formula
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
            {tCore('create')}
          </Button>
        </>
      )}
    ></ApiForm>
  ) : (
    <Alert color="red" icon={<IconAlertCircle size="1rem" />}>
      <ApiError
        error={new NotFoundWeb3WithdrawSettingException(props.currencyId)}
      />
    </Alert>
  );
}
