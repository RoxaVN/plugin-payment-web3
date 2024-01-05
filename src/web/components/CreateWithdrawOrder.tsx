import { Alert, Button, NumberInput } from '@mantine/core';
import { InferApiResponse, formulaUtils } from '@roxavn/core';
import { ApiError, ApiForm, useApi } from '@roxavn/core/web';
import { webModule as currencyWebModule } from '@roxavn/module-currency/web';
import { webModule as paymentWebModule } from '@roxavn/plugin-payment/web';
import { settingApi } from '@roxavn/module-utils/base';
import { IconAlertCircle, IconCoin } from '@tabler/icons-react';
import { useMemo } from 'react';

import {
  NotFoundWeb3WithdrawSettingException,
  UpdateWeb3WithdrawSettingRequest,
  constants,
  transactionApi,
} from '../../base/index.js';

export function CreateWithdrawOrder(props: {
  currencyId: string;
  onSuccess?: (
    data: InferApiResponse<typeof transactionApi.createWithdrawOrder>
  ) => void;
}) {
  const tPayment = paymentWebModule.useTranslation().t;
  const settingResp = useApi(settingApi.getPublic, {
    module: currencyWebModule.name,
    name: constants.WEB3_DEPOSIT_SETTING,
  });
  const settingItem = useMemo(() => {
    return (
      settingResp.data &&
      (settingResp.data as UpdateWeb3WithdrawSettingRequest).items.find(
        (item) => item.currencyId === props.currencyId
      )
    );
  }, [settingResp]);

  return settingItem ? (
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
            {tPayment('withdraw')}
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
