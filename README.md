# Anonymous Voting using ZK-SNARKs

This project demonstrates a basic anonymous voting system using ZK-SNARKs. I built this project to learn more about ZK-SNARKs and how they can be used to build privacy-preserving applications. I mostly followed the tutorial by [TheBojda](https://thebojda.medium.com/how-i-built-an-anonymous-voting-system-on-the-ethereum-blockchain-using-zero-knowledge-proof-d5ab286228fd) and made some modifications to the code to add some more voting features and make it work with the latest versions of the libraries.

Anyways, this project uses the same concept as Tornado Cash, which is a privacy-focused Ethereum mixer. The idea is to allow users to deposit funds into a smart contract, and then withdraw them later without revealing their identity. The smart contract uses ZK-SNARKs to prove that the user has the right to withdraw the funds without revealing any information about the user's identity.

In this project, I have implemented a simple voting system where users can vote for a candidate without revealing their identity. The smart contract uses ZK-SNARKs to prove that the user has the right to vote without revealing any information about the user's identity.

In Tornado cash, we are proving to withdraw the funds without revealing the identity of the user. In this project, we are proving to vote for a candidate without revealing the identity of the user.

## Prerequisites

- Node.js
- SnarkJS
- Hardhat
- Circom

## Installation

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `npx hardhat compile` to compile the contracts
4. Run `npx hardhat test` to run the tests

## References

- [Zk-merkle-tree](https://github.com/TheBojda/zk-merkle-tree)
- [How does Tornado Cash work?](https://www.rareskills.io/post/how-does-tornado-cash-work)