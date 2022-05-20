pragma solidity ^0.8.2;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

abstract contract BatchReveal {
    uint256 public constant TOKEN_LIMIT = 10000;
    uint256 public constant REVEAL_BATCH_SIZE = 200;
    mapping(uint256 => uint256) public batchToSeed;
    uint256 public lastTokenRevealed = 0; // in [0-9999]. offset not included

    struct Range {
        int128 start;
        int128 end;
    }

    // Forked from openzeppelin
    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(int128 a, int128 b) internal pure returns (int128) {
        return a < b ? a : b;
    }

    uint256 constant RANGE_LENGTH = (TOKEN_LIMIT / REVEAL_BATCH_SIZE) * 2;
    int128 constant intTOKEN_LIMIT = int128(int256(TOKEN_LIMIT));

    // ranges include the start but not the end [start, end)
    // TODO remove view and set back to pure after testing
    function addRange(
        Range[RANGE_LENGTH] memory ranges,
        int128 start,
        int128 end,
        uint256 lastIndex
    ) private view returns (uint256) {
        uint256 positionToAssume = lastIndex;
        for (uint256 j = 0; j < lastIndex; j++) {
            int128 rangeStart = ranges[j].start;
            int128 rangeEnd = ranges[j].end;
            // console.log("[Add Range] Start and end");
            // console.logInt(rangeStart);
            // console.logInt(rangeEnd);
            if (start < rangeStart && positionToAssume == lastIndex) {
                positionToAssume = j;
            }
            if (
                (start < rangeStart && end > rangeStart) ||
                (rangeStart <= start && end <= rangeEnd) ||
                (start < rangeEnd && end > rangeEnd)
            ) {
                int128 length = end - start;
                start = min(start, rangeStart);
                end = start + length + (rangeEnd - rangeStart);
                ranges[j] = Range(-1, -1); // Delete
            }
        }
        for (uint256 pos = lastIndex; pos > positionToAssume; pos--) {
            ranges[pos] = ranges[pos - 1];
        }
        // console.log('Position to assume: ', positionToAssume);
        ranges[positionToAssume] = Range(start, min(end, intTOKEN_LIMIT));
        lastIndex++;
        if (end > intTOKEN_LIMIT) {
            addRange(ranges, 0, end - intTOKEN_LIMIT, lastIndex);
            lastIndex++;
        }
        return lastIndex;
    }

    function buildJumps(uint256 lastBatch)
        private
        view
        returns (Range[RANGE_LENGTH] memory)
    {
        Range[RANGE_LENGTH] memory ranges;
        uint256 lastIndex = 0;

        for (uint256 i = 0; i < lastBatch; i++) {
            int128 start = int128(
                int256(getFreeTokenId(batchToSeed[i], ranges))
            );
            int128 end = start + int128(int256(REVEAL_BATCH_SIZE));
            // console.log("[Building Jumps] Start and end");
            // console.logInt(start);
            // console.logInt(end);
            lastIndex = addRange(ranges, start, end, lastIndex);
            // console.log("[Building Jumps] Last Index: ", lastIndex);
        }
        return ranges;
    }

    // set back to internal from public when out of dev
    function getShuffledTokenId(uint256 startId) public view returns (uint256) {
        uint256 batch = startId / REVEAL_BATCH_SIZE;
        console.log("[Get Shuffled] Batch: ", batch);
        Range[RANGE_LENGTH] memory ranges = buildJumps(batch);
        uint256 positionsToMove = (startId % REVEAL_BATCH_SIZE) +
            batchToSeed[batch];
        console.log("[Get Shuffled] **** Positions to move: ", positionsToMove);
        return getFreeTokenId(positionsToMove, ranges);
    }

    function getFreeTokenId(
        uint256 positionsToMoveStart,
        Range[RANGE_LENGTH] memory ranges
    ) private view returns (uint256) {
        int128 positionsToMove = int128(int256(positionsToMoveStart));
        int128 id = 0;
        for (uint256 round = 0; round < 2; round++) {
            // console.log('ROUND: ', round);
            for (uint256 i = 0; i < RANGE_LENGTH; i++) {
                int128 start = ranges[i].start;
                int128 end = ranges[i].end;
                console.log('[Get Free Token] Searching range: ', i);
                console.log("[Get Free Token] Start and end");
                console.logInt(start);
                console.logInt(end);
                if (id < start) {
                    console.log("[Get Free Token] Id and start");
                    console.logInt(id);
                    console.logInt(start);
                    int128 finalId = id + positionsToMove;
                    if (finalId < start) {
                        console.log('[Get Free Token] Final Id: ', uint256(uint128(finalId)));
                        return uint256(uint128(finalId));
                    } else {
                        positionsToMove -= start - id;
                        id = end;
                    }
                } else if (id < end) {
                    id = end;
                }
            }
            if ((id + positionsToMove) >= intTOKEN_LIMIT) {
                positionsToMove -= intTOKEN_LIMIT - id;
                id = 0;
            }
        }
        console.log(
            "[Contract] free token id: ",
            uint256(uint128(id + positionsToMove))
        );
        return uint256(uint128(id + positionsToMove));
    }

    function setBatchSeed(uint256 randomness) internal {
        // console.log("[Contract] Incoming Randomness: ", randomness);
        uint256 batchNumber;
        unchecked {
            batchNumber = lastTokenRevealed / REVEAL_BATCH_SIZE;
            lastTokenRevealed += REVEAL_BATCH_SIZE;
        }
        // not perfectly random since the folding doesn't match bounds perfectly, but difference is small
        batchToSeed[batchNumber] =
            randomness %
            (TOKEN_LIMIT - (batchNumber * REVEAL_BATCH_SIZE));
    }
}
