import {
  ApiConfirmFormGroup,
  ApiTable,
  webModule as coreWebModule,
  userService,
  utils,
} from '@roxavn/core/web';
import { webModule as currencyWebModule } from '@roxavn/module-currency/web';
import { webModule as projectWebModule } from '@roxavn/module-project/web';
import { taskApi } from '@roxavn/module-project/base';

import { transactionApi } from '../../base/index.js';
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';

export function AdminWithdrawOrders() {
  const tCore = coreWebModule.useTranslation().t;
  const tCurrency = currencyWebModule.useTranslation().t;
  const tProject = projectWebModule.useTranslation().t;

  return (
    <ApiTable
      api={transactionApi.getWithdrawOrders}
      columns={{
        id: { label: tCore('id') },
        userId: { label: tCore('user'), reference: userService.reference },
        createdDate: {
          label: tCore('createdDate'),
          render: utils.Render.datetime,
        },
        metadata: {
          label: tCurrency('amount'),
          render: (value) => utils.Render.number(value?.amount),
        },
        startedDate: {
          label: tCurrency('currencyId'),
          render: (_, item) => item.metadata?.currencyId,
        },
        status: {
          label: tCore('status'),
          render: (value) => tProject(value),
        },
        assignee: {
          label: tProject('assignee'),
          reference: userService.reference,
        },
      }}
      cellActions={(item) => [
        {
          label: tCore('reject'),
          icon: IconCircleX,
          modal: ({ closeModal }) => ({
            title: 'deleteUserRole',
            children: (
              <ApiConfirmFormGroup
                api={taskApi.reject}
                onCancel={closeModal}
                apiParams={{ taskId: item.id }}
              />
            ),
          }),
        },
        {
          label: tCore('accept'),
          icon: IconCircleCheck,
          modal: ({ closeModal }) => ({
            title: 'deleteUserRole',
            children: (
              <ApiConfirmFormGroup
                api={transactionApi.acceptWithdrawOrder}
                onCancel={closeModal}
                apiParams={{ taskId: item.id }}
              />
            ),
          }),
        },
      ]}
    />
  );
}
