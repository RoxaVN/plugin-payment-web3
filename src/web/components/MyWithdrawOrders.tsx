import { Button, Tooltip } from '@mantine/core';
import {
  ApiTable,
  useAuthUser,
  webModule as coreWebModule,
  utils,
  ModalTrigger,
  ApiConfirmFormGroup,
  ApiFetcherRef,
} from '@roxavn/core/web';
import { webModule as currencyWebModule } from '@roxavn/module-currency/web';
import { webModule as projectWebModule } from '@roxavn/module-project/web';
import {
  TaskResponse,
  constants as projectConstants,
  taskApi,
} from '@roxavn/module-project/base';

import { withdrawApi } from '../../base/index.js';
import { useRef } from 'react';
import { InferApiRequest } from '@roxavn/core';

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
  const fetcherRef =
    useRef<ApiFetcherRef<InferApiRequest<typeof withdrawApi.getMany>>>();
  const tCore = coreWebModule.useTranslation().t;
  const tCurrency = currencyWebModule.useTranslation().t;
  const tProject = projectWebModule.useTranslation().t;

  return (
    <ApiTable
      fetcherRef={fetcherRef}
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
        startedDate: {
          label: '',
          render: (_, item) => {
            switch (item.status) {
              case projectConstants.TaskStatus.CANCELED:
                return (
                  <Tooltip label={tProject('canceledDate')}>
                    <span>{utils.Render.datetime(item.canceledDate)}</span>
                  </Tooltip>
                );
              case projectConstants.TaskStatus.FINISHED:
                return (
                  <Tooltip label={tProject('finishedDate')}>
                    <span>{utils.Render.datetime(item.finishedDate)}</span>
                  </Tooltip>
                );
              case projectConstants.TaskStatus.REJECTED:
                return (
                  <Tooltip label={tProject('rejectedDate')}>
                    <span>{utils.Render.datetime(item.rejectedDate)}</span>
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
                        onSuccess={() => {
                          setOpened(false);
                          fetcherRef.current?.fetch(
                            fetcherRef.current.currentParams
                          );
                        }}
                        apiParams={{ taskId: item.id }}
                      />
                    )}
                  >
                    <Button>{tCore('cancel')}</Button>
                  </ModalTrigger>
                );
              default:
                return <></>;
            }
          },
        },
      }}
    ></ApiTable>
  );
}
