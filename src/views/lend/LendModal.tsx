import { t, Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Modal from 'components/modal'
import { useAtom, useAtomValue } from 'jotai'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { isLendModalVisibleAtom, isWalletModalVisibleAtom } from 'state/atoms'
import { approve, lend } from 'state/web3/utils/utils'
import { Box, Button, Flex, Image, Spinner, Text } from 'theme-ui'
import { isValidLendAmountAtom, lendAmountAtom, maxLendAtom, selectedLendAsset } from 'views/issuance/atoms'
import MaxIssuableUpdater from 'views/issuance/components/issue/MaxIssuableUpdater'
import TransactionInput from 'components/transaction-input'
import { LoadingButton } from 'components/button'
import { signed, success } from 'state/web3/lib/notifications'


export const LendModal = () => {
    const { account } = useWeb3React()
    const setLendModalVisible = useSetAtom(isLendModalVisibleAtom)
    const [ lendAmount, setLendAmount ] = useAtom(lendAmountAtom)
    const [ maxDeposit, setMaxDeposit ] = useAtom(maxLendAtom)
    const [ lendAsset, setSelectedLendAsset ] = useAtom(selectedLendAsset)
    const isValid = useAtomValue(isValidLendAmountAtom)
    const [loading, setLoading] = useState(false)
    const [approving, setApproving] = useState(false)
    const [approved, setApproved] = useState(false)


    const onClose = () => setLendModalVisible(false)

    async function callApprove() {
        setApproving(true)
        approve(account!, lendAsset, +lendAmount).then(() => {
            signed("Approval Signed", 4000)
            setApproving(false)
            setApproved(true)
        })
    }

    
    async function callLend() {
        setLoading(true)
        lend(account!, lendAsset, +lendAmount).then(() => {
            signed("Transaction Signed", 4000)
        }).finally(() => {
            setLoading(false)
        })
    }


    return (
        <>
            <MaxIssuableUpdater />
            <Modal
                title={`Lend ${lendAsset}`}
                style={{ width: 400 }}
                onClose={onClose}
            >
                <Box>
                    <TransactionInput
                        placeholder={`Choose an Amount`}
                        amountAtom={lendAmountAtom}
                        maxAmount={maxDeposit}
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


                    {approved && (<LoadingButton
                        loading={loading}
                        disabled={!isValid}
                        variant={loading ? 'accent' : 'primary'}
                        text={`Deposit`}
                        onClick={() => callLend()}
                        sx={{ width: '100%' }}
                        mt={3}
                    />)}
                </Box>
            </Modal>
        </>
    )
}

export default LendModal