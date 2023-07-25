import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { Button } from 'components'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { ADDRESS_STORAGE } from 'state/storage'
import { signed } from 'state/web3/lib/notifications'
import { approve, getBalance, getSupplyBalance, splitRisk } from 'state/web3/utils/utils'
import { BoxProps, Card } from 'theme-ui'
import { rMAV } from 'utils/addresses'
import { isValidSplitRiskAmountAtom, isValidStakeAmountAtom, maxSplitRiskAmountAtom, splitRiskAmountAtom } from 'views/insurance/atoms'
import ConfirmStake from './ConfirmStake'
import StakeInput from './StakeInput'

const Stake = (props: BoxProps) => {
    const { account } = useWeb3React()
    const [confirming, setConfirming] = useState(false)
    const isValid = useAtomValue(isValidSplitRiskAmountAtom)
    const [ splitRiskAmount, _ ] = useAtom(splitRiskAmountAtom)
    const [ maxSplitRiskAmount, setMaxSplitRiskAtom ] = useAtom(maxSplitRiskAmountAtom)

    function callSplitRisk() {
        console.debug("Split risk amount", splitRiskAmount)
        approve(account!, "rMAV", +splitRiskAmount, true).then(() => {
            splitRisk(account!, "rMAV", +splitRiskAmount).then(() => {
                signed("Transaction signed", 4000)
            })
        })
    }

    useEffect(() => {
        getBalance(localStorage.getItem(ADDRESS_STORAGE)!, rMAV, 18).then(res => {
            setMaxSplitRiskAtom(res.toString())
        })
    }, [account!])

    return (
        <>
            {/* {confirming && <ConfirmStake onClose={() => setConfirming(false)} />} */}
            <Card p={4} {...props}>
                <StakeInput />
                <Button
                    disabled={!isValid}
                    sx={{ width: '100%' }}
                    mt={3}
                    onClick={() => callSplitRisk()}
                >
                    + <Trans>Split Risk</Trans>
                </Button>
            </Card>
        </>
    )
}

export default Stake
