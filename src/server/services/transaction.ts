import {
  type InferApiRequest,
  NotFoundException,
  utils,
  BadRequestException,
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

    const { items } = await this.getWeb3ProvidersApiService.handle({
      networkId: setting.networkId,
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
          isAddressEqual(eventData.to, setting.recipientAddress)
        ) {
          const identity = await this.getIdentityBytypeService.handle({
            subject: eventData.from?.toLowerCase(),
            type: web3AuthConstants.identityTypes.WEB3_ADDRESS,
          });
          if (identity && identity.userId === authUser.id) {
            const decimal = await publicClient.readContract({
              address: setting.contractAddress,
              abi: erc20ABI,
              functionName: 'decimals',
            });
            const amount =
              BigInt(eventData.value) / BigInt(10) ** BigInt(decimal);

            await this.createPaymentTransactionService.handle({
              account: {
                userId: authUser.id,
                amount: amount * BigInt(setting.exchangeRate),
              },
              currencyId: setting.currencyId,
              type: constants.PAYMENT_WEB3,
              originalTransactionId: request.transactionHash,
            });

            return { id: '' };
          }
          throw new NotLinkedAddressException();
        }
      }
      throw new BadRequestException();
    }
    throw new NotFoundException();
  }
}
