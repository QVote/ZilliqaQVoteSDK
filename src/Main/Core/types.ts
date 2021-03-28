import { QVoteContracts } from "../../Utill";
import Long from "long";
import BN from "bn.js";
export type DeployPayload = [
  { version: number; gasPrice: BN; gasLimit: Long.Long },
  number,
  number,
  boolean
];
export type ContractPayload = [string, QVoteContracts.Value[]];
export type CallPayload = [
  string,
  QVoteContracts.Value[],
  { version: number; gasPrice: BN; amount: BN; gasLimit: Long.Long },
  number,
  number,
  boolean
];
export type ContractCall<T> = {
  payload: T;
  amount?: number;
  gasPrice: BN;
  gasLimit?: Long.Long;
};
