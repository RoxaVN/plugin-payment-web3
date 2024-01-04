import {
  ApiSource,
  Empty,
  ExactProps,
  IsOptional,
  Min,
  MinLength,
  NotFoundException,
  PaginatedCollection,
  PaginationRequest,
} from '@roxavn/core/base';
import { AccountTransactionResponse } from '@roxavn/module-currency/base';
import { TaskResponse } from '@roxavn/module-project/base';
import { permissions as paymentPermissions } from '@roxavn/plugin-payment/base';

import { baseModule } from '../module.js';
import { permissions, scopes } from '../access.js';

const transactionSource = new ApiSource<AccountTransactionResponse>(
  [scopes.Transaction],
  baseModule
);

class DepositTransactionRequest extends ExactProps<DepositTransactionRequest> {
  @MinLength(3)
  transactionHash: `0x${string}`;

  @MinLength(3)
  contractAddress: `0x${string}`;

  @MinLength(1)
  networkId: string;
}

class WithdrawOrderRequest extends ExactProps<WithdrawOrderRequest> {
  @Min(1)
  amount: number;

  @MinLength(1)
  currencyId: string;
}

class AcceptWithdrawOrderRequest extends ExactProps<AcceptWithdrawOrderRequest> {
  @MinLength(1)
  taskId: string;
}

class GetWithdrawOrdersRequest extends PaginationRequest<GetWithdrawOrdersRequest> {
  @MinLength(1)
  @IsOptional()
  userId?: string;
}

export const transactionApi = {
  deposit: transactionSource.create<
    DepositTransactionRequest,
    AccountTransactionResponse
  >({
    path: transactionSource.apiPath() + '/deposit',
    validator: DepositTransactionRequest,
    permission: permissions.DepositTransaction,
  }),
  createWithdrawOrder: transactionSource.create<
    WithdrawOrderRequest,
    { id: string }
  >({
    path: transactionSource.apiPath() + '/withdraw-order',
    validator: WithdrawOrderRequest,
    permission: permissions.WithdrawTransaction,
  }),
  acceptWithdrawOrder: transactionSource.create<
    AcceptWithdrawOrderRequest,
    Empty
  >({
    path: transactionSource.apiPath() + '/accept-withdraw-order',
    validator: AcceptWithdrawOrderRequest,
    permission: paymentPermissions.ConfirmOrder,
  }),
  getWithdrawOrders: transactionSource.custom<
    GetWithdrawOrdersRequest,
    PaginatedCollection<TaskResponse>,
    NotFoundException
  >({
    method: 'GET',
    path: transactionSource.apiPath() + '/withdraw-orders',
    validator: GetWithdrawOrdersRequest,
    permission: paymentPermissions.ReadOrders,
  }),
};
