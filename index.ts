import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
require('dotenv').config();

import { BlobServiceClient } from '@azure/storage-blob';

const app = express();
const port = 5000;

app.use(cors(
  {
    origin: '*',
    methods: 'GET',
    allowedHeaders: 'Content-Type, Range',
  }
));

// Conexión a Azure Blob Storage
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE!;
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerName = 'blobmultimedia';

app.get('/stream/:blobName', async (req: Request, res: Response) => {
  try {

    const blobName = req.params.blobName; 
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const contentLength = downloadBlockBlobResponse.contentLength!;

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : contentLength - 1;


      if (start >= contentLength || end >= contentLength) {
        res.status(416).setHeader('Content-Range', `bytes */${contentLength}`);
        return res.end();
      }

      const chunkSize = (end - start) + 1;
      res.status(206).setHeader('Content-Range', `bytes ${start}-${end}/${contentLength}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', 'video/mp4');

      // Descargar la parte solicitada del blob
      const partialDownloadResponse = await blockBlobClient.download(start, chunkSize);
      partialDownloadResponse.readableStreamBody?.pipe(res);
    } else {
      // Si no hay encabezado Range, transmitir el archivo completo
      res.setHeader('Content-Length', contentLength);
      res.setHeader('Content-Type', 'video/mp4');
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