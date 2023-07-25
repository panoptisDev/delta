import { Trans } from '@lingui/macro'
import { Button } from 'components'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { Card } from 'theme-ui'
import ConfirmUnstake from './ConfirmUnstake'
import { Box, BoxProps, Flex, Text } from 'theme-ui'
import { invest, divest } from 'state/web3/utils/utils'
import { useWeb3React } from '@web3-react/core'
import { signed } from 'state/web3/lib/notifications'
import { rMAV } from 'utils/addresses'

const InsuranceOps = (props: BoxProps) => {
    const { account } = useWeb3React()

    function callInvest() {
        invest(account!, "rMAV").then(() => {
            signed("Transaction Signed", 4000)
        })
    }

    function callDivest() {
        divest(account!, "rMAV").then(() => {
            signed("Transaction Signed", 4000)
        })
    }


    return (
        <>
            <Card p={4} {...props}>
                <Flex sx={{ alignItems: 'center' }} mb={2}>
                    <Text as="label" variant="legend" ml={2}>
                        Protocol Ops
                    </Text>
                </Flex>

                <Button
                    sx={{ width: '100%' }}
                    mt={3}
                    onClick={() => callInvest()}
                >
                    Invest
                </Button>

                <Button
                    sx={{ width: '100%' }}
                    mt={3}
                    onClick={() => callDivest()}
                >
                    Divest
                </Button>
            </Card>
        </>
    )
}

export default InsuranceOps
