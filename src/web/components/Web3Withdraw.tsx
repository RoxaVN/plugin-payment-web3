import { Flex, Tabs } from '@mantine/core';
import { webModule as paymentWebModule } from '@roxavn/plugin-payment/web';
import { IconCoins, IconHistory } from '@tabler/icons-react';
import { useState } from 'react';

import { MyWithdrawOrders } from './MyWithdrawOrders.js';
import { CreateWithdrawOrder } from './CreateWithdrawOrder.js';

export function Web3Withdraw(props: { currencyId: string }) {
  const tPayment = paymentWebModule.useTranslation().t;
  const [activeTab, setActiveTab] = useState<string | null>('create');

  return (
    <Tabs value={activeTab} onTabChange={setActiveTab} keepMounted={false}>
      <Tabs.List grow position="center" mb="md">
        <Tabs.Tab value="create" icon={<IconCoins size="1rem" />}>
          {tPayment('createOrder')}
        </Tabs.Tab>
        <Tabs.Tab value="list" icon={<IconHistory size="1rem" />}>
          {tPayment('orders')}
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="create">
        <Flex justify="center">
          <CreateWithdrawOrder
            currencyId={props.currencyId}
            onSuccess={() => setActiveTab('list')}
          />
        </Flex>
      </Tabs.Panel>
      <Tabs.Panel value="list">
        <MyWithdrawOrders currencyId={props.currencyId} />
      </Tabs.Panel>
    </Tabs>
  );
}
