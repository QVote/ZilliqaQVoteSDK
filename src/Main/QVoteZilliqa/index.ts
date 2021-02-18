import { Core } from "../Core";
import { QVotingCode } from "../../ContractCode";
import { defaultProtocol } from "../_config";
import { QVoteContracts } from "../../Utill";
import { BN } from "@zilliqa-js/zilliqa";
import { QVPayload, CallPayload } from "./types";

class QVoteZilliqa extends Core {

    /**
     * @param protocol the chain id and the message version of the used blockchain
     * @param secondsPerTxBlockAverage the seconds on average it takes for a new 
     * transaction block to be created
     */
    constructor(protocol = defaultProtocol, secondsPerTxBlockAverage = 60) {
        super(protocol, secondsPerTxBlockAverage, QVotingCode);
    }

    /**
     * @description 
     * Converts the raw init and mutable state of the QV contract
     * into a more approachable js object
     * divides the votes for each option by 100 to get the actual value
     * populates unvoted options with 0
     * strips away the wrapper for states
     * @param init The immutable state of the contract
     * @param state The mutable state of the contract
     * @example
     * const init = await contractInstance.getInit();
     * const state = await contractInstance.getState();
     * const contractState = qv.parseInitAndState(init, state);
     */
    parseInitAndState(init: QVoteContracts.Value[], state: { [key: string]: any }): { [key: string]: any } {
        const res = super.stripInit(init);
        const votesKey = "options_to_votes_map";
        const optionsKey = "options";
        type votesMap = { [key: string]: number };
        const votesMapInit = res[optionsKey].reduce((prev: votesMap, k: string) => {
            prev[k] = 0;
            return prev;
        }, {});
        const resState = {
            ...state,
            [votesKey]: Object.entries(state[votesKey] as { [key: string]: string })
                .reduce((prev: votesMap, [k, v]) => {
                    prev[k] = (parseInt(v) / 100);
                    return prev;
                }, votesMapInit)
        };
        return { ...resState, ...res };
    }

    payloadQv({ payload, ownerAddress }: {
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
    }): QVPayload {
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
    payloadOwnerRegister({ payload, gasPrice, gasLimit, amount = 0 }:
        {
            payload: {
                addresses: string[],
                creditsForAddresses: number[]
            }
            amount?: number,
            gasPrice: BN,
            gasLimit?: Long.Long,
        }): CallPayload {
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
    payloadVote({ payload, gasPrice, gasLimit, amount = 0 }:
        {
            payload: {
                creditsToOption: string[]
            }
            amount?: number,
            gasPrice: BN,
            gasLimit?: Long.Long,
        }): CallPayload {
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

    //register()
    payloadRegister({ gasPrice, gasLimit, amount = 0 }:
        {
            amount?: number,
            gasPrice: BN,
            gasLimit?: Long.Long,
        }): CallPayload {
        const callParams = super.getCallParamsPayload({ gasPrice, gasLimit, amount });
        const transitionParams: [string, QVoteContracts.Value[]] = [
            "register", [],
        ];
        return [...transitionParams, ...callParams];
    }
}

export { QVoteZilliqa };