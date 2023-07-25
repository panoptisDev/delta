import styled from '@emotion/styled'
import Popup from 'components/popup'
import TokenItem from 'components/token-item'
import { atom, useAtom, useAtomValue } from 'jotai'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { accountRTokensAtom, rTokenAtom, selectedPoolAtom, selectedRTokenAtom } from 'state/atoms'
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


const POOLS = [
    {
        name: "Open Pool",
        logo: "/svgs/openPool.svg",
        sticker: "open"
    },
    {
        name: "Verified Pool",
        logo: "/svgs/verifiedPool.svg",
        sticker: "verified"
    }
]

const PoolList = memo(({ onSelect }: { onSelect(name: string): void }) => {
    const tokens = POOLS

    return (
        <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
            {
                Object.values(tokens).map(({ name, logo, sticker }, idx) => (
                    <ActionItem key={idx} onClick={() => onSelect(name)}>
                        <TokenItem symbol={name} logo={logo} />
                    </ActionItem>
                ))
            }
        </Box>
    )
})


function getLogoFromPoolName(name: string) {
    return name.toLowerCase() === "open pool" ? "/svgs/openPool.svg" : "/svgs/verifiedPool.svg"
}


const SelectedPool = () => {
    const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom)
    
    const { symbol, logo } = useMemo(() => {
        return {
            symbol: selectedPool,
            logo: getLogoFromPoolName(selectedPool)
        }
    }, [selectedPool])

    return (
        <TokenItem
            sx={{ overflow: 'hidden', width: [60, 'auto'], textOverflow: 'ellipsis' }}
            logo={logo}
            symbol={symbol}
        />
    )
}


const PoolSelector = (props: BoxProps) => {
    const navigate = useNavigate()
    const [selectedPool, setSelectedPool] = useAtom(selectedPoolAtom)
    const [isVisible, setVisible] = useState(false)

    const setCurrent = (addr: string) => {
        localStorage.setItem(TOKEN_STORAGE, addr)
    }

    const handleSelect = useCallback(
        (token: string) => {
            if(token !== selectedPool) {
                setCurrent(token)
                setSelectedPool(token)
                setVisible(false)
            }
        },
        [setCurrent]
    )


    return (
        <Popup
            show={isVisible}
            onDismiss={() => setVisible(false)}
            content={<PoolList onSelect={handleSelect} />}
        >
            <Flex
                {...props}
                sx={{ alignItems: 'center', cursor: 'pointer', minWidth: 100 }}
                onClick={() => setVisible(!isVisible)}
            >
                <SelectedPool />
                <Box mr="2" />
                {isVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </Flex>
        </Popup>
    )
}

export default PoolSelector
