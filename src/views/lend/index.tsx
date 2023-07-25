import { t, Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { Container } from 'components'
import { ContentHead } from 'components/info-box'
import { Table } from 'components/table'
import TokenItem from 'components/token-item'
import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import useDebounce from 'hooks/useDebounce'
import { usePools, Pool, getPoolFromSymbol } from 'hooks/usePools'
import useQuery from 'hooks/useQuery'
import { availableRTokens, useRToken } from 'hooks/useRToken'
import { getRTokenLogo } from 'hooks/useRTokenLogo'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'react-feather'
import { Box, Grid, Text } from 'theme-ui'
import { RToken } from 'abis/types'
import { blockTimestampAtom, isLendModalVisibleAtom, isWalletModalVisibleAtom, isWithdrawModalVisibleAtom, poolsAtom } from 'state/atoms'
import { BoxProps, Link, Button } from 'theme-ui'
import { StringMap } from 'types'
import { formatCurrency } from 'utils'
import { RSR_ADDRESS } from 'utils/addresses'
import { CHAIN_ID } from 'utils/chains'
import { maxLendAtom, maxWithdrawAtom, selectedLendAsset } from 'views/issuance/atoms'
import { ADDRESS_STORAGE } from 'state/storage'
import LendModal from './LendModal'
import Redeem from 'views/issuance/components/redeem'
import Stats from 'components/Stats'
import WithdrawModal from './WithdrawModal'


interface TableProps extends BoxProps {
    data: Pool[]
    tokens: StringMap
    account: string
}


const LendMarkets = ({ data, tokens, account, ...props }: TableProps) => {
    const [ maxDeposit, setMaxDeposit ] = useAtom(maxLendAtom)
    const [ maxWithdraw, setMaxWithdraw ] = useAtom(maxWithdrawAtom)
    const [ lendAsset, setSelectedLendAsset ] = useAtom(selectedLendAsset)
    const [ totalDeposit, setTotalDeposit ] = useState(0)
    const [ totalInterest, setTotalInterest ] = useState(0)
    const [ isLendModalVisible, setDepositVisible ] = useAtom(isLendModalVisibleAtom)
    const [ isWithdrawModalVisible, setWithdrawVisible ] = useAtom(isWithdrawModalVisibleAtom)


    useEffect(() => {
        let res = 0
        let interest = 0
        for(const d of data) {
            res += d.lendBalance
            interest += d.lendInterest
        }
        setTotalDeposit(res)
        setTotalInterest(interest)
    }, [data])

    const columns = useMemo(
        () => [
            {
                Header: t`Asset`,
                accessor: 'address',
                Cell: (cell: any) => (
                    <TokenItem
                        symbol={(tokens.find((tok: RToken) => tok.address === cell.cell.value)).symbol}
                        logo={(tokens.find((tok: RToken) => tok.address === cell.cell.value)).logo}
                    />
                ),
            },
            {
            Header: t`Available`,
                accessor: 'balance',
                Cell: (cell: any) => (
                    <Text>
                        {(cell.cell.value as number).toFixed(2)}
                    </Text>
                )
            },
            {
                Header: t`Liquidity`,
                accessor: 'liquidity',
                Cell: (cell: any) => (
                    <Text>
                        {(cell.cell.value as number).toFixed(2)}
                    </Text>
                )
            },
            {
                Header: t`APY`,
                accessor: 'lendApy',
                Cell: (cell: any) => (
                    <Text sx={{ color: "green" }}>{(cell.cell.value as number).toFixed(2)}%</Text>
                ),
            },
            {
                Header: '',
                accessor: 'maxDeposit',
                Cell: (cell: any) => {
                    const pool = getPoolFromSymbol(cell.cell.value.symbol)!

                    const buttonColor = pool.lendBalance > 0 ? "#008060" : "#171C1A"
                    const textColor = pool.lendBalance > 0 ? "#ffffff" : "#171C1A"

                    return (
                        <Box
                            variant="layout.verticalAlign"
                            // sx={{ justifyContent: 'right' }}
                        >
                            <Button px={4} mr={10} backgroundColor={buttonColor} style={{ color: `${textColor}` }} onClick={() => {
                                setMaxWithdraw(pool.lendBalance)
                                setSelectedLendAsset(cell.cell.value.symbol)
                                setWithdrawVisible(true)
                            }}>
                                Withdraw
                            </Button>

                            <Button px={4} ml={10} onClick={() => {
                                setMaxDeposit(cell.cell.value.maxDeposit)
                                setSelectedLendAsset(cell.cell.value.symbol)
                                setDepositVisible(true)
                            }}>
                                Deposit
                            </Button>
                        </Box>
                    )
                },
            },
        ],
        []
    )

    return (
        <>
            <Grid columns={[1, 1, 1, 1]} gap={5} mb={40}>
                <Box>
                    <Grid columns={[1, 3]} gap={4} mb={4}>
                        <Stats title="Total Deposits" amount={`$${totalDeposit.toFixed(2)}`} />
                        <Stats title="Earning APY (%)" amount={`6.3%`} color="green" />
                        <Stats title="Interest Earned" amount={`$${totalInterest.toFixed(2)}`} />
                    </Grid>
                </Box>
            </Grid>

            <Box {...props}>
                <Text variant="title" sx={{ fontSize: 3 }} ml={5} mb={4}>
                    <Trans>Available Lending Markets</Trans>
                </Text>
                {data.length ? (
                    <>
                        <Table columns={columns} data={data} />
                        {isLendModalVisible && <LendModal />}
                        {isWithdrawModalVisible && <WithdrawModal />}
                    </>
                ) : (
                    <Box
                        sx={{
                            border: '1px dashed',
                            borderColor: 'darkBorder',
                            textAlign: 'center',
                            borderRadius: 16,
                        }}
                        p={6}
                    >
                        {/* <Text>
                            <Trans>No lending markets available. Something has probably gone wrong.</Trans>
                        </Text> */}
                    </Box>
                )}
            </Box>
        </>
    )
}


const Lend = () => {
    const [ account, setAccount ] = useState(localStorage.getItem(ADDRESS_STORAGE)!)
    const [pools, setPools] = useAtom(poolsAtom)
    const tokens = availableRTokens()

    useEffect(() => {
        usePools(account!).then((res: any) => {
            setPools(res as any)
        })
    }, [account])

    return (
        <Container>
            <ContentHead
                title={`Lend RTokens`}
                subtitle={t``}
                mb={7}
                ml={5}
            />
            
            <LendMarkets data={pools} tokens={tokens} account={account!} mb={7} />
        </Container>
    )
}

export default Lend
