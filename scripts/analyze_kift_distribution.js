/**
 * Kift NFT Distribution Analysis
 *
 * Based on the ledger data provided, this script analyzes:
 * - Total NFTs minted (~535)
 * - Unique wallet addresses
 * - Average NFTs per wallet
 * - Gas cost estimates for airdrop
 */

// Sample wallet addresses I can identify from the ledger (partial list for demonstration)
const visibleWallets = {
  // 5 NFT holders (max mint)
  '0x20229AAb17432C3D8482531e416a4aD363Fd2EF8': 5,
  '0x7899093eb22bfd0965a3c841a484a0f12030f55a': 5, // samuelianrosen.eth
  '0x137effbb0b405cd6a3c549e53dd6244a439c514d': 5, // matai.eth
  '0x6905435fa2e1cb31972bb0f0bff16f5744a91876': 5, // justwa1t.eth
  '0x3D029d55464B7F040394BD160B17e378553caab9': 5,
  '0x21eF24353C6aC92eA9B4439246C160A28D1c6Bf3': 5,
  '0x4AEA901ac7815358B0CcF22511f3a001D6B976B6': 4,
  '0xf912df89afd526b451bf50fa7c0477bce1a7b10a': 4, // santekotturi.eth
  '0x009b6639CE8628425DA05861239368cC85be22E9': 5,
  '0xBA94DFAde25c83bd52Ed1d92F6eeEA13e827BB38': 5,
  '0xBbdA22Ec2b3a6761DEE9dE0210e405eeF158AbA7': 5,
  '0xE4bdD3209Ae808dF149011025bB29225Bb06C993': 5,
  '0x282173335ae1F328b34Eb9Acadc052E59E70A89f': 5,
  '0x1FF52CEf9e271ccA78306bb9d6B9c8bbceA607f1': 5,
  '0x757007182E8B35D252AF3A3c4D4afCE0FEfd416A': 5,
  '0x989E801b82734649d292fC49E657D6b0f1DE9Cba': 5,
  '0x4f34Db89F0b5468BEf05A7EfcEAeBa9c3B2C70a1': 5,
  '0xb0ea9ee04fcb6c9bbf11b7bd92597a87b535aeac': 5, // basicrich.eth
  '0x6FFcB6ae7Cdf6C45bA2b31a24Cd599a0208ed951': 5,
  '0x1Ed909A9aa5B93E7eC5d56939a7C570EDf810C50': 5,
  '0x5056596726deAcAA6a78Ad4f1bB826d008689606': 5,
  '0x41FBa52F39F3841cc40f7b57c668444EE5E0138a': 5,
  '0x99fE32D9b1DdFC1B125D078c536B91dF164FF8F1': 5,
  '0x8F581907b1d71f75A98A015c8C4e55f00Da317Be': 5,
  '0x927dEdF46F0EC579762824702e56eC1eA986593a': 5,
  '0x64f8dB39635Ecb9Ddb25e5A255905810DdD2187c': 5,
  '0x9BC48F455d62c15271C3331936dB2033bEbFb2A1': 5,
  '0x12b15F72a0A69feFDbF512de84ae6021d736E8e1': 5,
  '0x85937d6b43b77eca2f9fa96bc149739bfb48d5fd': 5, // fooj.eth
  '0xa2f0448f346ce50b9029506c88dfa58d07baf880': 5, // sspnft.eth
  '0x8Bc095161f1e30af86Ba52afd3c3233B81A4097A': 3,
  '0x4452700F01B6863DeC653E3183c6C951020Bc666': 5,
  '0xd1344833f3ccb6359583657be3d8959a18ab83b2': 3, // cosmicblend.eth

  // 4 NFT holders
  '0x30C75c34e33bC5637d23898D32bC6c07aB268351': 4,
  '0x706271FF5B10A80276b1B8ACB12Ec72eF2E36102': 4,

  // 3 NFT holders
  '0x9A5f9Ba29E27483E62F61339Ce6B8Afd07D47068': 3,
  '0x37a05d42b16b1d39c2db219d76e238c1373d0c52': 3, // duncansghola.eth
  '0xBA94DFAde25c83bd52Ed1d92F6eeEA13e827BB38': 3,
  '0xF5323Cb2752699CBabD1134dc19D4cB7AcF67Db8': 3,
  '0xc2B27c40D37d1d8338525656D5570A397Bc155E5': 5,
  '0xBB59e373eeEC22646cD93914e7f86743F1C64FF9': 5,
  '0xE4f93Bac414326cDff2AB1506D11Ba9b4CfF8427': 3,
  '0xb2ef634e5bab1d7b2136ed35a91abc1adb118281': 2, // slimsnapped.eth
  '0xd827eb2673d3dc1a7f886413f6f0950ec2fbbc98': 3, // rosanna.eth
  '0x575E0f63AaAA11cD37B214Ab66Aefa08997c222a': 5,
  '0x2aB27316709F23dc0c83De96B149B22aFBAd7Be1': 3,
  '0x05ae0683d8b39d13950c053e70538f5810737bc5': 5, // teedubya.eth
  '0xd693142ca1d319db4778ccee87b9a034105f6168': 1, // drcrad.eth
  '0x6140F00e4Ff3936702E68744f2b5978885464cbB': 2,
  '0xAb781be5F528d00105E88d951ef5fb7AF5A7e937': 3,
  '0x823D788F5cF0c8EDc02479C138257427f6e53c3C': 2,
  '0xcfe2f8daa9e67ba9d5abba29f7fd428b3b917dc5': 5, // alankahler.wallet
  '0xB18D6D27FFB234B69fA28cAB8a11b1B953a10185': 5,
  '0xeCc6B9cd1b3D36Cb85784410c690cA88159e8101': 5,
  '0xabC7482E6d532467B5Bf91D4ba731b5cfBf30F5A': 5,
  '0xd27cd9b687cd898eeb2af557bfdf75017ca7e50d': 5, // sanisideup.eth
  '0x8796264d25F5302c42BAf97ad5fb83e4d55031Be': 4,
  '0x6169110a063e26890b0f74689faa820721f0364c': 4, // digitalxshaman.eth
  '0x77aA943A365161e499eaFF59E936a799e6051e15': 2,
  '0x1cb58259fB7Bc902a82d9b7561d3d3E29418FE9D': 2,
  '0x0c687a27410e8a655bf31befc4c88237a60b1d3d': 2, // badmonky.eth
  '0x0cb27e883e207905ad2a94f9b6ef0c7a99223c37': 2, // seanwbren.eth
  '0x135Bf5065DbB72e493d9aA879c47DF1e9683E2EA': 2,
  '0x68812f136ad7f76817fee39c3ff2848a5d5614aa': 2, // torin.eth
  '0x6618173f885F9A67f07D5FDF79f21A916E5fBCDf': 2,
  '0x0bd793ea8334a77b2bfd604dbaedca11ea094306': 2, // yisiliu.eth
  '0x11e4338381ae037E72f8129B3c735b8dF05Af095': 2,
  '0x2d9cbc4ecfbd1b8f66aa798fd51585ae058daa8b': 2, // metamu.eth
  '0x4bbfBa9D4301C5D34722b13702776e37774F2c89': 2,
  '0x796307f46b108661600e252a23faa2ee11ee6e23': 2, // darakhan.eth

  // 2 NFT holders
  '0xf928edae51f0110c390346f1c50c5586bfe24746': 2, // 03000044.eth
  '0x97495aE1cE36Fc0d34D6216Dc4a97E5178e1076E': 2,
  '0xD3ff24F8feBF9Cf8406495Ea7dCA78cbF16CEf65': 2,
  '0xab75A8FF542EEF2A4f6417E0874D2E922E03aE36': 2,
  '0x6BabCdf1B118E8ba873e270Da65c37f61A5E0a42': 3,
  '0xe62BCcd8974d18D746B424CB212A379F71B8d4a4': 5,
  '0x0258391eB58e1E7EA1df967d6340c8048E560036': 4,
  '0x0d43e9d9812c0d7c63c7cbe873526030307d921f': 3, // bigbucksnowhammies.eth
  '0x484C09cbC057f6E85D71EBd4D6B36818f6f0b7CF': 2,
  '0xB20b86BF3a02e3aC8221Dec2EF49929368129449': 3,
  '0xec184089705e88f2380efa98068e3f167c01f609': 2, // mccallmepaul.eth
  '0x1660207BF5681c9cDB8AFe3A16C03A497A438753': 2,
  '0x92f77916f48bEe46072e4FF45c5672B9A757F31A': 3,
  '0xcD69b426f13a8B3b497972a9A09E0c67F9A7d674': 2,
  '0x026f751CB6Be8b0871A612883f652358fCD82960': 2,
  '0xa710b72bc9561932e144bceb9c2e62e6c2f05844': 2, // przcntn.eth
  '0x22E14146427bbDD7a4cABD3FA2D735552F508FcF': 2,
  '0x07927D33bef51c0aB6B7C17b2E37ffAD4b0d078c': 2,
  '0x634f91aB2DabaDE5e16C709FC668eF025fEF580C': 2,
  '0xFd4894B09EcFAF0456EB5240D2E71e46D116CA38': 2,
  '0x0DeE12A2548432702e1c275c50b3aD223f9a74be': 2,
  '0x02adBb6eD1DF0A6D0c9F4A7f4763F3c54560910E': 3,
  '0x84eaEBc04869bEf3A3c5fFbab95c44f494aCd0FD': 2,
  '0x48080E7bfEb6c5DfA4c38cEA6Ef48B3F1EdcDEbC': 2,
  '0xA2f36f9F1591A3e2Dd752F1e1491F4d98340E580': 2,
  '0xB8b2B075C8a959255Fbc1D5D9F51645Cd1517740': 1,
  '0x5F33D14F958EF391Af22C1A1a3a10B36ecAbf5d3': 2,
  '0x703fbd74399f71103604e3c7ea9f54cbb43f718a': 2, // 0xblockboy.eth
  '0xdC4604C543d73367376315e75a2bAcf6A3a156aa': 2,
  '0x4220Dd57f665A2B93E6584Cfa4B46c0D74A5a7b9': 2,

  // 1 NFT holders (examples)
  '0x0D83675f7F7F55384Ec4f102D37641E0633B56F1': 3,
  '0xd66993ca0D24507E9F892e1428dD181B822fdc06': 2,
  '0xb74C03E1b44b8A3A537008291129feAF9c2f1F90': 2,
  '0xa89bcBd2ccb9aE72bb63cA6d8Da427eCc3868bfE': 2,
  '0xb6fc5228d6e0efa7000e926710475b4e0d256405': 2, // stefanocapri.eth
  '0x983C4dB2567d72FAE5dd43017cec57Cc81431C28': 2,
  '0x9b9A82b33c5545F0C7bdFd1d28628286b21719FC': 1,
  '0x55343534C739ad4aa93C67c6d9b8CB69982AD0D3': 1,
  '0x8036Ca28cf3cCb47e3ee9F293396471030174E87': 2,
  '0x042B65b17091fe3414078e5CE7Cf61d37Ac45444': 1,
  '0x9de5ae3b772bcf4661f8b307678a90668729c89e': 1, // ldub.eth
  '0x92B90E82720459ed0473C5Beb13337280B0eE6ee': 1,
  '0xaF4BdaF9C1Ef06E059A8f4c02C3468E364c932aC': 1,
  '0x0EE2D105c63e8c64D948220A161D09c0Efe08784': 1,
  '0x1dD0b5D0807887614631AB760582624a9EC9502f': 1,
  '0x4752512d1ad8b041c61916f41B32Dc62583E0fC6': 1,
  '0xf4a0a3c2121e6962bbf75fc43cdbeb341f7ef3a0': 5, // olawrites.eth
  '0xd331252da88b5918dE1d3253a79Dc859a524Efa5': 1,
  '0xdaa3254e3497a0b2e8f0d0962fc97a9468dd8169': 2, // jeffbzy.eth
  '0x4a1a0aeea2a03ed451b577f51f1d7e5568f29736': 1, // stu.eth
  '0x3581347Bd425D33a2776336DAF1E71EA4De95CA3': 1,
  '0xbaafaa49277f42029cc9e6aa947e84fc3e38d8d3': 1, // karlnft.eth
  '0xe3f01bf25fd0b64c9ea776d9b5d5c589b6277fd2': 1, // countmchristo.eth
  '0xdc221566c43cb2513869db4858db26c0625a17ca': 1, // jamessiegal.eth
  '0x17cE6FEC6EA92D7089d1CdA382548527b4831E8C': 2,
  '0x22D5D80Ab89055FD064CAe829Ac7969De5cCad8A': 5,
  '0x9e33078f3398be71da0e0fba182af22eea0ebb12': 1, // carllippert.eth
  '0xA89e3557245a6FDb5F151B3f02756F8d25af1278': 3,
  '0xb712abf3f5658aa6197d37bd5b60cb6c55ddd0ac': 1, // jeddjohnson.eth
  '0x4F9238694822866f66d445fBA013d0153c177Af9': 2,
  '0x446B636d7135bFD0350995d8800a014D316411FA': 2,
  '0x37Db750bd1642A4c7a9b53C9E0167D43c1f568f1': 5,
  '0x6A232FD686ED6b00Aed7d0Dd121F189079229d53': 1,
  '0xce1aac18ee472da6d90b68b6685df910046cb8ad': 1, // blissth3tic.eth
  '0x2b0E21d53c810f36f554652f52c4607d299a4d26': 5,
  '0x71dd2032c472b56B1A3Fc8672Cd598AcAd69cEaC': 1,
  '0xDcCa8E98dEC73AD25a1E5E38a9C96180bB20c979': 1,
  '0x36fbb8251b327255721d90083ae812920a7fb855': 1, // mdyouree.eth
  '0xAB40c1493FB48A1Cc66b992e53E6c3B8fD5327D3': 1,
  '0xec6d36a487d85cf562b7b8464ce8dc60637362ac': 1, // og.shrugs.eth
  '0x000cef8f0ab0a2fadbecaeb92e8781ab3e04b01e': 1, // deezcoinz.eth
  '0xE4bdD3209Ae808dF149011025bB29225Bb06C993': 5,
  '0x2d67c063c7b93e3ab5ebd2907dafce8c78a52798': 1, // bkatz.eth
  '0x265d105f4968cb02468904ee00c2ec62a9058fbd': 1, // dreher.eth
  '0x34bd8a7ae5369b71380b88157e01372182a10638': 1, // earthadam.eth
  '0xba5f2760348c82a897592e8a82f9430aebc01773': 2, // zoyayaseka.eth
  '0x8061c137db2c1a1906d7f22e4d57ab8e32f682c6': 1, // davidknapp.eth
  '0xa3520bcc02bcbb0ea16cb1faa2c8aace848a2348': 1, // tmccormick.eth
  '0xb41204cba1ee7a4e3a20a887c8d22d0858f9d7e7': 1, // sourpapi.eth
  '0xC55F7286EA9e9918B47415958d5bd9fb2b0cF968': 1,
  '0x162a9d145EA855BcE74036C6F9A926b911b4dcb9': 1,
  '0x3df76920c0423f88e2809913f20f888ce31feee6': 2, // joyhoward.eth
  '0x937a911c9724f4b1e56527570d1b1d53f31f540a': 2, // akaki.eth
  '0xa73c4c84486d2dfe4f53626e2bfd8831a3f76743': 1, // amzhen.eth
  '0x37db6edfa7a1002467f4f4d72acf5f3c2736afec': 2, // originalkan.eth
  '0x48CC092273e4016c1de3610CFF9a65F3A67D24A5': 1,
  '0xF914097A81CB7d9374AB44abf4E3b3855CC3b1D2': 1,
  '0xb4a5369BA168Ed6918b4f350d8c6402cF8b3132E': 1,
  '0xf3cf63256BEaaAC7a6c7057d468c8E11171AaE85': 2,
  '0x059e5e698db972c196f1ccbf1317d8070da77cd8': 1, // webnegade.eth
  '0x28240809fcf756F1398c415E14f616f2Ae32eF1D': 2,
  '0xB8C652e66e6F3fF5aA278C6662a745F80758A3EE': 2,
  '0xc8C6FFFe83980A664D35a53A145042c86fF30FF4': 1,
  '0xe2D35441Da7492d0F64fFe245aD72cbF51985cB5': 1,
  '0x3C25209FFbF0D9Aceaf14b29BccCaf4d2c87a17c': 1,
  '0x4251d77Efec4e1A3EFc8010594b1b3F118e8c05B': 1,
  '0xbab70d05b0caf7B538B5Cb04058c003edc73b250': 1,
  '0x46a987547467b8549841bb31e0de6da6696ED004': 1,
  '0x4a2a7739c2f424b4ef1e5e56ddba366f8f3dd3ef': 1, // michaelmccreesh.eth
  '0x6a14904f4ab888Cd716D6D35F779005832c2FA71': 1,
  '0x029ee42d381c9809493f34095235843625e46676': 1, // phillevin.eth
  '0x8c8eFB309597177E5A65E53466e788686809FC6e': 1,
  '0xF8B209A7c6423dEdFdCd21d2b5B226596A2590d0': 1,
  '0x912C0001Eb9112F6e4422E66947C5a5435ff45B9': 1,
  '0x3c1d6DEB260A173059e030Fa29D053545E7Bc821': 1,
  '0x21e3fbb00d498711276eb42fa0de0e017b93e633': 1, // dsgn4w3b.eth
  '0xa6af0566ef4ef7e8f38913f69d4e55c06f00a5ac': 1, // chaliceandco.eth
  '0x0d2637f4b304e4d2a86078eef60efcf4daf1168d': 1, // cutbank.eth
  '0x5Dd4FD919B207D6B67A63D135e37BBE5A1C2ab0d': 1,
  '0x465d793d86cf927279d4d8b82e06c266ba6f4796': 1, // ethanreeder.eth
  '0xB0308635713E031F2452BB0a8916b0687b0f4eD7': 1,
  '0xA3C34CFAeB859AD488630111dAab0bA737ac1F63': 1,
  '0xb55b87c78d6ee66945ab0e8fde47dd8c82ceb99c': 1, // spacemanrandy.eth
  '0x3df76920c0423f88e2809913f20f888ce31feee6': 2, // joyhoward.eth
  '0x9716ff369914c68dd10b7efe567ff0b212d6d90a': 2, // cascadeum.eth
  '0xB37C247485abeA5EE687f552A032188b4087D5BF': 2,
  '0x3C28f54869f8A6703a6F786092eFC64dd0C3958b': 1,
  '0xB2e698A1C34D2EB2652CFA31C7dC798aaaFcE8FB': 1,
  '0xfeE0a596e4766D32C25037eB472734aD5d612c03': 1,
  '0x52577f3E06c51f95fC3D3BB8915cA214b928E957': 1,
  '0xE5722C1b8E60a07ccaB62f5F6460587E383631da': 1,
  '0x99020fb6892365Ef2080732c84C11356f7124Dc7': 1,
  '0x65C8b76D126A00AB6D7Ac43d948F27606026F451': 1,
  '0xf9fe419edb56DCEdd39E266bb7FFC2c532d80d05': 1,
  '0xF6788E2D6C65eD7A81027F03a6576aF8462ACe96': 1,
  '0x8f03cE5F78276A1B714491B824e8F53Db36D8ec2': 1,
  '0x2166E4bf8526890aE1dC725c0269B099756a7cf7': 1,
  '0x46a3719d303ce537a75e1c031010be71697321e2': 1, // Cuvrr: Deployer
  '0x88882e661ed8cb398b21f1cf13651bd8b47a0588': 1, // mambodao.eth
  '0x263e67b7ca66d5cf97cb27715b746531e4ecb5cc': 1, // atkt.eth
  '0x72667877Cd49cfc405F96D70850Ba0922BD82e81': 1,
  '0x4dbc249cc12bb69dc4f2c1fdd0c68ff68de281f3': 1, // equify.dao
  '0xF804C2D62333F516205DB5D3CC8c73948f7147de': 1,
  '0x85D438Ef28b25f2bc4E30eBF1CF0Ec5B4e0a93aD': 2,
  '0x2908211E5De23d549244014aad4A96b775Fa6334': 1,
  '0x8F47754ca7b6955732fA28aDe68C3F73d420aF89': 1,
  '0x9Dc56c329292EE4150D4F68f462913b28e810Dd8': 1,
  '0x6ABEa88227d9dcA8E4C9cd846A6B61F577BcB848': 1,
  '0xf4dF3648CFC235c1af5E28E7366BBCcCa5E16627': 1,
  '0x38b86ECD3971EC1aB3f2d1a852F79a55Ed77Eb0c': 1,
  '0x197e24891edbfbe7aac820dd46885e87e9f1121b': 1, // makidoll.x
  '0x29d12114fF51f6C57b476e219EB8F612487dbA8a': 2,
  '0x0e4fc45a1E07bFA77B637E608d9E9BD21D9D7E83': 1,
  '0x97B72B168CD5D910F8fEC429D1Ce03C3a234901B': 1,
  '0x8eE3C110084d9523cDa304Ec9bF6DBd083d87A1e': 1,
  '0xa9915E38d314A808d24168a6d8a15fD21FC5E619': 2,
  '0x2f0Cbf92475082C1EE60053f44E11F516BC43934': 1,
  '0xB52110ab6F218bCe609F2eAE441dAaA019550B5F': 1,
  '0x96f9bE693E260477aEFc9621c9b79cf5E1bb1EBA': 2,
  '0x143E60b17FfDa6E878Af4A1CFf9d61CBAE3FEE29': 1,
  '0x006f3AFDfb6B67B306D48A641B7B769aA2071420': 1,
  '0x0a3bfd31570df77c243379606ef1fca7ddd2ec74': 1, // jsonp.eth
  '0x7bf173bF2132441eF5e0Fd6314746EaF889a62fC': 1,
  '0xe7Ff01Dac7ae259f06DF666E9bf8aB0fb103EB14': 2,
  '0x5C513e5c1e39EB93BeBDcDC51d38Daf80AaB171e': 1,
  '0x24DeCFa2754CEA952e6b3152497d40a6429D81f0': 1,
  '0x03Ae532C055D47318B18cEaBE73DC471b300A090': 1,
  '0x439158afe483b324f81d5ea62bdd7ed3e457e7c2': 1, // michaelkeating.eth
  '0x196CF15F92eFE7ac62384Da5b12895Faf006c4Cc': 1,
  '0x10bbad85b0d79f279edbb10b3db5444c2e222c80': 1, // billfuckingmurray.eth
  '0x595677072F8d64b1bcA6FF37D07b2605Ca68a315': 1,
  '0x042f7cdD30ab9dc024d68d77A91b57036728b75c': 1,
  '0xd92C463376EF809d4212A7D9502d0a42113c5940': 1,
  '0x73b8ce7E8E243F6D4E19f4a5cd942DEeFb6503d0': 1,
  '0xa869886d4d6767733E9EE0795861537ae9a2D1bE': 1,
  '0x24B899612dFC386e6A1bc30FD926406b6c42498E': 1,
  '0x04d3931d909aF1a1bB62D1DfAd8fE933daB374Ec': 2,
  '0xC9E7Fbc979415fbc6B6e2E42d8F62447f38Ac6F1': 1,
  '0xE446c19Cac9389e4F575ebBdE99F24F338E9fCA2': 1,
  '0x52b4Df7B53523084673284301F4A02559F1A13d5': 1,
  '0xE55a8A47E4fa55557A0CC2f535595BA4e5aEdD27': 1,
};

