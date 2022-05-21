## The Graph API

We use the graph to index transaction events on the blockchain to a query-able api which helps do more powerful operations than the methods available on the contract itself. An example would be:

- find the nfts owned by a wallet address

### Setup

1. Download The Graph CLI

`npm install -g @graphprotocol/graph-cli`

2. Upon making changes to the schema run the command

`npm run codegen`

3. Ensure you have auth'd using the graph access token (request for access)

`graph auth --product hosted-service <ACCESS_TOKEN>`

For those with access the graph is hosted here:
https://thegraph.com/hosted-service/subgraph/bradryan/kiftables

4. Deploy changes to the graph

`graph deploy`
