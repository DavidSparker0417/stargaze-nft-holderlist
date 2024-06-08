import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import * as fs from 'fs';
import { format } from '@fast-csv/format';
import * as dotenv from 'dotenv'
dotenv.config()
const nftContractAddress:string = process.env.NFT_CONTRACT||""; // NFT contract address

interface NftHolder {
  id: number,
  holder: string
}

const convertToCSV = (holderlist: NftHolder[], outputPath: string) => {
  const ws = fs.createWriteStream(outputPath);
  const csvStream = format({ headers: true });

  csvStream.pipe(ws).on('end', () => process.exit());

  holderlist.forEach((record) => csvStream.write(record));
  csvStream.end();
};

async function getNFTHolders() {
  // Connect to the Cosmos SDK-based blockchain
  const rpcEndpoint = "https://rpc.stargaze-apis.com"; // Example endpoint, replace with the actual endpoint of your Cosmos chain
  const client = await CosmWasmClient.connect(rpcEndpoint);
  
  // Get the number of tokens
  const tokenCount = (await client.queryContractSmart(nftContractAddress, {
    num_tokens: {}
  })).count
  console.log("token count:", tokenCount);

  const holderlist: NftHolder[] = []
  console.log('[id] -------------- holder -----------------------')
  for (let i = 0; i < tokenCount; i++) {
    try {
      const nftHolder = (await client.queryContractSmart(nftContractAddress, {
        owner_of: { token_id: `${i + 1}` }
      })).owner;

      console.log(`[${i + 1}] : ${nftHolder}`);
      holderlist.push({id: i+1, holder: nftHolder})
    } catch (error) {
      console.log(`[${i + 1}] : no holder`);
    }
  }
  convertToCSV(holderlist, 'holderlist.csv')
}

getNFTHolders().catch(console.error);