// Calculate statistics
function analyzeDistribution(walletCounts) {
  const uniqueWallets = Object.keys(walletCounts).length;
  const totalNFTs = Object.values(walletCounts).reduce((sum, count) => sum + count, 0);
  const avgNFTsPerWallet = totalNFTs / uniqueWallets;

  // Distribution breakdown
  const distribution = {};
  Object.values(walletCounts).forEach(count => {
    distribution[count] = (distribution[count] || 0) + 1;
  });

  return {
    uniqueWallets,
    totalNFTs,
    avgNFTsPerWallet,
    distribution
  };
}

const stats = analyzeDistribution(visibleWallets);

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║  KIFT NFT DISTRIBUTION ANALYSIS                   ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

console.log(`📊 From ledger data analysis (partial sample):`);
console.log(`   Visible unique wallets: ${stats.uniqueWallets}`);
console.log(`   Visible NFTs counted: ${stats.totalNFTs}`);
console.log(`   Average NFTs per wallet: ${stats.avgNFTsPerWallet.toFixed(2)}\n`);

console.log(`🔢 Based on your ~535 total NFTs:`);
const estimatedUniqueWallets = Math.round(535 / stats.avgNFTsPerWallet);
console.log(`   Estimated unique wallets: ~${estimatedUniqueWallets} wallets`);
console.log(`   Estimated avg per wallet: ~${(535 / estimatedUniqueWallets).toFixed(2)} NFTs\n`);

