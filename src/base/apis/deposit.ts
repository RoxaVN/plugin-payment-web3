import { ApiSource, ExactProps, MinLength } from '@roxavn/core/base';

import { baseModule } from '../module.js';
import { permissions, scopes } from '../access.js';

export interface TransactionResponse {}

const transactionSource = new ApiSource<TransactionResponse>(
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
