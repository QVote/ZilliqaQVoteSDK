import { bytes, BN, } from "@zilliqa-js/zilliqa";
import { Contract } from "@zilliqa-js/contract";
import { Transaction } from "@zilliqa-js/account";
import { QVoteContracts, Zil } from "../Utill";
import { defaultProtocol } from "./_config";

class Core {
    protected VERSION: number;

    constructor(protocol = defaultProtocol) {
        this.VERSION = bytes.pack(protocol.chainId, protocol.msgVersion);
    }

    async getMinGasHandle(promise: Promise<Zil.RPCResponse<string, string>>): Promise<BN> {
        const minGasPrice = await promise;
        if (typeof minGasPrice.result == "undefined") {
            throw new Error("Couldn't get minimum gas price");
        }
        const res = new BN(minGasPrice.result);
        return res;
    }

    async deployContractHandle(promise: Promise<[Transaction, Contract]>): Promise<[string, Contract, Transaction]> {
        const [deployTx, contract] = await promise;
        if (typeof deployTx.txParams.receipt != "undefined") {
            if (typeof contract.address != "undefined") {
                return [contract.address, contract, deployTx];
            } else {
                throw new Error("There is no contract address");
            }
        } else {
            throw new Error("There is no tx receipt");
        }
    }

    // protected getDefaultAddress(): string {
    //     const acc = this.zil.wallet.defaultAccount;
    //     if (!acc) {
    //         throw new Error("Couldn't get the default account");
    //     } else {
    //         return acc.address;
    //     }
    // }

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
}

export { Core };