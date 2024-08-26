import * as fs from 'fs'
import * as snarkjs from 'snarkjs'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers } from "hardhat"
import { buildMimcSponge, mimcSpongecontract } from 'circomlibjs'
import { assert, expect } from "chai"
import { AnonymousVoting, Groth16Verifier } from "../typechain-types";
import { generateZeros, calculateMerkleRootAndPath, checkMerkleProof, generateCommitment, calculateMerkleRootAndPathFromEvents, getVerifierWASM, convertCallData, calculateMerkleRootAndZKProof } from '../src/zktree'

const SEED = "mimcsponge";
const TREE_LEVELS = 20;
const NO_OF_CANDIDATES = 2;

try {
    describe("Anonymous Voting", function () {
        let mimcSponge: any
        let mimc: any
        let verifier: Groth16Verifier
        let anonymousVoting: AnonymousVoting
        let owner: SignerWithAddress
        let accounts: SignerWithAddress[]
        let voters: SignerWithAddress[]
        let commitment1: any


        before(async() => {
            [ owner, ...accounts] = await ethers.getSigners()
            voters = accounts.slice(0,3)
            console.log('owner', owner.address)
            console.log('accounts', accounts.length)

            // deploy the verifier contract
            const Verifier = await ethers.getContractFactory("Groth16Verifier")
            verifier = await Verifier.connect(owner).deploy()
            await verifier.waitForDeployment()
            console.log("Verifier contract", await verifier.getAddress())

            // deploy hasher contract
            const MiMCSponge = new ethers.ContractFactory(mimcSpongecontract.abi, mimcSpongecontract.createCode(SEED, 220), accounts[0])
            mimcSponge = await MiMCSponge.connect(owner).deploy()
            await mimcSponge.waitForDeployment()
            console.log("Mimc sponge contract", await mimcSponge.getAddress())
            mimc = await buildMimcSponge()

            // deploy the contract and register election
            const AnonymousVoting = await ethers.getContractFactory("AnonymousVoting")
            anonymousVoting = await AnonymousVoting.connect(owner).deploy(
                TREE_LEVELS, await mimcSponge.getAddress(), await verifier.getAddress(), NO_OF_CANDIDATES, voters.map(x => x.address)
            )
            await anonymousVoting.waitForDeployment()
            console.log('voting contract', await anonymousVoting.getAddress())
        })

        it("Commitment generation and registration", async () => {
            commitment1 = await generateCommitment()
            console.log('commitment', commitment1)
            await anonymousVoting.connect(voters[0]).registerCommitment(commitment1.commitment)
        });

        it("Voter can generate only one commitment", async () => {
            const commitment = await generateCommitment()
            try {
                await anonymousVoting.connect(voters[0]).registerCommitment(commitment.commitment)
            } catch (error: any) {
                expect(error.message).to.contain('Voter has already committed!')
            }
        });

        it("Defined voters can only register commitments", async () => {
            const commitment = await generateCommitment()
            try {
                await anonymousVoting.connect(accounts[3]).registerCommitment(commitment.commitment)
            } catch (error: any) {
                expect(error.message).to.contain('Sender has to be registered as a voter')
            }
        });

        it("Voter can vote and only once", async () => {
            const cd = await calculateMerkleRootAndZKProof(await anonymousVoting.getAddress(), accounts[0], TREE_LEVELS, commitment1, "build/Verifier.zkey")
            await anonymousVoting.connect(voters[0]).vote(1, cd.nullifierHash, cd.root, cd.proof_a, cd.proof_b, cd.proof_c)
            try {
                await anonymousVoting.connect(voters[0]).vote(1, cd.nullifierHash, cd.root, cd.proof_a, cd.proof_b, cd.proof_c)
            } catch (error: any) {
                expect(error.message).to.contain('The nullifier has been submitted')
            }
        });

        it("Happy flow", async () => {

            // registered voters generate commitments
            const commitment2 = await generateCommitment()
            await anonymousVoting.connect(voters[1]).registerCommitment(commitment2.commitment)
            const commitment3 = await generateCommitment()
            await anonymousVoting.connect(voters[2]).registerCommitment(commitment3.commitment)

            const anonymousVotingAddress = await anonymousVoting.getAddress()
            const provider = accounts[0]

            // votes
            const cd2 = await calculateMerkleRootAndZKProof(anonymousVotingAddress, provider, TREE_LEVELS, commitment2, "build/Verifier.zkey")
            await anonymousVoting.connect(accounts[4]).vote(1, cd2.nullifierHash, cd2.root, cd2.proof_a, cd2.proof_b, cd2.proof_c)
            const cd3 = await calculateMerkleRootAndZKProof(anonymousVotingAddress, provider, TREE_LEVELS, commitment3, "build/Verifier.zkey")
            await anonymousVoting.connect(accounts[5]).vote(2, cd3.nullifierHash, cd3.root, cd3.proof_a, cd3.proof_b, cd3.proof_c)

            // // results
            console.log('winner is: Option', (await anonymousVoting.getWinner()).toString())
        });
    });    
} catch (error: any) {
    console.log(error.message);
}