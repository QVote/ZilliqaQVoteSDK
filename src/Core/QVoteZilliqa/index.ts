import { Core } from "../Core";
import { Zilliqa, BN, Long } from "@zilliqa-js/zilliqa";
import { Contract } from "@zilliqa-js/contract";
import { QVotingCode } from "../../ContractCode";
import { defaultProtocol } from "../_config";

class QVoteZilliqa extends Core {
    private QVotingCode: string;

    constructor(zil: Zilliqa, protocol = defaultProtocol) {
        super(zil, protocol);
        this.QVotingCode = QVotingCode;
    }

    getQVotingCode(): string {
        return this.QVotingCode;
    }

    async deployQVoting({ payload, gasPrice, gasLimit, ownerAddress }:
        {
            payload: {
                name: string,
                description: string,
                options: string[],
                tokenToCreditRatio: string,
                registrationEndTime: string,
                expirationBlock: string
            },
            gasPrice?: BN,
            gasLimit?: Long.Long,
            ownerAddress?: string
        }): Promise<{ address: string, instance: Contract }> {
        const _gasPrice = gasPrice ? gasPrice : await super.getMinimumGasPrice();
        const _gasLimit = gasLimit ? gasLimit : Long.fromNumber(100000);
        const _ownerAddress = ownerAddress ? ownerAddress : super.getDefaultAddress();
        const init = [
            // Required params
            super.createValueParam("Uint32", "_scilla_version", "0"),
            // QVoting contract params
            super.createValueParam("BNum", "expiration_block", payload.expirationBlock),
            super.createValueParam("String", "name", payload.name),
            super.createValueParam("String", "description", payload.description),
            //@ts-ignore
            super.createValueParam("List (String)", "options", payload.options),
            super.createValueParam("Int32", "token_to_credit_ratio", payload.tokenToCreditRatio),
            super.createValueParam("BNum", "registration_end_time", payload.registrationEndTime),
            super.createValueParam("ByStr20", "owner", _ownerAddress),
        ];
        // Instance of class Contract
        const contract = this.zil.contracts.new(this.QVotingCode, init);
        // Deploy the contract.
        // Also notice here we have a default function parameter named toDs as mentioned above.
        // A contract can be deployed at either the shard or at the DS. Always set this value to false.
        const [deployTx, qvoting] = await contract.deploy(
            {
                version: this.VERSION,
                gasPrice: _gasPrice,
                gasLimit: _gasLimit,
            },
            33,
            1000,
            false,
        );
        if (typeof deployTx.txParams.receipt != "undefined") {
            // Introspect the state of the underlying transaction
            console.log(`Deployment Transaction ID: ${deployTx.id}`);
            console.log("Deployment Transaction Receipt:");
            console.log(deployTx.txParams.receipt);
            // Get the deployed contract address
            console.log("The contract address is:");
            console.log(qvoting.address);
            if (typeof qvoting.address != "undefined") {
                return { address: qvoting.address, instance: qvoting };
            } else {
                throw new Error("There is no contract address");
            }
        } else {
            throw new Error("There is no tx receipt");
        }
    }

}

export { QVoteZilliqa };