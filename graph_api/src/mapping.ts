import { ipfs, json } from '@graphprotocol/graph-ts'

import {
  Transfer as TransferEvent,
  KiftVans as KiftVansContract
} from '../generated/KiftVans/KiftVans'

import { Token, User } from '../generated/schema'

// const BASE_PREREVEAL_URL = https://gateway.pinata.cloud/ipfs/QmR44zZLLBMwygbw9FCZpnvCsedooYM9VfKRhJhw5LwvE3
// onst IPFS_BASE_URL = https://gateway.pinata.cloud/ipfs/QmcL4aJCM4WATiyo75wnAs2E7J6JRmnpPVbfxuk1za66VX
const ipfshash = 'QmcL4aJCM4WATiyo75wnAs2E7J6JRmnpPVbfxuk1za66VX'

export function handleTransfer(event: TransferEvent): void {
  // console.log('[handleTransfer]', event)

  /* load the token from the existing Graph Node */
  let token = Token.load(event.params.tokenId.toString())
  
  if (!token) {
    /* if the token does not yet exist, create it */
    token = new Token(event.params.tokenId.toString())
    token.tokenID = event.params.tokenId
 
    token.tokenURI = "/" + event.params.tokenId.toString() + ".json"

    console.info(`tokenID: ${token.tokenID}`)
    // console.info('tokenURI: ' + token.tokenURI)

    /* combine the ipfs hash and the token ID to fetch the token metadata from IPFS */
    let metadata = ipfs.cat(ipfshash + token.tokenURI)
    if (metadata) {
      const value = json.fromBytes(metadata).toObject()
      if (value) {
        /* using the metatadata from IPFS, update the token object with the values  */
        const name = value.get('name')
        const image = value.get('image')
        const description = value.get('description')
        const externalURL = value.get('external_url')


        // console.info('name: ' + name?.toString())
        // console.info('image: ' + image?.toString())

        if (name && image &&  externalURL) {
          token.name = name.toString()
          token.image = image.toString()
          token.externalURL = externalURL.toString()
          token.ipfsURI = 'ipfs.io/ipfs/' + ipfshash + token.tokenURI
        }          

        if (description) {
          token.description = description.toString()
        }
      }
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