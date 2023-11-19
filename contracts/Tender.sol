// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.20;
// 2. Imports
import "./TestUSDT.sol";

// 3. Interfaces, Libraries, Contracts

/**@title A simple Technical Tender Contract
 * @author Hadi Saghafi
 * @notice This contract is for executing a simple technical tender
 */

contract Tender {
    // Type Declarations

    // State variables
    TestUSDT private usdt_contract;
    uint256 public proposal_hash_start;    // Timestamp for start time of sending rehashed proposal
    uint256 public proposal_hash_end;      // Timestamp for end time of sending rehashed proposal
    uint256 public proposal_reveal_start;  // Timestamp for start time of sending revealed hash of proposal 
    uint256 public proposal_reveal_end;    // Timestamp for end time of sending revealed hash of proposal
    uint256 public price_hash_start;   // Timestamp for start time of sending hashed price
    uint256 public price_hash_end;     // Timestamp for end time of sending hashed price
    uint256 public price_reveal_start; // Timestamp for start time of sending revealed price+salt
    uint256 public price_reveal_end;   // Timestamp for end time of sending revealed price+salt
    uint256 public withdraw_start;      // Timestamp for start time of sending revealed price+salt
    uint256 public withdraw_end;        // Timestamp for end time of sending revealed price+salt
    uint256 public collateral;          // The collateral amount required to participate in tender
    uint256 public best_price;          // The winner's price in the tender
    uint256 public max_price;          // The maximum acceptable price in the tender
    bool public is_setting_state;               // Indicates is the contract in setting state
    bool public is_forced_reset_approved;       // Indicates is the forced reseset approved
    address private immutable owner;            // Owner address
    address public winner;                      // Wallet address of the winner of tender
    address[] private proposal_participants;    // Array of proposal participants addresses
    address[] private approved_participants;    // Array of approved participants addresses
    mapping(address => bytes32) private proposal_hashed;    // Array of received proposal hashes (rehashed)
    mapping(address => bytes32) private proposal_revealed;  // Array of received proposal hashes
    mapping(address => bytes32) private price_hashed;       // Array of hashed prices
    mapping(address => uint256) private price_revealed;     // Array of proposed prices

    // Events
    event newTender(uint256 indexed proposal_hash_start, uint256 proposal_hash_end, 
        uint256 proposal_reveal_start, uint256 proposal_reveal_end,
        uint256 price_hash_start, uint256 price_hash_end, 
        uint256 price_reveal_start, uint256 price_reveal_end, 
        uint256 withdraw_start, uint256 withdraw_end);
    event TenderReset();
    event TenderForcedReset();
    event TenderForcedResetApproved();
    event TenderForcedResetCanceled();
    event HashedPropsalRegistered(address indexed participant);
    event RevealedPropsalRegistered(address indexed participant);
    event PropsalApproved(address indexed participant);
    event PropsalRejected(address indexed participant);
    event HashedPriceRegistered(address indexed participant);
    event RevealedPriceRegistered(address indexed participant);
    event Withdraw(address indexed participant, uint256 value);

    // Modifiers
    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != owner) revert("Only owner can call this method!");
        _;
    }
    modifier correctTiming(uint256 start_time,uint256 end_time) {
        if (block.timestamp < start_time || block.timestamp > end_time)
            revert("Tender is not in the stage which can accept this request!");
        _;
    }

    // Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    constructor(address USDT_address) {
        usdt_contract = TestUSDT(USDT_address);
        owner = msg.sender;
        is_setting_state = true;
    }

    /// @notice Funds our contract based on the ETH/USD price
    function set_new_tender(uint256 col, uint256 p_max, uint256 t_h_st, uint256 t_h_end, 
                            uint256 t_r_st, uint256 t_r_end, uint256 p_h_st, uint256 p_h_end, 
                            uint256 p_r_st, uint256 p_r_end, uint256 w_st, uint256 w_end)
                            public onlyOwner {
        require(is_setting_state,"Not in setting state!");
        require(t_h_st < t_h_end && t_h_end < t_r_st &&
                t_r_st < t_r_end && t_r_end < p_h_st &&
                p_h_st < p_h_end && p_h_end < p_r_st &&
                p_r_st < p_r_end && p_r_end < w_st &&
                w_st < w_end, "The sequence of timing is not correct!");

        // setting the variables' values for the new tender
        proposal_hash_start = t_h_st;
        proposal_hash_end = t_h_end;
        proposal_reveal_start = t_r_st;
        proposal_reveal_end = t_r_end;
        price_hash_start = p_h_st;
        price_hash_end = p_h_end;
        price_reveal_start = p_r_st;
        price_reveal_end = p_r_end;
        withdraw_start = w_st;
        withdraw_end = w_end;
        is_setting_state = false;

        collateral = col;
        max_price = p_max;
        winner = address(0);
        best_price = 0;
 
        emit newTender(proposal_hash_start, proposal_hash_end, proposal_reveal_start, proposal_reveal_end,
        price_hash_start, price_hash_end, price_reveal_start, price_reveal_end, withdraw_start, withdraw_end);
    }

    function reset_tender(address balance_receiver) public onlyOwner {
        require(block.timestamp >= withdraw_end, "Wait until the end of the current tender!");
        // at first delete all data of current tender
        delete_all_data();
        // transfer remained balance in the contract to the specified address balance_receiver (maybe another contract which designed to manage the project)
        usdt_contract.transfer(balance_receiver,usdt_contract.balanceOf(address(this)));
        is_setting_state = true;
        emit TenderReset();
    }

    function approve_forced_reset() public onlyOwner {
        is_forced_reset_approved = true;    // set approve flag to true
        emit TenderForcedResetApproved();
    }

    function cancel_forced_reset() public onlyOwner {
        is_forced_reset_approved = false;    // set approve flag to false
        emit TenderForcedResetCanceled();
    }

    function forced_reset_tender() public onlyOwner {
        require(is_forced_reset_approved, 
        "You need to run approve_forced_reset() at first!\nWARNING: By running this method all operations in the current tender will be canceled and collaterals refunded.");
        // refunding collaterals to participants
        for (uint16 index = 0; index < proposal_participants.length; index++)
        {
            usdt_contract.transfer(proposal_participants[index],collateral);    // refunding collaterals
        }
        // at first delete all data of current tender
        delete_all_data();
        is_forced_reset_approved = false;       // set back approve flag to false
        is_setting_state = true;                // set setting_state flag to true
        emit TenderForcedReset();
    }


    function send_proposal_hash(bytes32 proposal_h) public correctTiming(proposal_hash_start,proposal_hash_end) {
        bool is_existed;
        // check the existance of participant
        for (uint16 index = 0; index < proposal_participants.length; index++)
        {
            if (proposal_participants[index] == msg.sender) 
                is_existed = true; 
        }
        if (is_existed)   // checking if this account participated before to prevent duplicate collateral get
            proposal_hashed[msg.sender] = proposal_h;        // replacing new rehashed proposal instead of existed one
        else {
                bool result = usdt_contract.transferFrom(msg.sender,address(this),collateral); // transfering collateral from sender's wallet
                require(result,"You should pledge specified USDT to participate in the current tender!");
                proposal_hashed[msg.sender] = proposal_h;   // adding rehashed proposal to the array
                proposal_participants.push(msg.sender);     // adding new participant to the array of participants
            }

        emit HashedPropsalRegistered(msg.sender);
    }

    function send_proposal_reveal(bytes32 proposal_r) public correctTiming(proposal_reveal_start,proposal_reveal_end) {
        require(get_sha256(proposal_r) == proposal_hashed[msg.sender],
        "The hash of the sent value should be equal to the previous stage submission");
        // check not saved before
        if (proposal_revealed[msg.sender] != 0)
            revert("Your revealed proposal hash been already registered!");
        else
            proposal_revealed[msg.sender] = proposal_r;      // adding hash of proposal to the array
        emit RevealedPropsalRegistered(msg.sender);
    }

    function approve_proposal(address participant) public correctTiming(proposal_reveal_end, price_hash_start) onlyOwner {
        require(proposal_revealed[participant] != 0, "This address didn't send the proposal");
        // check not approved before
        for (uint16 index = 0; index < approved_participants.length; index++)
        {
            if (approved_participants[index] == participant)
                revert("This participant hash been already approved!");
        }
        approved_participants.push(participant);      // adding the participant to the array of approved participants
        emit PropsalApproved(participant);
    }

    function reject_proposal(address participant) public correctTiming(proposal_reveal_end, price_hash_start) onlyOwner {
        require(proposal_revealed[participant] != 0, "This address didn't send the proposal");
        // search to find the participant
        for (uint16 index = 0; index < approved_participants.length; index++)
        {
            if (approved_participants[index] == participant) {
                remove_from_approved_participants(index);       // remove participant from array
                emit PropsalRejected(participant);
                return;
            }
        }
    }

    function send_price_hash(bytes32 price_h) public correctTiming(price_hash_start,price_hash_end) {
        bool is_proposal_approved;
        // check is the participant approved
        for (uint16 index = 0; index < approved_participants.length; index++)
        {
            if (approved_participants[index] == msg.sender) 
                is_proposal_approved = true;
        }
        require(is_proposal_approved,"Unfortunately your proposal was not approved!");
        price_hashed[msg.sender] = price_h;        // storing hash of proposed price into the array of hashed prices
        emit HashedPriceRegistered(msg.sender);
    }

    function send_price_reveal(uint256 price, string calldata salt) public correctTiming(price_reveal_start,price_reveal_end) {
        bool is_proposal_approved;
        // check is the participant approved
        for (uint16 index = 0; index < approved_participants.length; index++)
        {
            if (approved_participants[index] == msg.sender) 
                is_proposal_approved = true;
        }
        require(is_proposal_approved,"Unfortunately your proposal was not approved!");
        // check if hash of (price,salt) matches with previous sent hash value
        require(get_sha256_salt(price,salt) == price_hashed[msg.sender],
        "The hash of the sent (price,salt) should be equal to the previous stage submission");
        // check the proposed price is lower than the maximum acceptable price
        require(price < max_price,"You should propose lower price!");
        if (winner == address(0)) {
            // Initialize best_price and the winner
            winner = msg.sender;
            best_price = price;
        }
        if (price < best_price) {
            // updating best_price and the winner
            winner = msg.sender;
            best_price = price;
        }
        price_revealed[msg.sender] = price;        // storing the proposed price into the array of revealed prices
        emit RevealedPriceRegistered(msg.sender);
    }

    function withdraw() public {
        require(msg.sender != winner,"The winner of tender can not call the withdraw() method!");
        uint16 index;
        bool is_participated;
        // search to find and remove participant from proposal_participants array
        for (index = 0; index < proposal_participants.length; index++)
        {
            if (proposal_participants[index] == msg.sender) {
                remove_from_proposal_participants(index);       // removing the participant from proposal-sent participants array
                is_participated = true;
                break;
            }
        }
        // search to find and remove participant from approved_participants array
        require(is_participated,"You didn't participate in the current tender yet!");
        for (index = 0; index < approved_participants.length; index++)
        {
            if (approved_participants[index] == msg.sender) {
                remove_from_approved_participants(index);       // removing the participant from approved participants array
                break;
            }
        }
        // remove all data related to withdrawn participant
        proposal_hashed[msg.sender]=0;
        proposal_revealed[msg.sender]=0;
        price_hashed[msg.sender]=0;
        price_revealed[msg.sender]=0;

        // refund collateral of withdrawn participant
        usdt_contract.transfer(msg.sender,collateral);
        emit Withdraw(msg.sender, collateral);
    }

    // removes the participant from proposal-sent participants array
    function remove_from_approved_participants(uint256 index) private {
        approved_participants[index] = approved_participants[approved_participants.length - 1];
        approved_participants.pop();
    }

    // removes the participant from approved participants array
    function remove_from_proposal_participants(uint256 index) private {
        proposal_participants[index] = proposal_participants[proposal_participants.length - 1];
        proposal_participants.pop();
    }

    // deletes all data and initializes variables and arrays for reset_tender and forced_reset_tender functions
    function delete_all_data() private {
        uint16 index;
        for (index = 0; index < proposal_participants.length; index++)
        {
            address participant = proposal_participants[index];
            proposal_hashed[participant] = 0;
            proposal_revealed[participant] = 0;
        }
        for (index = 0; index < approved_participants.length; index++)
        {
            address participant = approved_participants[index];
            price_hashed[participant] = 0;
            price_revealed[participant] = 0;
        }

        proposal_participants = new address[](0);
        approved_participants = new address[](0);
        collateral = 0;
        max_price = 0;
        winner = address(0);
        best_price = 0;
    }

    function getStage() public view returns (uint256) {
        uint256 ctime = block.timestamp;
        if (ctime < proposal_hash_start)
            return 1;       // Stage: Initialized
        if (ctime >= proposal_hash_start && ctime < proposal_hash_end)
            return 2;       // Stage: Hashed Proposal Send
        if (ctime >= proposal_reveal_start && ctime < proposal_reveal_end)
            return 3;       // Stage: Revealed Proposal Send
        if (ctime >= proposal_reveal_end && ctime < price_hash_start)
            return 4;       // Stage: Review and Approve/Reject the Proposals
        if (ctime >= price_hash_start && ctime < price_hash_end)
            return 5;       // Stage: Hashed Price Send
        if (ctime >= price_reveal_start && ctime < price_reveal_end)
            return 6;       // Stage: Revealed Price Send
        if (ctime >= withdraw_start && ctime < withdraw_end)
            return 7;       // Stage: Withdraw
        if (ctime >= withdraw_end)
            return 8;       // Stage: Finished      
        return 0;           // Stage: (unknown)
    }

    function get_number_of_participants() public view returns (uint256) {
        return proposal_participants.length;
    }

    // returns a participant's address from proposal_participants array
    function get_participant(uint256 index) public view returns (address) {
        require(index<proposal_participants.length,"Index overflow!");
        return proposal_participants[index];
    }

    // returns a participant's proposal from proposal_revealed array
    function get_proposal(address participant) public view returns (bytes32) {
        return proposal_revealed[participant];
    }

    // returns approve state of a participant
    function is_approved(address participant) public view returns (bool) {
        for (uint16 index = 0; index < approved_participants.length; index++)
        {
            if (approved_participants[index] == participant)
                return true;
        }
        return false;
    }
   
    // returns the wallet's address of the winner
    function getWinner() public view returns (address) {
        return winner;
    }

    // returns the lowest price proposed by the winner
    function getBestPrice() public view returns (uint256) {
        return best_price;
    }

    // determines if the contract is in the setting state (to call set_new_tender function)
    function getSettingState() public view returns (bool) {
        return is_setting_state;
    }
    
    // returns the set value of collateral
    function getCollateral() public view returns (uint256) {
        return collateral;
    }
    
    // returns the set value of maximum acceptable price
    function getMaxPrice() public view returns (uint256) {
        return max_price;
    }

    // returns the address of the owner
    function getOwner() public view returns (address) {
        return owner;
    }

    // returns the address of the this contract
    function get_contract_address() public view returns (address) {
        return address(this);
    }

    // returns the address of the USDT contract
    function get_usdt_contract() public view returns (TestUSDT) {
        return usdt_contract;
    }

    // returns the current block's timestamp
    function getTimeStamp() public view returns (uint256) {
        return block.timestamp;
    }

    // returns the hash of one input
    function get_sha256(bytes32 input) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(input));
    }

    // returns the hash of two inputs
    function get_sha256_salt(uint256 price, string calldata salt) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(price,salt));
    }
}
