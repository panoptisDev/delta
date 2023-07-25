import useSWR from 'swr'
import { GraphQLClient, RequestDocument } from 'graphql-request'

const client = new GraphQLClient(process.env.REACT_APP_SUBGRAPH_URL ?? '')

const fetcher = (query: RequestDocument, variables: any) =>
  client.request(query, variables)

const useQuery = (
  query: RequestDocument | null = null,
  variables: any = {},
  config: any = {}
): any => {
  // return useSWR(query ? [query, variables] : null, fetcher, config)
  return {data: null, error: null, mutate: null, isValidating: null}
}

export default useQuery
