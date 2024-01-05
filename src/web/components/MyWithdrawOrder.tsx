import {
  ApiTable,
  useAuthUser,
  webModule as coreWebModule,
  utils,
  ModalTrigger,
  ApiConfirmFormGroup,
} from '@roxavn/core/web';
import { webModule as currencyWebModule } from '@roxavn/module-currency/web';
import { webModule as projectWebModule } from '@roxavn/module-project/web';
import {
  constants as projectConstants,
  taskApi,
} from '@roxavn/module-project/base';

import { transactionApi } from '../../base/index.js';
import { Button, Tooltip } from '@mantine/core';

export function MyWithdrawOrder(props: { currencyId: string }) {
  const user = useAuthUser();
  const tCore = coreWebModule.useTranslation().t;
  const tCurrency = currencyWebModule.useTranslation().t;
  const tProject = projectWebModule.useTranslation().t;

  return (
    <ApiTable
      api={transactionApi.getWithdrawOrders}
      apiParams={{
        userId: user?.id,
        currencyId: props.currencyId,
      }}
      columns={{
        id: { label: tCore('id') },
        createdDate: {
          label: tCore('createdDate'),
          render: utils.Render.datetime,
        },
        metadata: {
          label: tCurrency('amount'),
          render: (value) => utils.Render.number(value?.amount),
        },
        status: {
          label: tCore('status'),
          render: (value) => tProject(value),
        },
        startedDate: {
          label: '',
          render: (_, item) => {
            switch (item.status) {
              case projectConstants.TaskStatus.CANCELED:
                return (
                  <Tooltip label={tProject('canceledDate')}>
                    {utils.Render.datetime(item.canceledDate)}
                  </Tooltip>
                );
              case projectConstants.TaskStatus.FINISHED:
                return (
                  <Tooltip label={tProject('finishedDate')}>
                    {utils.Render.datetime(item.finishedDate)}
                  </Tooltip>
                );
              case projectConstants.TaskStatus.REJECTED:
                return (
                  <Tooltip label={tProject('rejectedDate')}>
                    {utils.Render.datetime(item.rejectedDate)}
                  </Tooltip>
                );
              case projectConstants.TaskStatus.PENDING:
                return (
                  <ModalTrigger
                    title={tCore('confirm')}
                    content={({ setOpened }) => (
                      <ApiConfirmFormGroup
                        api={taskApi.cancel}
                        onCancel={() => setOpened(false)}
                        onSuccess={() => setOpened(false)}
                        apiParams={{ taskId: item.id }}
                      />
                    )}
                  >
                    <Button>{tCore('cancel')}</Button>
                  </ModalTrigger>
                );
            }
          },
        },
      }}
    ></ApiTable>
  );
}
