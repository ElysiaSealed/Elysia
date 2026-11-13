// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {ElysiaLedger} from "../src/ElysiaLedger.sol";

/// Env: AGENT_ADDRESS (wajib). Owner = akun yang menjalankan script (deployer).
/// Testnet:  forge script script/DeployElysiaLedger.s.sol --rpc-url https://rpc.testnet.chain.robinhood.com --account deployer --broadcast
/// Mainnet:  HANYA dry run (tanpa --broadcast).
contract DeployElysiaLedger is Script {
    function run() external returns (ElysiaLedger ledger) {
        address agent = vm.envAddress("AGENT_ADDRESS");
        vm.startBroadcast();
        ledger = new ElysiaLedger(msg.sender, agent);
        vm.stopBroadcast();
        console2.log("ElysiaLedger", address(ledger));
        console2.log("owner", ledger.owner());
        console2.log("agent", ledger.agent());
    }
}
