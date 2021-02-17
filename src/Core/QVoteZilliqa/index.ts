import { Core } from "../Core";
import { QVotingCode } from "../../ContractCode";
import { defaultProtocol } from "../_config";
import { QVoteContracts } from "../../Utill";
import { BN } from "@zilliqa-js/zilliqa";

class QVoteZilliqa extends Core {

    constructor(protocol = defaultProtocol, secondsPerTxBlockAverage = 60) {
        super(protocol, secondsPerTxBlockAverage, QVotingCode);
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
        return [this.code, init];
    }

    //owner_register(addresses : List ByStr20, credits : List Int32)
    getOwnerRegisterPayload({ payload, gasPrice, gasLimit, amount = 0 }:
        {
            payload: {
                addresses: string[],
                creditsForAddresses: number[]
            }
            amount?: number,
            gasPrice: BN,
            gasLimit?: Long.Long,
        }): [string, QVoteContracts.Value[], { version: number, gasPrice: BN, amount: BN, gasLimit: Long.Long }, number, number, boolean] {
        const callParams = super.getCallParamsPayload({ gasPrice, gasLimit, amount });
        const transitionParams: [string, QVoteContracts.Value[]] = [
            "owner_register",
            [
                //@ts-ignore
                super.createValueParam("List (ByStr20)", "addresses", payload.addresses),
                //@ts-ignore
                super.createValueParam("List (Int32)", "credits", payload.creditsForAddresses.map(x => ("" + x))),
            ],
        ];
        return [...transitionParams, ...callParams];
    }

    //vote(credits_sender: List Int128)	
    getVotePayload({ payload, gasPrice, gasLimit, amount = 0 }:
        {
            payload: {
                creditsToOption: string[]
            }
            amount?: number,
            gasPrice: BN,
            gasLimit?: Long.Long,
        }): [string, QVoteContracts.Value[], { version: number, gasPrice: BN, amount: BN, gasLimit: Long.Long }, number, number, boolean] {
        const callParams = super.getCallParamsPayload({ gasPrice, gasLimit, amount });
        const transitionParams: [string, QVoteContracts.Value[]] = [
            "vote",
            [
                //@ts-ignore
                super.createValueParam("List (Int128)", "credits_sender", payload.creditsToOption),
            ],
        ];
        return [...transitionParams, ...callParams];
    }
}

export { QVoteZilliqa };