import { bytes, BN, Long } from "@zilliqa-js/zilliqa";
import { QVoteContracts } from "../../Utill";
import { Contract } from "@zilliqa-js/contract";
import { Transaction } from "@zilliqa-js/account";
import { Zil } from "../../Utill";
import { DeployPayload } from "./types";

class Core {
    protected VERSION: number;
    protected secondsPerTxBlockAverage: number;
    protected code: string;

    constructor(protocol: { chainId: number, msgVersion: number }, secondsPerTxBlockAverage: number, code: string) {
        this.VERSION = bytes.pack(protocol.chainId, protocol.msgVersion);
        this.secondsPerTxBlockAverage = secondsPerTxBlockAverage;
        this.code = code;
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
        return "" + (blockNumber + Math.round((secondsToAdd / this.secondsPerTxBlockAverage)));
    }

    /**
     * @description
     * Payload used to deploy contracts
     * @example
     * const gasPrice = await qv.handleMinGas(zil.blockchain.getMinimumGasPrice());
     * contractInstance.deploy(...qv.payloadDeploy({ gasPrice }));
     */
    payloadDeploy({ gasPrice, gasLimit }: {
        gasPrice: BN,
        gasLimit?: Long.Long,
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
            false
        ];
    }

    /**
     * @param promise that is returned from the zil sdk
     * @example
     * const gasPrice = await qv.handleMinGas(zil.blockchain.getMinimumGasPrice());
     */
    async handleMinGas(promise: Promise<Zil.RPCResponse<string, string>>): Promise<BN> {
        const minGasPrice = await promise;
        if (typeof minGasPrice.result == "undefined") {
            throw new Error("Couldn't get minimum gas price");
        }
        const res = new BN(minGasPrice.result);
        return res;
    }

    /**
     * @param promise that is returned from the zil sdk
     * @example
     *  const [address, instance, deployTx] = await qv.handleDeploy(
     *      contract.deploy(...qv.payloadDeploy({ gasPrice }))
     *  );
     */
    async handleDeploy(promise: Promise<[Transaction, Contract]>): Promise<[string, Contract, Transaction]> {
        const [deployTx, contract] = await promise;
        if (typeof deployTx.txParams.receipt != "undefined") {
            if (typeof contract.address != "undefined") {
                return [contract.address, contract, deployTx];
            } else {
                throw new Error("There is no contract address");
            }
        } else {
            console.log(deployTx, contract)
            throw new Error("There is no tx receipt");
        }
    }

    protected stripInit(init: QVoteContracts.Value[]): { [key: string]: any } {
        const res: { [key: string]: any } = {};
        init.forEach(e => {
            res[e.vname] = e.value;
        });
        return res;
    }

    protected createValueParam(
        type: QVoteContracts.Types.All,
        vname: string,
        value: QVoteContracts.ValueField,
    ): QVoteContracts.Value {
        return {
            type,
            value,
            vname
        };
    }

    protected getCallParamsPayload({ gasPrice, gasLimit, amount }:
        {
            amount: number,
            gasPrice: BN,
            gasLimit?: Long.Long,
        }): [{ version: number, gasPrice: BN, amount: BN, gasLimit: Long.Long }, number, number, boolean] {
        const _gasPrice = gasPrice;
        const _gasLimit = gasLimit ? gasLimit : Long.fromNumber(80000);
        return [{
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
}

export { Core };