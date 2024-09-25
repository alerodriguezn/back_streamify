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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require('dotenv').config();
const storage_blob_1 = require("@azure/storage-blob");
const app = (0, express_1.default)();
const port = 5000;
// Conexión a Azure Blob Storage
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE;
;
const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerName = 'blobmultimedia';
app.get('/stream/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const blobName = 'mp4video.mp4';
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const downloadBlockBlobResponse = yield blockBlobClient.download(0);
        res.setHeader('Content-Type', 'video/mp4');
        const range = req.headers.range;
        if (range) {
            const start = parseInt(range.replace(/bytes=/, ""), 10);
            const end = Math.min(start + 1024 * 1024 - 1, downloadBlockBlobResponse.contentLength - 1); // 1 MB chunks
            res.setHeader('Content-Range', `bytes ${start}-${end}/${downloadBlockBlobResponse.contentLength}`);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Length', end - start + 1);
            res.status(206);
            (_a = downloadBlockBlobResponse.readableStreamBody) === null || _a === void 0 ? void 0 : _a.pipe(res);
        }
        else {
            res.setHeader('Content-Length', (_b = downloadBlockBlobResponse.contentLength) !== null && _b !== void 0 ? _b : 0);
            (_c = downloadBlockBlobResponse.readableStreamBody) === null || _c === void 0 ? void 0 : _c.pipe(res);
        }
    }
    catch (error) {
        console.error('Error al transmitir el archivo:', error);
        res.status(500).send('Error al transmitir el archivo');
    }
}));
app.listen(port, () => {
    console.log(`Servidor de streaming en http://localhost:${port}`);
});
