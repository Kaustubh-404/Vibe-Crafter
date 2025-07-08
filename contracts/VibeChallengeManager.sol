// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./VibeToken.sol";

contract VibeChallengeManager is Ownable, ReentrancyGuard {
    VibeToken public vibeToken;
    
    struct Challenge {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 votingEndTime;
        ChallengeStatus status;
        uint256[] submissionIds;
        uint256 winnerTokenId;
        uint256 totalRewards;
    }
    
    struct Submission {
        uint256 id;
        uint256 challengeId;
        address submitter;
        string ipfsHash;
        string title;
        uint256 likes;
        uint256 votes;
        uint256 timestamp;
    }
    
    enum ChallengeStatus { Active, Voting, Completed, Cancelled }
    
    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public vibePoints;
    
    uint256 public challengeCounter;
    uint256 public submissionCounter;
    
    // Reward constants
    uint256 public constant SUBMISSION_REWARD = 5;
    uint256 public constant VOTE_REWARD = 5;
    uint256 public constant SWIPE_REWARD = 1; // 0.1 VP per swipe (scaled by 10)
    uint256 public constant WINNER_BONUS = 50;
    
    event ChallengeCreated(uint256 indexed challengeId, string title);
    event SubmissionCreated(uint256 indexed submissionId, uint256 indexed challengeId, address submitter);
    event VoteCast(uint256 indexed submissionId, address voter);
    event ChallengeCompleted(uint256 indexed challengeId, uint256 winnerTokenId);
    event VibePointsAwarded(address indexed user, uint256 amount, string reason);
    
    // Fixed constructor - pass initialOwner to Ownable
    constructor(address _vibeToken, address _initialOwner) Ownable(_initialOwner) {
        vibeToken = VibeToken(_vibeToken);
    }
    
    function createChallenge(
        string memory title,
        string memory description,
        uint256 duration
    ) external onlyOwner returns (uint256) {
        challengeCounter++;
        uint256 challengeId = challengeCounter;
        
        challenges[challengeId] = Challenge({
            id: challengeId,
            title: title,
            description: description,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            votingEndTime: block.timestamp + duration + 12 hours,
            status: ChallengeStatus.Active,
            submissionIds: new uint256[](0),
            winnerTokenId: 0,
            totalRewards: 0
        });
        
        emit ChallengeCreated(challengeId, title);
        return challengeId;
    }
    
    function submitToChallenge(
        uint256 challengeId,
        string memory ipfsHash,
        string memory title
    ) external returns (uint256) {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.status == ChallengeStatus.Active, "Challenge not active");
        require(block.timestamp <= challenge.endTime, "Submission period ended");
        
        submissionCounter++;
        uint256 submissionId = submissionCounter;
        
        submissions[submissionId] = Submission({
            id: submissionId,
            challengeId: challengeId,
            submitter: msg.sender,
            ipfsHash: ipfsHash,
            title: title,
            likes: 0,
            votes: 0,
            timestamp: block.timestamp
        });
        
        challenge.submissionIds.push(submissionId);
        
        // Award vibe points for submission
        vibePoints[msg.sender] += SUBMISSION_REWARD;
        
        emit SubmissionCreated(submissionId, challengeId, msg.sender);
        emit VibePointsAwarded(msg.sender, SUBMISSION_REWARD, "submission");
        
        return submissionId;
    }
    
    function voteForSubmission(uint256 submissionId) external {
        Submission storage submission = submissions[submissionId];
        Challenge storage challenge = challenges[submission.challengeId];
        
        require(challenge.status == ChallengeStatus.Voting, "Not in voting phase");
        require(block.timestamp <= challenge.votingEndTime, "Voting period ended");
        require(!hasVoted[submission.challengeId][msg.sender], "Already voted");
        
        submission.votes++;
        hasVoted[submission.challengeId][msg.sender] = true;
        
        // Award vibe points for voting
        vibePoints[msg.sender] += VOTE_REWARD;
        
        emit VoteCast(submissionId, msg.sender);
        emit VibePointsAwarded(msg.sender, VOTE_REWARD, "voting");
    }
    
    function completeChallenge(uint256 challengeId) external onlyOwner {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.status == ChallengeStatus.Voting, "Not in voting phase");
        require(block.timestamp > challenge.votingEndTime, "Voting not ended");
        
        // Find winner (submission with most votes)
        uint256 winnerSubmissionId = 0;
        uint256 maxVotes = 0;
        
        for (uint256 i = 0; i < challenge.submissionIds.length; i++) {
            uint256 submissionId = challenge.submissionIds[i];
            if (submissions[submissionId].votes > maxVotes) {
                maxVotes = submissions[submissionId].votes;
                winnerSubmissionId = submissionId;
            }
        }
        
        if (winnerSubmissionId > 0) {
            Submission storage winnerSubmission = submissions[winnerSubmissionId];
            
            // Mint Zora token for winner
            uint256 tokenId = vibeToken.mintVibeToken(
                winnerSubmission.submitter,
                winnerSubmission.title,
                challenge.description,
                winnerSubmission.ipfsHash,
                1 ether // 1 ZORA initial price
            );
            
            challenge.winnerTokenId = tokenId;
            
            // Award bonus vibe points to winner
            vibePoints[winnerSubmission.submitter] += WINNER_BONUS;
            
            emit VibePointsAwarded(winnerSubmission.submitter, WINNER_BONUS, "winner");
        }
        
        challenge.status = ChallengeStatus.Completed;
        emit ChallengeCompleted(challengeId, challenge.winnerTokenId);
    }
    
    function updateSubmissionLikes(uint256 submissionId, uint256 likes) external onlyOwner {
        submissions[submissionId].likes = likes;
        
        // Award vibe points based on likes (1 VP per 10 likes)
        uint256 vpReward = likes / 10;
        if (vpReward > 0) {
            vibePoints[submissions[submissionId].submitter] += vpReward;
            emit VibePointsAwarded(submissions[submissionId].submitter, vpReward, "likes");
        }
    }
    
    function awardSwipePoints(address user, uint256 swipes) external onlyOwner {
        uint256 reward = swipes * SWIPE_REWARD / 10; // Convert back from scaled value
        vibePoints[user] += reward;
        emit VibePointsAwarded(user, reward, "swipes");
    }
    
    function getChallenge(uint256 challengeId) external view returns (Challenge memory) {
        return challenges[challengeId];
    }
    
    function getSubmission(uint256 submissionId) external view returns (Submission memory) {
        return submissions[submissionId];
    }
    
    function getChallengeSubmissions(uint256 challengeId) external view returns (uint256[] memory) {
        return challenges[challengeId].submissionIds;
    }
    
    function getUserVibePoints(address user) external view returns (uint256) {
        return vibePoints[user];
    }
}