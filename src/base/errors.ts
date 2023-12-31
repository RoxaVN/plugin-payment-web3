import { I18nErrorField, NotFoundException } from '@roxavn/core';
import { baseModule } from './module.js';

export class NotFoundWeb3DepositSettingException extends NotFoundException {
  i18n = {
    default: {
      key: 'Error.NotFoundWeb3DepositSettingException',
      ns: baseModule.escapedName,
    } as I18nErrorField,
  };

  constructor(contractAddress: string, networkId: string) {
    super();
    this.i18n.default.params = { contractAddress, networkId };
  }
}
