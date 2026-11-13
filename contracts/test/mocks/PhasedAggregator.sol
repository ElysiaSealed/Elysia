// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "../../src/interfaces/AggregatorV3Interface.sol";

/// Stand-in for the aggregator of a finished phase: only latestRoundData matters to the ledger.
contract PhaseAggregatorStub {
    uint256 public immutable lastUpdatedAt;

    constructor(uint256 updatedAt) {
        lastUpdatedAt = updatedAt;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (1, 1, lastUpdatedAt, lastUpdatedAt, 1);
    }
}

/// Mimics a Chainlink proxy: round ids are (phaseId << 64) | aggregatorRound, a phase change resets the round counter,
/// and phaseAggregators(phase) returns the aggregator of an earlier phase. Used only to test how ElysiaLedger verifies
/// rounds across phases.
contract PhasedAggregator is AggregatorV3Interface {
    struct Round {
        int256 answer;
        uint256 updatedAt;
    }

    mapping(uint80 => Round) public rounds;
    mapping(uint16 => address) private _phaseAggregators;
    uint16 public phaseId = 1;
    uint64 public nextRound = 1;
    uint256 public lastUpdatedAt;
    bool public phaseAggregatorsBroken;

    function setNextRound(uint64 n) external {
        nextRound = n;
    }

    /// Ends the current phase: records a stub aggregator holding the last update time, then starts the next phase.
    function bumpPhase() external {
        _phaseAggregators[phaseId] = address(new PhaseAggregatorStub(lastUpdatedAt));
        phaseId += 1;
        nextRound = 1;
    }

    /// Simulates a proxy that does not expose phaseAggregators (or whose call fails).
    function breakPhaseAggregators() external {
        phaseAggregatorsBroken = true;
    }

    function phaseAggregators(uint16 phase) external view returns (address) {
        require(!phaseAggregatorsBroken, "not supported");
        return _phaseAggregators[phase];
    }

    function push(int256 answer, uint256 updatedAt) external returns (uint80 id) {
        id = (uint80(phaseId) << 64) | uint80(nextRound);
        nextRound += 1;
        rounds[id] = Round(answer, updatedAt);
        lastUpdatedAt = updatedAt;
    }

    function decimals() external pure returns (uint8) {
        return 8;
    }

    function description() external pure returns (string memory) {
        return "PHASED / USD";
    }

    function version() external pure returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 id) external view returns (uint80, int256, uint256, uint256, uint80) {
        Round memory r = rounds[id];
        require(r.updatedAt != 0, "No data present");
        return (id, r.answer, r.updatedAt, r.updatedAt, id);
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        uint80 id = (uint80(phaseId) << 64) | uint80(nextRound - 1);
        Round memory r = rounds[id];
        return (id, r.answer, r.updatedAt, r.updatedAt, id);
    }
}
