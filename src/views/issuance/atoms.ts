import { rTokenBalanceAtom } from './../../state/atoms'
import { BigNumberMap } from './../../types/index'
import { atom } from 'jotai'

const isValid = (value: number, max: number) => value > 0 && value <= max

export const quantitiesAtom = atom<BigNumberMap>({})
export const issueAmountAtom = atom('')
export const redeemAmountAtom = atom('')
export const maxRedeemableAtom = atom(0)
export const isValidRedeemAmountAtom = atom((get) => isValid(Number(get(redeemAmountAtom) || 0), get(maxRedeemableAtom)))
export const maxIssuableAtom = atom(0)
export const isValidIssuableAmountAtom = atom((get) => isValid(Number(get(issueAmountAtom) || 0), get(maxIssuableAtom)))

// Lend
export const maxLendAtom = atom(0)
export const selectedLendAsset = atom("")
export const lendAmountAtom = atom("")
export const isValidLendAmountAtom = atom((get) => isValid(Number(get(lendAmountAtom) || 0), get(maxLendAtom)))

// Borrow
export const maxBorrowAtom = atom(0)
export const selectedBorrowAsset = atom("")
export const borrowAmountAtom = atom("")
export const isValidBorrowAmountAtom = atom((get) => isValid(Number(get(borrowAmountAtom) || 0), get(maxBorrowAtom)))

// Withdraw
export const maxWithdrawAtom = atom(0)
export const selectedWithdrawAsset = atom("")
export const withdrawAmountAtom = atom("")
export const isValidWithdrawAmountAtom = atom((get) => isValid(Number(get(withdrawAmountAtom) || 0), get(maxWithdrawAtom)))

// Repay
export const maxRepayAtom = atom(0)
export const selectedRepayAsset = atom("")
export const repayAmountAtom = atom("")
export const isValidRepayAmountAtom = atom((get) => isValid(Number(get(repayAmountAtom) || 0), get(maxRepayAtom)))