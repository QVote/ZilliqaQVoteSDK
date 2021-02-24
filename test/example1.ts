import { Zilliqa } from "@zilliqa-js/zilliqa";
import { QVoteZilliqa } from "../src";
import { QueueZilliqa } from '../src';
import { printEvents, BLOCKCHAINS } from "./utill";

export async function example1(zil: Zilliqa, deployerAddress: string, voterAddress: string) {
    /**
     * Complete Example 1
    */
    const qv = new QVoteZilliqa(BLOCKCHAINS.CURRENT.protocol);

    /**
     * Get current block number (think of it as a timestamp)
     * Get current minimum gasPrice (price you pay for computation on the blockchain)
    */
    const txblock = await zil.blockchain.getLatestTxBlock();
    const curBlockNumber = parseInt(txblock.result!.header!.BlockNum);
    const gasPrice = await qv.handleMinGas(zil.blockchain.getMinimumGasPrice());

    /* Deploy a contract */
    zil.wallet.setDefault(deployerAddress);
    const contract = zil.contracts.new(...qv.payloadQv({
        payload: {
            name: "Test hi",
            description: "Hello hi",
            options: ["opt1", "opt2", "opt3", "opt4"],
            creditToTokenRatio: "1000",
            //can register for next 0 min
            registrationEndTime: qv.futureTxBlockNumber(curBlockNumber, 60 * 0),
            //can vote in 0 min and voting is open for 15 min
            expirationBlock: qv.futureTxBlockNumber(curBlockNumber, 60 * 15),
            tokenId: "DogeCoinZilToken"
        }, ownerAddress: deployerAddress,
    }));
    const [qvotingAddress, instance, deployTx] = await qv.handleDeploy(
        contract.deploy(...qv.payloadDeploy({ gasPrice }))
    );
    console.log(qvotingAddress);

    /* Register addressses */
    const registerTx = await instance.call(...qv.payloadOwnerRegister({
        payload: {
            addresses: [deployerAddress, voterAddress],
            creditsForAddresses: [100, 100]
        },
        gasPrice
    }));
    printEvents(registerTx);

    /* Vote as deployer (we registered this qvotingAddress) */
    const voteTx1 = await instance.call(...qv.payloadVote({
        payload: {
            // ["opt1", "opt2", "opt3", "opt4"] so we are giving
            // 20 cred to opt1, and -80 to opt2 0 to opt3, 0 to opt4
            creditsToOption: ["20", "-80", "0", "0"]
        },
        gasPrice
    }));
    printEvents(voteTx1);

    /* Vote as voter (we registered this qvotingAddress) */
    zil.wallet.setDefault(voterAddress);
    const voteTx2 = await instance.call(...qv.payloadVote({
        payload: {
            creditsToOption: ["50", "-30", "-20", "0"]
        },
        gasPrice
    }));
    printEvents(voteTx2);


    await (async () => new Promise((res) => setTimeout(res, 20000)))();

    /**
     * Getting contract immutable initial state variables
     * Getting contract mutable state variables
     */
    const init = await zil.blockchain.getSmartContractInit(qvotingAddress);
    const state = await zil.blockchain.getSmartContractState(qvotingAddress);
    const contractState = qv.parseInitAndState(init.result!!, state.result);
    console.log(contractState);

    /**
     * Adding qv contract qvotingAddress to a queue
     */

    /**
     * Deploying queue
     */
    zil.wallet.setDefault(deployerAddress);
    const queue = new QueueZilliqa(BLOCKCHAINS.CURRENT.protocol);

    const queueContract = zil.contracts.new(...queue.payloadQueue({
        payload: {
            maxQueueSize: "3",
        }, ownerAddress: deployerAddress,
    }));
    const [address1, queueInstance, deployTx1] = await queue.handleDeploy(
        queueContract.deploy(...queue.payloadDeploy({ gasPrice }))
    );

    /**
     * Pushing address to queue
     */
    const pushTx = await queueInstance.call(...queue.payloadPushQueue({
        payload: {
            addressToPush: qvotingAddress
        },
        gasPrice
    }));
    printEvents(pushTx);

    /**
     * Pushing address to queue2
     */
    await queueInstance.call(...queue.payloadPushQueue({
        payload: {
            addressToPush: voterAddress
        },
        gasPrice
    }));

    /**
     * Pushing address to queue3
     */
    await queueInstance.call(...queue.payloadPushQueue({
        payload: {
            addressToPush: deployerAddress
        },
        gasPrice
    }));

    /**
     * Pushing address to queue4
     */
    await queueInstance.call(...queue.payloadPushQueue({
        payload: {
            addressToPush: zil.wallet.create()
        },
        gasPrice
    }));

    await (async () => new Promise((res) => setTimeout(res, 20000)))();
    
    /**
     * Getting queue state
     */
    const queueState = await zil.blockchain.getSmartContractState(address1);
    console.log(queueState.result);

}

