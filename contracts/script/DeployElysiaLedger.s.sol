// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {ElysiaLedger} from "../src/ElysiaLedger.sol";

/// Env (both required): DEPLOYER_ADDRESS = the Deployer wallet (becomes the owner), AGENT_ADDRESS = the Agent wallet.
/// The script broadcasts from DEPLOYER_ADDRESS explicitly, so the owner can never silently become the default
/// Foundry sender. If the keystore does not hold that address, forge refuses to sign.
/// Robinhood Chain mainnet (4663): simulate first without --broadcast, using the keystore named elysia-deployer, and check
/// that the logged owner equals the Deployer address.
/// Broadcasting is a mainnet transaction: only a human runs it, after explicit approval (roadmap gate R3).
contract DeployElysiaLedger is Script {
    function run() external returns (ElysiaLedger ledger) {
        require(block.chainid == 4663, "DeployElysiaLedger: only Robinhood Chain mainnet (4663)");
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        address agent = vm.envAddress("AGENT_ADDRESS");
        require(deployer != address(0) && agent != address(0), "DeployElysiaLedger: zero address");

        vm.startBroadcast(deployer);
        ledger = new ElysiaLedger(deployer, agent);
        vm.stopBroadcast();

        require(ledger.owner() == deployer, "DeployElysiaLedger: owner mismatch");
        require(ledger.agent() == agent, "DeployElysiaLedger: agent mismatch");
        console2.log("ElysiaLedger", address(ledger));
        console2.log("owner", ledger.owner());
        console2.log("agent", ledger.agent());
    }
}
