import { Core } from "../Core";
import { BN, Long } from "@zilliqa-js/zilliqa";
import { QVotingCode } from "../../ContractCode";
import { defaultProtocol } from "../_config";
import { QVoteContracts } from "../../Utill";

class QVoteZilliqa extends Core {
    private QVotingCode: string;

    constructor(protocol = defaultProtocol) {
        super(protocol);
        this.QVotingCode = QVotingCode;
    }

    getDeployPayload({ gasPrice, gasLimit }: {
        gasPrice: BN,
        gasLimit?: Long.Long,
    }): [{ version: number, gasPrice: BN, gasLimit: Long.Long }, number, number, boolean] {
        const _gasPrice = gasPrice;
        const _gasLimit = gasLimit ? gasLimit : Long.fromNumber(100000);
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

    getContractPayload({ payload, ownerAddress }: {
        payload: {
            name: string,
            description: string,
            options: string[],
            creditToTokenRatio: string,
            registrationEndTime: string,
            expirationBlock: string,
            tokenId: string
        },
        ownerAddress: string,
    }): [string, QVoteContracts.Value[]] {
        const _ownerAddress = ownerAddress;
        const init = [
            // Required params
            super.createValueParam("Uint32", "_scilla_version", "0"),
            // QVoting contract params
            super.createValueParam("BNum", "expiration_block", payload.expirationBlock),
            super.createValueParam("String", "name", payload.name),
            super.createValueParam("String", "description", payload.description),
            //@ts-ignore
            super.createValueParam("List (String)", "options", payload.options),
            super.createValueParam("Int32", "credit_to_token_ratio", payload.creditToTokenRatio),
            super.createValueParam("BNum", "registration_end_time", payload.registrationEndTime),
            super.createValueParam("ByStr20", "owner", _ownerAddress),
            super.createValueParam("String", "token_id", payload.tokenId)
        ];
        return [this.QVotingCode, init];
    }
}

export { QVoteZilliqa };