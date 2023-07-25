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
