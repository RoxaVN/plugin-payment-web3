import { Tooltip } from '@mantine/core';
import {
  ApiTable,
  useAuthUser,
  webModule as coreWebModule,
  utils,
  ApiConfirmFormGroup,
} from '@roxavn/core/web';
import { webModule as currencyWebModule } from '@roxavn/module-currency/web';
import { webModule as projectWebModule } from '@roxavn/module-project/web';
import {
  TaskResponse,
  constants as projectConstants,
} from '@roxavn/module-project/base';
import dayjs from 'dayjs';

import { withdrawApi } from '../../base/index.js';

export function TaskStatus({ task }: { task: TaskResponse }) {
  const tProject = projectWebModule.useTranslation().t;
  switch (task.status) {
    case projectConstants.TaskStatus.CANCELED:
      return (
        <Tooltip label={utils.Render.datetime(task.canceledDate)}>
          <span>{tProject(task.status)}</span>
        </Tooltip>
      );
    case projectConstants.TaskStatus.FINISHED:
      return (
        <Tooltip label={utils.Render.datetime(task.finishedDate)}>
          <span>{tProject(task.status)}</span>
        </Tooltip>
      );
    case projectConstants.TaskStatus.REJECTED:
      return (
        <Tooltip label={utils.Render.datetime(task.rejectedDate)}>
          <span>{tProject(task.status)}</span>
        </Tooltip>
      );
    default:
      return <span>{tProject(task.status)}</span>;
  }
}

export function MyWithdrawOrders(props: { currencyId: string }) {
  const user = useAuthUser();
  const tCore = coreWebModule.useTranslation().t;
  const tCurrency = currencyWebModule.useTranslation().t;

  return (
    <ApiTable
      api={withdrawApi.getMany}
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
          render: (_, item) => <TaskStatus task={item} />,
        },
      }}
      cellActions={(item, fetcher) => {
        if (
          item.status === projectConstants.TaskStatus.PENDING &&
          dayjs().isAfter(item.metadata?.cancelDate)
        ) {
          return [
            {
              label: tCore('cancel'),
              modal: ({ closeModal }) => ({
                title: tCore('confirm'),
                children: (
                  // add Fragment to prevent checking api permission
                  <>
                    <ApiConfirmFormGroup
                      api={withdrawApi.cancel}
                      onCancel={closeModal}
                      onSuccess={() => {
                        closeModal();
                        fetcher.fetch(fetcher.currentParams);
                      }}
                      apiParams={{ taskId: item.id }}
                    />
                  </>
                ),
              }),
            },
          ];
        }
        return [];
      }}
    ></ApiTable>
  );
}
