import { useRToken } from 'hooks/useRToken'
import { Trans } from '@lingui/macro'
import { Container } from 'components'
import { Box, Grid, Text } from 'theme-ui'
import Balances from './components/balances'
import Overview from './components/overview'
import Stake from './components/stake'
import Unstake from './components/unstake'
import { ContentHead } from 'components/info-box'
import InsuranceOps from './components/insurance-ops'


export default () => {
    const rToken = useRToken()

    return (
        <Container pb={4}>
            <ContentHead
                title={`Insurance | Risk Transfer`}
                subtitle={``}
                mb={7}
                ml={5}
            />
            
            <Grid columns={[1, 1, 1, '1.5fr 1fr']} gap={5}>
                <Box>
                    <Grid columns={[1, 2]} gap={4} mb={4}>
                        <Stake />
                        <Unstake />
                        <InsuranceOps />
                    </Grid>
                </Box>
                <Overview />
            </Grid>
        </Container>
    )
}
