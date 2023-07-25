import { DELTA_OPEN, rFRA, rMAV, DELTA_INSURANCE } from "utils/addresses"
import Web3 from "web3"

let web3: Web3 | undefined

const RToken = require("abis/contracts/reserve/p1/RToken.sol/RTokenP1.json")
const DeltaOpen = require("abis/contracts/DeltaOpen.sol/DeltaOpen.json")
const DeltaVerified = require("abis/contracts/DeltaVerified.sol/DeltaVerified.json")
const DeltaInsurance = require("abis/contracts/insurance/DeltaInsurance.sol/DeltaInsurance.json")


function setup() {
    if(!web3) web3 = new Web3((window as any).ethereum)
}

function fromDecimals(num: string, decimals: number = 18) {
    let str: any = "ether"
    if(decimals === 12) str = "szabo"
    if(decimals === 6)  str = "mwei"
    

    return web3!.utils.fromWei(num, str).toString()
}


function toDecimals(num: string, decimals: number = 18) {
    let str: any = "ether"
    if(decimals === 12) str = "szabo"
    if(decimals === 6)  str = "mwei"

    return web3!.utils.toWei(num, str).toString()
}


export async function getBalance(
    account: string,
    tokenAddress: string,
    decimals: number, 
    str: string = ""
) {
    if(!account) return 0

    setup()

    const contract = new web3!.eth.Contract(RToken.abi, tokenAddress)
    const balance = await contract.methods.balanceOf(account).call()

    return +fromDecimals(balance, decimals)
}


export async function getAllowance(account: string, spender: string, asset: string) {
    const contract = new web3!.eth.Contract(RToken.abi, asset)
    const allowance = await contract.methods.allowance(account, spender).call()

    return +fromDecimals(allowance)
}


export async function getCollateralRatio() {
    setup()

    const contract = new web3!.eth.Contract(DeltaOpen.abi, DELTA_OPEN)
    const result = await contract.methods.collateralRatio().call()

    return result as string
}


export async function approve(account: string, assetName: string, amount: number, isInsurance: boolean = false) {
    if(!account) return;

    setup()

    const asset = assetName === "rMAV" ? rMAV : rFRA
    const spender = !isInsurance ? DELTA_OPEN : DELTA_INSURANCE

    console.debug("Approving for:", amount)

    const allowance = await getAllowance(account, spender, asset)

    console.debug("Approve:", { allowance, amount })
    if(allowance > amount)
        return

    const contract = new web3!.eth.Contract(RToken.abi, asset)
    const receipt = await contract.methods.approve(spender, toDecimals((amount + 2).toString())).send({ from: account })

    return receipt
}


export async function getSupplyBalance(account: string, assetAddress: string) {
    if(!account)
        return {
            principal: 0,
            withInterest: 0,
            interest: 0
        }

    setup()

    const contract = new web3!.eth.Contract(DeltaOpen.abi, DELTA_OPEN)
    const principal = await contract.methods.getSupplyBalance(account, assetAddress).call()
    const withInterest = await contract.methods.getSupplyBalanceWithInterest(account, assetAddress).call()

    return {
        principal: +fromDecimals(principal),
        withInterest: +fromDecimals(withInterest),
        interest: +fromDecimals((BigInt(withInterest.toString()) - BigInt(principal.toString())).toString())
    }
}


export async function getBorrowBalance(account: string, assetAddress: string) {
    if(!account)
        return {
            principal: 0,
            withInterest: 0,
            interest: 0
        }
    setup()

    const contract = new web3!.eth.Contract(DeltaOpen.abi, DELTA_OPEN)
    const principal = await contract.methods.getBorrowBalance(account, assetAddress).call()
    const withInterest = await contract.methods.getBorrowBalanceWithInterest(account, assetAddress).call()


    return {
        principal: +fromDecimals(principal),
        withInterest: +fromDecimals(withInterest),
        interest: +fromDecimals((BigInt(withInterest) - BigInt(principal)).toString())
    }
}


