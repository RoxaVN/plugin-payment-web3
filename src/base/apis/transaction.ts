import {
  ApiSource,
  Empty,
  ExactProps,
  Min,
  MinLength,
} from '@roxavn/core/base';
import {
  AccountTransactionResponse,
  permissions as currencyPermissions,
} from '@roxavn/module-currency/base';

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

class WithdrawTransactionRequest extends ExactProps<WithdrawTransactionRequest> {
  @Min(1)
  amount: number;

  @MinLength(1)
  currencyId: string;
}

class AcceptWithdrawTransactionRequest extends ExactProps<AcceptWithdrawTransactionRequest> {
  @MinLength(1)
  taskId: string;
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
  withdraw: transactionSource.create<
    WithdrawTransactionRequest,
    { id: string }
  >({
    path: transactionSource.apiPath() + '/withdraw',
    validator: WithdrawTransactionRequest,
    permission: permissions.WithdrawTransaction,
  }),
  acceptWithdraw: transactionSource.create<
    AcceptWithdrawTransactionRequest,
    Empty
  >({
    path: transactionSource.apiPath() + '/accept-withdraw',
    validator: AcceptWithdrawTransactionRequest,
    permission: currencyPermissions.CreateTransaction,
  }),
};
