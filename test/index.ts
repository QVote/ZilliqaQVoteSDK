import { Zilliqa } from '@zilliqa-js/zilliqa';
import { Transaction } from '@zilliqa-js/account';
import {
    toBech32Address,
} from '@zilliqa-js/crypto';
import fetch from 'node-fetch';
import { QVoteZilliqa } from '../src'

const faucetUrl = "http://localhost:5556/request-funds";
const zilliqaBlockchainUrl = "http://localhost:5555";

function printAddress(prefix: string, add: string) {
    console.log(`${prefix} account address is: ${add}`);
    console.log(`${prefix} account bech32 address is: ${toBech32Address(add)}`);
    return add;
}

async function fundAddress(address: string) {
    try {
        const res = await fetch(faucetUrl, { method: 'POST', body: JSON.stringify({ "address": address }) });
        console.log(`funded the address: ${res.status}`);
    } catch (e) { throw e; }
}

async function getBalance(address: string, zil: Zilliqa) {
    try {       // Get Balance
        const balance = await zil.blockchain.getBalance(address);
        console.log(`Balance of ${address} : `);
        return balance;
    } catch (e) { throw e; }
}

function printReceipt(tx: Transaction) {
    // @ts-ignore
    console.log(JSON.stringify(tx.receipt!!, null, 4));
}

(async () => {
    try {
        /**
         * Run Isolated ZIL server with docker 
         * using ceres or yourself
         */
        const zil = new Zilliqa(zilliqaBlockchainUrl);

        /**
         * Prefunded genesis accounts from the ceres scilla docker zil blockchain
         */
        const deployerAddress = zil.wallet.addByPrivateKey("b87f4ba7dcd6e60f2cca8352c89904e3993c5b2b0b608d255002edcda6374de4");
        const voterAddress = zil.wallet.addByPrivateKey("b8fc4e270594d87d3f728d0873a38fb0896ea83bd6f96b4f3c9ff0a29122efe4");
        printAddress("Deployer ", deployerAddress);
        printAddress("Voter ", voterAddress);
        await getBalance(deployerAddress, zil);
        await getBalance(voterAddress, zil);

        /**
         * Complete Example
        */
        const qv = new QVoteZilliqa();

        /**
         * Get current block number (think of it as a timestamp)
         * Get current minimum gasPrice (price you pay for computation on the blockchain)
        */
        const txblock = await zil.blockchain.getLatestTxBlock();
        const curBlockNumber = parseInt(txblock.result!!.header!!.BlockNum);
        const gasPrice = await qv.getMinGasHandle(zil.blockchain.getMinimumGasPrice());

        /* Deploy a contract */
        zil.wallet.setDefault(deployerAddress);
        const contract = zil.contracts.new(...qv.getContractPayload({
            payload: {
                name: "Test hi",
                description: "Hello hi",
                options: ["opt1", "opt2", "opt3"],
                creditToTokenRatio: "1000",
                //can register for next 0 min
                registrationEndTime: qv.getFutureTxBlockNumber(curBlockNumber, 60 * 0),
                //can vote in 5 min and voting is open for 10 min
                expirationBlock: qv.getFutureTxBlockNumber(curBlockNumber, 60 * 15),
                tokenId: "DogeCoinZilToken"
            }, ownerAddress: deployerAddress,
        }));
        const [address, instance, deployTx] = await qv.deployContractHandle(
            contract.deploy(...qv.getDeployPayload({ gasPrice }))
        );
        console.log(address);

        /* Register addressses */
        const registerTx = await instance.call(...qv.getOwnerRegisterPayload({
            payload: {
                addresses: [deployerAddress, voterAddress],
                creditsForAddresses: [100, 100]
            },
            gasPrice
        }));
        printReceipt(registerTx);

        /* Vote as deployer (we registered this address) */
        const voteTx1 = await instance.call(...qv.getVotePayload({
            payload: {
                //["opt1", "opt2", "opt3"] so we are giving 20 cred to opt1, and -80 to opt2 0 to opt3
                creditsToOption: ["20", "-80", "0"]
            },
            gasPrice
        }));
        printReceipt(voteTx1);

        /* Vote as voter (we registered this address) */
        zil.wallet.setDefault(voterAddress);
        const voteTx2 = await instance.call(...qv.getVotePayload({
            payload: {
                //["opt1", "opt2", "opt3"] so we are giving 20 cred to opt1, and -80 to opt2 0 to opt3
                creditsToOption: ["50", "-30", "-20"]
            },
            gasPrice
        }));
        printReceipt(voteTx2);



        /**
         * Getting contract immutable initial state variables
         * Getting contract mutable state variables
         */
        const init = await instance.getInit()
        const state = await instance.getState()
        const contractState = qv.parseInitAndState(init, state);
        console.log(contractState);

    } catch (err) {
        console.log(err);
    }
    process.exit();
})()