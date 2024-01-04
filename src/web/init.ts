import { webModule as currencyWebModule } from '@roxavn/module-currency/web';

export default function () {
  currencyWebModule.adminPluginRegisters.push(() => import('./register'));
}
