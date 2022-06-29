require('dotenv').config()
import express = require("express")
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { AvatarResolver, utils as avtUtils } from '@ensdomains/ens-avatar'
import { JSDOM } from 'jsdom'
import sharp from 'sharp';
import { Contract } from '@ethersproject/contracts';
import { NFTStorage, Blob } from 'nft.storage';
import to from "await-to-js"

import PUNKS_ABI from './punks.json'

export const storage = new NFTStorage({ token: process.env.NFT_STORAGE_API_KEY || "" });

const PORT = process.env.PORT
const PUNKS_DATA_ADDRESS = '0x16F5A35647D6F03D5D3da7b35409D65ba03aF3B2'
const PUNKS_ADRRESS = '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB'

const jsdom = new JSDOM().window
const provider = new StaticJsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`)
const app = express()

export const isBase64 = (uri?: string): boolean => uri?.includes("data:image/svg+xml;base64,") ? true : false

export const storeBase64 = async (image?: string): Promise<string | undefined> => {
  if (!image) return undefined

  const svg = Buffer.from(image.substring(26), 'base64');
  const png = await sharp(svg).png().toBuffer()
  const imageCID = await storage.storeBlob(new Blob([png]))

  return `${process.env.IPFS_GATEWAY}/ipfs/${imageCID}`
}


export const isPunk = (uri?: string): boolean => uri?.toLowerCase().includes(PUNKS_ADRRESS.toLowerCase()) ? true : false

export const storePunk = async (uri?: string): Promise<string | undefined> => {
  if (!uri) return undefined
  const contract = new Contract(PUNKS_DATA_ADDRESS, PUNKS_ABI, provider)
  const splitted = uri.split('/')
  const punkId = splitted[splitted.length - 1]
  if (!punkId) return undefined
  const image = await contract.punkImageSvg(punkId)
  const svg = Buffer.from(image.substring(24), 'utf8');
  const png = await sharp(svg).png().toBuffer()
  const imageCID = await storage.storeBlob(new Blob([png]))

  return `${process.env.IPFS_GATEWAY}/ipfs/${imageCID}`
}

app.get("/:handle", async (req, res) => {
  const { handle } = req.params
  console.log('handle', handle)

  try {
    if (!handle?.endsWith('.eth' || 'xyz')) {
      return res.status(404).send("missing or invalid ens handle")
    }

    const resolver = new AvatarResolver(provider, { ipfs: process.env.IPFS_GATEWAY })
    const [err, avatar] = await to(resolver.getAvatar(handle, { jsdomWindow: jsdom }))

    if (err) {
      const [ensAddress, ensResolver] = await Promise.all([
        provider.resolveName(handle),
        provider.getResolver(handle),
      ]);

      if (!ensAddress || !ensResolver) {
        return res.status(404).send("no resolver found")
      }

      const ensAvatar = await ensResolver?.getText('avatar')
      console.log('ensAvatar', ensAvatar)
      if (!ensAvatar) {
        return res.status(404).send("no avatar found")
      }

      if (isBase64(ensAvatar)) {
        const [err, uri] = await to(storeBase64(ensAvatar))
        if (err) {
          return res.status(500).send(err)
        }
        return res.status(200).json(uri)
      } else if (isPunk(ensAvatar)) {
        const [err, uri] = await to(storePunk(ensAvatar))
        if (err) {
          return res.status(500).send(err)
        }
        return res.status(200).json(uri)
      } else if (typeof ensAvatar === 'string' && ensAvatar.startsWith("ar://")) {
        return res.status(200).json(ensAvatar.replace('ar://', 'https://arweave.net/'))
      } else {
        console.log(`unknown avatar format: ${ensAvatar}`)
        return res.status(404).json("unknown avatar format")
      }
    } else if (avatar) {
      if (isBase64(avatar)) {
        const [err, uri] = await to(storeBase64(avatar))
        if (err) {
          return res.status(500).send(err)
        }
        return res.status(200).json(uri)
      } else if (avatar?.startsWith("ar://")) {
        return res.status(200).json(avatar?.replace('ar://', 'https://arweave.net/'))
      } else if (isPunk(avatar)) {
        const [err, uri] = await to(storePunk(avatar))
        if (err) {
          return res.status(500).send(err)
        }
        return res.status(200).json(uri)
      } else {
        res.status(200).json(avatar?.replace('https://ipfs.io', process.env.IPFS_GATEWAY))
      }
    } else {
      return res.status(404).json("no avatar found")
    }

  } catch (err) {
    console.log('error', handle, err)
    return res.status(500).send(err)
  }
})

app.listen(PORT, () => {
  console.log(`🦄 [server]: is running at ${PORT}`)
})