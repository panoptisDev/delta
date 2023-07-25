import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Modal from 'components/modal'
import { useAtom, useAtomValue } from 'jotai'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { isRepayModalVisibleAtom } from 'state/atoms'
import { approve, repayBorrow } from 'state/web3/utils/utils'
import { Box, Text } from 'theme-ui'
import { isValidRepayAmountAtom, repayAmountAtom, maxLendAtom, selectedLendAsset, maxRepayAtom, selectedBorrowAsset } from 'views/issuance/atoms'
import MaxIssuableUpdater from 'views/issuance/components/issue/MaxIssuableUpdater'
import TransactionInput from 'components/transaction-input'
import { LoadingButton } from 'components/button'
import { signed, success } from 'state/web3/lib/notifications'
import { getPoolFromSymbol, Pool } from 'hooks/usePools'


export const RepayBorrowModal = () => {
    const { account } = useWeb3React()
    const setRepayModalVisible = useSetAtom(isRepayModalVisibleAtom)
    const [ repayAmount, setRepayAmount ] = useAtom(repayAmountAtom)
    const [ maxRepay, setMaxRepay ] = useAtom(maxRepayAtom)
    const [ borrowAsset, setSelectedBorrowAsset ] = useAtom(selectedBorrowAsset)
    const isValid = useAtomValue(isValidRepayAmountAtom)
    const [ loading, setLoading ] = useState(false)
    const [approving, setApproving] = useState(false)
    const [approved, setApproved] = useState(false)

    const onClose = () => setRepayModalVisible(false)
    
    async function callApprove() {
        setApproving(true)

        approve(account!, borrowAsset, +repayAmount).then(() => {
            signed("Approval Signed", 4000)
            setApproving(false)
            setApproved(true)
        })
    }

    async function callRepay() {
        setLoading(true)

        repayBorrow(account!, borrowAsset, +repayAmount).then(() => {
            signed("Transaction Signed", 4000)
        }).finally(() => {
            setLoading(false)
        })
    }

    
    return (
        <>
            <Modal
                title={`Repay ${borrowAsset}`}
                style={{ width: 400 }}
                onClose={onClose}
            >
                <Box>
                    <TransactionInput
                        placeholder={`Choose an Amount`}
                        amountAtom={repayAmountAtom}
                        maxAmount={maxRepay}
                    />

                    {!approved && (<LoadingButton
                        loading={approving}
                        disabled={!isValid}
                        variant={approving ? 'accent' : 'primary'}
                        text={`Approve`}
                        onClick={() => callApprove()}
                        sx={{ width: '100%' }}
                        mt={3}
                    />)}

                    {approved && <LoadingButton
                        loading={loading}
                        disabled={!isValid}
                        variant={loading ? 'accent' : 'primary'}
                        text={`Repay`}
                        onClick={() => callRepay()}
                        sx={{ width: '100%' }}
                        mt={3}
                    />}
                </Box>
            </Modal>
        </>
    )
}

export default RepayBorrowModal