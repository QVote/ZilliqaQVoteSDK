import BN from "bn.js";
import Long from "long";
import { QVoteContracts } from "../../Utill";
import { Zil } from "../../Utill";
import { DeployPayload } from "./types";
import { Transaction } from "@zilliqa-js/account";
import { Contract } from "@zilliqa-js/contract";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import { sleep } from "../../Utill";

class Core {
  protected VERSION: number;
  protected secondsPerTxBlockAverage: number;
  protected code: string;
  protected zil: Zilliqa | undefined;

  private pack(a: number, b: number) {
    if (a >> 16 > 0 || b >> 16 > 0) {
      throw new Error("Both a and b must be 16 bits or less");
    }
    return (a << 16) + b;
  }

  constructor(
    protocol: { chainId: number; msgVersion: number },
    secondsPerTxBlockAverage: number,
    code: string,
    zil?: Zilliqa
  ) {
    this.VERSION = this.pack(protocol.chainId, protocol.msgVersion);
    this.secondsPerTxBlockAverage = secondsPerTxBlockAverage;
    this.code = code;
    this.zil = zil;
  }

  /**
   * @param blockNumber the current block number of the blockchain
   * @param secondsToAdd seconds to add to the blocknumber to receive a block number that
   * will be the current one x seconds in the future
   * @example
   *  const txblock = await zil.blockchain.getLatestTxBlock();
   *  const curBlockNumber = parseInt(txblock.result.header.BlockNum);
   *  // approx blocknumber 60 seconds into the future
   *  const futureBlockNumber = qv.futureTxBlockNumber(curBlockNumber, 60);
   */
  futureTxBlockNumber(blockNumber: number, secondsToAdd: number): string {
    return (
      "" +
      (blockNumber + Math.round(secondsToAdd / this.secondsPerTxBlockAverage))
    );
  }

  /**
   * @description
   * Payload used to deploy contracts
   * @example
   * const gasPrice = await qv.handleMinGas(zil.blockchain.getMinimumGasPrice());
   * contractInstance.deploy(...qv.payloadDeploy({ gasPrice }));
   */
  payloadDeploy({
    gasPrice,
    gasLimit,
  }: {
    gasPrice: BN;
    gasLimit?: Long.Long;
  }): DeployPayload {
    const _gasPrice = gasPrice;
    const _gasLimit = gasLimit ? gasLimit : Long.fromNumber(80000);
    return [
      {
        version: this.VERSION,
        gasPrice: _gasPrice,
        gasLimit: _gasLimit,
      },
      33,
      1000,
      false,
    ];
  }

  /**
   * @webOnly
   *
   * @webOnly
   *
   * @webOnly
   *
   * @webOnly
   *
   * @example
   * const provider = await qv.connectAndGetZilPayProvider();
   * const zil =  new Zilliqa("", provider);
   */
  async getZilPay(): Promise<any> {
    //@ts-ignore
    const res = await window.zilPay.wallet.connect();
    if (!res) {
      throw new Error("Didn't manage to connect.");
    }
    //@ts-ignore
    return window.zilPay.provider;
  }

  /**
   * @param promise that is returned from the zil sdk
   * @example
   * const gasPrice = await qv.handleMinGas(zil.blockchain.getMinimumGasPrice());
   */
  async handleMinGas(
    promise: Promise<Zil.RPCResponse<string, string>>
  ): Promise<BN> {
    const minGasPrice = await promise;
    if (typeof minGasPrice.result == "undefined") {
      throw new Error("Couldn't get minimum gas price");
    }
    const res = new BN(minGasPrice.result);
    return res;
  }

  protected async getConfirmedTx(tx: Transaction): Promise<Transaction> {
    const confirmedTx = await tx.confirm(tx.hash);
    if (confirmedTx.isConfirmed()) {
      return confirmedTx;
    } else {
      const receipt = confirmedTx.getReceipt();
      if (receipt) {
        throw new Error(
          `Transaction rejected by the network, receipt: ${JSON.stringify(
            receipt,
            null,
            2
          )}`
        );
      }
      throw new Error(`Something went wrong, tx hash: ${confirmedTx.hash}`);
    }
  }

  /**
   * @param promise that is returned from the zil sdk
   * @example
   *  const [address, instance, deployTx] = await qv.handleDeploy(
   *      contract.deploy(...qv.payloadDeploy({ gasPrice }))
   *  );
   */
  async handleDeploy(
    promise: Promise<[Transaction, Contract]>
  ): Promise<[string, Contract, Transaction]> {
    const [deployTx, contract] = await promise;
    // Confirm the TX to be sure
    const confirmedTx = await this.getConfirmedTx(deployTx);
    if (typeof contract.address != "undefined") {
      return [contract.address, contract, confirmedTx];
    } else {
      throw new Error(
        `The confirmed transaction has no contract address ${confirmedTx.hash}`
      );
    }
  }

  getInstance(contractAddress: string): Contract {
    return this.getZil().contracts.at(contractAddress);
  }

  protected async retryLoop(
    maxRetries: number,
    intervalMs: number,
    func: () => Promise<Zil.RPCResponse<QVoteContracts.Value[], any>>
  ): Promise<[QVoteContracts.Value[] | undefined, any]> {
    let err = {};
    for (let x = 0; x < maxRetries; x++) {
      await sleep(x * intervalMs);
      const temp = await func();
      if (temp.result) {
        return [temp.result, temp.error];
      }
      err = temp.error;
    }
    return [undefined, err];
  }

  protected stripInit(init: QVoteContracts.Value[]): { [key: string]: any } {
    const res: { [key: string]: any } = {};
    init.forEach((e) => {
      res[e.vname] = e.value;
    });
    return res;
  }

  protected createValueParam(
    type: QVoteContracts.Types.All,
    vname: string,
    value: QVoteContracts.ValueField
  ): QVoteContracts.Value {
    return {
      type,
      value,
      vname,
    };
  }

  protected getCallParamsPayload({
    gasPrice,
    gasLimit,
    amount,
  }: {
    amount: number;
    gasPrice: BN;
    gasLimit?: Long.Long;
  }): [
    { version: number; gasPrice: BN; amount: BN; gasLimit: Long.Long },
    number,
    number,
    boolean
  ] {
    const _gasPrice = gasPrice;
    const _gasLimit = gasLimit ? gasLimit : Long.fromNumber(80000);
    return [
      {
        // amount, gasPrice and gasLimit must be explicitly provided
        version: this.VERSION,
        amount: new BN(amount),
        gasPrice: _gasPrice,
        gasLimit: _gasLimit,
      },
      33,
      1000,
      false,
    ];
  }

  protected async getGasPriceAndLimit({
    gasPrice,
    gasLimit,
  }: {
    gasPrice?: BN;
    gasLimit?: Long.Long;
  }): Promise<{
    gasPrice: BN;
    gasLimit: Long.Long;
  }> {
    const _gasPrice = gasPrice
      ? gasPrice
      : await this.handleMinGas(this.getZil().blockchain.getMinimumGasPrice());
    const _gasLimit = gasLimit ? gasLimit : Long.fromNumber(80000);
    return { gasPrice: _gasPrice, gasLimit: _gasLimit };
  }

  protected getZil(): Zilliqa {
    if (typeof this.zil == "undefined") {
      throw new Error(
        "To use this method please set the zilliqa sdk in the constructor"
      );
    }
    return this.zil;
  }
}

export { Core };
