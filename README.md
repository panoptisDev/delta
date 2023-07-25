# Delta (Web3Conf 2023)


# What is Delta?

Delta is a protocol that offers DeFi access to everyone through a set of products that serves as onramps from a legacy financial system to the future of natively-digital capital coordination. In essence, Delta offers more capital-efficient features to your assets. In particular, we provide the following features: 

1. Institution-grade DeFi lending & borrowing protocol
2. DeFi Risk Transfer protocol

For the purposes of this hackathon, we have deployed this project on the [Mantle Testnet](https://mantle.xyz/) -- no particular reason apart from fast transaction times and low gas fees. Theoretically, Delta can be deployed on any EVM-compatible chain.


## 1. Lending & Borrowing

We envision a future where multiple tokens are deployed on networks, competing with each other. However, one of the biggest drawbacks to this is that not all these assets would be supported on third-party lending & borrowing protocols such as [Aave](https://aave.com/) and [Compound](https://compound.finance/) (or similar). Delta solves this problem by introducing an institution-grade DeFi borrowing and lending protocol featuring ***permissioned*** and ***permissionless*** liquidity pools exclusively for these assets.

* The ***permissionless***/***Open*** pool is open & public, allowing anyone to lending and borrow tokens at high APYs.

* The ***permissioned***/***Verified*** pool is KYC-restricted. It is tailored for institutional clients, solving the friction points of capital, connectivity and control and enabling their participation in the emerging on-chain structured financial product yields of DeFi.


### Why not use use Aave or Compound? 

See above. Also, Delta offers higher APYs, and attracts greater CeFi adoption into the DeFi and Mantle ecosystem.


### Some points

1. Borrowers pay 0.1% of the borrowed amount as an "origination" fee, which is added to the total borrow amount in its respective token.
2. Liquidations carry a 10% fee paid directly to the liquidator.
3. All transactions occur on the [Mantle Testnet](https://explorer.testnet.mantle.xyz/).



## 2. DeFi Risk Transfer / Insurance


Insurance on Delta is not exactly "insurance" in the traditional P2P Insurance Model; rather, we introduce a novel concept: *P2P Risk Transfer*. It is a combination of P2P Insurance, seniority-based promises, and DeFi specifics. In other words, you may think of it as a decentralized risk hedging protocol based on tranched insurance. 

The general idea is that we pools assets from third-party protocols (like Aave and Compound), and allow users to split the pool redemption rights into two tranches: *A* and *B*. If any of the third-party protocols suffer losses during the insurance period, those losses will be primarily borne by the B-tranche holders. A-tranche holders will only be negatively affected if 50% or more of the pooled funds are irrecoverable, or if both protocols become temporarily illiquid and face (partial) losses. We effectively split the redemption rights into a riskier and less risky version and allow the market for A- and B- tranches to determine the fair risk premium in line with the users’ expectations.


There are three main phases:

1. ***Risk Splitting***: In this phase, which can potentially last about 7-21 days, anyone may deposit their preferred amount of tokens into the insurance protocol. In exchange, users receive equal denominations of A- and B- tranches, ensuring that an equal number of tranches are created. 

2. In the ***Invest/Divest*** phase, the protocol allocates the *underlying collateral* behind the accumulated tokens and deposits them equally into two third-party protocols (e.g. Aave & Compound). In return, the protocol rececives two interest-bearing tokens (wrapped liquidity shares), namely `Cx` and `Cy` from each protocol. At the end of this phase, the protocol attempts to liquidate the wrapped shares. This is necessary to prepare for the redemption of the A- and B- tranches

3. In the ***Redemption*** phase, the protocol computes potential losses and allows the A- and B- tranche holders to claim their respective share of the underlying. If a third-party protocol suffers from a liquidity crunch or if an external contract changes the expected behavior. In fallback mode, users redeem their tranche tokens directly for their preferred mix of Cx and Cy tokens. The higher tranche seniority of A-tranches is ensured through a timelock-based redemption sequence. In a first step, A-tranche holders get to choose if they want to claim their share in `Cx`, `Cy` or a mix of the two. After the timelock is over, B-tranche holders can claim what is left.


Additionally, our approach (P2P Risk Transfer) has several advantages over other DeFi insurance solutions. In addition to being fully decentralized and trustless, it also prevents over-insurance, does not rely on any parametric triggers, and is highly capital-efficient.


### P2P Insurance vs P2P Risk Transfer?

P2P insurance usually covers individual risks. As such, P2P insurance is built on the general assumption that damages within the collective are uncorrelated and that premiums of the unaffected insurants can be used to compensate the ones that have suffered losses. Delta insures large scale risks that will affect all insurance holders. Consequently, we need explicit roles in accordance with the individuals’ risk preferences. This is achieved by creating tranches with different seniorities and security guarantees. 
