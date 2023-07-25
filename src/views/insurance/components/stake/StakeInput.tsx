import TransactionInput, {
    TransactionInputProps,
} from 'components/transaction-input'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { rsrBalanceAtom } from 'state/atoms'
import { maxSplitRiskAmountAtom, splitRiskAmountAtom } from 'views/insurance/atoms'

const StakeInput = (props: Partial<TransactionInputProps>) => {
    const max = useAtomValue(maxSplitRiskAmountAtom)

    return (
        <TransactionInput
            title="Deposit"
            placeholder="Amount"
            amountAtom={splitRiskAmountAtom}
            maxAmount={+max}
            {...props}
        />
    )
}

export default StakeInput
