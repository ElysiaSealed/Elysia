// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// Chainlink proxy accessor for the aggregator of an earlier phase (EACAggregatorProxy.phaseAggregators).
interface IPhaseProxy {
    function phaseAggregators(uint16 phaseId) external view returns (address);
}
