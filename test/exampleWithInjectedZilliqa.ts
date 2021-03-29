import { Zilliqa } from "@zilliqa-js/zilliqa";
import { BLOCKCHAINS } from "./utill";
import { QVoteZilliqa } from "../src";
import { QueueZilliqa } from "../src";
import { printEvents } from "./utill";

BLOCKCHAINS.CURRENT = BLOCKCHAINS.ZIL_LOCAL_SERVER;

(async () => {
  try {
    /**
     * Run Isolated ZIL server with docker
     * using ceres or yourself
     */
    const zil = new Zilliqa(BLOCKCHAINS.CURRENT.url);

    /**
     * Prefunded genesis accounts from the ceres scilla docker zil blockchain
     */
    const deployerAddress = zil.wallet.addByPrivateKey(
      "b87f4ba7dcd6e60f2cca8352c89904e3993c5b2b0b608d255002edcda6374de4"
    );
    const voterAddress = zil.wallet.addByPrivateKey(
      "b8fc4e270594d87d3f728d0873a38fb0896ea83bd6f96b4f3c9ff0a29122efe4"
    );
    /**
     * Complete Example 1
     */
    zil.wallet.setDefault(deployerAddress);
    const qv = new QVoteZilliqa(zil, BLOCKCHAINS.CURRENT.protocol);

    /**
     * Get current block number (think of it as a timestamp)
     * Get current minimum gasPrice (price you pay for computation on the blockchain)
     */
    const txblock = await zil.blockchain.getLatestTxBlock();
    const curBlockNumber = parseInt(txblock.result!.header!.BlockNum);

    /* Deploy a contract */
    const [qvotingAddress, qvInstance, deployTx] = await qv.deploy(
      {
        name: "Test hi",
        description: "Hello hi",
        options: ["opt1", "opt2", "opt3", "opt4"],
        creditToTokenRatio: "1000",
        //can register for next 0 min
        registrationEndTime: qv.futureTxBlockNumber(curBlockNumber, 60 * 0),
        //can vote in 0 min and voting is open for 15 min
        expirationBlock: qv.futureTxBlockNumber(curBlockNumber, 60 * 15),
        tokenId: "DogeCoinZilToken",
      },
      deployerAddress
    );
    console.log(qvotingAddress);

    /* Register addressses */
    const registerTx = await qv.ownerRegister(qvInstance, {
      addresses: [deployerAddress, voterAddress],
      creditsForAddresses: [100, 100],
    });
    printEvents(registerTx);

    /* Vote as deployer (we registered this qvotingAddress) */
    const voteTx1 = await qv.vote(qvInstance, {
      // ["opt1", "opt2", "opt3", "opt4"] so we are giving
      // 20 cred to opt1, and -80 to opt2 0 to opt3, 0 to opt4
      creditsToOption: ["20", "-80", "0", "0"],
    });
    printEvents(voteTx1);

    /* Vote as voter (we registered this qvotingAddress) */
    zil.wallet.setDefault(voterAddress);
    const voteTx2 = await qv.vote(qvInstance, {
      creditsToOption: ["50", "-30", "-20", "0"],
    });
    printEvents(voteTx2);

    /**
     * Getting contract immutable initial state variables
     * Getting contract mutable state variables
     */
    const contractState = await qv.getContractState(qvotingAddress);
    console.log(contractState);

    /**
     * Adding qv contract qvotingAddress to a queue
     */

    /**
     * Deploying queue
     */
    zil.wallet.setDefault(deployerAddress);
    const queue = new QueueZilliqa(zil, BLOCKCHAINS.CURRENT.protocol);

    const [address1, queueInstance, deployTx1] = await queue.deploy(
      {
        maxQueueSize: "3",
      },
      deployerAddress
    );


    /**
     * we can also get the instance from a deployed address
     */
    const regeneratedQueueInstance = queue.getInstance(address1);

    /**
     * Pushing address to queue
     */
    const pushTx = await queue.push(regeneratedQueueInstance, {
      addressToPush: qvotingAddress,
    });
    printEvents(pushTx);

    /**
     * Pushing address to queue2
     */
    const pushTx2 = await queue.push(regeneratedQueueInstance, {
      addressToPush: voterAddress,
    });
    printEvents(pushTx2);

    /**
     * Pushing address to queue3
     */
    const pushTx3 = await queue.push(queueInstance, {
      addressToPush: deployerAddress,
    });
    printEvents(pushTx3);

    /**
     * Pushing address to queue4
     */
    const pushTx4 = await queue.push(queueInstance, {
      addressToPush: zil.wallet.create(),
    });
    printEvents(pushTx4);

    /**
     * Getting queue state
     */
    const queueState = await queue.getContractState(address1, 14);
    console.log(queueState);
  } catch (err) {
    console.log(err);
  }
  process.exit();
})();
