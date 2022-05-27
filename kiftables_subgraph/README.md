## The Graph API

We use the graph to index transaction events on the blockchain to a query-able api which helps do more powerful operations than the methods available on the contract itself. An example would be:

- find the nfts owned by a wallet address

The project subgraph is currently located here:
https://thegraph.com/hosted-service/subgraph/bradryan/kiftables

### Setup

1. Download The Graph CLI

`yarn global add @graphprotocol/graph-cli`

2. Install dependencies in graph subdirector

`cd ./kiftables_subgraph`
`yarn install`

3. Ensure you have auth'd using the graph access token (request for access). Currently the access token appears to be that of the user who created the hosted subgraph. Perhaps if we create a distributed one (subgraph stude)

`graph auth --product hosted-service <ACCESS_TOKEN>`

4. Upon making changes to the schema run the command

`yarn codegen`

5. Deploy changes to the graph

`graph deploy --product hosted-service bradryan/kiftables`
