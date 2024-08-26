import * as fs from 'fs'
import * as snarkjs from 'snarkjs'
import { ethers } from "hardhat"
import { buildMimcSponge } from 'circomlibjs'
import { assert } from "chai"
import { Groth16Verifier } from "../typechain-types";
import { calculateMerkleRootAndPath, generateCommitment, getVerifierWASM, convertCallData } from '../src/zktree'

const TREE_LEVELS = 20;

try {
    describe("ZK Tree", function () {
        let mimc: any
        let verifier: Groth16Verifier


        before(async() => {
            // deploy the verifier contract
            const Verifier = await ethers.getContractFactory("Groth16Verifier")
            verifier = await Verifier.deploy()
            await verifier.waitForDeployment()

            mimc = await buildMimcSponge()
        })

        it("Testing the verifier circuit", async () => {
            const commitment = await generateCommitment()
            // console.log('commitment', commitment)

            const rootAndPath = calculateMerkleRootAndPath(mimc, TREE_LEVELS, [1, 2, 3, commitment.commitment], commitment.commitment)
            // console.log('rootAndPath', rootAndPath)

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                {
                    nullifier: commitment.nullifier, secret: commitment.secret,
                    pathElements: rootAndPath.pathElements, pathIndices: rootAndPath.pathIndices
                },
                getVerifierWASM(),
                "build/Verifier.zkey"
            );

            assert.equal(publicSignals[0], commitment.nullifierHash)
            assert.equal(publicSignals[1], rootAndPath.root)

            const vKey = JSON.parse(fs.readFileSync("build/Verifier_vkey.json").toString());
            const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
            assert(res)

            const cd = convertCallData(await snarkjs.groth16.exportSolidityCallData(proof, publicSignals));
            // console.log(cd);

            const verifyRes = await verifier.verifyProof(cd.a, cd.b, cd.c, cd.input);
            // console.log(verifyRes)
            assert(verifyRes)
        })

        // This test is part of the ZKTree test 
        // available at https://github.com/TheBojda/zk-merkle-tree/blob/main/test/zktree_test.ts

    });    
} catch (error: any) {
    console.log(error.message);
}