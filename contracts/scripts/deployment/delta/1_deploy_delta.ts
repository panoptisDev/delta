import fs from 'fs'
import hre from 'hardhat'
import { ethers } from 'hardhat'
import { getChainId } from '../../../common/blockchain-utils'
import { 
    getDeploymentFilename,
} from '../common'


async function main() {
    const [sender] = await hre.ethers.getSigners()
    const chainId = await getChainId(hre)

    let deployments: any = {}
    const deploymentFilename = getDeploymentFilename(chainId, "-delta-deployments.json")
    const deployed = require("../../../scripts/addresses/5-delta-deployments.json")

    console.debug("Deploying now")
    const MockERC20 = await ethers.getContractFactory("MockERC20")
    const DLT = await MockERC20.deploy("DLT", "DLT", 18)
    deployments.DLT = DLT.address

    // Oracles
    const Oracle = await ethers.getContractFactory("MockAggregatorV3")
    const rMavOracle = await Oracle.deploy(18)
    const rFraOracle = await Oracle.deploy(18)
    deployments.rMAV_ORACLE = rMavOracle.address
    deployments.rFRA_ORACLE = rFraOracle.address


    // Chainlink
    const ChainLink = await ethers.getContractFactory("ChainLink")
    const chainlink = await ChainLink.deploy()
    deployments.CHAINLINK = chainlink.address


    const DeltaOpenFactory = await ethers.getContractFactory("DeltaOpen")
    const deltaOpen = await DeltaOpenFactory.deploy(
        chainlink.address, // oracle
        (.5 * 10**18).toString() // 500000000000000000
    )
    deployments.DELTA_OPEN = deltaOpen.address


    const DeltaVerifiedFactory = await ethers.getContractFactory("DeltaVerified")
    const deltaVerified = await DeltaVerifiedFactory.deploy(
        chainlink.address, // oracle
        (.5 * 10**18).toString()
    )
    deployments.DELTA_VERIFIED = deltaVerified.address


    const RewardControl = await ethers.getContractFactory("RewardControl")
    const rewardControl = await RewardControl.deploy(
        deltaVerified.address, // deltaVerified
        deltaOpen.address, // deltaOpen
        DLT.address, // dltAddress
    )
    deployments.REWARD_CONTROL = rewardControl.address


    const RateModel = await ethers.getContractFactory("RateModel")
    const rateModel = await RateModel.deploy(
        100,
        2000,
        100,
        3000,
        8000,
        400,
    )
    deployments.RATE_MODEL = rateModel.address

    fs.writeFileSync(deploymentFilename, JSON.stringify(deployments, null, 4))
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
