import { t } from '@lingui/macro'
import TransactionInput, {
    TransactionInputProps,
} from 'components/transaction-input'
import { useRToken } from 'hooks/useRToken'
import { atom, useAtom, useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { rTokenBalanceAtom, rTokenStatusAtom } from 'state/atoms'
import { ADDRESS_STORAGE } from 'state/storage'
import { getBalance } from 'state/web3/utils/utils'
import { RTOKEN_STATUS } from 'utils/constants'
import { maxRedeemableAtom, redeemAmountAtom } from 'views/issuance/atoms'

const isTokenFrozenAtom = atom((get) => {
    const status = get(rTokenStatusAtom)

    return status === RTOKEN_STATUS.FROZEN
})

const RedeemInput = (props: Partial<TransactionInputProps>) => {
    // const max = useAtomValue(rTokenBalanceAtom)
    const rToken = useRToken()
    const [ max, setMax ] = useAtom(maxRedeemableAtom)

    useEffect(() => {
        getBalance(localStorage.getItem(ADDRESS_STORAGE)!, rToken.address, 18).then(res => {
            setMax(res)
        })
    }, [])

    return (
        <TransactionInput
            title={t`Redeem`}
            placeholder={t`Redeem amount`}
            amountAtom={redeemAmountAtom}
            maxAmount={max}
            disabled={false}
            {...props}
        />
    )
}

export default RedeemInput