console.log(`📈 NFT Distribution Breakdown (from visible sample):`);
console.log(`   ─────────────────────────────────────`);
Object.keys(stats.distribution).sort((a, b) => parseInt(b) - parseInt(a)).forEach(nftCount => {
  const walletCount = stats.distribution[nftCount];
  const percentage = (walletCount / stats.uniqueWallets * 100).toFixed(1);
  console.log(`   ${nftCount} NFT${nftCount > 1 ? 's' : ' '}: ${walletCount.toString().padStart(3)} wallets (${percentage}%)`);
});

console.log('\n⛽ Gas Cost Estimates for Airdrop:');
console.log('   ─────────────────────────────────────');
console.log('   Based on test results:');
console.log('   - Average gas per airdrop: ~51,455 gas');
console.log('   - Etherscan 30-day data (Oct 2025):');
console.log('     • Typical range: 0.2-0.7 gwei');
console.log('     • Spike event: 15 gwei (single occurrence)');
console.log('');

// Calculate costs for different batch sizes and gas prices
const gasPerAddress = 51455;
const estimatedWallets = estimatedUniqueWallets;
const ethPriceUsd = 1800; // Approximate

// Gas price scenarios (in gwei) - based on Etherscan 30-day historical data
const gasPriceScenarios = [
  { gwei: 0.2, label: 'Low (30-day floor)' },
  { gwei: 0.5, label: 'Normal Low' },
  { gwei: 0.7, label: 'Normal High' },
  { gwei: 1, label: 'Elevated' },
  { gwei: 5, label: 'Minor Spike' },
  { gwei: 10, label: 'Moderate Spike' },
  { gwei: 20, label: 'Major Spike' }
];

