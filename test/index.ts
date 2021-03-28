import { Zilliqa } from "@zilliqa-js/zilliqa";
import { printAddress, getBalance, BLOCKCHAINS } from "./utill";
import { example1 } from "./example1";
import { exampleWithDecentralizedRegister } from "./exampleWithDecentralizedRegister";

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
    printAddress("Deployer ", deployerAddress);
    printAddress("Voter ", voterAddress);
    await getBalance(deployerAddress, zil);
    await getBalance(voterAddress, zil);

    console.log("*** EXAMPLE1 ***");
    await example1(zil, deployerAddress, voterAddress);
    console.log("*** EXAMPLE WITH DECENTRALIZED REGISTER ***");
    await exampleWithDecentralizedRegister(zil, deployerAddress, voterAddress);
  } catch (err) {
    console.log(err);
  }
  process.exit();
})();
