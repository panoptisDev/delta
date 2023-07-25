import { useMemo } from 'react'
import { tokenList } from 'utils/rtokens'

export const getRTokenLogo = (address: string) => {
  if(tokenList[address]?.logo) {
    return require(`@lc-labs/rtokens/images/${tokenList[address].logo}`)
  }

  return '/svgs/rmav.svg'
}

export const useRTokenLogo = (address: string) =>
  useMemo(() => getRTokenLogo(address), [address])