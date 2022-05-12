
const BASE_PREREVEAL_URL = `https://gateway.pinata.cloud/ipfs/QmR44zZLLBMwygbw9FCZpnvCsedooYM9VfKRhJhw5LwvE3`
// const IPFS_BASE_URL = `https://gateway.pinata.cloud/ipfs/QmcL4aJCM4WATiyo75wnAs2E7J6JRmnpPVbfxuk1za66VX`
// const BASE_PREREVEAL_URL = 'ipfs://a-placeholder-image-path';
const IPFS_BASE_URL = 'ifps://a-real-path'

const CHAINLINK_SUB_ID = '2879'
const CHAINLINK_KEY_HASH = '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc'

const airdropDevAddresses = [
    '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
  ];

  const communityDevAddresses = [
    '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
    '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65'
  ];

  const testAddresses = [
    '0x93E40A70115C9EfC67f817BfC62717d8Ab66C720',     // brad
    '0xF912DF89aFD526B451bF50fA7c0477bCe1A7b10A',     // sante
    '0x9de5ae3b772bcf4661f8b307678a90668729c89e',     // lev
    '0x6F20F74586936B09cc6E21e35067ad5Aa197b130',     // nick
    '0x025B62EB00120e340B30F8c7Ba0f3b20392edA90',     // mo
    '0xc0c385e74C47e19302Be184Af3379fc21FBf079B',     // cam
    '0xc2B27c40D37d1d8338525656D5570A397Bc155E5',     // colin
    '0x8061c137db2c1a1906d7f22e4d57ab8e32f682c6',     // david
  ];


  const airdropProdAddresses = [];
  const communityProdAddresses = [];

  module.exports  = {
    BASE_PREREVEAL_URL,
    IPFS_BASE_URL,
    airdropDevAddresses,
    communityDevAddresses,
    testAddresses,
    airdropProdAddresses,
    communityProdAddresses,
    CHAINLINK_SUB_ID,
    CHAINLINK_KEY_HASH
  }