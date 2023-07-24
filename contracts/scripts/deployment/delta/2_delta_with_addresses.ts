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

    // let deployments: any = {}
    const deploymentFilename = getDeploymentFilename(chainId, "-delta-deployments.json")
    const deployments = require("../../../scripts/addresses/5-delta-deployments.json")

    const DLT = await ethers.getContractAt("MockERC20", deployments.DLT)

    const rMAV = deployments.rMAV
    const rFRA = deployments.rFRA

    // Oracles
    const rMavOracle = await ethers.getContractAt("MockAggregatorV3", deployments.rMAV_ORACLE)
    const rFraOracle = await ethers.getContractAt("MockAggregatorV3", deployments.rFRA_ORACLE)

    // Chainlink
    const chainlink = await ethers.getContractAt("ChainLink", deployments.CHAINLINK )

    const deltaOpen = await ethers.getContractAt("DeltaOpen", deployments.DELTA_OPEN)

    const deltaVerified = await ethers.getContractAt("DeltaVerified", deployments.DELTA_OPEN)

    const rewardControl = await ethers.getContractAt("RewardControl", deployments.REWARD_CONTROL)

    const rateModel = await ethers.getContractAt("RateModel", deployments.RATE_MODEL)

    
    // Set Reward control
    await deltaOpen.setRewardControlAddress(rewardControl.address)
    console.debug("Set Reward Control")

    await deltaVerified.setRewardControlAddress(rewardControl.address)
    console.debug("Set Reward Control")

    await chainlink.addAsset(rMAV, rMavOracle.address)
    console.debug("Added asset rMAV")

    await chainlink.addAsset(rFRA, rFraOracle.address)
    console.debug("Added asset rFRA")

    // await new Promise(resolve => setTimeout(resolve, 3000));

    // Support markets
    await deltaOpen._supportMarket(rMAV, rateModel.address)
    console.debug("Supported market rMAV")

    await deltaOpen._supportMarket(rFRA, rateModel.address)
    console.debug("Supported market rFRA")
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
