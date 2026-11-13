// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ElysiaLedger} from "../src/ElysiaLedger.sol";
import {AggregatorV3Interface} from "../src/interfaces/AggregatorV3Interface.sol";
import {PhasedAggregator} from "./mocks/PhasedAggregator.sol";

/// Round verification against feeds whose round ids carry a phase (Chainlink proxy style), like the Robinhood Chain feeds.
contract ElysiaLedgerPhasesTest is Test {
    ElysiaLedger ledger;
    PhasedAggregator feed;

    address owner = makeAddr("owner");
    address agent = makeAddr("agent");
    address asset = makeAddr("nvda");

    string constant TEXT = "NVDA closes higher in 1 hour";
    bytes32 constant SALT = bytes32(uint256(0xabc));
    uint32 constant HORIZON = 1 hours;

    function setUp() public {
        vm.warp(1_800_000_000);
        ledger = new ElysiaLedger(owner, agent);
        feed = new PhasedAggregator();
        vm.prank(owner);
        ledger.setFeed(asset, AggregatorV3Interface(address(feed)));
        feed.setNextRound(1911); // mimics a mid-life aggregator round number
    }

    function _commit() internal returns (uint256 id) {
        vm.prank(agent);
        id = ledger.commit(keccak256(abi.encode(TEXT, asset, uint8(1), HORIZON, SALT)));
    }

    function _reveal(uint256 id, uint80 s, uint80 e) internal {
        vm.prank(agent);
        ledger.reveal(id, TEXT, asset, 1, HORIZON, SALT, s, e);
    }

    function test_phased_revealInsideOnePhase() public {
        uint80 s = feed.push(100e8, block.timestamp - 10);
        assertEq(s >> 64, 1); // phase 1
        uint256 id = _commit();
        feed.push(101e8, block.timestamp + 10 minutes);
        vm.warp(block.timestamp + HORIZON + 1);
        uint80 e = feed.push(110e8, block.timestamp - 1);
        _reveal(id, s, e);
        assertEq(ledger.getPrediction(id).returnBps, 1000);
    }

    function test_phased_revealEndRoundInNextPhase() public {
        uint80 s = feed.push(100e8, block.timestamp - 10);
        uint256 id = _commit();
        vm.warp(block.timestamp + HORIZON + 1);
        feed.bumpPhase(); // the first round of the new phase is round 1 of phase 2
        uint80 e = feed.push(110e8, block.timestamp - 1);
        assertEq(e >> 64, 2);
        assertEq(uint64(e), 1);
        _reveal(id, s, e); // no previous round in this phase to check: accepted
        assertTrue(ledger.getPrediction(id).revealed);
    }

    function test_phased_startRoundMustBeTheLatestBeforeCommit() public {
        uint80 stale = feed.push(90e8, block.timestamp - 30 minutes);
        feed.push(100e8, block.timestamp - 10); // newer round before the commit
        uint256 id = _commit();
        vm.warp(block.timestamp + HORIZON + 1);
        uint80 e = feed.push(110e8, block.timestamp - 1);
        vm.expectRevert(ElysiaLedger.InvalidStartRound.selector);
        _reveal(id, stale, e);
    }

    function test_phased_startRoundAtPhaseEndRejectedWhenNewPhaseStartedBeforeCommit() public {
        uint80 old = feed.push(100e8, block.timestamp - 20 minutes); // last round of phase 1
        feed.bumpPhase();
        feed.push(105e8, block.timestamp - 10); // round 1 of phase 2, before the commit
        uint256 id = _commit();
        vm.warp(block.timestamp + HORIZON + 1);
        uint80 e = feed.push(110e8, block.timestamp - 1);
        vm.expectRevert(ElysiaLedger.InvalidStartRound.selector);
        _reveal(id, old, e); // stale start: a newer round in the next phase existed before the commit
    }

    function test_phased_startRoundAtPhaseEndAcceptedWhenNewPhaseStartedAfterCommit() public {
        uint256 t0 = 1_800_000_000; // absolute times: avoids reading block.timestamp across vm.warp
        uint80 old = feed.push(100e8, t0 - 10); // last round of phase 1 before the commit
        uint256 id = _commit();
        vm.warp(t0 + 5 minutes);
        feed.bumpPhase();
        feed.push(105e8, t0 + 5 minutes - 1); // phase 2 starts after the commit
        vm.warp(t0 + 5 minutes + HORIZON);
        uint80 e = feed.push(110e8, t0 + 5 minutes + HORIZON - 1);
        _reveal(id, old, e);
        assertTrue(ledger.getPrediction(id).revealed);
    }

    function test_phased_unknownRoundIdRejected() public {
        feed.push(100e8, block.timestamp - 10);
        uint256 id = _commit();
        vm.warp(block.timestamp + HORIZON + 1);
        uint80 e = feed.push(110e8, block.timestamp - 1);
        vm.expectRevert(ElysiaLedger.InvalidStartRound.selector);
        _reveal(id, uint80(1911), e); // a plain round number without the phase bits does not exist
    }

    function test_phased_endRoundMustBeTheFirstAfterMaturity() public {
        uint80 s = feed.push(100e8, block.timestamp - 10);
        uint256 id = _commit();
        vm.warp(block.timestamp + HORIZON + 1);
        feed.push(105e8, block.timestamp - 1); // first round after maturity
        uint80 later = feed.push(110e8, block.timestamp);
        vm.expectRevert(ElysiaLedger.InvalidEndRound.selector);
        _reveal(id, s, later);
    }

    // Absolute times (t0 = setUp warp) avoid reading block.timestamp across vm.warp.
    uint256 constant T0 = 1_800_000_000;

    function test_phased_endRoundFirstOfNewPhaseRejectedWhenOldPhaseRoundAfterMaturity() public {
        uint80 s = feed.push(100e8, T0 - 10);
        uint256 id = _commit();
        vm.warp(T0 + HORIZON + 1);
        feed.push(105e8, T0 + HORIZON + 10); // last round of phase 1, after maturity: the rightful end round
        feed.bumpPhase();
        uint80 later = feed.push(130e8, T0 + HORIZON + 600); // round 1 of phase 2
        vm.expectRevert(ElysiaLedger.InvalidEndRound.selector);
        _reveal(id, s, later);
    }

    function test_phased_lastRoundOfOldPhaseAfterMaturityIsAccepted() public {
        uint80 s = feed.push(100e8, T0 - 10);
        uint256 id = _commit();
        vm.warp(T0 + HORIZON + 1);
        uint80 e = feed.push(105e8, T0 + HORIZON + 10);
        feed.bumpPhase();
        feed.push(130e8, T0 + HORIZON + 600);
        _reveal(id, s, e);
        assertEq(ledger.getPrediction(id).returnBps, 500);
    }

    function test_phased_endRoundFirstOfNewPhaseFailsClosedWithoutPhaseAggregators() public {
        uint80 s = feed.push(100e8, T0 - 10);
        uint256 id = _commit();
        vm.warp(T0 + HORIZON + 1);
        feed.bumpPhase();
        uint80 e = feed.push(110e8, T0 + HORIZON);
        feed.breakPhaseAggregators();
        vm.expectRevert(ElysiaLedger.InvalidEndRound.selector);
        _reveal(id, s, e);
    }
}
