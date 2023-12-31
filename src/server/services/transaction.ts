import {
  type InferApiRequest,
  NotFoundException,
  utils,
  BadRequestException,
  formulaUtils,
} from '@roxavn/core/base';
import {
  AuthUser,
  BaseService,
  type InferContext,
  inject,
} from '@roxavn/core/server';
import { serverModule as currencyServerModule } from '@roxavn/module-currency/server';
import { GetIdentityBytypeService } from '@roxavn/module-user/server';
import { GetSettingService } from '@roxavn/module-utils/server';
import {
  GetWeb3ContractApiService,
  GetWeb3ProvidersApiService,
} from '@roxavn/module-web3/server';
import { CreatePaymentTransactionService } from '@roxavn/plugin-payment/server';
import {
  constants as web3AuthConstants,
  NotLinkedAddressException,
} from '@roxavn/plugin-web3-auth/base';
import { createPublicClient, decodeEventLog, http, isAddressEqual } from 'viem';
import { erc20ABI } from 'wagmi';

import {
  NotFoundWeb3DepositSettingException,
  UpdateWeb3DepositSettingRequest,
  constants,
  transactionApi,
} from '../../base/index.js';
import { serverModule } from '../module.js';

@serverModule.useApi(transactionApi.deposit)
export class DepositTransactionApiService extends BaseService {
  constructor(
    @inject(GetSettingService)
    protected getSettingService: GetSettingService,
    @inject(GetWeb3ContractApiService)
    protected getWeb3ContractApiService: GetWeb3ContractApiService,
    @inject(GetWeb3ProvidersApiService)
    protected getWeb3ProvidersApiService: GetWeb3ProvidersApiService,
    @inject(GetIdentityBytypeService)
    protected getIdentityBytypeService: GetIdentityBytypeService,
    @inject(CreatePaymentTransactionService)
    protected createPaymentTransactionService: CreatePaymentTransactionService
  ) {
    super();
  }

  async handle(
    request: InferApiRequest<typeof transactionApi.deposit>,
    @AuthUser authUser: InferContext<typeof AuthUser>
  ) {
    const setting = (await this.getSettingService.handle({
      module: currencyServerModule.name,
      name: constants.WEB3_DEPOSIT_SETTING,
    })) as UpdateWeb3DepositSettingRequest;
    const settingItem = setting.items.find(
      (item) =>
        item.contractAddress === request.contractAddress &&
        item.networkId === request.networkId
    );
    if (!settingItem) {
      throw new NotFoundWeb3DepositSettingException(
        request.contractAddress,
        request.networkId
      );
    }

    const { items } = await this.getWeb3ProvidersApiService.handle({
      networkId: settingItem.networkId,
    });
    const provider = items[0];
    if (provider) {
      const publicClient = createPublicClient({
        transport: http(provider.url),
      });
      const transaction = await publicClient.getTransactionReceipt({
        hash: request.transactionHash,
      });

      while (true) {
        const currentBlock = await publicClient.getBlockNumber();
        // wait to avoid forked blocks
        if (
          currentBlock >=
          transaction.blockNumber + BigInt(provider.delayBlockCount)
        ) {
          break;
        }
        await utils.delay(5000);
      }

      for (const log of transaction.logs) {
        const event = decodeEventLog({
          abi: erc20ABI,
          data: log.data,
          topics: log.topics,
        });
        const eventData = event.args as any;
        if (
          event.eventName === 'Transfer' &&
          isAddressEqual(eventData.to, settingItem.recipientAddress) &&
          transaction.to &&
          isAddressEqual(transaction.to, settingItem.contractAddress)
        ) {
          const identity = await this.getIdentityBytypeService.handle({
            subject: eventData.from?.toLowerCase(),
            type: web3AuthConstants.identityTypes.WEB3_ADDRESS,
          });
          if (identity && identity.userId === authUser.id) {
            const decimal = await publicClient.readContract({
              address: settingItem.contractAddress,
              abi: erc20ABI,
              functionName: 'decimals',
            });
            let amount = Number(
              BigInt(eventData.value) / BigInt(10) ** BigInt(decimal)
            );
            amount = parseInt(
              formulaUtils.getResult([amount], settingItem.formula) as any
            );

            return this.createPaymentTransactionService.handle({
              account: {
                userId: authUser.id,
                amount: amount,
              },
              currencyId: settingItem.currencyId,
              type: constants.WEB3_DEPOSIT,
              originalTransactionId: request.transactionHash,
            });
          }
          throw new NotLinkedAddressException();
        }
      }
      throw new BadRequestException();
    }
    throw new NotFoundException();
  }
}
