import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { Button } from 'components'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { signed } from 'state/web3/lib/notifications'
import { claimAll } from 'state/web3/utils/utils'
import { BoxProps, Card, Flex, Text } from 'theme-ui'
import { isValidUnstakeAmountAtom } from 'views/insurance/atoms'
import ConfirmUnstake from './ConfirmUnstake'
import UnstakeInput from './UnstakeInput'

const Unstake = (props: BoxProps) => {
    const { account } = useWeb3React()

    function callRedeem() {
        claimAll(account!, "rMAV").then(() => {
            signed("Transaction signed", 4000)
        })
    }

    return (
        <>
            <Card p={4} {...props}>
                <Flex sx={{ alignItems: 'center' }} mb={2}>
                    <Text as="label" variant="legend" ml={2}>
                        Redeem
                    </Text>
                </Flex>

                {/* <UnstakeInput /> */}

                <Button
                    sx={{ width: '100%' }}
                    mt={3}
                    onClick={() => callRedeem()}
                >
                    - Redeem
                </Button>
            </Card>
        </>
    )
}

export default Unstake
