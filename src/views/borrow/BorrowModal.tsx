import { t, Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Modal from 'components/modal'
import { useAtom, useAtomValue } from 'jotai'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { isBorrowModalVisibleAtom, isWalletModalVisibleAtom } from 'state/atoms'
import { approve, borrow } from 'state/web3/utils/utils'
import { Box, Button, Flex, Image, Spinner, Text } from 'theme-ui'
import { isValidBorrowAmountAtom, borrowAmountAtom, maxBorrowAtom, selectedBorrowAsset } from 'views/issuance/atoms'
import MaxIssuableUpdater from 'views/issuance/components/issue/MaxIssuableUpdater'
import TransactionInput from 'components/transaction-input'
import { LoadingButton } from 'components/button'
import { signed, success } from 'state/web3/lib/notifications'


export const BorrowModal = () => {
    const { account } = useWeb3React()
    const setBorrowModalVisible = useSetAtom(isBorrowModalVisibleAtom)
    const [ borrowAmount, setBorrowAmount ] = useAtom(borrowAmountAtom)
    const [ maxBorrow, setMaxBorrow ] = useAtom(maxBorrowAtom)
    const [ borrowAsset, setSelectedBorrowAsset ] = useAtom(selectedBorrowAsset)
    const isValid = useAtomValue(isValidBorrowAmountAtom)
    const [loading, setLoading] = useState(false)

    const onClose = () => setBorrowModalVisible(false)
    
    async function callBorrow() {
        setLoading(true)
        borrow(account!, borrowAsset, +borrowAmount).then(() => {
            signed("Transaction Signed", 4000)
        }).finally(() => {
            setLoading(false)
        })
    }


    return (
        <>
            <Modal
                title={`Borrow ${borrowAsset}`}
                style={{ width: 400 }}
                onClose={onClose}
            >
                <Box>
                    <TransactionInput
                        placeholder={`Choose an Amount`}
                        amountAtom={borrowAmountAtom}
                        maxAmount={maxBorrow}
                    />

                    <LoadingButton
                        loading={loading}
                        disabled={!isValid}
                        variant={loading ? 'accent' : 'primary'}
                        text={`Borrow`}
                        onClick={() => callBorrow()}
                        sx={{ width: '100%' }}
                        mt={3}
                    />
                </Box>
            </Modal>
        </>
    )
}

export default BorrowModal