export async function getLiquidity(asset: string) {
    return getBalance(
        DELTA_OPEN,
        asset,
        18
    )
}


/*
    Write Methods
*/
export async function lend(account: string, assetName: string, amount: number) {
    if(!account) return
    setup()

    const value = toDecimals(amount.toString())
    const asset = assetName === "rMAV" ? rMAV : rFRA

    const contract = new web3!.eth.Contract(DeltaOpen.abi, DELTA_OPEN)
    const receipt = await contract.methods.supply(asset, value).send({ from: account })
    console.debug("Receipt:", receipt)

    return receipt
}


export async function borrow(account: string, assetName: string, amount: number) {
    if(!account) return
    setup()

    const value = toDecimals(amount.toString())
    const asset = assetName === "rMAV" ? rMAV : rFRA

    const contract = new web3!.eth.Contract(DeltaOpen.abi, DELTA_OPEN)
    const receipt = await contract.methods.borrow(asset, value).send({ from: account })
    console.debug("Receipt:", receipt)

    return receipt
}


// Withdraw Deposit
export async function withdraw(account: string, assetName: string, amount: number) {
    if(!account) return
    setup()

    const value = toDecimals(amount.toString())
    const asset = assetName === "rMAV" ? rMAV : rFRA

    const contract = new web3!.eth.Contract(DeltaOpen.abi, DELTA_OPEN)
    const receipt = await contract.methods.withdraw(asset, value).send({ from: account })
    console.debug("Receipt:", receipt) 

    return receipt
}


export async function repayBorrow(account: string, assetName: string, amount: number) {
    if(!account) return
    setup()

    const value = toDecimals(amount.toString())
    const asset = assetName === "rMAV" ? rMAV : rFRA

    const contract = new web3!.eth.Contract(DeltaOpen.abi, DELTA_OPEN)
    const receipt = await contract.methods.repayBorrow(asset, value).send({ from: account })
    console.debug("Receipt:", receipt)

    return receipt
}


// Insurance
export async function splitRisk(account: string, assetName: string, amount: number) {
    if(!account) return
    setup()

    const value = toDecimals(amount.toString())
    const asset = assetName === "rMAV" ? rMAV : rFRA

    const contract = new web3!.eth.Contract(DeltaInsurance.abi, DELTA_INSURANCE)
    const receipt = await contract.methods.splitRisk(asset, value).send({ from: account })
    console.debug("Receipt:", receipt)

    return receipt
}


export async function invest(account: string, assetName: string) {
    if(!account) return
    setup()

    const asset = assetName === "rMAV" ? rMAV : rFRA
    console.debug("Asset:", asset)

    const contract = new web3!.eth.Contract(DeltaInsurance.abi, DELTA_INSURANCE)
    const receipt = await contract.methods.invest(asset).send({ from: account })
    console.debug("Receipt:", receipt)

    return receipt
}



export async function divest(account: string, assetName: string) {
    if(!account) return
    setup()

    const asset = assetName === "rMAV" ? rMAV : rFRA

    const contract = new web3!.eth.Contract(DeltaInsurance.abi, DELTA_INSURANCE)
    const receipt = await contract.methods.divest(asset).send({ from: account })
    console.debug("Receipt:", receipt)

    return receipt
}



export async function claimAll(account: string, assetName: string) {
    if(!account) return
    setup()

    const asset = assetName === "rMAV" ? rMAV : rFRA

    const contract = new web3!.eth.Contract(DeltaInsurance.abi, DELTA_INSURANCE)
    const receipt = await contract.methods.claimAll(asset).send({ from: account })
    console.debug("Receipt:", receipt)

    return receipt
}


export async function getInsuranceBalances(account: string) {
    if(!account) return 0
    setup()

    const contract = new web3!.eth.Contract(DeltaInsurance.abi, DELTA_INSURANCE)
    const balances = await contract.methods.getInsuranceBalances(account).call()

    return (+fromDecimals(balances[0])) + (+fromDecimals(balances[1]))
}
