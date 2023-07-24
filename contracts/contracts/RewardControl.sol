// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./ExponentialNoError.sol";
import "./interfaces/IRewardControl.sol";
import "./interfaces/IEIP20.sol";
import "./DeltaOpen.sol";
import "./DeltaVerified.sol";

contract RewardControl is IRewardControl, ExponentialNoError {
    struct MarketState {
        // @notice The market's last updated dltSupplyIndex or dltBorrowIndex
        uint224 index;
        // @notice The block number the index was last updated at
        uint32 block;
    }

    // @notice A list of all markets in the reward program mapped to respective verified/public protocols
    // @notice true => address[] represents Verified Protocol markets
    // @notice false => address[] represents Public Protocol markets
    mapping(bool => address[]) public allMarkets;

    // @notice The index for checking whether a market is already in the reward program
    // @notice The first mapping represents verified / public market and the second gives the existence of the market
    mapping(bool => mapping(address => bool)) public allMarketsIndex;

    // @notice The rate at which the Reward Control distributes Delta per block
    uint256 public dltRate;

    // @notice The portion of dltRate that each market currently receives
    // @notice The first mapping represents verified / public market and the second gives the dltSpeeds
    mapping(bool => mapping(address => uint256)) public dltSpeeds;

    // @notice The Delta market supply state for each market
    // @notice The first mapping represents verified / public market and the second gives the supplyState
    mapping(bool => mapping(address => MarketState)) public dltSupplyState;

    // @notice The Delta market borrow state for each market
    // @notice The first mapping represents verified / public market and the second gives the borrowState
    mapping(bool => mapping(address => MarketState)) public dltBorrowState;

    // @notice The snapshot of Delta index for each market for each supplier as of the last time they accrued Delta
    // @notice verified/public => market => supplier => supplierIndex
    mapping(bool => mapping(address => mapping(address => uint256))) public dltSupplierIndex;

    // @notice The snapshot of Delta index for each market for each borrower as of the last time they accrued Delta
    // @notice verified/public => market => borrower => borrowerIndex
    mapping(bool => mapping(address => mapping(address => uint256))) public dltBorrowerIndex;

    // @notice The Delta accrued but not yet transferred to each participant
    mapping(address => uint256) public dltAccrued;

    // @notice To make sure initializer is called only once
    bool public initializationDone;

    // @notice The address of the current owner of this contract
    address public owner;

    // @notice The underlying DeltaVerified contract
    DeltaVerified public deltaVerified;

    // @notice The underlying DeltaOpen contract
    DeltaOpen public deltaOpen;

    // @notice The Delta token address
    address public dltAddress;

    // Hard cap on the maximum number of markets
    uint8 public MAXIMUM_NUMBER_OF_MARKETS;


    /**
     * Events
     */

    /// @notice Emitted when a new DLT speed is calculated for a market
    event DltSpeedUpdated(
        address indexed market,
        uint256 newSpeed,
        bool isVerified
    );

    /// @notice Emitted when DLT is distributed to a supplier
    event DistributedSupplierDlt(
        address indexed market,
        address indexed supplier,
        uint256 supplierDelta,
        uint256 supplierAccruedDlt,
        uint256 supplyIndexMantissa,
        bool isVerified
    );

    /// @notice Emitted when DLT is distributed to a borrower
    event DistributedBorrowerDlt(
        address indexed market,
        address indexed borrower,
        uint256 borrowerDelta,
        uint256 borrowerAccruedDlt,
        uint256 borrowIndexMantissa,
        bool isVerified
    );

    /// @notice Emitted when DLT is transferred to a participant
    event TransferredDlt(
        address indexed participant,
        uint256 participantAccrued,
        address market,
        bool isVerified
    );

    /// @notice Emitted when the owner of the contract is updated
    event OwnerUpdate(address indexed owner, address indexed newOwner);

    /// @notice Emitted when a market is added
    event MarketAdded(
        address indexed market,
        uint256 numberOfMarkets,
        bool isVerified
    );

    /// @notice Emitted when a market is removed
    event MarketRemoved(
        address indexed market,
        uint256 numberOfMarkets,
        bool isVerified
    );


    modifier onlyOwner() {
        require(msg.sender == owner, "non-owner");
        _;
    }


    /**
     * @notice `RewardControl` is the contract to calculate and distribute reward tokens
     */
    constructor(
        address deltaVerified_,
        address deltaOpen_,
        address dltAddress_
    ) {
        require(
            deltaVerified_ != address(0) &&
                deltaOpen_ != address(0) &&
                dltAddress_ != address(0),
            "Inputs cannot be 0x00"
        );

        owner = msg.sender;
        setDeltaOpen(deltaOpen_);
        setDeltaOpen(deltaVerified_);
        setDltAddress(dltAddress_);

        // Total Liquidity rewards for 4 years = 70,000,000
        // Liquidity per year = 70,000,000/4 = 17,500,000
        // Divided by blocksPerYear (assuming 13.3 seconds avg. block time) = 17,500,000/2,371,128 = 7.380453522542860000
        // 7380453522542860000 (Tokens scaled by token decimals of 18) divided by 2 (half for lending and half for borrowing)
        setDltRate(3690226761271430000);
        
        MAXIMUM_NUMBER_OF_MARKETS = 16;
    }


    function setDeltaOpen(address deltaOpen_) public onlyOwner {
        require(deltaOpen_ != address(0), "Address is empty");
        deltaOpen = DeltaOpen(deltaOpen_);
    }


    function setDeltaVerified(address deltaVerified_) public onlyOwner {
        require(deltaVerified_ != address(0), "Address is empty");
        deltaVerified = DeltaVerified(deltaVerified_);
    }


    function setDltAddress(address dltAddress_) public onlyOwner {
        require(dltAddress_ != address(0), "Address is empty");
        dltAddress = dltAddress_;
    }


    function setDltRate(uint256 _dltRate) public onlyOwner {
        dltRate = _dltRate;
    }



    /**
     * @notice Refresh DLT supply index for the specified market and supplier
     * @param market The market whose supply index to update
     * @param supplier The address of the supplier to distribute DLT to
     * @param isVerified Specifies if the market is from verified or public protocol
     */
    function refreshDltSupplyIndex(
        address market,
        address supplier,
        bool isVerified
    ) external {
        if(!allMarketsIndex[isVerified][market]) {
            return;
        }

        refreshDltSpeeds();
        updateDltSupplyIndex(market, isVerified);
        distributeSupplierDlt(market, supplier, isVerified);
    }


    /**
     * @notice Refresh DLT borrow index for the specified market and borrower
     * @param market The market whose borrow index to update
     * @param borrower The address of the borrower to distribute DLT to
     * @param isVerified Specifies if the market is from verified or public protocol
     */
    function refreshDltBorrowIndex(
        address market,
        address borrower,
        bool isVerified
    ) external {
        if(!allMarketsIndex[isVerified][market]) {
            return;
        }

        refreshDltSpeeds();
        updateDltBorrowIndex(market, isVerified);
        distributeBorrowerDlt(market, borrower, isVerified);
    }


    /**
     * @notice Claim all the DLT accrued by holder in all markets
     * @param holder The address to claim DLT for
     */
    function claimDlt(address holder) external {
        claimDlt(holder, allMarkets[true], true);
        claimDlt(holder, allMarkets[false], false);
    }


    /**
     * @notice Claim all the DLT accrued by holder by refreshing the indexes on the specified market only
     * @param holder The address to claim DLT for
     * @param market The address of the market to refresh the indexes for
     * @param isVerified Specifies if the market is from verified or public protocol
     */
    function claimDlt(
        address holder,
        address market,
        bool isVerified
    ) external {
        require(allMarketsIndex[isVerified][market], "Market does not exist");
        address[] memory markets = new address[](1);
        markets[0] = market;
        claimDlt(holder, markets, isVerified);
    }


    /**
     * Private functions
     */

    /**
     * @notice Recalculate and update DLT speeds for all markets
     */
    function refreshMarketLiquidity() internal view returns(Exp[] memory, Exp memory) {
        Exp memory totalLiquidity = Exp({ mantissa: 0 });
        Exp[] memory marketTotalLiquidity = new Exp[](
            add_(allMarkets[true].length, allMarkets[false].length)
        );

        address currentMarket;
        uint256 verifiedMarketsLength = allMarkets[true].length;
        uint256 currentMarketTotalSupply = 0;
        uint256 currentMarketTotalBorrows = 0;
        Exp memory currentMarketTotalLiquidity;

        for(uint256 i = 0; i < allMarkets[true].length; i++) {
            currentMarket = allMarkets[true][i];
            currentMarketTotalSupply = mul_(
                getMarketTotalSupply(currentMarket, true),
                // TODO deltaVerified.assetPrices(currentMarket)
                0
            );
            currentMarketTotalBorrows = mul_(
                getMarketTotalBorrows(currentMarket, true),
                // TODO deltaVerified.assetPrices(currentMarket)
                0
            );
            currentMarketTotalLiquidity = Exp({
                mantissa: add_(
                    currentMarketTotalSupply,
                    currentMarketTotalBorrows
                )
            });
            marketTotalLiquidity[i] = currentMarketTotalLiquidity;
            totalLiquidity = add_(totalLiquidity, currentMarketTotalLiquidity);
        }

        for(uint256 j = 0; j < allMarkets[false].length; j++) {
            currentMarket = allMarkets[false][j];
            currentMarketTotalSupply = mul_(
                getMarketTotalSupply(currentMarket, false),
                // TODO deltaVerified.assetPrices(currentMarket)
                0
            );
            currentMarketTotalBorrows = mul_(
                getMarketTotalBorrows(currentMarket, false),
                // TODO deltaVerified.assetPrices(currentMarket)
                0
            );
            currentMarketTotalLiquidity = Exp({
                mantissa: add_(
                    currentMarketTotalSupply,
                    currentMarketTotalBorrows
                )
            });
            marketTotalLiquidity[
                verifiedMarketsLength + j
            ] = currentMarketTotalLiquidity;
            totalLiquidity = add_(totalLiquidity, currentMarketTotalLiquidity);
        }
        return (marketTotalLiquidity, totalLiquidity);
    }


    /**
     * @notice Recalculate and update DLT speeds for all markets
     */
    function refreshDltSpeeds() public {
        address currentMarket;
        (
            Exp[] memory marketTotalLiquidity,
            Exp memory totalLiquidity
        ) = refreshMarketLiquidity();

        uint256 newSpeed;
        uint256 verifiedMarketsLength = allMarkets[true].length;

        for(uint256 i = 0; i < allMarkets[true].length; i++) {
            currentMarket = allMarkets[true][i];
            newSpeed = totalLiquidity.mantissa > 0
                ? mul_(dltRate, div_(marketTotalLiquidity[i], totalLiquidity))
                : 0;
            dltSpeeds[true][currentMarket] = newSpeed;
            emit DltSpeedUpdated(currentMarket, newSpeed, true);
        }

        for(uint256 j = 0; j < allMarkets[false].length; j++) {
            currentMarket = allMarkets[false][j];
            newSpeed = totalLiquidity.mantissa > 0
                ? mul_(
                    dltRate,
                    div_(
                        marketTotalLiquidity[verifiedMarketsLength + j],
                        totalLiquidity
                    )
                )
                : 0;

            dltSpeeds[false][currentMarket] = newSpeed;
            emit DltSpeedUpdated(currentMarket, newSpeed, false);
        }
    }


    /**
     * @notice Accrue DLT to the market by updating the supply index
     * @param market The market whose supply index to update
     * @param isVerified Verified / Public protocol
     */
    function updateDltSupplyIndex(address market, bool isVerified) public {
        MarketState storage supplyState = dltSupplyState[isVerified][market];
        uint256 marketSpeed = dltSpeeds[isVerified][market];
        uint256 blockNumber = block.number;
        uint256 deltaBlocks = sub_(blockNumber, uint256(supplyState.block));
        
        if(deltaBlocks > 0 && marketSpeed > 0) {
            uint256 marketTotalSupply = getMarketTotalSupply(
                market,
                isVerified
            );
            uint256 supplyDltAccrued = mul_(deltaBlocks, marketSpeed);
            Double memory ratio = marketTotalSupply > 0
                ? fraction(supplyDltAccrued, marketTotalSupply)
                : Double({ mantissa: 0 });
            Double memory index = add_(
                Double({ mantissa: supplyState.index }),
                ratio
            );
            dltSupplyState[isVerified][market] = MarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(blockNumber, "block number exceeds 32 bits")
            });
        } else if(deltaBlocks > 0) {
            supplyState.block = safe32(
                blockNumber,
                "block number exceeds 32 bits"
            );
        }
    }


    /**
     * @notice Accrue DLT to the market by updating the borrow index
     * @param market The market whose borrow index to update
     * @param isVerified Verified / Public protocol
     */
    function updateDltBorrowIndex(address market, bool isVerified) public {
        MarketState storage borrowState = dltBorrowState[isVerified][market];
        uint256 marketSpeed = dltSpeeds[isVerified][market];
        uint256 blockNumber = block.number;
        uint256 deltaBlocks = sub_(blockNumber, uint256(borrowState.block));

        if(deltaBlocks > 0 && marketSpeed > 0) {
            uint256 marketTotalBorrows = getMarketTotalBorrows(
                market,
                isVerified
            );
            uint256 borrowDltAccrued = mul_(deltaBlocks, marketSpeed);
            Double memory ratio = marketTotalBorrows > 0
                ? fraction(borrowDltAccrued, marketTotalBorrows)
                : Double({mantissa: 0});
            Double memory index = add_(
                Double({mantissa: borrowState.index}),
                ratio
            );
            dltBorrowState[isVerified][market] = MarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(blockNumber, "block number exceeds 32 bits")
            });
        } else if(deltaBlocks > 0) {
            borrowState.block = safe32(
                blockNumber,
                "block number exceeds 32 bits"
            );
        }
    }

    /**
     * @notice Calculate DLT accrued by a supplier and add it on top of dltAccrued[supplier]
     * @param market The market in which the supplier is interacting
     * @param supplier The address of the supplier to distribute DLT to
     * @param isVerified Verified / Public protocol
     */
    function distributeSupplierDlt(
        address market,
        address supplier,
        bool isVerified
    ) public {
        MarketState storage supplyState = dltSupplyState[isVerified][market];
        Double memory supplyIndex = Double({mantissa: supplyState.index});
        Double memory supplierIndex = Double({
            mantissa: dltSupplierIndex[isVerified][market][supplier]
        });
        dltSupplierIndex[isVerified][market][supplier] = supplyIndex.mantissa;

        if(supplierIndex.mantissa > 0) {
            Double memory deltaIndex = sub_(supplyIndex, supplierIndex);
            uint256 supplierBalance = getSupplyBalanceWithInterest(
                market,
                supplier,
                isVerified
            );
            uint256 supplierDelta = mul_(supplierBalance, deltaIndex);
            dltAccrued[supplier] = add_(dltAccrued[supplier], supplierDelta);
            emit DistributedSupplierDlt(
                market,
                supplier,
                supplierDelta,
                dltAccrued[supplier],
                supplyIndex.mantissa,
                isVerified
            );
        }
    }


    /**
     * @notice Calculate DLT accrued by a borrower and add it on top of dltAccrued[borrower]
     * @param market The market in which the borrower is interacting
     * @param borrower The address of the borrower to distribute DLT to
     * @param isVerified Verified / Public protocol
     */
    function distributeBorrowerDlt(
        address market,
        address borrower,
        bool isVerified
    ) public {
        MarketState storage borrowState = dltBorrowState[isVerified][market];
        Double memory borrowIndex = Double({mantissa: borrowState.index});
        Double memory borrowerIndex = Double({
            mantissa: dltBorrowerIndex[isVerified][market][borrower]
        });
        dltBorrowerIndex[isVerified][market][borrower] = borrowIndex.mantissa;

        if(borrowerIndex.mantissa > 0) {
            Double memory deltaIndex = sub_(borrowIndex, borrowerIndex);
            uint256 borrowerBalance = getBorrowBalanceWithInterest(
                market,
                borrower,
                isVerified
            );
            uint256 borrowerDelta = mul_(borrowerBalance, deltaIndex);
            dltAccrued[borrower] = add_(dltAccrued[borrower], borrowerDelta);
            emit DistributedBorrowerDlt(
                market,
                borrower,
                borrowerDelta,
                dltAccrued[borrower],
                borrowIndex.mantissa,
                isVerified
            );
        }
    }


    /**
     * @notice Claim all the DLT accrued by holder in the specified markets
     * @param holder The address to claim DLT for
     * @param markets The list of markets to claim DLT in
     * @param isVerified Verified / Public protocol
     */
    function claimDlt(
        address holder,
        address[] memory markets,
        bool isVerified
    ) internal {
        for(uint256 i = 0; i < markets.length; i++) {
            address market = markets[i];

            updateDltSupplyIndex(market, isVerified);
            distributeSupplierDlt(market, holder, isVerified);

            updateDltBorrowIndex(market, isVerified);
            distributeBorrowerDlt(market, holder, isVerified);

            dltAccrued[holder] = transferDlt(
                holder,
                dltAccrued[holder],
                market,
                isVerified
            );
        }
    }


    /**
     * @notice Transfer DLT to the participant
     * @dev Note: If there is not enough DLT, we do not perform the transfer all.
     * @param participant The address of the participant to transfer DLT to
     * @param participantAccrued The amount of DLT to (possibly) transfer
     * @param market Market for which DLT is transferred
     * @param isVerified Verified / Public Protocol
     * @return The amount of DLT which was NOT transferred to the participant
     */
    function transferDlt(
        address participant,
        uint256 participantAccrued,
        address market,
        bool isVerified
    ) internal returns(uint256) {
        if(participantAccrued > 0) {
            IEIP20 dlt = IEIP20(dltAddress);
            uint256 dltRemaining = dlt.balanceOf(address(this));
            if(participantAccrued <= dltRemaining) {
                dlt.transfer(participant, participantAccrued);
                emit TransferredDlt(
                    participant,
                    participantAccrued,
                    market,
                    isVerified
                );
                return 0;
            }
        }
        return participantAccrued;
    }


    /**
     * @notice Get the current accrued DLT for a participant
     * @param participant The address of the participant
     * @return The amount of accrued DLT for the participant
     */
    function getDltAccrued(address participant) public view returns(uint256) {
        return dltAccrued[participant];
    }


    /**
     * @notice Get the address of the underlying DeltaVerified and DeltaOpen contract
     * @return The address of the underlying DeltaVerified and DeltaOpen contract
     */
    function getDeltaAddresses() public view returns(address, address) {
        return (address(deltaVerified), address(deltaOpen));
        // return (address(0), address(deltaOpen));
    }


    /**
     * @notice Get market statistics from the DeltaVerified contract
     * @param market The address of the market
     * @param isVerified Verified / Public protocol
     */
    function getMarketStats(address market, bool isVerified) public view returns(
        bool isSupported,
        uint256 blockNumber,
        address interestRateModel,
        uint256 totalSupply,
        uint256 supplyRateMantissa,
        uint256 supplyIndex,
        uint256 totalBorrows,
        uint256 borrowRateMantissa,
        uint256 borrowIndex
    ) {
        if(isVerified) {
            // TODO return (deltaVerified.markets(market));
            return deltaVerified.markets(market); // TODO
        } else {
            return deltaOpen.markets(market);
        }
    }

    /**
     * @notice Get market total supply from the DeltaVerified / DeltaOpen contract
     * @param market The address of the market
     * @param isVerified Verified / Public protocol
     * @return Market total supply for the given market
     */
    function getMarketTotalSupply(address market, bool isVerified) public view returns(uint256) {
        uint256 totalSupply;
        (, , , totalSupply, , , , , ) = getMarketStats(market, isVerified);
        return totalSupply;
    }


    /**
     * @notice Get market total borrows from the DeltaVerified contract
     * @param market The address of the market
     * @param isVerified Verified / Public protocol
     * @return Market total borrows for the given market
     */
    function getMarketTotalBorrows(address market, bool isVerified) public view returns(uint256) {
        uint256 totalBorrows;
        (, , , , , , totalBorrows, , ) = getMarketStats(market, isVerified);
        return totalBorrows;
    }


    /**
     * @notice Get supply balance of the specified market and supplier
     * @param market The address of the market
     * @param supplier The address of the supplier
     * @param isVerified Verified / Public protocol
     * @return Supply balance of the specified market and supplier
     */
    function getSupplyBalanceWithInterest(
        address market,
        address supplier,
        bool isVerified
    ) public view returns(uint256) {
        if(isVerified) {
            return deltaVerified.getSupplyBalanceWithInterest(supplier, market);
        } else {
            return deltaOpen.getSupplyBalanceWithInterest(supplier, market);
        }
    }


    /**
     * @notice Get borrow balance of the specified market and borrower
     * @param market The address of the market
     * @param borrower The address of the borrower
     * @param isVerified Verified / Public protocol
     * @return Borrow balance of the specified market and borrower
     */
    function getBorrowBalanceWithInterest(
        address market,
        address borrower,
        bool isVerified
    ) public view returns(uint256) {
        if(isVerified) {
            return deltaVerified.getBorrowBalanceWithInterest(borrower, market);
        } else {
            return deltaOpen.getBorrowBalanceWithInterest(borrower, market);
        }
    }


    /**
     * Admin functions
     */

    /**
     * @notice Transfer the ownership of this contract to the new owner. The ownership will not be transferred until the new owner accept it.
     * @param newOwner_ The address of the new owner
     */
    function transferOwnership(address newOwner_) external onlyOwner {
        require(newOwner_ != owner, "TransferOwnership: the same owner.");
        owner = newOwner_;
    }


    /**
     * @notice Add new market to the reward program
     * @param market The address of the new market to be added to the reward program
     * @param isVerified Verified / Public protocol
     */
    function addMarket(address market, bool isVerified) external onlyOwner {
        require(!allMarketsIndex[isVerified][market], "Market already exists");
        require(
            allMarkets[isVerified].length < uint256(MAXIMUM_NUMBER_OF_MARKETS),
            "Exceeding the max number of markets allowed"
        );

        allMarketsIndex[isVerified][market] = true;
        allMarkets[isVerified].push(market);

        emit MarketAdded(
            market,
            add_(allMarkets[isVerified].length, allMarkets[!isVerified].length),
            isVerified
        );
    }


    /**
     * @notice Remove a market from the reward program based on array index
     * @param id The index of the `allMarkets` array to be removed
     * @param isVerified Verified / Public protocol
     */
    function removeMarket(uint256 id, bool isVerified) external onlyOwner {
        if(id >= allMarkets[isVerified].length) {
            return;
        }
        allMarketsIndex[isVerified][allMarkets[isVerified][id]] = false;
        address removedMarket = allMarkets[isVerified][id];

        for(uint256 i = id; i < allMarkets[isVerified].length - 1; i++) {
            allMarkets[isVerified][i] = allMarkets[isVerified][i + 1];
        }
        allMarkets[isVerified].pop();
        
        // reset the DLT speeds for the removed market and refresh DLT speeds
        dltSpeeds[isVerified][removedMarket] = 0;
        refreshDltSpeeds();
        emit MarketRemoved(
            removedMarket,
            add_(allMarkets[isVerified].length, allMarkets[!isVerified].length),
            isVerified
        );
    }


    /**
     * @notice Get latest DLT rewards
     * @param user the supplier/borrower
     */
    function getDltRewards(address user) external view returns(uint256) {
        // Refresh DLT speeds
        uint256 dltRewards = dltAccrued[user];
        (
            Exp[] memory marketTotalLiquidity,
            Exp memory totalLiquidity
        ) = refreshMarketLiquidity();

        uint256 verifiedMarketsLength = allMarkets[true].length;
        for(uint256 i = 0; i < allMarkets[true].length; i++) {
            dltRewards = add_(
                dltRewards,
                add_(
                    getSupplyDltRewards(
                        totalLiquidity,
                        marketTotalLiquidity,
                        user,
                        i,
                        i,
                        true
                    ),
                    getBorrowDltRewards(
                        totalLiquidity,
                        marketTotalLiquidity,
                        user,
                        i,
                        i,
                        true
                    )
                )
            );
        }

        for(uint256 j = 0; j < allMarkets[false].length; j++) {
            uint256 index = verifiedMarketsLength + j;
            dltRewards = add_(
                dltRewards,
                add_(
                    getSupplyDltRewards(
                        totalLiquidity,
                        marketTotalLiquidity,
                        user,
                        index,
                        j,
                        false
                    ),
                    getBorrowDltRewards(
                        totalLiquidity,
                        marketTotalLiquidity,
                        user,
                        index,
                        j,
                        false
                    )
                )
            );
        }
        return dltRewards;
    }


    /**
     * @notice Get latest Supply DLT rewards
     * @param totalLiquidity Total Liquidity of all markets
     * @param marketTotalLiquidity Array of individual market liquidity
     * @param user the supplier
     * @param i index of the market in marketTotalLiquidity array
     * @param j index of the market in the verified/public allMarkets array
     * @param isVerified Verified / Public protocol
     */
    function getSupplyDltRewards(
        Exp memory totalLiquidity,
        Exp[] memory marketTotalLiquidity,
        address user,
        uint256 i,
        uint256 j,
        bool isVerified
    ) internal view returns(uint256) {
        uint256 newSpeed = totalLiquidity.mantissa > 0
            ? mul_(dltRate, div_(marketTotalLiquidity[i], totalLiquidity))
            : 0;
        MarketState memory supplyState = dltSupplyState[isVerified][
            allMarkets[isVerified][j]
        ];
        if(
            sub_(block.number, uint256(supplyState.block)) > 0 &&
            newSpeed > 0
        ) {
            Double memory index = add_(
                Double({mantissa: supplyState.index}),
                (
                    getMarketTotalSupply(
                        allMarkets[isVerified][j],
                        isVerified
                    ) > 0
                        ? fraction(
                            mul_(
                                sub_(
                                    block.number,
                                    uint256(supplyState.block)
                                ),
                                newSpeed
                            ),
                            getMarketTotalSupply(
                                allMarkets[isVerified][j],
                                isVerified
                            )
                        )
                        : Double({mantissa: 0})
                )
            );
            supplyState = MarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(block.number, "block number exceeds 32 bits")
            });
        } else if(sub_(block.number, uint256(supplyState.block)) > 0) {
            supplyState.block = safe32(
                block.number,
                "block number exceeds 32 bits"
            );
        }


        if(Double({ mantissa: dltSupplierIndex[isVerified][allMarkets[isVerified][j]][user] }).mantissa > 0) {
            if(isVerified) {
                uint256 bal = deltaVerified.getSupplyBalanceWithInterest(
                    user,
                    allMarkets[isVerified][j]
                );

                return 
                    mul_(
                        bal,
                        sub_(
                            Double({mantissa: supplyState.index}),
                            Double({
                                mantissa: dltSupplierIndex[isVerified][
                                    allMarkets[isVerified][j]
                                ][user]
                            })
                        )
                    );
            } else {
                uint256 bal = deltaOpen.getSupplyBalanceWithInterest(
                    user,
                    allMarkets[isVerified][j]
                );

                return
                    mul_(
                        bal,
                        sub_(
                            Double({mantissa: supplyState.index}),
                            Double({
                                mantissa: dltSupplierIndex[isVerified][
                                    allMarkets[isVerified][j]
                                ][user]
                            })
                        )
                    );
            }
        } else {
            return 0;
        }
    }


    /**
     * @notice Get latest Borrow DLT rewards
     * @param totalLiquidity Total Liquidity of all markets
     * @param marketTotalLiquidity Array of individual market liquidity
     * @param user the borrower
     * @param i index of the market in marketTotalLiquidity array
     * @param j index of the market in the verified/public allMarkets array
     * @param isVerified Verified / Public protocol
     */
    function getBorrowDltRewards(
        Exp memory totalLiquidity,
        Exp[] memory marketTotalLiquidity,
        address user,
        uint256 i,
        uint256 j,
        bool isVerified
    ) internal view returns(uint256) {
        uint256 newSpeed = totalLiquidity.mantissa > 0
            ? mul_(dltRate, div_(marketTotalLiquidity[i], totalLiquidity))
            : 0;

        MarketState memory borrowState = dltBorrowState[isVerified][allMarkets[isVerified][j]];

        if(
            sub_(block.number, uint256(borrowState.block)) > 0 &&
            newSpeed > 0
        ) {
            Double memory index = add_(
                Double({mantissa: borrowState.index}),
                (
                    getMarketTotalBorrows(
                        allMarkets[isVerified][j],
                        isVerified
                    ) > 0
                        ? fraction(
                            mul_(
                                sub_(
                                    block.number,
                                    uint256(borrowState.block)
                                ),
                                newSpeed
                            ),
                            getMarketTotalBorrows(
                                allMarkets[isVerified][j],
                                isVerified
                            )
                        )
                        : Double({mantissa: 0})
                )
            );
            borrowState = MarketState({
                index: safe224(index.mantissa, "new index exceeds 224 bits"),
                block: safe32(block.number, "block number exceeds 32 bits")
            });
        } else if(sub_(block.number, uint256(borrowState.block)) > 0) {
            borrowState.block = safe32(
                block.number,
                "block number exceeds 32 bits"
            );
        }

        if(Double({ mantissa: dltBorrowerIndex[isVerified][allMarkets[isVerified][j]][user] }).mantissa > 0) {
            if(isVerified) {
                uint256 bal = deltaVerified.getBorrowBalanceWithInterest(
                    user,
                    allMarkets[isVerified][j]
                );

                return
                    mul_(
                        bal,
                        sub_(
                            Double({ mantissa: borrowState.index }),
                            Double({
                                mantissa: dltBorrowerIndex[isVerified][
                                    allMarkets[isVerified][j]
                                ][user]
                            })
                        )
                    );
            } else {
                uint256 bal = deltaOpen.getBorrowBalanceWithInterest(
                    user,
                    allMarkets[isVerified][j]
                );

                return
                    mul_(
                        bal,
                        sub_(
                            Double({ mantissa: borrowState.index }),
                            Double({
                                mantissa: dltBorrowerIndex[isVerified][
                                    allMarkets[isVerified][j]
                                ][user]
                            })
                        )
                    );
            }
        } else {
            return 0;
        }
    }
}
