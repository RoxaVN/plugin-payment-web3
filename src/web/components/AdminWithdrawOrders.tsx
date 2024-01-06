import {
  ApiConfirmFormGroup,
  ApiTable,
  JSONTree,
  webModule as coreWebModule,
  userService,
  utils,
} from '@roxavn/core/web';
import { webModule as projectWebModule } from '@roxavn/module-project/web';
import { constants as projectConstants } from '@roxavn/module-project/base';
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';

import { transactionApi } from '../../base/index.js';
import { TaskStatus } from './MyWithdrawOrders.js';

export function AdminWithdrawOrders() {
  const tCore = coreWebModule.useTranslation().t;
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
        status: {
          label: tCore('status'),
          render: (_, item) => <TaskStatus task={item} />,
        },
        assignee: {
          label: tProject('assignee'),
          reference: userService.reference,
        },
        metadata: {
          label: tCore('metadata'),
          render: (value) => <JSONTree data={value} />,
        },
      }}
      cellActions={(item) =>
        item.status === projectConstants.TaskStatus.PENDING
          ? [
              {
                label: tCore('reject'),
                icon: IconCircleX,
                modal: ({ closeModal }) => ({
                  title: tCore('reject'),
                  children: (
                    <ApiConfirmFormGroup
                      api={transactionApi.rejectWithdrawOrder}
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
                  title: tCore('accept'),
                  children: (
                    <ApiConfirmFormGroup
                      api={transactionApi.acceptWithdrawOrder}
                      onCancel={closeModal}
                      apiParams={{ taskId: item.id }}
                    />
                  ),
                }),
              },
            ]
          : []
      }
    />
  );
}
