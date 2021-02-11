import { Zilliqa, BN } from '@zilliqa-js/zilliqa';
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
        console.log(balance)
        return balance;
    } catch (e) { throw e; }
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

        /* Deploy a contract */
        const qv = new QVoteZilliqa();
        const gasPrice = await qv.getMinGasHandle(zil.blockchain.getMinimumGasPrice());
        const contract = zil.contracts.new(...qv.getContractPayload({
            payload: {
                name: "Test hi",
                description: "Hello hi",
                options: ["opt1", "opt2"],
                creditToTokenRatio: "1000",
                registrationEndTime: "100",
                expirationBlock: "1000000",
                tokenId: "DogeCoinZilToken"
            }, ownerAddress: deployerAddress,
        }));
        const [address, instance, deployTx] = await qv.deployContractHandle(
            contract.deploy(...qv.getDeployPayload({ gasPrice }))
        );
        console.log(deployTx);
        console.log(instance);
        console.log(address);
        /* Deploy a contract */


        // // Create a new timebased message and call setHello
        // // Also notice here we have a default function parameter named toDs as mentioned above.
        // // For calling a smart contract, any transaction can be processed in the DS but not every transaction can be processed in the shards.
        // // For those transactions are involved in chain call, the value of toDs should always be true.
        // // If a transaction of contract invocation is sent to a shard and if the shard is not allowed to process it, then the transaction will be dropped.
        // const newMsg = 'Hello, the time is ' + Date.now();
        // console.log('Calling setHello transition with msg: ' + newMsg);
        // const callTx = await hello.call(
        //     'setHello',
        //     [
        //         {
        //             vname: 'msg',
        //             type: 'String',
        //             value: newMsg,
        //         },
        //     ],
        //     {
        //         // amount, gasPrice and gasLimit must be explicitly provided
        //         version: VERSION,
        //         amount: new BN(0),
        //         gasPrice: myGasPrice,
        //         gasLimit: Long.fromNumber(8000),
        //     },
        //     33,
        //     1000,
        //     false,
        // );

        // // Retrieving the transaction receipt (See note 2)
        // // @ts-ignore
        // console.log(JSON.stringify(callTx.receipt!!, null, 4));

        // //Get the contract state
        // console.log('Getting contract state...');
        // const state = await deployedContract.getState();
        // console.log('The state of the contract is:');
        // console.log(JSON.stringify(state, null, 4));
    } catch (err) {
        console.log(err);
    }
    process.exit();
})()