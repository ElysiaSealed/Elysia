// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {IPhaseProxy} from "./interfaces/IPhaseProxy.sol";

/// @title ElysiaLedger
/// @notice Commit-reveal for Elysia predictions. `commit(hash)` is recorded before posting, `reveal()` runs at maturity,
///         and the score is computed on-chain from the Chainlink oracle price.
/// @dev Hash = keccak256(abi.encode(string text, address asset, uint8 direction, uint32 horizon, bytes32 salt)).
///      Aset tersembunyi saat commit, jadi harga awal/akhir dibuktikan lewat roundId saat reveal. Kontrak memverifikasi
///      bahwa round awal adalah round terakhir sebelum commit dan round akhir adalah round pertama sesudah jatuh tempo,
///      sehingga agent tidak bisa memilih round yang menguntungkan.
///      Catatan: `roundId + 1` / `roundId - 1` hanya valid dalam satu phase aggregator Chainlink.
///      Harga yang terlalu basi (round awal lebih tua dari MAX_START_AGE sebelum commit, atau round akhir lebih lambat
///      dari MAX_END_LAG setelah jatuh tempo, mis. pasar saham tutup) tidak membuat reveal gagal: prediksi tercatat
///      sebagai VOID, tidak dihitung menang atau kalah, dan tidak masuk `winCount` maupun `sumReturnBps`.
contract ElysiaLedger is Ownable2Step {
    uint8 public constant UP = 1;
    uint8 public constant DOWN = 2;
    uint32 public constant MIN_HORIZON = 1 hours;
    uint32 public constant MAX_HORIZON = 365 days;
    /// Umur maksimum round awal terhadap waktu commit (keputusan Head Dev).
    uint32 public constant MAX_START_AGE = 1 hours;
    /// Jeda maksimum round akhir setelah jatuh tempo (keputusan Head Dev).
    uint32 public constant MAX_END_LAG = 2 hours;

    struct Prediction {
        bytes32 hash;
        uint64 committedAt;
        uint16 minMoveBps; // snapshot saat commit
        bool revealed;
        bool won;
        uint8 direction;
        uint32 horizon;
        address asset;
        int256 startPrice;
        int256 endPrice;
        int256 returnBps;
        bool voided; // true: harga basi, tidak dinilai
    }

    address public agent;
    uint16 public minMoveBps; // definisi "menang": default 0 = arah saja
    uint256 public commitCount;
    uint256 public revealCount;
    uint256 public winCount;
    uint256 public voidCount; // prediksi yang direveal tetapi tidak dinilai; dinilai = revealCount - voidCount
    int256 public sumReturnBps; // searah klaim: prediksi turun yang benar bernilai positif

    mapping(uint256 => Prediction) private _predictions;
    mapping(bytes32 => bool) public hashUsed;
    mapping(address => AggregatorV3Interface) public feedOf;

    event Committed(uint256 indexed id, bytes32 indexed hash, uint64 committedAt);
    event Revealed(
        uint256 indexed id,
        string text,
        address indexed asset,
        uint8 direction,
        uint32 horizon,
        bytes32 salt,
        uint80 startRoundId,
        uint80 endRoundId,
        int256 startPrice,
        int256 endPrice,
        int256 returnBps,
        bool won,
        bool voided
    );
    event AgentSet(address indexed agent);
    event FeedSet(address indexed asset, address indexed feed);
    event MinMoveBpsSet(uint16 minMoveBps);

    error NotAgent();
    error ZeroHash();
    error HashAlreadyCommitted();
    error UnknownPrediction();
    error AlreadyRevealed();
    error HashMismatch();
    error InvalidDirection();
    error InvalidHorizon();
    error NotMatured();
    error NoFeed();
    error InvalidStartRound();
    error InvalidEndRound();
    error ZeroAddress();
    error InvalidFeed();
    error RenounceDisabled();

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    constructor(address initialOwner, address initialAgent) Ownable(initialOwner) {
        if (initialAgent == address(0)) revert ZeroAddress();
        agent = initialAgent;
        emit AgentSet(initialAgent);
    }

    // ---------------------------------------------------------------- admin

    /// @dev Dinonaktifkan: tanpa owner, agent dan feed tidak bisa dirotasi.
    function renounceOwnership() public pure override {
        revert RenounceDisabled();
    }

    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert ZeroAddress();
        agent = newAgent;
        emit AgentSet(newAgent);
    }

    function setFeed(address asset, AggregatorV3Interface feed) external onlyOwner {
        if (asset == address(0) || address(feed).code.length == 0) revert InvalidFeed();
        feedOf[asset] = feed;
        emit FeedSet(asset, address(feed));
    }

    /// @notice Hanya berlaku untuk prediksi berikutnya; prediksi yang sudah di-commit memakai snapshot-nya.
    function setMinMoveBps(uint16 newMinMoveBps) external onlyOwner {
        minMoveBps = newMinMoveBps;
        emit MinMoveBpsSet(newMinMoveBps);
    }

    // ----------------------------------------------------------- commit/reveal

    function commit(bytes32 hash) external onlyAgent returns (uint256 id) {
        if (hash == bytes32(0)) revert ZeroHash();
        if (hashUsed[hash]) revert HashAlreadyCommitted();
        hashUsed[hash] = true;

        id = commitCount++;
        Prediction storage p = _predictions[id];
        p.hash = hash;
        p.committedAt = uint64(block.timestamp);
        p.minMoveBps = minMoveBps;
        emit Committed(id, hash, uint64(block.timestamp));
    }

    function reveal(
        uint256 id,
        string calldata text,
        address asset,
        uint8 direction,
        uint32 horizon,
        bytes32 salt,
        uint80 startRoundId,
        uint80 endRoundId
    ) external onlyAgent {
        Prediction storage p = _predictions[id];
        if (p.committedAt == 0) revert UnknownPrediction();
        if (p.revealed) revert AlreadyRevealed();
        if (computeHash(text, asset, direction, horizon, salt) != p.hash) revert HashMismatch();
        if (direction != UP && direction != DOWN) revert InvalidDirection();
        if (horizon < MIN_HORIZON || horizon > MAX_HORIZON) revert InvalidHorizon();

        uint256 maturity = uint256(p.committedAt) + horizon;
        if (block.timestamp < maturity) revert NotMatured();

        AggregatorV3Interface feed = feedOf[asset];
        if (address(feed) == address(0)) revert NoFeed();

        (int256 startPrice, uint256 startAt) = _verifyStart(feed, startRoundId, p.committedAt);
        (int256 endPrice, uint256 endAt) = _verifyEnd(feed, endRoundId, maturity);

        // startAt <= committedAt dan endAt >= maturity sudah dijamin oleh verifikasi round, jadi tidak ada underflow.
        bool voided = uint256(p.committedAt) - startAt > MAX_START_AGE || endAt - maturity > MAX_END_LAG;

        int256 ret = ((endPrice - startPrice) * 10_000) / startPrice;
        int256 minMove = int256(uint256(p.minMoveBps));
        bool won = !voided && (direction == UP ? (ret > 0 && ret >= minMove) : (ret < 0 && -ret >= minMove));

        p.revealed = true;
        p.won = won;
        p.direction = direction;
        p.horizon = horizon;
        p.asset = asset;
        p.startPrice = startPrice;
        p.endPrice = endPrice;
        p.returnBps = ret;
        p.voided = voided;

        revealCount++;
        if (voided) {
            voidCount++;
        } else {
            if (won) winCount++;
            sumReturnBps += direction == UP ? ret : -ret;
        }

        emit Revealed(
            id, text, asset, direction, horizon, salt, startRoundId, endRoundId, startPrice, endPrice, ret, won, voided
        );
    }

    // ------------------------------------------------------------------ views

    function computeHash(string calldata text, address asset, uint8 direction, uint32 horizon, bytes32 salt)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(text, asset, direction, horizon, salt));
    }

    function getPrediction(uint256 id) external view returns (Prediction memory) {
        if (_predictions[id].committedAt == 0) revert UnknownPrediction();
        return _predictions[id];
    }

    // --------------------------------------------------------------- internals

    /// Round awal harus: ada, diperbarui <= waktu commit, dan round berikutnya (jika ada) setelah waktu commit.
    function _verifyStart(AggregatorV3Interface feed, uint80 roundId, uint64 committedAt)
        internal
        view
        returns (int256, uint256)
    {
        (int256 price, uint256 updatedAt, bool ok) = _round(feed, roundId);
        if (!ok || price <= 0 || updatedAt > committedAt) revert InvalidStartRound();
        (, uint256 nextAt, bool nextOk) = _round(feed, roundId + 1);
        if (nextOk && nextAt <= committedAt) revert InvalidStartRound();
        if (!nextOk) {
            // Chainlink proxy round ids are (phaseId << 64) | aggregatorRound. If roundId was the last round of its
            // phase, its successor is the first round (1) of the next phase, so check that one too.
            uint80 nextPhaseFirst = (((roundId >> 64) + 1) << 64) | 1;
            (, uint256 phaseAt, bool phaseOk) = _round(feed, nextPhaseFirst);
            if (phaseOk && phaseAt <= committedAt) revert InvalidStartRound();
        }
        return (price, updatedAt);
    }

    /// Round akhir harus: ada, diperbarui >= jatuh tempo, dan round sebelumnya (jika ada) sebelum jatuh tempo.
    function _verifyEnd(AggregatorV3Interface feed, uint80 roundId, uint256 maturity)
        internal
        view
        returns (int256, uint256)
    {
        (int256 price, uint256 updatedAt, bool ok) = _round(feed, roundId);
        if (!ok || price <= 0 || updatedAt < maturity) revert InvalidEndRound();
        if (uint64(roundId) > 1) {
            (, uint256 prevAt, bool prevOk) = _round(feed, roundId - 1);
            if (prevOk && prevAt >= maturity) revert InvalidEndRound();
        } else if (uint64(roundId) == 1 && (roundId >> 64) > 1) {
            _verifyPreviousPhase(feed, uint16(roundId >> 64) - 1, maturity);
        }
        return (price, updatedAt);
    }

    /// The end round is the first round of a new phase, so its predecessor lives in the previous phase aggregator.
    /// That aggregator's latest round must be before maturity. Fails closed when the proxy cannot answer.
    function _verifyPreviousPhase(AggregatorV3Interface feed, uint16 previousPhase, uint256 maturity) internal view {
        address aggregator;
        try IPhaseProxy(address(feed)).phaseAggregators(previousPhase) returns (address a) {
            aggregator = a;
        } catch {
            revert InvalidEndRound();
        }
        if (aggregator == address(0)) revert InvalidEndRound();
        try AggregatorV3Interface(aggregator).latestRoundData() returns (uint80, int256, uint256, uint256 updatedAt, uint80) {
            if (updatedAt >= maturity) revert InvalidEndRound();
        } catch {
            revert InvalidEndRound();
        }
    }

    function _round(AggregatorV3Interface feed, uint80 roundId)
        internal
        view
        returns (int256 price, uint256 updatedAt, bool ok)
    {
        try feed.getRoundData(roundId) returns (uint80, int256 answer, uint256, uint256 upd, uint80) {
            if (upd == 0) return (0, 0, false);
            return (answer, upd, true);
        } catch {
            return (0, 0, false);
        }
    }
}
