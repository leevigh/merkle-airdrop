import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";
import csv from "csv-parser";

const values = [];
fs.createReadStream("airdrop.csv")
  .pipe(csv())
  .on("data", (row) => {
    values.push([row.Address, row.Amount]);
  })
  .on("end", () => {
    const tree = StandardMerkleTree.of(values, ["address", "uint256"]);
    console.log("Merkle Root:", tree.root);

    // Write the tree to a JSON file
    fs.writeFileSync("tree.json", JSON.stringify(tree.dump()));

    // Initialize an object to store proofs for all addresses
    const proofs = {};

    try {
      const loadedTree = StandardMerkleTree.load(JSON.parse(fs.readFileSync("tree.json", "utf8")));
      for (const [i, v] of loadedTree.entries()) {
        // Get the proof for each address
        const proof = loadedTree.getProof(i);
        proofs[v[0]] = proof; // Store the proof with the address as the key
      }

      // Write all proofs to a JSON file
      fs.writeFileSync("proofs.json", JSON.stringify(proofs, null, 2));
      console.log("All proofs have been saved to 'proofs.json'.");
      
    } catch (err) {
      console.error("Error reading or processing 'tree.json':", err);
    }
  })
  .on("error", (err) => {
    console.error("Error reading 'airdrop.csv':", err);
  });


// const fs = require("fs");
// const keccak = require("keccak256");
// const csvParser = require("csv-parser");
// const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

// let addresses = [];
// let amounts = [];

// // use fs to read csv file
// fs.createReadStream("airdrop.csv").pipe(csvParser()).on("data", (row) => {
//     addresses.push(row.Address);
//     amounts.push(row.Amount);
// }).on("end", () => {

//     console.log("CSV file read successful");

//     // Combine addresses and amounts into a 'values' array as [address, amount] tuples
//     let values = addresses.map(function (address, i) {
//         return [address, amounts[i].toString()]; // Ensure the amount is in string format
//     });

//     const tree = StandardMerkleTree.of(values, ["address", "uint256"]);
//     console.log("Merkle Root:", tree.root);

//     // Write the tree to a JSON file
//     fs.writeFileSync("tree.json", JSON.stringify(tree.dump()));

//     // Initialize an object to store proofs for all addresses
//     let proofs = {};

//     try {
//         // Load the Merkle tree from the JSON file
//         let loadedTree = StandardMerkleTree.load(JSON.parse(fs.readFileSync("tree.json", "utf8")));
  
//         // Iterate over each entry in the loaded tree
//         loadedTree.entries().forEach(function (entry, i) {
//           let address = entry[0]; // Get the address from the entry
//           let amount = entry[1]; // Get the amount from the entry
//           let proof = loadedTree.getProof(i); // Get the Merkle proof for this entry
  
//           // Store the proof with the address as the key
//           proofs[address] = {
//             amount: amount,
//             proof: proof,
//           };
  
//           // Check if the specific address matches and print its proof
//         //   if (address === "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2") {
//         //     console.log("Proof:", proof);
//         //   }
//         });
  
//         // Write all proofs to a JSON file
//         fs.writeFileSync("proofs.json", JSON.stringify({ rootHash: tree.root, proofs: proofs }, null, 2));
//         console.log("All proofs have been saved to 'proofs.json'.");
//       } catch (err) {
//         console.error("Error reading or processing 'tree.json':", err);
//       }

//     // console.log("CSV file read successful");

//     // const leafNodes = addresses.map((address, i) => {
//     //     return keccak(address + amounts[i]);
//     // })

//     // const merkleTree = new MerkleTree(leafNodes, keccak, {
//     //     sortPairs: true,
//     // })

//     // const loadedTree = StandardMerkleTree.load(JSON.parse(fs.readFileSync("tree.json", "utf8")));
//     //   for (const [i, v] of loadedTree.entries()) {
//     //     if (v[0] === '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2') {
//     //       const proof = loadedTree.getProof(i);
//     //       console.log('Proof:', proof);
//     //     }
//     // }

//     // const rootHash = merkleTree.getRoot().toString("hex");

//     // console.log("Root Hash", rootHash);

//     // // Generate Proofs
//     // const proofs = {};

//     // addresses.forEach((address, i) => {
//     //     const leaf = keccak(address + amounts[i]);
//     //     const proof = merkleTree.getHexProof(leaf);
//     //     proofs[address] = {
//     //         amount: amounts[i],
//     //         proof: proof
//     //     } 
//     // })

//     // fs.writeFileSync("proofs.json", JSON.stringify({ rootHash, proofs }, null, 2))
// })
