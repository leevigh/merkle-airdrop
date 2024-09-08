// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";



contract MerkleAirdrop {

    address public owner;
    bytes32 public merkleRoot;
    IERC20 public token;

    mapping(address => bool) public hasClaimed;

    event Claimed(address indexed participant, uint256 amount);
    event ClaimSuccessful();
    
    constructor(address _token, bytes32 _merkleRoot) {
        token = IERC20(_token);
        merkleRoot = _merkleRoot;
        owner = msg.sender;
    }
    


    function claim(bytes32[] memory proof,uint256 amount) public {
        require(!hasClaimed[msg.sender], "Already claimed");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));

        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");

        hasClaimed[msg.sender] = true;
        IERC20(token).transfer(msg.sender, amount);

        emit Claimed(msg.sender, amount);
    }

    function withdrawRemainingBalance() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner, balance), "Transfer failed");
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Unauthorized access");
        _;
    }

}

