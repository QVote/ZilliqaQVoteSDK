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

export function printEvents(tx: Transaction) {
    // @ts-ignore
    if (typeof tx.receipt != "undefined") {
        // @ts-ignore
        if (typeof tx.receipt.event_logs != "undefined") {
            // @ts-ignore
            console.log(JSON.stringify(tx.receipt!.event_logs.map((e: any) => e._eventname), null, 4));
        } else {
            // @ts-ignore
            console.log(JSON.stringify(tx.receipt, null, 4));
        }
    } else {
        console.log(JSON.stringify(tx, null, 4));
    }
}

type Protocol = { chainId: number, msgVersion: number }

type BlockchainInfo = {
    url: string,
    protocol: Protocol
}
export const BLOCKCHAINS: {
    CURRENT: BlockchainInfo,
    TESTNET: BlockchainInfo,
    ZIL_LOCAL_SERVER: BlockchainInfo
} = Object.create({
    CURRENT: {
        url: "",
        protocol: { chainId: 0, msgVersion: 0 },
    },
    TESTNET: {
        url: "https://dev-api.zilliqa.com",
        protocol: { chainId: 333, msgVersion: 1 }
    },
    ZIL_LOCAL_SERVER: {
        url: "http://localhost:5555",
        protocol: { chainId: 222, msgVersion: 1 }
    }
});