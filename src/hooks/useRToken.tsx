import { ReserveToken } from 'types'
import { DAI, rFRA, rMAV, USDC, USDT } from 'utils/addresses'
import { TOKEN_STORAGE } from 'utils/rtokens'


export const rMAV_RTOKEN = {
    address: rMAV,
    name: "Maverick Token",
    symbol: "rMAV",
    decimals: 18,
    stToken: {
        address: "0xEc9d8e5C55a04000a860FD8801Dd93aE77501401",
        name: "rdtlRSR Token",
        symbol: "rdtlRSR",
        decimals: 18
    },
    collaterals: [
      {
            address: USDT,
            name: "Goerli Reserve USDT",
            symbol: "USDT",
            decimals: 18
        },
        {
            address: USDC,
            name: "Reserve Goerli USDC",
            symbol: "USDC",
            decimals: 6
        }
    ],
    main: "0xBED07C2967767BE1db2Ad4E048Fc4AaB9Bd1c7aC",
    logo: "/svgs/rmav.svg",
    mandate: "Mandate",
    unlisted: true
}


export const rFRA_RTOKEN = {
    address: rFRA,
    name: "Frack Token",
    symbol: "rFRA",
    decimals: 18,
    stToken: {
        address: "0x2EFCA8a62c937f404EC6CCa8A2eeBc887cE132Ca",
        name: "rfraRSR Token",
        symbol: "rfraRSR",
        decimals: 18
    },
    collaterals: [
        {
            address: DAI,
            name: "Goerli Reserve DAI",
            symbol: "DAI",
            decimals: 18
        },
        {
            address: USDT,
            name: "Goerli Reserve USDT",
            symbol: "USDT",
            decimals: 18
        }
    ],
    main: "0x1e69Bd674d45814B60388dF980F91e1B77feE9AA",
    logo: "/svgs/rfra.svg",
    mandate: "rFRA Mandate",
    unlisted: true
}


export function getRTokenFromSymbol(symbol: string) {
    return symbol === "rMAV" ? rMAV_RTOKEN : rFRA_RTOKEN
}


// const useRToken = (): ReserveToken | null => {
export const useRToken = (): ReserveToken => {
    // const val = useAtomValue(rTokenAtom)
    // console.debug("Value:", val)
    // return val
    if(localStorage.getItem(TOKEN_STORAGE) === rFRA_RTOKEN.address)
        return rFRA_RTOKEN
    
    return rMAV_RTOKEN
}

export const availableRTokens = (): ReserveToken[] => {
    return [rMAV_RTOKEN, rFRA_RTOKEN]
}
