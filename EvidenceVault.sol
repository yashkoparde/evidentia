// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EvidenceVault
 * @dev Stores and verifies cryptographic hashes for forensic evidence.
 */
contract EvidenceVault {
    struct Evidence {
        string fileHash;
        string caseId;
        uint256 timestamp;
        address uploader;
    }

    // Mapping from file hash to Evidence details
    mapping(string => Evidence) private evidenceRecords;
    
    // Mapping to track if a hash has already been stored
    mapping(string => bool) private hashExists;

    // Event emitted when new evidence is stored
    event EvidenceStored(string indexed fileHash, string caseId, address indexed uploader, uint256 timestamp);

    /**
     * @dev Stores a new evidence hash.
     * @param _hash The SHA-256 (or other) hash of the file.
     * @param _caseId The case identifier associated with the evidence.
     */
    function storeEvidence(string memory _hash, string memory _caseId) public {
        require(!hashExists[_hash], "Evidence with this hash already exists on-chain.");
        require(bytes(_hash).length > 0, "Hash cannot be empty.");

        evidenceRecords[_hash] = Evidence({
            fileHash: _hash,
            caseId: _caseId,
            timestamp: block.timestamp,
            uploader: msg.sender
        });

        hashExists[_hash] = true;

        emit EvidenceStored(_hash, _caseId, msg.sender, block.timestamp);
    }

    /**
     * @dev Verifies if an evidence hash exists.
     * @param _hash The hash to check.
     * @return exists Boolean indicating if hash is registered.
     * @return timestamp The time it was registered.
     * @return uploader The address of the uploader.
     * @return caseId The case ID associated with the evidence.
     */
    function verifyEvidence(string memory _hash) public view returns (
        bool exists,
        uint256 timestamp,
        address uploader,
        string memory caseId
    ) {
        if (!hashExists[_hash]) {
            return (false, 0, address(0), "");
        }

        Evidence memory record = evidenceRecords[_hash];
        return (true, record.timestamp, record.uploader, record.caseId);
    }
}
