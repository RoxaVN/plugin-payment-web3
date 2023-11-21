import { ApiSource, ExactProps, MinLength } from '@roxavn/core/base';

import { baseModule } from '../module.js';
import { permissions, scopes } from '../access.js';

export interface TransactionResponse {}

const transactionSource = new ApiSource<TransactionResponse>(
  [scopes.Transaction],
  baseModule
);

class DepositTransactionRequest extends ExactProps<DepositTransactionRequest> {
  @MinLength(1)
  transactionHash: `0x${string}`;
}

export const transactionApi = {
  deposit: transactionSource.create<
    DepositTransactionRequest,
    {
      accountId: string;
      amount: string;
      createdDate: Date;
      currencyId: string;
      id: string;
      newBalance: string;
      oldBalance: string;
      transactionId: string;
    }
  >({
    path: transactionSource.apiPath() + '/deposit',
    validator: DepositTransactionRequest,
    permission: permissions.DepositTransaction,
  }),
};
