import { toBech32Address, Zilliqa } from "@zilliqa-js/zilliqa";
import { Transaction } from "@zilliqa-js/account";
import fetch from "node-fetch";

export function printAddress(prefix: string, add: string) {
    console.log(`${prefix} account address is: ${add}`);
    console.log(`${prefix} account bech32 address is: ${toBech32Address(add)}`);
    return add;
}

export async function fundAddress(faucetUrl: string, address: string) {
    const res = await fetch(faucetUrl, { method: "POST", body: JSON.stringify({ "address": address }) });
    console.log(`funded the address: ${res.status}`);
}

export async function getBalance(address: string, zil: Zilliqa) {
    // Get Balance
    const balance = await zil.blockchain.getBalance(address);
    console.log(`Balance of ${address} : `);
    return balance;
}

export function printReceipt(tx: Transaction) {
    // @ts-ignore
    console.log(JSON.stringify(tx.receipt!, null, 4));
}