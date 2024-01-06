import { ApiSource, ExactProps, MinLength } from '@roxavn/core/base';
import { AccountTransactionResponse } from '@roxavn/module-currency/base';

import { baseModule } from '../module.js';
import { permissions, scopes } from '../access.js';

const depositSource = new ApiSource<AccountTransactionResponse>(
  [scopes.Deposit],
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

export const depositApi = {
  create: depositSource.create<
    DepositTransactionRequest,
    AccountTransactionResponse
  >({
    validator: DepositTransactionRequest,
    permission: permissions.Deposit,
  }),
};
