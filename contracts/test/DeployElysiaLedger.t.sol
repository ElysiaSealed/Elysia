// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {DeployElysiaLedger} from "../script/DeployElysiaLedger.s.sol";
import {ElysiaLedger} from "../src/ElysiaLedger.sol";

contract DeployElysiaLedgerTest is Test {
    address deployer = makeAddr("deployer");
    address agent = makeAddr("agent");

    function test_run_ownerIsDeployerNotScriptSender() public {
        vm.chainId(4663);
        vm.setEnv("DEPLOYER_ADDRESS", vm.toString(deployer));
        vm.setEnv("AGENT_ADDRESS", vm.toString(agent));
        ElysiaLedger ledger = new DeployElysiaLedger().run();
        assertEq(ledger.owner(), deployer);
        assertEq(ledger.agent(), agent);
    }

    function test_run_rejectsOtherChains() public {
        vm.chainId(46630);
        vm.setEnv("DEPLOYER_ADDRESS", vm.toString(deployer));
        vm.setEnv("AGENT_ADDRESS", vm.toString(agent));
        DeployElysiaLedger s = new DeployElysiaLedger();
        vm.expectRevert(bytes("DeployElysiaLedger: only Robinhood Chain mainnet (4663)"));
        s.run();
    }
}
