// based on https://github.com/tornadocash/tornado-core/blob/master/contracts/Tornado.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ZKTree.sol";

contract AnonymousVoting is ZKTree {
    address public owner;
    address[] public voters;
    uint public numCandidates;
    mapping(address => bool) voterCommitted;
    mapping(uint => uint) public votes;

    constructor(
        uint32 _levels,
        IHasher _hasher,
        IVerifier _verifier,
        uint _numCandidates,
        address[] memory _voters
    ) ZKTree(_levels, _hasher, _verifier) {
        owner = msg.sender;
        numCandidates = _numCandidates;
        voters = _voters;
        for (uint i = 0; i <= numCandidates; i++) votes[i] = 0;
    }

    modifier onlyVoters() {
        address[] memory electionVoters = voters;
        bool inside = false;
        for (uint256 i = 0; i < electionVoters.length; i++)
            if (msg.sender == electionVoters[i]) {
                inside = true;
                break;
            }
        require(inside, "Sender has to be registered as a voter");
        _;
    }

    function registerCommitment(uint256 _commitment) external onlyVoters {
        require(!voterCommitted[msg.sender], "Voter has already committed!");
        _commit(bytes32(_commitment));
        voterCommitted[msg.sender] = true;
    }

    function vote(
        uint _option,
        uint256 _nullifier,
        uint256 _root,
        uint[2] memory _proof_a,
        uint[2][2] memory _proof_b,
        uint[2] memory _proof_c
    ) external {
        require(_option <= numCandidates, "Invalid option!");
        _nullify(
            bytes32(_nullifier),
            bytes32(_root),
            _proof_a,
            _proof_b,
            _proof_c
        );
        votes[_option] = votes[_option] + 1;
    }

    function getWinner() external view returns (uint) {
        uint winner = 0;
        for (uint i = 0; i <= numCandidates; i++)
            if (votes[i] > votes[winner]) winner = i;
        return winner;
    }
}
