require('dotenv').config()
import express = require("express")
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { AvatarResolver, utils as avtUtils } from '@ensdomains/ens-avatar'
import { JSDOM } from 'jsdom'

const jsdom = new JSDOM().window

const provider = new StaticJsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`)

const app = express()

// https://www.larvalabs.com/blog/2021-8-18-18-0/on-chain-cryptopunks

app.use("/:handle", async (req, res, next) => {
  const { handle } = req.params
  if (!handle?.endsWith('.eth')) {
    return res.status(400).send("missing or invalid ens handle")
  }
  console.log(handle)
  const resolver = new AvatarResolver(provider, { ipfs: process.env.IPFS_GATEWAY })

  return resolver.getAvatar(handle, { jsdomWindow: jsdom }).then(avatar => {
    console.log(handle, "->", avatar)
    return res.status(200).json(avatar)
  }).catch(err => {
    console.log('error.resolver.getAvatar')
    return res.status(500).send(err)
  })
})

app.listen(process.env.APP_PORT, () => {
  console.log(`server is up and running at port: ${process.env.APP_PORT}`)
})