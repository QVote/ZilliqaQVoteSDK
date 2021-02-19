import { QVoteContracts } from "../../Utill";
import { BN, Long } from "@zilliqa-js/zilliqa";
export type DeployPayload = [{ version: number, gasPrice: BN, gasLimit: Long.Long }, number, number, boolean]
export type ContractPayload = [string, QVoteContracts.Value[]];
export type CallPayload = [string, QVoteContracts.Value[], { version: number, gasPrice: BN, amount: BN, gasLimit: Long.Long }, number, number, boolean];