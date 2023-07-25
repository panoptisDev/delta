import * as React from 'react'

function CoinbaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width="1em"
      height="1em"
      {...props}
    >
      <circle cx={512} cy={512} r={512} fill="#1652f0" />
      <path
        d="M559.2 672c26.2 0 52.4-5.8 75.6-14.5l49.4 75.6C640.6 756.4 594 768 544.6 768c-148.3 0-258.9-98.9-258.9-256 2.9-157.1 116.4-256 261.8-256 52.4 0 90.2 11.6 130.9 32l-46.5 78.5c-23.3-8.7-49.4-14.5-75.6-14.5-87.3 0-157.1 55.3-157.1 160 0 98.9 66.9 160 160 160z"
        fill="#fff"
      />
    </svg>
  )
}

export default CoinbaseIcon
