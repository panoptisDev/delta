import { formatEther } from '@ethersproject/units'
import { Facade } from 'abis/types'
import { useFacadeContract } from 'hooks/useContract'
import { useAtomValue } from 'jotai'
import { useSetAtom } from 'jotai'
import { useCallback, useEffect } from 'react'
import { balancesAtom, chainIdAtom, rTokenAtom, walletAtom } from 'state/atoms'
import { getIssuable } from 'utils/rsv'
import { maxIssuableAtom } from 'views/issuance/atoms'
import { useRToken } from 'hooks/useRToken'

/**
 * View: Mint -> Issue
 * Fex maximun issuable amount for rToken
 */
const MaxIssuableUpdater = () => {
    // const rToken = useAtomValue(rTokenAtom)
    const rToken = useRToken()
    const tokenBalances = useAtomValue(balancesAtom)
    const setMaxIssuable = useSetAtom(maxIssuableAtom)
    const account = useAtomValue(walletAtom)
    const chainId = useAtomValue(chainIdAtom)
    const facadeContract = useFacadeContract()

    const updateMaxIssuable = useCallback(
        async (account: string, rTokenAddress: string, facade: Facade) => {
            try {
                const maxIssuable = await facade.callStatic.maxIssuable(
                    rTokenAddress,
                    account
                )
                setMaxIssuable(maxIssuable ? Number(formatEther(maxIssuable)) : 0)
            } catch (e) {
                setMaxIssuable(0)
                console.error('error with max issuable', e)
            }
        },
        []
    )

    useEffect(() => {
        if(rToken && account && facadeContract) {
            updateMaxIssuable(account, rToken.address, facadeContract)
        } else if(!rToken?.isRSV) {
            setMaxIssuable(0)
        }
    }, [rToken?.address, account, facadeContract, JSON.stringify(tokenBalances)])

    return null
}

export default MaxIssuableUpdater
