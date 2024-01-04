import { webModule as web3WebModule } from '@roxavn/module-web3/web';

export default function () {
  web3WebModule.adminPluginRegisters.push(() => import('./register'));
}
