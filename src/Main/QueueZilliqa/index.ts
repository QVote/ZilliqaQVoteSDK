import { Core } from "../Core";
import { DecisionQueueCode } from "../../ContractCode";
import { defaultProtocol } from "../_config";
import { ContractPayload, CallPayload, ContractCall } from "../Core/types";
import { QVoteContracts } from "../../Utill";

class QueueZilliqa extends Core {

    /**
     * @param protocol the chain id and the message version of the used blockchain
     * @param secondsPerTxBlockAverage the seconds on average it takes for a new 
     * transaction block to be created
     */
    constructor(protocol = defaultProtocol, secondsPerTxBlockAverage = 60) {
        super(protocol, secondsPerTxBlockAverage, DecisionQueueCode);
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
    payloadQueue({ payload, ownerAddress }: {
        payload: {
            maxQueueSize: string,
        },
        ownerAddress: string,
    }): ContractPayload {
        const _ownerAddress = ownerAddress;
        const init = [
            // Required params
            super.createValueParam("Uint32", "_scilla_version", "0"),
            super.createValueParam("ByStr20", "owner", _ownerAddress),
            super.createValueParam("Uint32", "max_queue_size", payload.maxQueueSize),
            super.createValueParam("Bool", "is_decision_queue", { "constructor": "True", "argtypes": [], "arguments": [] }),
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
    payloadPushQueue({ payload, gasPrice, gasLimit, amount = 0 }:
        ContractCall<{
            addressToPush: string
        }>
    ): CallPayload {
        const callParams = super.getCallParamsPayload({ gasPrice, gasLimit, amount });
        const transitionParams: [string, QVoteContracts.Value[]] = [
            "pushToQueue",
            [
                super.createValueParam("ByStr20", "addr", payload.addressToPush),
            ],
        ];
        return [...transitionParams, ...callParams];
    }

}

export { QueueZilliqa };