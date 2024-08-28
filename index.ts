import express from 'express';
import type { Request, Response } from 'express';
require('dotenv').config();

import { BlobServiceClient } from '@azure/storage-blob';

const app = express();
const port = 5000;

// Conexión a Azure Blob Storage
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE!; ;
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerName = 'blobmultimedia';


app.get('/stream/', async (req: Request, res: Response) => {
  try {
    const blobName = 'mp4video.mp4';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);

    res.setHeader('Content-Type', 'video/mp4');


    const range = req.headers.range;
    if (range) {
      const start = parseInt(range.replace(/bytes=/, ""), 10);
      const end = Math.min(start + 1024 * 1024 - 1, downloadBlockBlobResponse.contentLength! - 1); // 1 MB chunks
      res.setHeader('Content-Range', `bytes ${start}-${end}/${downloadBlockBlobResponse.contentLength}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', end - start + 1);
      res.status(206);
      downloadBlockBlobResponse.readableStreamBody?.pipe(res);
    } else {
      res.setHeader('Content-Length', downloadBlockBlobResponse.contentLength ?? 0);
      downloadBlockBlobResponse.readableStreamBody?.pipe(res);
    }
  } catch (error) {
    console.error('Error al transmitir el archivo:', error);
    res.status(500).send('Error al transmitir el archivo');
  }
});

app.listen(port, () => {
  console.log(`Servidor de streaming en http://localhost:${port}`);
});