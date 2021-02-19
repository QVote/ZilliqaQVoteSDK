import { Core } from "../Core";
import { DecisionQueueCode } from "../../ContractCode";
import { defaultProtocol } from "../_config";
import { ContractPayload } from "../Core/types";

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

}

export { QueueZilliqa };