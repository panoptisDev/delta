import { useEffect, useState } from 'react'
import { Card, Flex, Text } from 'theme-ui'
/**
 * Issuance
 */
const Stats = ({
    title = "",
    amount = "",
    color = ""
}) => {
    return (
        <>
            <Card p={4}>
                <Text as="label" variant="legend" ml={2}>
                    {title}
                </Text>

            <Text as="h1" variant="" color={color} ml={2} style={{ width: "100%", margin: "10 auto 0 auto", alignItems: "center" }}>
                {amount}
            </Text>
            </Card>
        </>
    )
}

export default Stats
