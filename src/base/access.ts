import { accessManager } from '@roxavn/core/base';

import { baseModule } from './module.js';

export const scopes = accessManager.makeScopes(baseModule, {
  Transaction: { name: 'transaction' },
});

export const permissions = accessManager.makePermissions(scopes, {
  Deposit: { allowedScopes: [accessManager.scopes.AuthUser] },
  CreateWithdrawOrder: { allowedScopes: [accessManager.scopes.AuthUser] },
});
