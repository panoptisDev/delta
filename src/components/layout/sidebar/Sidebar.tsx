import styled from '@emotion/styled'
import { t, Trans } from '@lingui/macro'
import AuctionsIcon from 'components/icons/AuctionsIcon'
import DiscussionsIcon from 'components/icons/DiscussionsIcon'
import GovernanceIcon from 'components/icons/GovernanceIcon'
import HomeIcon from 'components/icons/HomeIcon'
import IssuanceIcon from 'components/icons/IssuanceIcon'
import ManagerIcon from 'components/icons/ManagerIcon'
import OverviewIcon from 'components/icons/OverviewIcon'
import StakeIcon from 'components/icons/StakeIcon'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { isManagerAtom, rTokenAtom, selectedRTokenAtom } from 'state/atoms'
import { Box, Flex, Link, NavLinkProps, Text } from 'theme-ui'
import { ReserveToken } from 'types'
import { rMAV } from 'utils/addresses'
import { isContentOnlyView, ROUTES } from 'utils/constants'
import Brand from '../Brand'

const Container = styled(Box)`
    padding-top: 0;
    flex-grow: 1;
    box-sizing: border-box;
    flex-direction: column;
    border-right: 1px solid var(--theme-ui-colors-darkBorder);
`

interface Item {
    path: string
    title: string
    Icon: React.ElementType
}

interface NavItemProps extends Item, Omit<NavLinkProps, 'title'> {
    to?: any
}

const MenuItem = ({ title, Icon }: Omit<Item, 'path'>) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexGrow: 1,
                alignItems: 'center',
                paddingLeft: [0, 0, 4],
                justifyContent: ['center', 'center', 'inherit'],
            }}
            my={[10, 10, 10]}
        >
            <Icon />
            <Text sx={{ display: ['none', 'none', 'inherit'] }} ml={2}>
                {title}
            </Text>
        </Box>
    )
}

const NavItem = ({
    path,
    title,
    Icon,
    ...props
}: NavItemProps) => (
    <NavLink
        style={({ isActive }) => ({
            paddingLeft: '5px',
            textDecoration: 'none',
            color: 'inherit',
            lineHeight: '32px',
            boxShadow: isActive
                ? 'inset 0 12px 0px var(--theme-ui-colors-background), inset 0 -12px 0px var(--theme-ui-colors-background), inset 4px 0px 0px currentColor'
                : 'none',
            display: 'flex',
        })}
        to={`${path}`}
        {...props}
    >
        <MenuItem title={title} Icon={Icon} />
    </NavLink>
)

// Sidebar Navigation
const Navigation = ({
    currentToken,
}: {
    currentToken?: ReserveToken | null
}) => {
    const PAGES = useMemo(() => {
        const items = [
            { path: ROUTES.HOME, title: `Home`, Icon: HomeIcon },
            { path: ROUTES.ISSUANCE, title: `Mint + Redeem`, Icon: IssuanceIcon },
            { path: ROUTES.LEND, title: `Lend`, Icon: AuctionsIcon },
            { path: ROUTES.BORROW, title: `Borrow`, Icon: OverviewIcon },
            { path: ROUTES.INSURANCE, title: `Insurance`, Icon: StakeIcon },
        ]
        return items
    }, [])

    
    const pages = useMemo(() => {
        return PAGES
      }, [currentToken])

    return (
        <Box mt={5}>
            {pages.map((item) => (
                <NavItem
                    key={item.path}
                    {...item}
                />
            ))}
        </Box>
    )
}


// Sidebar footer
const Footer = () => (
    <Box m={4} sx={{ display: ['none', 'none', 'block'] }}>
    </Box>
)

/**
 * Application sidebar
 */
const Sidebar = () => {
    const rToken = useAtomValue(rTokenAtom)
    const { pathname } = useLocation()

    if(isContentOnlyView(pathname)) {
        return null
    }

    return (
        <Container sx={{ flexBasis: [64, 72, 264], display: ['none', 'flex'] }}>
            <Brand ml={4} mt={4} />
            <Navigation currentToken={rToken} />
            <Box my="auto" />
            <Footer />
        </Container>
    )
}

export default Sidebar
