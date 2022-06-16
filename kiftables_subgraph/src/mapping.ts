import { ipfs, json, log } from '@graphprotocol/graph-ts'
import {
  Transfer as TransferEvent,
  Kiftables as KiftablesContract,
  LogReveal as RevealEvent,
} from '../generated/Kiftables/Kiftables'
import { Attribute, Token, User } from '../generated/schema'


/** 
 * [addIpfsDataToToken] - fetches ipfs data for provided hash and assigns relevant attributes to the provided token
 */

export const addIpfsDataToToken = (token: Token, ipfsHash: string) => {
  // tokenURI examples 
  // [Pre-Reveal] ipfs://QmdwirNbpsi3aymwqEAtftMni5kmrqah44epkxJrAiU7aD
  // [Reveal] ipfs://QmTrHZFPNpjYTgEdqu4FRjxW8Y5yCkrKeQZ1N2odQNyUwt/274.json
  let ipfsData = ipfs.cat(ipfsHash)

  
  if (!ipfsData) {
    log.error(`[KIFT:handleTransfer] No ipfs data found for tokenId: ${token.tokenID.toString()}. tokenURI: ${tokenURI}`, []);
  }

  if (ipfsData) {
    const value = json.fromBytes(ipfsData).toObject()

    if (value) {
      /* using the metatadata from IPFS, update the token object with the values  */
      const name = value.get('name')
      const description = value.get('description')
      const image = value.get('image')

      if (name && image && description) {
        token.name = name.toString()
        token.description = description.toString()
        token.image = image.toString()
      }

      let tokenAttributes: string[] = []
      const attributes = value.get('attributes')

      if (attributes) {
        const attributesArray = attributes.toArray()
        for (let i = 0; i < attributesArray.length; i++) {
          const attributeJson = attributesArray[i]
          const attributeObj = attributeJson.toObject()
          
          let type = attributeObj.get('trait_type')
          let value = attributeObj.get('value')
          
          if (type && value) {
            // for now using trait type & value for generating attribute id
            let attributeId = type.toString() + '-' + value.toString()
            let attribute = Attribute.load(attributeId)

            // Create new attribute if not found
            if (!attribute && type && value) {
              attribute = new Attribute(attributeId)
              attribute.trait_type = type.toString()
              attribute.value = value.toString()
              
              log.info(`[KIFT:handleReveal] new attribute created ${attributeId}`, [])
              attribute.save() 
            }

            if (attribute) {
              tokenAttributes.push(attributeId)
            }
          }
        }
      }

      token.attributes = tokenAttributes       
      token.revealDataSet = true
    }
  }
}

export function handleTransfer(event: TransferEvent): void {
  /* load the token from the existing Graph Node */
  let token = Token.load(event.params.tokenId.toString())
  log.info(`[KIFT:handleTransfer] token transfer initiated for id: ${event.params.tokenId.toString()}`, [])
  
  if (!token) {
    /* if the token does not yet exist, create it */
    token = new Token(event.params.tokenId.toString())
    log.info(`[KIFT:handleTransfer] new token being created for id ${token.id}`, [])

    token.tokenID = event.params.tokenId
    token.name = "Unrevealed Kiftable"
    token.description = "Your Kiftable will be revealed soon!"
    token.image = "ipfs://QmNqtqiYJxUWzCyPaGZFe8GFWLkT9FcZhQvN1cjM7MPFp1"
    token.revealed = false
    token.revealDataSet = false
    

    // Get tokenURI from Kiftables contract
    let contract = KiftablesContract.bind(event.address)
    let tokenURI = contract.tokenURI(token.tokenID)
    let ipfsHash = tokenURI.replace('ipfs://', '')
    token.ipfsURI = 'ipfs.io/ipfs/' + ipfsHash  
  }

  if (token.revealed && !token.revealDataSet) {
    let contract = KiftablesContract.bind(event.address)
    let tokenURI = contract.tokenURI(token.tokenID)
    token.tokenURI = tokenURI.toString()
    let ipfsHash = tokenURI.replace('ipfs://', '')
    addIpfsDataToToken(token, ipfsHash)
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

export function handleReveal(event: RevealEvent): void {
  let contract = KiftablesContract.bind(event.address)

  const revealFinish = event.params.lastTokenRevealed.toI32()
  const revealStart = revealFinish - 200;
  
  log.info(`[KIFT:handleReveal] token reveal start: ${revealStart.toString()} | finish: ${revealFinish.toString()}`, [])
    
  for (let i = revealStart; i < revealFinish; i++) {
    let tokenId = i.toString()
    let token = Token.load(tokenId)
    log.info(`[KIFT:handleReveal] fetch tokenId ${tokenId} | token found: ${!!token}`, [])
    
    if (token && !token.revealed) {
      // ****** get new IPFS data now that revealed ******
      // Get tokenURI from Kiftables contract
      let tokenURI = contract.tokenURI(token.tokenID)

      // tokenURI examples 
      // [Pre-Reveal] ipfs://QmdwirNbpsi3aymwqEAtftMni5kmrqah44epkxJrAiU7aD
      // [Reveal] ipfs://QmTrHZFPNpjYTgEdqu4FRjxW8Y5yCkrKeQZ1N2odQNyUwt/274.json
      let ipfsHash = tokenURI.replace('ipfs://', '')

      token.tokenURI = tokenURI.toString()
      token.ipfsURI = 'ipfs.io/ipfs/' + ipfsHash
      token.revealed = true
      token.save()
    }
  }
}