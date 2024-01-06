import { accessManager } from '@roxavn/core/base';
import { scopes as projectScopes } from '@roxavn/module-project/base';

import { baseModule } from './module.js';

export const scopes = accessManager.makeScopes(baseModule, {
  Deposit: { name: 'deposit' },
  Withdraw: projectScopes.Task,
});

export const permissions = accessManager.makePermissions(scopes, {
  Deposit: { allowedScopes: [accessManager.scopes.AuthUser] },
  CreateWithdrawOrder: { allowedScopes: [accessManager.scopes.AuthUser] },
  CancelWithdrawOrder: {
    allowedScopes: [accessManager.scopes.ResourceOwner(scopes.Withdraw.name)],
  },
});
