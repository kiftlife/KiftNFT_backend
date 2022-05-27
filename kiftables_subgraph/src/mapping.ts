import { ipfs, json } from '@graphprotocol/graph-ts'
import {
  Transfer as TransferEvent,
  Kiftables as KiftablesContract
} from '../generated/Kiftables/Kiftables'
import { Token, User } from '../generated/schema'


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

