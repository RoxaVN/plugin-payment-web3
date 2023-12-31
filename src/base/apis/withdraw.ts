import {
  ApiSource,
  ExactProps,
  IsOptional,
  Min,
  MinLength,
  PaginationRequest,
} from '@roxavn/core/base';
import { TaskResponse } from '@roxavn/module-project/base';
import { permissions as paymentPermissions } from '@roxavn/plugin-payment/base';

import { baseModule } from '../module.js';
import { permissions, scopes } from '../access.js';

const withdrawSource = new ApiSource<TaskResponse>(
  [scopes.Withdraw],
  baseModule
);

class CreateWithdrawOrderRequest extends ExactProps<CreateWithdrawOrderRequest> {
  @Min(1)
  amount: number;

  @MinLength(1)
  currencyId: string;
}

class AcceptWithdrawOrderRequest extends ExactProps<AcceptWithdrawOrderRequest> {
  @MinLength(1)
  taskId: string;
}

const RejectWithdrawOrderRequest = AcceptWithdrawOrderRequest;
const CancelWithdrawOrderRequest = AcceptWithdrawOrderRequest;

class GetWithdrawOrdersRequest extends PaginationRequest<GetWithdrawOrdersRequest> {
  @MinLength(1)
  @IsOptional()
  userId?: string;

  @MinLength(1)
  @IsOptional()
  currencyId?: string;
}

export const withdrawApi = {
  create: withdrawSource.create({
    validator: CreateWithdrawOrderRequest,
    permission: permissions.CreateWithdrawOrder,
  }),
  cancel: withdrawSource.update({
    path: withdrawSource.apiPath() + '/cancel',
    validator: CancelWithdrawOrderRequest,
    permission: permissions.CancelWithdrawOrder,
  }),
  accept: withdrawSource.update({
    path: withdrawSource.apiPath({ includeId: true }) + '/accept',
    validator: AcceptWithdrawOrderRequest,
    permission: paymentPermissions.ConfirmOrder,
  }),
  reject: withdrawSource.update({
    path: withdrawSource.apiPath() + '/reject',
    validator: RejectWithdrawOrderRequest,
    permission: paymentPermissions.ConfirmOrder,
  }),
  getMany: withdrawSource.getMany({
    validator: GetWithdrawOrdersRequest,
    permission: paymentPermissions.ReadOrders,
  }),
};
