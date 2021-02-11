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
        zil.wallet.setDefault(deployerAddress);
        const qv = new QVoteZilliqa();
        const txblock = await zil.blockchain.getLatestTxBlock();
        const curBlockNumber = parseInt(txblock.result!!.header!!.BlockNum);
        const gasPrice = await qv.getMinGasHandle(zil.blockchain.getMinimumGasPrice());
        const contract = zil.contracts.new(...qv.getContractPayload({
            payload: {
                name: "Test hi",
                description: "Hello hi",
                options: ["opt1", "opt2"],
                creditToTokenRatio: "1000",
                //can register for next 5 min
                registrationEndTime: qv.getFutureTxBlockNumber(curBlockNumber, 1000 * 60 * 5),
                //can vote in 5 min and voting is open for 10 min
                expirationBlock: qv.getFutureTxBlockNumber(curBlockNumber, 1000 * 60 * 15),
                tokenId: "DogeCoinZilToken"
            }, ownerAddress: deployerAddress,
        }));
        const [address, instance, deployTx] = await qv.deployContractHandle(
            contract.deploy(...qv.getDeployPayload({ gasPrice }))
        );
        console.log(address);
        const callTx = await instance.call(...qv.getOwnerRegisterPayload({
            payload: {
                addresses: [deployerAddress],
                creditsForAddresses: [100]
            },
            gasPrice
        }));
        console.log(callTx)

        // Retrieving the transaction receipt (See note 2)
        // @ts-ignore
        console.log(JSON.stringify(callTx.receipt!!, null, 4));
        console.log('Getting contract state...');
        const state = await instance.getState();
        console.log('Getting contract init...');
        const init = await instance.getInit();
        console.log(state, init)

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