// import {
//     time,
//     loadFixture,
//   } from "@nomicfoundation/hardhat-toolbox/network-helpers";
//   import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
//   import { expect } from "chai";
//   import hre, { ethers } from "hardhat";
//   import { MerkleTree } from 'merkletreejs';
//   import keccak256 from 'keccak256';
  
//   describe("MerkleAirdrop", function () {
//     async function deployMerkleAirdropFixture() {
//       const [owner, addr1, addr2] = await ethers.getSigners();
  
//       // Deploy mock ERC20 token
//       const MockToken = await ethers.getContractFactory("MockERC20");
//       const mockToken = await MockToken.deploy("MockToken", "MT", ethers.parseEther("1000000"));
  
//       // Create Merkle tree
//       const leaves = [
//         { address: addr1.address, amount: ethers.parseEther("100") },
//         { address: addr2.address, amount: ethers.parseEther("200") },
//       ].map((x) => ethers.solidityPackedKeccak256(['address', 'uint256'], [x.address, x.amount]));
  
//       const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
//       const root = merkleTree.getHexRoot();
  
//       // Deploy MerkleAirdrop contract
//       const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
//       const merkleAirdrop = await MerkleAirdrop.deploy(mockToken.target, root);
  
//       // Transfer tokens to MerkleAirdrop contract
//       await mockToken.transfer(merkleAirdrop.target, ethers.parseEther("1000"));
  
//       return { merkleAirdrop, mockToken, owner, addr1, addr2, merkleTree };
//     }
  
//     describe("Deployment", function () {
//       it("Should set the right owner", async function () {
//         const { merkleAirdrop, owner } = await loadFixture(deployMerkleAirdropFixture);
//         expect(await merkleAirdrop.owner()).to.equal(owner.address);
//       });
  
//       it("Should set the correct token and merkle root", async function () {
//         const { merkleAirdrop, mockToken, merkleTree } = await loadFixture(deployMerkleAirdropFixture);
//         expect(await merkleAirdrop.token()).to.equal(mockToken.target);
//         expect(await merkleAirdrop.merkleRoot()).to.equal(merkleTree.getHexRoot());
//       });
//     });
  
//     describe("Claiming", function () {
//       it("Should allow valid claims", async function () {
//         const { merkleAirdrop, mockToken, addr1, merkleTree } = await loadFixture(deployMerkleAirdropFixture);
//         const leaf = ethers.solidityPackedKeccak256(['address', 'uint256'], [addr1.address, ethers.parseEther("100")]);
//         const proof = merkleTree.getHexProof(leaf);
  
//         await expect(merkleAirdrop.connect(addr1).claim(proof, ethers.parseEther("100")))
//           .to.emit(merkleAirdrop, "Claimed")
//           .withArgs(addr1.address, ethers.parseEther("100"));
  
//         expect(await mockToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
//       });
  
//       it("Should reject invalid proofs", async function () {
//         const { merkleAirdrop, addr1, merkleTree } = await loadFixture(deployMerkleAirdropFixture);
//         const leaf = ethers.solidityPackedKeccak256(['address', 'uint256'], [addr1.address, ethers.parseEther("100")]);
//         const proof = merkleTree.getHexProof(leaf);
  
//         // Tamper with the proof
//         proof[0] = ethers.hexlify(ethers.randomBytes(32));
  
//         await expect(merkleAirdrop.connect(addr1).claim(proof, ethers.parseEther("100")))
//           .to.be.revertedWith("Invalid proof");
//       });
  
//       it("Should prevent double claims", async function () {
//         const { merkleAirdrop, addr1, merkleTree } = await loadFixture(deployMerkleAirdropFixture);
//         const leaf = ethers.solidityPackedKeccak256(['address', 'uint256'], [addr1.address, ethers.parseEther("100")]);
//         const proof = merkleTree.getHexProof(leaf);
  
//         await merkleAirdrop.connect(addr1).claim(proof, ethers.parseEther("100"));
  
//         await expect(merkleAirdrop.connect(addr1).claim(proof, ethers.parseEther("100")))
//           .to.be.revertedWith("Already claimed");
//       });
//     });
  
//     describe("Withdrawal", function () {
//       it("Should allow owner to withdraw remaining balance", async function () {
//         const { merkleAirdrop, mockToken, owner } = await loadFixture(deployMerkleAirdropFixture);
//         const initialBalance = await mockToken.balanceOf(owner.address);
//         const contractBalance = await mockToken.balanceOf(merkleAirdrop.target);
  
//         await merkleAirdrop.connect(owner).withdrawRemainingBalance();
  
//         expect(await mockToken.balanceOf(owner.address)).to.equal(initialBalance + contractBalance);
//         expect(await mockToken.balanceOf(merkleAirdrop.target)).to.equal(0);
//       });
  
//       it("Should prevent non-owners from withdrawing", async function () {
//         const { merkleAirdrop, addr1 } = await loadFixture(deployMerkleAirdropFixture);
  
//         await expect(merkleAirdrop.connect(addr1).withdrawRemainingBalance())
//           .to.be.revertedWith("Unauthorized access");
//       });
//     });
//   });