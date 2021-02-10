import { Zilliqa, bytes, BN } from "@zilliqa-js/zilliqa";
import { QVoteContracts } from "../Utill";
import { defaultProtocol } from "./_config";

class Core {
    protected zil: Zilliqa;
    protected VERSION: number;

    constructor(zilliqa: Zilliqa, protocol = defaultProtocol) {
        this.zil = zilliqa;
        this.VERSION = bytes.pack(protocol.chainId, protocol.msgVersion);
    }

    protected async getMinimumGasPrice(): Promise<BN> {
        const minGasPrice = await this.zil.blockchain.getMinimumGasPrice();
        if (typeof minGasPrice.result == "undefined") {
            throw new Error("Couldn't get minimum gas price");
        }
        const res = new BN(minGasPrice.result);
        return res;
    }

    protected getDefaultAddress(): string {
        const acc = this.zil.wallet.defaultAccount;
        if (!acc) {
            throw new Error("Couldn't get the default account");
        } else {
            return acc.address;
        }
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
}

export { Core };