console.log(`   For ~${estimatedWallets} wallets:\n`);

gasPriceScenarios.forEach(({ gwei, label }) => {
  const costPerAddressEth = (gasPerAddress * gwei) / 1e9;
  const totalGasEth = costPerAddressEth * estimatedWallets;
  const batchCosts = {
    '25': (gasPerAddress * 25 * gwei) / 1e9,
    '50': (gasPerAddress * 50 * gwei) / 1e9
  };

  console.log(`   ${label} (${gwei} gwei):`);
  console.log(`   - Per wallet: ${costPerAddressEth.toFixed(8)} ETH ($${(costPerAddressEth * ethPriceUsd).toFixed(4)})`);
  console.log(`   - Total cost: ${totalGasEth.toFixed(6)} ETH ($${(totalGasEth * ethPriceUsd).toFixed(2)})`);
  console.log(`   - Batch of 25: ${batchCosts['25'].toFixed(6)} ETH | Batch of 50: ${batchCosts['50'].toFixed(6)} ETH`);
  console.log('');
});

console.log(`   📦 Batch Processing Options:`);
console.log(`   - Batch size 10: ~${Math.ceil(estimatedWallets / 10)} transactions`);
console.log(`   - Batch size 25: ~${Math.ceil(estimatedWallets / 25)} transactions`);
console.log(`   - Batch size 50: ~${Math.ceil(estimatedWallets / 50)} transactions`);

