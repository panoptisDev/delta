import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import IconInfo from 'components/info-icon'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import {
    rTokenDistributionAtom,
    rTokenYieldAtom,
} from 'state/atoms'
import { ADDRESS_STORAGE } from 'state/storage'
import { getInsuranceBalances } from 'state/web3/utils/utils'
import { Box, BoxProps, Flex, Grid, Image, Text } from 'theme-ui'



const Stats = (props: BoxProps) => {
    const  { account } = useWeb3React()
    const distribution = useAtomValue(rTokenDistributionAtom)
    const { stakingApy } = useAtomValue(rTokenYieldAtom)

    const [ balance, setBalance ] = useState(0)

    useEffect(() => {
        getInsuranceBalances(localStorage.getItem(ADDRESS_STORAGE)!).then((res: number) => {
            setBalance(res)
        })
    }, [account!])

    return (
        <Box {...props} variant="layout.borderBox" p={0}>
            <Grid gap={0} columns={1}>
                <Box
                    p={4}
                    sx={{
                        borderRight: '1px solid',
                        borderBottom: '1px solid',
                        borderColor: 'darkBorder',
                    }}
                >
                    <Text variant="subtitle" mb={3}>
                        <Trans>Your stake</Trans>
                    </Text>
                    <IconInfo
                        icon={<Image src="/svgs/trendup.svg" />}
                        title=""
                        text={`${balance.toString()} rMAV`}
                    />
                </Box>

                {/* <Box
                    p={4}
                    sx={{ borderBottom: '1px solid', borderColor: 'darkBorder' }}
                >
                    <Text variant="subtitle" mb={3}>
                        <Trans>Collateral backing</Trans>
                    </Text>
                    <IconInfo
                        icon={<Image src="/svgs/backing.svg" />}
                        title="Current"
                        text={`${distribution.backing}%`}
                    />
                </Box>
                <Box p={4} sx={{ borderRight: '1px solid', borderColor: 'darkBorder' }}>
                    <Text variant="subtitle" mb={3}>
                        <Trans>Backing + Insurance</Trans>
                    </Text>
                    <IconInfo
                        icon={<Image src="/svgs/insurance.svg" />}
                        title="Current"
                        text={`${distribution.backing + distribution.insurance}%`}
                    />
                </Box> */}
            </Grid>
        </Box>
    )
}



const About = (props: BoxProps) => (
    <Box variant="layout.borderBox" p={4} {...props}>
        <Text variant="strong" mb={2}>
            Risk Splitting
        </Text>
        <Text as="p" variant="legend">
            Delta pools assets from 2 third-party protocols (e.g. Aave & Compound), and allows
            users to split the risk of the collateral behind your RTokens into two tranches: A & B.
            If any of the third-party protocol suffers losses during the insurance period, those losses
            are born by the B-tranche holders. We effectively split the redemption rights into a riskier
            and less risky version and allow the market for A- and B-
            tranches to determine the fair risk premium in line with the
            users' expectations.
        </Text>

        {/* <Text variant="strong" mb={2} mt={4}>
            Mechanics
        </Text>
        <Text as="p" variant="legend">
            Delta allows you to 
        </Text>

        <Text variant="strong" mb={2} mt={4}>
            Unstaking RSR
        </Text>
        <Text as="p" variant="legend">
            
        </Text>

        <Text variant="strong" mb={2} mt={4}>
            Risk evaluation
        </Text>
        <Text as="p" variant="legend">
            Please carefully evaluate the RToken before choosing to stake your RSR
            here. If any of the various collaterals of this RToken default, then the
            staked RSR will be the first funds that get auctioned off to make up the
            difference for RToken holders.
        </Text>

        <Text variant="strong" mb={2} mt={4}>
            Governor Alexios
        </Text>
        <Text as="p" variant="legend">
            The description below applies to the default Reserve Governor Alexios.
            If an RToken's deployer opted out of this scheme, please consult with
            the RToken's documentation to understand how staking functions.
        </Text> */}
    </Box>
  )

const Overview = (props: BoxProps) => {
    return (
        <Box {...props}>
            {/* <ExchangeRate /> */}
            <Stats mt={4} />
            <About mt={4} />
        </Box>
    )
}

export default Overview
