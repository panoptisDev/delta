import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Modal from 'components/modal'
import { useAtom, useAtomValue } from 'jotai'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { isWithdrawModalVisibleAtom } from 'state/atoms'
import { approve, withdraw } from 'state/web3/utils/utils'
import { Box, Text } from 'theme-ui'
import { isValidWithdrawAmountAtom, withdrawAmountAtom, maxLendAtom, selectedLendAsset, maxWithdrawAtom } from 'views/issuance/atoms'
import MaxIssuableUpdater from 'views/issuance/components/issue/MaxIssuableUpdater'
import TransactionInput from 'components/transaction-input'
import { LoadingButton } from 'components/button'
import { signed, success } from 'state/web3/lib/notifications'
import { getPoolFromSymbol, Pool } from 'hooks/usePools'


export const WithdrawModal = () => {
    const { account } = useWeb3React()
    const setWithdrawModalVisible = useSetAtom(isWithdrawModalVisibleAtom)
    const [ withdrawAmount, setWithdrawAmount ] = useAtom(withdrawAmountAtom)
    const [ maxWithdraw, setMaxWithdraw ] = useAtom(maxWithdrawAtom)
    const [ lendAsset, setSelectedLendAsset ] = useAtom(selectedLendAsset)
    const isValid = useAtomValue(isValidWithdrawAmountAtom)
    const [ loading, setLoading ] = useState(false)
    const [ hasExistingBorrow, setExistingBorrow ] = useState(false)


    useEffect(() => {
        const pool = getPoolFromSymbol(lendAsset)!
        // setExistingBorrow(pool.borrowBalance > 0)
    }, [])

    const onClose = () => setWithdrawModalVisible(false)

    
    async function callWithdraw() {
        setLoading(true)
        withdraw(account!, lendAsset, +withdrawAmount).then(() => {
            signed("Transaction Signed", 4000)
        }).finally(() => {
            setLoading(false)
        })
    }


    return (
        <>
            <MaxIssuableUpdater />
            <Modal
                title={`Withdraw ${lendAsset}`}
                style={{ width: 400 }}
                onClose={onClose}
            >
                {hasExistingBorrow && <Box mt={5} sx={{ textAlign: 'center', fontSize: 1 }}>
                    <Text>
                        <Trans>
                            Repay your borrowed {lendAsset} first to be able to withdraw.
                        </Trans>
                    </Text>
                </Box>}

                {!hasExistingBorrow && <Box>
                    <TransactionInput
                        placeholder={`Choose an Amount`}
                        amountAtom={withdrawAmountAtom}
                        maxAmount={maxWithdraw}
                    />
                    <LoadingButton
                        loading={loading}
                        disabled={!isValid}
                        variant={loading ? 'accent' : 'primary'}
                        text={`Withdraw`}
                        onClick={() => callWithdraw()}
                        sx={{ width: '100%' }}
                        mt={3}
                    />
                </Box>}
            </Modal>
        </>
    )
}

export default WithdrawModal