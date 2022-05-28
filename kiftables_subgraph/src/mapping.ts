import { ipfs, json, log } from '@graphprotocol/graph-ts'
import {
  Transfer as TransferEvent,
  Kiftables as KiftablesContract
} from '../generated/Kiftables/Kiftables'
import { Token, User } from '../generated/schema'
// Import the generated contract class
import { Kiftables } from '../generated/Kiftables/Kiftables'


// TODO: create a new event handler for reveal which uses contract.tokenURI to get the newly
// revealed token locations.
// REFERENCES: 
// - https://github.com/dabit3/building-a-subgraph-workshop
// - https://github.com/dabit3/cryptocoven-api/blob/main/src/mapping.ts

export function handleTransfer(event: TransferEvent): void {
  /* load the token from the existing Graph Node */
  let token = Token.load(event.params.tokenId.toString())
  if (!token) {
    /* if the token does not yet exist, create it */
    token = new Token(event.params.tokenId.toString())
    token.tokenID = event.params.tokenId

    // Get tokenURI from Kiftables contract
    
    let contract = Kiftables.bind(event.address)
    let tokenURI = contract.tokenURI(token.tokenID)
    log.debug('tokenURI', [tokenURI])

    // tokenURI examples 
    // [Pre-Reveal] ipfs://QmdwirNbpsi3aymwqEAtftMni5kmrqah44epkxJrAiU7aD
    // [Reveal] ipfs://QmTrHZFPNpjYTgEdqu4FRjxW8Y5yCkrKeQZ1N2odQNyUwt/274.json

    let ipfsHash = tokenURI.replace('ipfs://', '');
    log.debug('ipfsHash', [ipfsHash])

    let ipfsData = ipfs.cat(ipfsHash)
    log.debug('ipfsHash', [ipfsHash])

    if (ipfsData) {
      const value = json.fromBytes(ipfsData).toObject()
      if (value) {
        /* using the metatadata from IPFS, update the token object with the values  */
        const name = value.get('name')
        const description = value.get('description')
        const image = value.get('image')
        const attributes = value.get('attributes')

        if (name && image && description && attributes) {
          token.name = name.toString()
          token.description = description.toString()
          token.image = image.toString()
          token.ipfsURI = 'ipfs.io/ipfs/' + ipfsHash
          // token.attributes = attributes
        }
    }

    // TODO: should we be searching by another approach? i.e. ipfs://{...}/1.json
    // let metadata = ipfs.cat(ipfshash + token.tokenURI)
    

    // data example
    // {
    //   "name": "Unrevealed Kiftable",
    //   "description": "Your Kiftable will be revealed soon!",
    //   "image": "ipfs://QmNqtqiYJxUWzCyPaGZFe8GFWLkT9FcZhQvN1cjM7MPFp1",
    //   "attributes": []
    // }
    // log.debug('ipfs data', [ipfsData?.toString()])
    if (ipfsData) {

    }
  }

  token.updatedAtTimestamp = event.block.timestamp
  /* set or update the owner field and save the token to the Graph Node */
  token.owner = event.params.to.toHexString()
  token.save()
  
  /* if the user does not yet exist, create them */
  let user = User.load(event.params.to.toHexString())
  if (!user) {
    user = new User(event.params.to.toHexString())
    user.save()
  }
}

