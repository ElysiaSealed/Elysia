// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {ElysiaLedger} from "../src/ElysiaLedger.sol";

/// Env: AGENT_ADDRESS (required). Owner = the account that runs the script (the Deployer wallet).
/// Robinhood Chain mainnet (4663): simulate first without --broadcast, using the keystore named elysia-deployer.
/// Broadcasting is a mainnet transaction: only a human runs it, after explicit approval (roadmap gate R3).
contract DeployElysiaLedger is Script {
    function run() external returns (ElysiaLedger ledger) {
        require(block.chainid == 4663, "DeployElysiaLedger: only Robinhood Chain mainnet (4663)");
        address agent = vm.envAddress("AGENT_ADDRESS");
        vm.startBroadcast();
        ledger = new ElysiaLedger(msg.sender, agent);
        vm.stopBroadcast();
        console2.log("ElysiaLedger", address(ledger));
        console2.log("owner", ledger.owner());
        console2.log("agent", ledger.agent());
    }
}
