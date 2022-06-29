require('dotenv').config()
import express = require("express")
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { AvatarResolver, utils as avtUtils } from '@ensdomains/ens-avatar'
import { JSDOM } from 'jsdom'
import sharp from 'sharp';
import { Contract } from '@ethersproject/contracts';
import { NFTStorage, Blob } from 'nft.storage';

export const storage = new NFTStorage({ token: process.env.NFT_STORAGE_API_KEY || "" });

const jsdom = new JSDOM().window
const provider = new StaticJsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`)
const PORT = process.env.PORT

const app = express()
// https://www.larvalabs.com/blog/2021-8-18-18-0/on-chain-cryptopunks

app.get("/:handle", async (req, res) => {
  const { handle } = req.params
  if (!handle?.endsWith('.eth')) {
    return res.status(404).send("missing or invalid ens handle")
  }
  console.log(handle)
  const resolver = new AvatarResolver(provider, { ipfs: process.env.IPFS_GATEWAY })

  return resolver.getAvatar(handle, { jsdomWindow: jsdom }).then(async avatar => {
    console.log(Date.now(), "-> ", handle, "-> ", avatar)

    if (avatar?.startsWith("data:image/svg+xml;base64,")) {
      const svg = Buffer.from(avatar.substring(26), 'base64');
      const png = await sharp(svg).png().toBuffer()
      const imageCID = await storage.storeBlob(new Blob([png]))

      if (imageCID) {
        avatar = `${process.env.IPFS_GATEWAY}/ipfs/${imageCID}`
      }
    } else if (avatar?.startsWith("ar:")) {
      avatar = avatar.replace('ar://', 'https://arweave.net/')
    }

    return res.status(200).json(avatar?.replace('https://ipfs.io', process.env.IPFS_GATEWAY))
  }).catch(err => {
    console.log('error.resolver.getAvatar', handle, err)
    return res.status(500).send(err)
  })
})

app.listen(PORT, () => {
  console.log(`🦄 [server]: is running at ${PORT}`)
})