import { Core } from "../Core";
import { DecisionQueueCode } from "../../ContractCode";
import { defaultProtocol } from "../_config";
import { ContractPayload, CallPayload, ContractCall } from "../Core/types";
import { QVoteContracts } from "../../Utill";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import { Contract } from "@zilliqa-js/contract";
import { Transaction } from "@zilliqa-js/account";
import BN from "bn.js";

class QueueZilliqa extends Core {
  /**
   * @param protocol the chain id and the message version of the used blockchain
   * @param secondsPerTxBlockAverage the seconds on average it takes for a new
   * transaction block to be created
   */
  constructor(
    zil?: Zilliqa,
    protocol = defaultProtocol,
    secondsPerTxBlockAverage = 60
  ) {
    super(protocol, secondsPerTxBlockAverage, DecisionQueueCode, zil);
  }

  /**
     * @description
     * Payload that allows to create a contract factory instance
     * @example
     *  const queueContract = zil.contracts.new(...queue.payloadQueue({
        payload: {
            maxQueueSize: "3",
        }, ownerAddress: deployerAddress,
       }));
     */
  payloadQueue({
    payload,
    ownerAddress,
  }: {
    payload: {
      maxQueueSize: string;
    };
    ownerAddress: string;
  }): ContractPayload {
    const _ownerAddress = ownerAddress;
    const init = [
      // Required params
      super.createValueParam("Uint32", "_scilla_version", "0"),
      super.createValueParam("ByStr20", "owner", _ownerAddress),
      super.createValueParam("Uint32", "max_queue_size", payload.maxQueueSize),
      super.createValueParam("Bool", "is_decision_queue", {
        constructor: "True",
        argtypes: [],
        arguments: [],
      }),
    ];
    return [this.code, init];
  }

  /**
     * @description
     * Payload to make a contract call to the push function
     * it pushes the given address to the queue and dequeues the oldest one
     * if max is reached 
     * @note cannot push the same address
     * @warning ONLY OWNER OF QUEUE CAN CALL THIS
     * @example
     *  const pushTx = await queueInstance.call(...queue.payloadPushQueue({
        payload: {
            addressToPush: qvotingAddress
        },
        gasPrice
        }));
     */
  payloadPushQueue({
    payload,
    gasPrice,
    gasLimit,
    amount = 0,
  }: ContractCall<{
    addressToPush: string;
  }>): CallPayload {
    const callParams = super.getCallParamsPayload({
      gasPrice,
      gasLimit,
      amount,
    });
    const transitionParams: [string, QVoteContracts.Value[]] = [
      "pushToQueue",
      [super.createValueParam("ByStr20", "addr", payload.addressToPush)],
    ];
    return [...transitionParams, ...callParams];
  }

  /**
   * @param payload the max queue size
   * @param ownerAddress the address of the owner of the queue
   * @param options optional gas price and gas limit for the deploy
   * @returns the contract address the instance and confirmed transaction
   * @example 
   * const [address1, queueInstance, deployTx1] = await queue.deploy(
      {
        maxQueueSize: "3",
      },
      deployerAddress
    );
   */
  async deploy(
    payload: {
      maxQueueSize: string;
    },
    ownerAddress: string,
    options: {
      gasPrice?: BN;
      gasLimit?: Long.Long;
    } = {}
  ): Promise<[string, Contract, Transaction]> {
    const { gasPrice, gasLimit } = await this.getGasPriceAndLimit(options);
    const contract = this.getZil().contracts.new(
      ...this.payloadQueue({
        payload,
        ownerAddress,
      })
    );
    const [queueAddress, instance, deployTx] = await this.handleDeploy(
      contract.deploy(...this.payloadDeploy({ gasPrice, gasLimit }))
    );
    return [queueAddress, instance, deployTx];
  }

  /**
   * @param queueInstance the instance of the deployed queue
   * @param payload the addresses to push to the queue
   * @param options optional gas price and gas limit for the deploy
   * @returns confirmed transaction of the push
   * @example 
   * const pushTx = await queue.push(regeneratedQueueInstance, {
      addressToPush: qvotingAddress,
    });
   */
  async push(
    queueInstance: Contract,
    payload: {
      addressToPush: string;
    },
    options: {
      gasPrice?: BN;
      gasLimit?: Long.Long;
    } = {}
  ): Promise<Transaction> {
    const { gasPrice, gasLimit } = await this.getGasPriceAndLimit(options);
    const tx = await queueInstance.call(
      ...this.payloadPushQueue({
        payload,
        gasPrice,
        gasLimit,
      })
    );
    const confirmedTx = await this.getConfirmedTx(tx);
    return confirmedTx;
  }

  /**
   * @param address the address of the contract to read state off
   * @param maxRetries optional max number of retries to call the blockchain
   * @param intervalMs optional interval in which the retries increase lineraly with
   * @returns the state of the queue
   * @example
   * const queueState = await queue.getContractState(address1, 14);
   */
  async getContractState(
    address: string,
    maxRetries = 6,
    intervalMs = 750
  ): Promise<QVoteContracts.QueueState> {
    const err = (s: string, e: string) =>
      new Error(`There was an issue getting contract ${s} state, ${e}`);
    const [state, errState] = await this.retryLoop(maxRetries, intervalMs, () =>
      this.getZil().blockchain.getSmartContractState(address)
    );
    if (!state) {
      throw err("mutable", JSON.stringify(errState));
    }
    return (state as unknown) as QVoteContracts.QueueState;
  }
}

export { QueueZilliqa };
