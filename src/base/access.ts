import { accessManager } from '@roxavn/core/base';

import { baseModule } from './module.js';

export const scopes = accessManager.makeScopes(baseModule, {
  Transaction: { name: 'transaction' },
});

export const permissions = accessManager.makePermissions(scopes, {
  DepositTransaction: { allowedScopes: [accessManager.scopes.AuthUser] },
});
