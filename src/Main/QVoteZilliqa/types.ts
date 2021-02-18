import { QVoteContracts } from "../../Utill";
import { BN } from "@zilliqa-js/zilliqa";
export type QVPayload = [string, QVoteContracts.Value[]];
export type CallPayload = [string, QVoteContracts.Value[], { version: number, gasPrice: BN, amount: BN, gasLimit: Long.Long }, number, number, boolean];