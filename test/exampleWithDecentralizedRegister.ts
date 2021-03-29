import { Zilliqa } from "@zilliqa-js/zilliqa";
import { QVoteZilliqa } from "../src";
import { printEvents, BLOCKCHAINS } from "./utill";

/**
 * @notice this is not implemented yet on the smart contract side
 * since Zilliqa does not support contract state reads
 * @param zil
 * @param deployerAddress
 * @param voterAddress
 */
export async function exampleWithDecentralizedRegister(
  zil: Zilliqa,
  deployerAddress: string,
  voterAddress: string
): Promise<void> {
  /**
   * Complete Example With Decentralized Register
   */
  const qv = new QVoteZilliqa(undefined, BLOCKCHAINS.CURRENT.protocol);

  /**
   * Get current block number (think of it as a timestamp)
   * Get current minimum gasPrice (price you pay for computation on the blockchain)
   */
  const txblock = await zil.blockchain.getLatestTxBlock();
  const curBlockNumber = parseInt(txblock.result!.header!.BlockNum);
  const gasPrice = await qv.handleMinGas(zil.blockchain.getMinimumGasPrice());

  /* Deploy a contract */
  zil.wallet.setDefault(deployerAddress);
  const contract = zil.contracts.new(
    ...qv.payloadQv({
      payload: {
        name: "Test hi",
        description: "Hello hi",
        options: ["opt1", "opt2", "opt3", "opt4"],
        creditToTokenRatio: "1000",
        //can register for next ~5 min
        registrationEndTime: qv.futureTxBlockNumber(curBlockNumber, 60 * 5),
        //can vote in ~5 min and voting is open for ~10 min
        expirationBlock: qv.futureTxBlockNumber(curBlockNumber, 60 * 15),
        tokenId: "DogeCoinZilToken",
      },
      ownerAddress: deployerAddress,
    })
  );
  const [address, instance, deployTx] = await qv.handleDeploy(
    contract.deploy(...qv.payloadDeploy({ gasPrice }))
  );
  console.log(address);

  /* Decentralized register (deployerAddress since it was set default in zil sdk)*/
  const registerTx = await instance.call(
    ...qv.payloadRegister({
      gasPrice,
    })
  );
  printEvents(registerTx);

  /* Decentralized register (voterAddress)*/
  zil.wallet.setDefault(voterAddress);
  const registerTx1 = await instance.call(
    ...qv.payloadRegister({
      gasPrice,
    })
  );
  printEvents(registerTx1);

  /**
   *
   * Here you could wait ~5 min and vote like in example1
   */

  await (async () => new Promise((res) => setTimeout(res, 20000)))();

  /**
   * Getting contract immutable initial state variables
   * Getting contract mutable state variables
   */
  const init = await zil.blockchain.getSmartContractInit(address);
  const state = await zil.blockchain.getSmartContractState(address);
  const contractState = qv.parseInitAndState(init.result!, state.result);
  console.log(contractState);
}
