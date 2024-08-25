// based on https://github.com/tornadocash/tornado-core/blob/master/circuits/merkleTree.circom
pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/mimcsponge.circom";

// This template computes the hash of two inputs using the MiMCSponge hash function
template HashLeftRight() {
    signal input left;   // Left input for the hash function (typically one part of the Merkle pair)
    signal input right;  // Right input for the hash function (typically the other part of the Merkle pair)
    signal output hash;  // Output signal for the resulting hash

    // Instantiate the MiMCSponge component with 2 inputs, 220 rounds, and 1 output
    component hasher = MiMCSponge(2, 220, 1);

    // Set the inputs for the hash function
    hasher.ins[0] <== left;
    hasher.ins[1] <== right;

    // Set the key input for the hash function to 0 (no additional key)
    hasher.k <== 0;

    // The resulting hash is assigned to the output signal
    hash <== hasher.outs[0];
}

// This template selects the correct pair of inputs for hashing based on the path index
// If s == 0, it returns [in[0], in[1]]
// If s == 1, it returns [in[1], in[0]]
template DualMux() {
    signal input in[2];    // Two possible inputs for the multiplexer
    signal input s;        // Selector signal (0 or 1)
    signal output out[2];  // The selected pair of outputs

    // Ensure the selector is either 0 or 1
    s * (1 - s) === 0;

    // Select and output the correct pair based on the selector
    out[0] <== (in[1] - in[0])*s + in[0];
    out[1] <== (in[0] - in[1])*s + in[1];
}

// This template verifies that a Merkle proof is correct for a given Merkle root and leaf
// levels: the number of levels in the Merkle Tree
template MerkleTreeChecker(levels) {
    signal input leaf;                     // The leaf node to be verified
    signal input pathElements[levels];     // The elements along the Merkle path (sibling nodes)
    signal input pathIndices[levels];      // The path indices (0 for left, 1 for right)
    signal output root;                    // The calculated Merkle root

    // Declare arrays of components for selectors and hashers
    component selectors[levels];
    component hashers[levels];

    // Loop through each level of the tree, starting from the leaf up to the root
    for (var i = 0; i < levels; i++) {
        // Instantiate the DualMux (selector) component for this level
        selectors[i] = DualMux();

        // Select the correct pair of inputs for hashing
        // If it's the first level, use the leaf as one of the inputs
        // Otherwise, use the hash from the previous level
        selectors[i].in[0] <== i == 0 ? leaf : hashers[i - 1].hash;
        selectors[i].in[1] <== pathElements[i];

        // Set the selector signal (left or right)
        selectors[i].s <== pathIndices[i];

        // Instantiate the HashLeftRight component for this level
        hashers[i] = HashLeftRight();

        // Set the inputs for the hash function from the selector's outputs
        hashers[i].left <== selectors[i].out[0];
        hashers[i].right <== selectors[i].out[1];
    }

    // The final hash at the last level is the calculated Merkle root
    root <== hashers[levels - 1].hash;
}