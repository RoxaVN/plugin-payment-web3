import { accessManager } from '@roxavn/core/base';

import { baseModule } from './module.js';

export const scopes = accessManager.makeScopes(baseModule, {
  Deposit: { name: 'deposit' },
});

export const permissions = accessManager.makePermissions(scopes, {
  Deposit: { allowedScopes: [accessManager.scopes.AuthUser] },
  CreateWithdrawOrder: { allowedScopes: [accessManager.scopes.AuthUser] },
});
