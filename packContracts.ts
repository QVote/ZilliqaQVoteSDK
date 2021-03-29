import fs from "fs";
import { resolve } from "path";
import fetch from "node-fetch";

async function getCode(contractName: string) {
  const res = await fetch(
    `https://raw.githubusercontent.com/QVote/ZilliqaContracts/main/contract/${contractName}.scilla`
  );
  const code = await res.text();
  return code;
}

function saveCode(files: { name: string; code: string }[]) {
  let toWrite = "";
  files.forEach((f) => {
    toWrite = toWrite + `export const ${f.name} = \`\n${f.code}\n\`;\n`;
  });
  fs.writeFileSync(resolve("./src/ContractCode/index.ts"), toWrite);
}

const _QVoting = "QVoting";
const _DecisionQueue = "DecisionQueue";
const _Code = "Code";

(async () => {
  try {
    const codeQVoting = await getCode(_QVoting);
    const codeQueue = await getCode(_DecisionQueue);
    saveCode([
      {
        name: _QVoting + _Code,
        code: codeQVoting,
      },
      {
        name: _DecisionQueue + _Code,
        code: codeQueue,
      },
    ]);
  } catch (e) {
    console.log(e);
  }
  process.exit();
})();
