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
import { blockTimestampAtom, isBorrowModalVisibleAtom, isRepayModalVisibleAtom, isWalletModalVisibleAtom, poolsAtom } from 'state/atoms'
import { BoxProps, Link, Button } from 'theme-ui'
import { StringMap } from 'types'
import { formatCurrency } from 'utils'
import { rMAV, RSR_ADDRESS } from 'utils/addresses'
import { CHAIN_ID } from 'utils/chains'
import { maxBorrowAtom, maxRepayAtom, selectedBorrowAsset } from 'views/issuance/atoms'
import { ADDRESS_STORAGE } from 'state/storage'
import BorrowModal from './BorrowModal'
import Redeem from 'views/issuance/components/redeem'
import Stats from 'components/Stats'
import RepayBorrowModal from './RepayBorrowModal'


interface TableProps extends BoxProps {
    data: Pool[]
    tokens: StringMap
    account: string
}


const BorrowMarkets = ({ data, tokens, account, ...props }: TableProps) => {
    const [ maxRepay, setMaxRepay ] = useAtom(maxRepayAtom)
    const [ maxBorrow, setMaxBorrow ] = useAtom(maxBorrowAtom)
    const [ lendAsset, setSelectedBorrowAsset ] = useAtom(selectedBorrowAsset)
    const [ totalBorrowed, setTotalBorrowed ] = useState(0)
    const [ borrowLimit, setBorrowLimit ] = useState(0)
    const [ isBorrowModalVisible, setBorrowModalVisible ] = useAtom(isBorrowModalVisibleAtom)
    const [ isRepayBorrowModalVisible, setRepayBorrowModalVisible ] = useAtom(isRepayModalVisibleAtom)

    useEffect(() => {
        let res = 0
        let limit = 0
        for(const d of data) {
            res += (d.borrowBalance + d.borrowInterest)
            limit += d.borrowLimit
        }
        setTotalBorrowed(res)
        setBorrowLimit(limit)
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
                Header: t`Total APY`,
                accessor: 'borrowApy',
                Cell: (cell: any) => (
                    <Text sx={{ color: "red" }}>{(cell.cell.value as number).toFixed(2)}%</Text>
                ),
            },
            {
                Header: '',
                accessor: 'maxBorrow',
                Cell: (cell: any) => {
                    const pool = getPoolFromSymbol(cell.cell.value.symbol)!

                    const buttonColor = pool.borrowBalance > 0 ? "#008060" : "#171C1A"
                    const textColor = pool.borrowBalance > 0 ? "#ffffff" : "#171C1A"

                    return (
                        <Box
                            variant="layout.verticalAlign"
                            // sx={{ justifyContent: 'right' }}
                        >
                            <Button px={4} mr={10} backgroundColor={buttonColor} style={{ color: `${textColor}` }} onClick={() => {
                                setMaxRepay(pool.borrowBalance)
                                setSelectedBorrowAsset(cell.cell.value.symbol)
                                setRepayBorrowModalVisible(true)
                            }}>
                                Repay
                            </Button>

                            <Button px={4} onClick={() => {
                                setMaxBorrow(cell.cell.value.maxBorrow)
                                setSelectedBorrowAsset(cell.cell.value.symbol)
                                setBorrowModalVisible(true)
                            }}>
                                Borrow
                            </Button>
                        </Box>
                    )
                }
            },
        ],
        []
    )

    return (
        <>
            <Grid columns={[1, 1, 1, 1]} gap={5} mb={40}>
                <Box>
                    <Grid columns={[1, 3]} gap={4} mb={4}>
                        <Stats title="Total Borrowed" amount={`$${totalBorrowed.toFixed(2)}`} />
                        <Stats title="Loan APY (%)" amount={`${(6.3).toFixed(2)}%`} color="red" />
                        <Stats title="Borrow Limit (%)" amount={`${borrowLimit.toFixed(2)}%`} />
                    </Grid>
                </Box>
            </Grid>

            <Box {...props}>
                <Text variant="title" sx={{ fontSize: 3 }} ml={5} mb={4}>
                    <Trans>Available Borrowing Markets</Trans>
                </Text>
                {data.length ? (
                    <>
                        <Table columns={columns} data={data} />
                        {isBorrowModalVisible && <BorrowModal />}
                        {isRepayBorrowModalVisible && <RepayBorrowModal />}
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
                        <Text>
                            <Trans>No lending markets available. Something has probably gone wrong.</Trans>
                        </Text>
                    </Box>
                )}
            </Box>
        </>
    )
}


const Borrow = () => {
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
                title={`Borrow RTokens`}
                subtitle={t``}
                mb={7}
                ml={5}
            />
            
            <BorrowMarkets data={pools} tokens={tokens} account={account!} mb={7} />
        </Container>
    )
}

export default Borrow
