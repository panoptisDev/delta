import styled from '@emotion/styled'
import Popup from 'components/popup'
import TokenItem from 'components/token-item'
import { availableRTokens, useRToken } from 'hooks/useRToken'
import { atom, useAtom, useAtomValue } from 'jotai'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { accountRTokensAtom, rTokenAtom, selectedRTokenAtom } from 'state/atoms'
import { transition } from 'theme'
import { Box, BoxProps, Flex, Text } from 'theme-ui'
import { TOKEN_STORAGE } from 'utils/rtokens'


// TODO: Separate component
const ActionItem = styled(Flex)`
    transition: ${transition};
    padding: 16px;
    border-bottom: 1px solid var(--theme-ui-colors-border);
    cursor: pointer;

    &:first-of-type {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
    }

    &:last-of-type {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        border-bottom: none;
    }

    &:hover {
        background-color: var(--theme-ui-colors-secondary);
    }
`

const TokenList = memo(({ onSelect }: { onSelect(address: string): void }) => {
    const tokens = availableRTokens()

    return (
        <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
            {Object.values(tokens).map(({ address, logo, symbol }) => (
                <ActionItem key={address} onClick={() => onSelect(address)}>
                    <TokenItem symbol={symbol} logo={logo} />
                </ActionItem>
            ))}
        </Box>
    )
})

const SelectedToken = () => {
    // const selectedAddress = rMAV
    const rToken = useRToken()
    const tokenList = availableRTokens()
    
    const { symbol, logo } = useMemo(() => {
        // if(tokenList[selectedAddress]) {
        //     return tokenList[selectedAddress]
        // }

        return {
            symbol: rToken.symbol,
            logo: rToken.logo,
        }
    }, [rToken?.symbol])


    return (
        <TokenItem
            sx={{ overflow: 'hidden', width: [60, 'auto'], textOverflow: 'ellipsis' }}
            logo={logo}
            symbol={symbol}
        />
    )
}


const RTokenSelector = (props: BoxProps) => {
    const navigate = useNavigate()
    const [selectedAddress, setSelectedToken] = useAtom(selectedRTokenAtom)
    const [isVisible, setVisible] = useState(false)
    const current = useRToken()

    const setCurrent = (addr: string) => {
        localStorage.setItem(TOKEN_STORAGE, addr)
    }

    const handleSelect = useCallback(
        (token: string) => {
            // setSelectedToken(current.address)
            if(token !== current.address) {
                setCurrent(token)
                setSelectedToken(token)
                // location.reload()
                setVisible(false)
            }
        },
        [setCurrent]
    )

    return (
        <Popup
            show={isVisible}
            onDismiss={() => setVisible(false)}
            content={<TokenList onSelect={handleSelect} />}
        >
            <Flex
                {...props}
                sx={{ alignItems: 'center', cursor: 'pointer', minWidth: 100 }}
                onClick={() => setVisible(!isVisible)}
            >
                <SelectedToken />
                <Box mr="2" />
                {isVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </Flex>
        </Popup>
    )
}

export default RTokenSelector
