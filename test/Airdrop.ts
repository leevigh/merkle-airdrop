import {
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
//   import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre, { ethers } from "hardhat";
  import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
  
  describe("MerkleAirdrop", function () {
    async function deployMerkleAirdropFixture() {
      const [owner, addr1, addr2] = await ethers.getSigners();
  
      // Deploy mock ERC20 token
      const MockToken = await ethers.getContractFactory("MockERC20");
      const mockToken = await MockToken.deploy();
  
      // Create Merkle tree
    //   const leaves = [
    //     { address: addr1.address, amount: ethers.parseEther("100") },
    //     { address: addr2.address, amount: ethers.parseEther("200") },
    //   ].map((x) => ethers.solidityPackedKeccak256(['address', 'uint256'], [x.address, x.amount]));

    const leaves = [
        [ addr1.address,  ethers.parseEther("100") ],
        [ addr2.address, ethers.parseEther("200") ],
    ]
  
    //   const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    //   const root = merkleTree.getHexRoot();
    const merkleTree = StandardMerkleTree.of(leaves, ["address", "uint256"])
  
      // Deploy MerkleAirdrop contract
      const MerkleAirdropInstance = await ethers.getContractFactory("MerkleAirdrop");
      const merkleAirdrop = await MerkleAirdropInstance.deploy(mockToken.target, merkleTree.root);
  
      // Transfer tokens to MerkleAirdrop contract
      await mockToken.transfer(await merkleAirdrop.getAddress(), ethers.parseEther("100000"));
  
      return { merkleAirdrop, mockToken, owner, addr1, addr2, merkleTree };
    }
  
    describe("Deployment", function () {
      it("Should set the correct owner", async function () {
        const { merkleAirdrop, owner } = await loadFixture(deployMerkleAirdropFixture);
        expect(await merkleAirdrop.owner()).to.equal(owner.address);
      });
  
      it("Should set the correct token and merkle root", async function () {
        const { merkleAirdrop, mockToken, merkleTree } = await loadFixture(deployMerkleAirdropFixture);
        expect(await merkleAirdrop.token()).to.equal(await mockToken.getAddress());
        expect(await merkleAirdrop.merkleRoot()).to.equal(merkleTree.root);
      });
    });
  
    describe("Claiming", function () {
      it("Should allow valid claims", async function () {
        const { merkleAirdrop, mockToken, addr1, merkleTree } = await loadFixture(deployMerkleAirdropFixture);
        // const leaf = ethers.solidityPackedKeccak256(['address', 'uint256'], [addr1.address, ethers.parseEther("100")]);
        const proof = merkleTree.getProof(0);
  
        await expect(merkleAirdrop.connect(addr1).claim(proof, ethers.parseEther("100")))
          .to.emit(merkleAirdrop, "Claimed")
          .withArgs(addr1.address, ethers.parseEther("100"));
  
        expect(await mockToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
      });
  
      it("Should reject invalid proofs", async function () {
        const { merkleAirdrop, addr1, merkleTree } = await loadFixture(deployMerkleAirdropFixture);
        // const leaf = ethers.solidityPackedKeccak256(['address', 'uint256'], [addr1.address, ethers.parseEther("100")]);
        // const proof = merkleTree.getHexProof(leaf);
        const proof = merkleTree.getProof(0);
  
        // Tamper with the proof
        proof[0] = ethers.hexlify(ethers.randomBytes(32));
  
        await expect(merkleAirdrop.connect(addr1).claim(proof, ethers.parseEther("100")))
          .to.be.revertedWith("Invalid proof");
      });
  
      it("Should prevent double claims", async function () {
            const { merkleAirdrop, addr2, merkleTree } = await loadFixture(deployMerkleAirdropFixture);
            // const leaf = ethers.solidityPackedKeccak256(['address', 'uint256'], [addr1.address, ethers.parseEther("100")]);
            const proof = merkleTree.getProof(1);
    
            // First claim here
            await merkleAirdrop.connect(addr2).claim(proof, ethers.parseEther("200"));
    
            // Second claim here to test for double claim
            await expect(merkleAirdrop.connect(addr2).claim(proof, ethers.parseEther("200")))
            .to.be.revertedWith("Already claimed");

        });
    });
  
    describe("Withdrawal", function () {
      it("Should allow owner to withdraw remaining balance", async function () {
        const { merkleAirdrop, mockToken, owner } = await loadFixture(deployMerkleAirdropFixture);
        const ownerInitialBalance = await mockToken.balanceOf(owner.address);
        const contractBalance = await mockToken.balanceOf(merkleAirdrop.getAddress());
  
        await merkleAirdrop.connect(owner).withdrawRemainingBalance();
  
        expect(await mockToken.balanceOf(owner.address)).to.equal(ownerInitialBalance + contractBalance);
        expect(await mockToken.balanceOf(merkleAirdrop.getAddress())).to.equal(0);
      });
  
      it("Should prevent other accounts from withdrawing", async function () {
        const { merkleAirdrop, addr1 } = await loadFixture(deployMerkleAirdropFixture);
  
        await expect(merkleAirdrop.connect(addr1).withdrawRemainingBalance())
          .to.be.revertedWith("Unauthorized access");
      });
    });
  });