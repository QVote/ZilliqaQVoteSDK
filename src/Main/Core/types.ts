import { BN, Long } from "@zilliqa-js/zilliqa";
export type DeployPayload = [{ version: number, gasPrice: BN, gasLimit: Long.Long }, number, number, boolean]