import { Zilliqa } from "@zilliqa-js/zilliqa";
import { QVoteZilliqa } from "../src";
import { printReceipt } from "./utill";

export async function example1(zil: Zilliqa, deployerAddress: string, voterAddress: string) {
    /**
     * Complete Example 1
    */
    const qv = new QVoteZilliqa();

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
    const [address, instance, deployTx] = await qv.handleDeploy(
        contract.deploy(...qv.payloadDeploy({ gasPrice }))
    );
    console.log(address);

    /* Register addressses */
    const registerTx = await instance.call(...qv.payloadOwnerRegister({
        payload: {
            addresses: [deployerAddress, voterAddress],
            creditsForAddresses: [100, 100]
        },
        gasPrice
    }));
    printReceipt(registerTx);

    /* Vote as deployer (we registered this address) */
    const voteTx1 = await instance.call(...qv.payloadVote({
        payload: {
            // ["opt1", "opt2", "opt3", "opt4"] so we are giving
            // 20 cred to opt1, and -80 to opt2 0 to opt3, 0 to opt4
            creditsToOption: ["20", "-80", "0", "0"]
        },
        gasPrice
    }));
    printReceipt(voteTx1);

    /* Vote as voter (we registered this address) */
    zil.wallet.setDefault(voterAddress);
    const voteTx2 = await instance.call(...qv.payloadVote({
        payload: {
            creditsToOption: ["50", "-30", "-20", "0"]
        },
        gasPrice
    }));
    printReceipt(voteTx2);



    /**
     * Getting contract immutable initial state variables
     * Getting contract mutable state variables
     */
    const init = await instance.getInit();
    const state = await instance.getState();
    const contractState = qv.parseInitAndState(init, state);
    console.log(contractState);
}