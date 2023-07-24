// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./Tranche.sol";


interface IAaveLendingpool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external;
}


interface ICY is IERC20 {
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
}


/// @title DeltaInsurance - A decentralized DeFi insurance protocol
/// @notice Deposited funds are invested into Aave and Compound.
///         Redeeming rights are split into two tranches with different seniority
contract DeltaInsurance {
    address A; // Tranche A
    address B; // Tranche B

    address AAVE_V2;  // Aave v2 lending pool
    address CX;       // Aave v2 interest bearing DAI (CX)
    address CY;       // Compound interest bearing DAI (CY)

    /* Math helper for decimal numbers */
    uint256 constant RAY = 1e27; // Used for floating point math

    /*
      Time controls
      - UNIX timestamps
      - Can be defined globally (here) or relative to deployment time (constructor)
    */
    uint256 immutable S;
    uint256 immutable T1;
    uint256 immutable T2;
    uint256 immutable T3;

    uint256 totalTranches; // Total A + B tokens
    bool isInvested; // True if c has been deposited for cx and cy
    bool inLiquidMode; // True: distribute c , False: xc/cy tokens claimable

    /* Liquid mode */
    uint256 cPayoutA; // Payout in c tokens per A tranche, after dividing by RAY
    uint256 cPayoutB; // Payout in c tokens per B tranche, after dividing by RAY

    /* Fallback mode */
    uint256 cxPayout; // Payout in cx tokens per (A or B) tranche, after dividing by RAY
    uint256 cyPayout; // Payout in cy tokens per (A or B) tranche, after dividing by RAY


    event RiskSplit(
        address indexed splitter,
        uint256 amount_c
    );
    event Invest(
        uint256 amount_c, 
        uint256 amount_cx, 
        uint256 amount_cy, 
        uint256 amount_c_incentive
    );
    event Divest(
        uint256 amount_c, 
        uint256 amount_cx, 
        uint256 amount_cy, 
        uint256 amount_c_incentive
    );
    event Claim(
        address indexed claimant, 
        uint256 amount_A, 
        uint256 amount_B, 
        uint256 amount_c, 
        uint256 amount_cx, 
        uint256 amount_cy
    );


    constructor(
        address aaveV2LendingPool_,
        address aaveADai_,
        address compoundCDai_
    ) {
        A = address(new Tranche("Tranche A", "A"));
        B = address(new Tranche("Tranche B", "B"));

        AAVE_V2 = aaveV2LendingPool_;
        CX = aaveADai_;
        CY = compoundCDai_;

        S = block.timestamp + 3600 * 24 * 7; // +7 days
        T1 = S + 3600 * 24 * 28; // +28 days
        T2 = T1 + 3600 * 24 * 1; // +1 day
        T3 = T2 + 3600 * 24 * 3; // +3days
    }


    function getInsuranceBalances(address sender) external view returns(uint256, uint256) {
        return (ITranche(A).balanceOf(sender), ITranche(B).balanceOf(sender));
    }


    /// @notice Deposit Dai into the protocol. Receive equal amounts of A and B tranches.
    /// @dev    Requires approval for Dai
    /// @param  asset The asset to invest into the protocol
    /// @param  amount The amount of asset to invest into the protocol
    function splitRisk(address asset, uint256 amount) public {
        // require(block.timestamp < S, "[Insurance]: no longer in issuance period");
        require(amount > 1, "[Insurance]: amount too low");

        if(amount % 2 != 0) {
            amount -= 1; // Only accept even denominations
        }

        require(
            IERC20(asset).transferFrom(msg.sender, address(this), amount),
            "[Insurance]: failed to transfer asset tokens"
        );

        ITranche(A).mint(msg.sender, amount / 2);
        ITranche(B).mint(msg.sender, amount / 2);

        emit RiskSplit(
            msg.sender, 
            amount
        );
    }


    /// @notice Invest all deposited funds into Aave and Compound, 50:50
    /// @dev  Should be incentivized for the first successful call
    function invest(address asset) public {
        require(!isInvested, "[Insurance]: investment was already performed");
        require(block.timestamp >= S, "[Insurance]: still in issuance period");
        require(block.timestamp < T1, "[Insurance]: no longer in insurance period");

        uint256 assetBalance = IERC20(asset).balanceOf(address(this));
        require(assetBalance > 0, "[Insurance]: insufficient asset balance");

        // totalTranches = ITranche(A).totalSupply() * 2;

        // Protocol X: Aave
        IERC20(asset).approve(AAVE_V2, assetBalance / 2);
        IAaveLendingpool(AAVE_V2).deposit(asset, assetBalance / 2, address(this), 0);

        // Protocol Y: Compound
        IERC20(asset).approve(CY, assetBalance / 2);
        ICY(CY).mint(assetBalance / 2);

        isInvested = true;

        emit Invest(
            assetBalance, 
            IERC20(CX).balanceOf(asset, address(this)), 
            IERC20(CY).balanceOf(asset, address(this)), 
            0
        );
    }


    /// @notice Attempt to withdraw all funds from Aave and Compound.
    ///         Then calculate the redeem ratios, or enter fallback mode
    /// @dev    Should be incentivized for the first successful call
    function divest(address asset) external {
        // Should be incentivized on the first successful call
        require(block.timestamp >= T1, "[Insurance]: still in insurance period");
        require(block.timestamp < T2, "[Insurance]: already in claim period");

        IERC20 cToken  = IERC20(asset);
        IERC20 cxToken = IERC20(CX);
        ICY cyToken = ICY(CY);

        uint256 halfOfTranches = totalTranches / 2;
        uint256 balance_cx = cxToken.balanceOf(address(this));
        uint256 balance_cy = cyToken.balanceOf(address(this));
        require(
            balance_cx > 0 && balance_cy > 0, 
            "[Insurance]: unable to redeem tokens"
        );

        uint256 interest;

        // Protocol X: Aave
        uint256 balance_c = cToken.balanceOf(address(this));
        IAaveLendingpool(AAVE_V2).withdraw(asset, balance_cx, address(this));

        uint256 withdrawn_x = cToken.balanceOf(address(this)) - balance_c;
        if(withdrawn_x > halfOfTranches) {
            interest += withdrawn_x - halfOfTranches;
        }

        // Protocol Y: Compound
        require(
            cyToken.redeem(balance_cy) == 0,
            "[Insurance]: unable to redeem cDai"
        );

        uint256 withdrawn_y = cToken.balanceOf(address(this)) - balance_c - withdrawn_x;
        if(withdrawn_y > halfOfTranches) {
            interest += withdrawn_y - halfOfTranches;
        }

        require(
            cxToken.balanceOf(address(this)) == 0 && cyToken.balanceOf(address(this)) == 0, 
            "[Insurance]: Error while redeeming tokens"
        );

        // Determine payouts
        inLiquidMode = true;
        balance_c = cToken.balanceOf(address(this));
        if(balance_c >= totalTranches) {
            // No losses, equal split of all c among A/B shares
            cPayoutA = RAY * balance_c / totalTranches;
            cPayoutB = cPayoutA;
        } else if(balance_c > halfOfTranches) {
            // Balance covers at least the investment of all A shares
            cPayoutA = RAY * interest / halfOfTranches + RAY; // A tranches fully covered and receive all interest
            cPayoutB = RAY * (balance_c - halfOfTranches - interest) / halfOfTranches;
        } else {
            // Greater or equal than 50% loss
            cPayoutA = RAY * balance_c / halfOfTranches; // Divide recovered assets among A
            cPayoutB = 0; // Not enough to cover B
        }

        emit Divest(
            balance_c, 
            balance_cx, 
            balance_cy, 
            0
        );
    }


    /// @notice Redeem A-tranches for aDai or cDai
    /// @dev    Only available in fallback mode
    /// @param  tranches_to_cx The amount of A-tranches that will be redeemed for aDai
    /// @param  tranches_to_cy The amount of A-tranches that will be redeemed for cDai
    function claimA(
        address asset,
        uint256 tranches_to_cx, 
        uint256 tranches_to_cy
    ) external {
        if(!isInvested && !inLiquidMode && block.timestamp >= T1) {
            // If invest was never called, activate liquid mode for redemption
            inLiquidMode = true;
        }

        if(inLiquidMode) {
            // Pay out c directly
            claim(asset, tranches_to_cx + tranches_to_cy, 0);
            return;
        }

        require(
            block.timestamp >= T2, 
            "[Insurance]: claim period for A tranches not active yet"
        );

        _claimFallback(tranches_to_cx, tranches_to_cy, A);
    }


    /// @notice Redeem B-tranches for aDai or cDai
    /// @dev    Only available in fallback mode, after A-tranches had a window to redeem
    /// @param  tranches_to_cx The amount of B-tranches that will be redeemed for aDai
    /// @param  tranches_to_cy The amount of B-tranches that will be redeemed for cDai
    function claimB(
        address asset,
        uint256 tranches_to_cx, 
        uint256 tranches_to_cy
    ) external {
        if(!isInvested && !inLiquidMode && block.timestamp >= T1) {
            // If invest was never called, activate liquid mode for redemption
            inLiquidMode = true;
        }

        if(inLiquidMode) {
            // Pay out c directly
            claim(asset, 0, tranches_to_cx + tranches_to_cy);
            return;
        }

        require(
            block.timestamp >= T3, 
            "[Insurance]: claim period for B tranches not active yet"
        );

        _claimFallback(tranches_to_cx, tranches_to_cy, B);
    }


    /// @notice Redeem **all** owned A- and B-tranches for asset
    /// @dev    Only available in liquid mode
    function claimAll(address asset) public {
        uint256 balance_A = ITranche(A).balanceOf(msg.sender);
        uint256 balance_B = ITranche(B).balanceOf(msg.sender);
        require(
            balance_A > 0 || balance_B > 0, 
            "[Insurance]: insufficient tranche tokens"
        );

        claim(asset, balance_A, balance_B);
    }


    /// @notice Redeem A- and B-tranches for asset
    /// @dev    Only available in liquid mode
    /// @param  amount_A The amount of A-tranches that will be redeemed for asset
    /// @param  amount_B The amount of B-tranches that will be redeemed for asset
    function claim(
        address asset, 
        uint256 amount_A, 
        uint256 amount_B
    ) public {
        if(!inLiquidMode) {
            if(!isInvested && block.timestamp >= T1) {
                // If invest was never called, activate liquid mode for redemption
                inLiquidMode = true;
            } else {
                if(block.timestamp < T1) {
                    revert("[Insurance]: can not claim during insurance period");
                } else if(block.timestamp < T2) {
                    revert("[Insurance]: call divest() first");
                } else {
                    revert("[Insurance]: use claimA() or claimB() instead");
                }
            }
        }

        require(
            amount_A > 0 || amount_B > 0, 
            "[Insurance]: amount_A or amount_B must be greater than zero"
        );

        uint256 payout_c;

        if(amount_A > 0) {
            ITranche tranche_A = ITranche(A);
            require(
                tranche_A.balanceOf(msg.sender) >= amount_A, 
                "[Insurance]: insufficient tranche A tokens"
            );

            tranche_A.burn(msg.sender, amount_A);
            payout_c += cPayoutA * amount_A / RAY;
        }


        if(amount_B > 0) {
            ITranche tranche_B = ITranche(B);
            require(
                tranche_B.balanceOf(msg.sender) >= amount_B, 
                "[Insurance]: insufficient tranche B tokens"
            );

            tranche_B.burn(msg.sender, amount_B);
            payout_c += cPayoutB * amount_B / RAY;
        }

        if(payout_c > 0) {
            IERC20(asset).transfer(msg.sender, payout_c);
        }

        emit Claim(
            msg.sender, 
            amount_A, 
            amount_B, 
            payout_c, 
            0, 
            0
        );
    }


    function _claimFallback(
        uint256 tranches_to_cx, 
        uint256 tranches_to_cy, 
        address trancheAddress
    ) internal {
        require(
            tranches_to_cx > 0 || tranches_to_cy > 0, 
            "[Insurance]: to_cx or to_cy must be greater than zero"
        );

        ITranche tranche = ITranche(trancheAddress);
        require(
            tranche.balanceOf(msg.sender) >= tranches_to_cx + tranches_to_cy, 
            "[Insurance]: sender does not hold enough tranche tokens"
        );

        uint256 amount_A;
        uint256 amount_B;
        if(trancheAddress == A) {
            amount_A = tranches_to_cx + tranches_to_cy;
        } else if(trancheAddress == B) {
            amount_B = tranches_to_cx + tranches_to_cy;
        }

        // Payouts
        uint256 payout_cx;
        uint256 payout_cy;
        if(tranches_to_cx > 0) {
            IERC20 cxToken = IERC20(CX);

            // Initialize cx split, only on first call
            if(cxPayout == 0) {
                cxPayout = RAY * cxToken.balanceOf(address(this)) / totalTranches / 2;
            }

            tranche.burn(msg.sender, tranches_to_cx);
            payout_cx = tranches_to_cx * cxPayout / RAY;
            cxToken.transfer(msg.sender, payout_cx);
        }

        if(tranches_to_cy > 0) {
            IERC20 cyToken = IERC20(CY);

            // Initialize cy split, only on first call
            if(cyPayout == 0) {
                cyPayout = RAY * cyToken.balanceOf(address(this)) / totalTranches / 2;
            }

            tranche.burn(msg.sender, tranches_to_cy);
            payout_cy =  tranches_to_cy * cyPayout / RAY;
            cyToken.transfer(msg.sender, payout_cy);
        }

        emit Claim(
            msg.sender, 
            amount_A, 
            amount_B, 
            0, 
            payout_cx, 
            payout_cy
        );
    }
}