console.log('\n💡 Recommendations:');
console.log('   ─────────────────────────────────────');
console.log('   1. Process in batches of 25-50 addresses');
console.log('   2. Monitor gas prices via Etherscan before execution');
console.log('   3. Budget recommendations (with 20% buffer):');
console.log('      • Conservative (10 gwei spike): ~' + ((gasPerAddress * estimatedWallets * 10) / 1e9 * 1.2).toFixed(4) + ' ETH ($' + ((gasPerAddress * estimatedWallets * 10) / 1e9 * 1.2 * ethPriceUsd).toFixed(2) + ')');
console.log('      • Typical execution (0.7 gwei): ~' + ((gasPerAddress * estimatedWallets * 0.7) / 1e9 * 1.2).toFixed(6) + ' ETH ($' + ((gasPerAddress * estimatedWallets * 0.7) / 1e9 * 1.2 * ethPriceUsd).toFixed(2) + ')');
console.log('      • Best case (0.2 gwei): ~' + ((gasPerAddress * estimatedWallets * 0.2) / 1e9 * 1.2).toFixed(6) + ' ETH ($' + ((gasPerAddress * estimatedWallets * 0.2) / 1e9 * 1.2 * ethPriceUsd).toFixed(2) + ')');
console.log('   4. Timing strategy:');
console.log('      • Target normal periods (0.2-0.7 gwei) - 99% of the time');
console.log('      • Pause execution if gas exceeds 1 gwei');
console.log('      • Avoid rare spike events (5+ gwei occurred once in 30 days)');
console.log('      • Weekend/early morning UTC often has lower fees');
console.log('   5. Non-reverting airdrop protects against DoS attacks');
console.log('   6. Failed transfers tracked in failedPayout mapping\n');

console.log('═══════════════════════════════════════════════════\n');

module.exports = { analyzeDistribution };
