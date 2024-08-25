#!/bin/bash

# Create build and dist directories
mkdir -p build
mkdir -p dist

# Download the Powers of Tau ceremony file
wget -nc https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau -P ./build

# circom test/circuits/CommitmentHasherTest.circom --wasm --r1cs -o ./build
# npx snarkjs groth16 setup build/CommitmentHasherTest.r1cs build/powersOfTau28_hez_final_15.ptau build/CommitmentHasherTest.zkey

# circom test/circuits/MerkleTreeCheckerTest.circom --wasm --r1cs -o ./build
# npx snarkjs groth16 setup build/MerkleTreeCheckerTest.r1cs build/powersOfTau28_hez_final_15.ptau build/MerkleTreeCheckerTest.zkey

# Compile the circuits
circom circuits/Verifier.circom --r1cs -o ./dist
circom circuits/Verifier.circom --wasm -o ./build

#  Generate the proving and verification keys
npx snarkjs groth16 setup dist/Verifier.r1cs build/powersOfTau28_hez_final_15.ptau build/Verifier.zkey
npx snarkjs zkey export verificationkey build/Verifier.zkey build/Verifier_vkey.json

# Export the solidity verifier 
npx snarkjs zkey export solidityverifier build/Verifier.zkey contracts/Verifier.sol
# Replace the pragma solidity version
# sed -i -e 's/pragma solidity \^0.6.11/pragma solidity 0.8.24/g' contracts/Verifier.sol

# Generate the verifier js files from the wasm file
npx wasm2js build/Verifier_js/Verifier.wasm -o src/Verifier.js