import { ReserveToken } from "types"
import { availableRTokens } from "./useRToken"
import useTokensBalance from "./useTokensBalance"
import  { walletAtom } from "state/atoms"
import { useAtomValue, useSetAtom } from 'jotai'
import { getBalance, getSupplyBalance, getBorrowBalance, getLiquidity, getCollateralRatio } from "state/web3/utils/utils"
import { ADDRESS_STORAGE, POOLS_STORAGE } from "state/storage"
import { rMAV } from "utils/addresses"


export interface Pool {
    address: string
    balance: number
    liquidity: number

    // Lend
    lendBalance: number
    lendInterest: number
    lendApy: number
    maxDeposit: {
        maxDeposit: number, 
        symbol: string
    }

    borrowBalance: number
    borrowInterest: number
    borrowLimit: number
    borrowApy: number
    maxBorrow: {
        maxBorrow: number, 
        symbol: string
    }
}

export function getPoolFromSymbol(symbol: string) {
    const pools = JSON.parse(localStorage.getItem(POOLS_STORAGE)!) as Pool[]
    
    for(const pool of pools) {
        if(pool.maxDeposit.symbol === symbol) {
            return pool
        }
    }
}


export async function usePools(account: string) {
    let _pools: Pool[] = []
    const tokens = availableRTokens()

    for(const token of tokens) {
        const balance = await getBalance(account, token.address, 18, "HEREHERE")
        const supplyBalance = await getSupplyBalance(account, token.address)
        const borrowBalance = await getBorrowBalance(account, token.address)
        const liquidity = await getLiquidity(token.address)
        const collateralRatio = +(await getCollateralRatio()) / 1e18

        // Borrow Limit is 
        // (totalBorrowed / maxBorrowed) * 100%
        const maxBorrow = supplyBalance.withInterest / collateralRatio
        const borrowLimit = ((borrowBalance.withInterest / maxBorrow) * 100).toFixed(2)

        _pools.push({
            address: token.address,
            balance: balance,
            liquidity: liquidity,

            // Lend 
            lendBalance: supplyBalance.principal,
            lendInterest: supplyBalance.interest,
            lendApy: token.address === rMAV ? 9.21 : 5.18,
            maxDeposit: {
                maxDeposit: balance,
                symbol: token.symbol as string
            },

            // Borrow
            borrowBalance: borrowBalance.principal,
            borrowInterest: borrowBalance.interest,
            borrowLimit: !isNaN(+borrowLimit) ? +borrowLimit : 0,
            borrowApy: token.address === rMAV ? 14.36 : 9.29,
            maxBorrow: {
                maxBorrow: maxBorrow,
                symbol: token.symbol as string
            }
        })    
    }

    localStorage.setItem(POOLS_STORAGE, JSON.stringify(_pools))
    return _pools
}