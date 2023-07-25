import styled from '@emotion/styled'
import { Trans } from '@lingui/macro'
import Account from 'components/account'
import ThemeColorMode from 'components/dark-mode-toggle/ThemeColorMode'
import PoolSelector from 'components/pool-selector'
import RTokenSelector from 'components/rtoken-selector'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { AlertCircle, HelpCircle } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { rTokenStatusAtom, selectedRTokenAtom } from 'state/atoms'
import { Box, Flex, Text } from 'theme-ui'
import { isContentOnlyView, RTOKEN_STATUS } from 'utils/constants'
import Brand from '../Brand'

const Container = styled(Flex)`
    align-items: center;
    flex-shrink: 0;
    position: relative;
    border-bottom: 1px solid var(--theme-ui-colors-darkBorder);
    height: 56px;
`

/**
 * Application header
 */
// TODO: Enable int
const AppHeader = () => {
    const { pathname } = useLocation()
    const selectedToken = useAtomValue(selectedRTokenAtom)
    const isDeployer = isContentOnlyView(pathname)
    const [ rTokenSelectorVisible, setRTokenSelectorVisible ] = useState(false)
    const [ poolSelectorVisible, setPoolSelectorVisible ] = useState(false)

    useEffect(() => {
        setRTokenSelectorVisible(pathname === "/issuance")
        setPoolSelectorVisible(pathname === "/lend" || pathname === "/borrow")
    })

    return (
        <Container px={[5, 7]}>
            <Flex mr={[2, 2, 4]} sx={{ alignItems: 'center' }}>
                <Brand />
                {isDeployer && (
                    <Text ml={3} sx={{ fontSize: 3 }} variant="subtitle">
                        <Trans>RToken Deployer</Trans>
                    </Text>
                )}
            </Flex>
            
            {!isDeployer && rTokenSelectorVisible && <RTokenSelector /> }
            {!isDeployer && poolSelectorVisible && <PoolSelector /> }

            <Box mx="auto" />
            <Account />
        </Container>
    )
}

export default AppHeader
