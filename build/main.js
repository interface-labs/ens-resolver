"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express = require("express");
const providers_1 = require("@ethersproject/providers");
const ens_avatar_1 = require("@ensdomains/ens-avatar");
const jsdom_1 = require("jsdom");
const jsdom = new jsdom_1.JSDOM().window;
const provider = new providers_1.StaticJsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);
const app = express();
app.use("/:handle", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { handle } = req.params;
    if (!(handle === null || handle === void 0 ? void 0 : handle.endsWith('.eth'))) {
        return res.status(400).send("missing or invalid ens handle");
    }
    console.log(handle);
    const resolver = new ens_avatar_1.AvatarResolver(provider, { ipfs: process.env.IPFS_GATEWAY });
    return resolver.getAvatar(handle, { jsdomWindow: jsdom }).then(avatar => {
        console.log(handle, "->", avatar);
        return res.status(200).json(avatar);
    }).catch(err => {
        console.log('error.resolver.getAvatar');
        return res.status(500).send(err);
    });
}));
app.listen(process.env.APP_PORT, () => {
    console.log(`server is up and running at port: ${process.env.APP_PORT}`);
});
//# sourceMappingURL=main.js.map