'use strict';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_BODY_SIZE = MAX_FILE_SIZE + 64 * 1024;

const newsImageUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  const match = contentType.match(/^multipart\/form-data\s*;\s*boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) return res.status(400).json({ success: false, message: 'Choose an image file to upload.' });
  const boundary = Buffer.from(`--${(match[1] || match[2]).trim()}`);
  const chunks = [];
  let length = 0;
  let finished = false;

  req.on('data', (chunk) => {
    if (finished) return;
    length += chunk.length;
    if (length > MAX_BODY_SIZE) {
      finished = true;
      res.status(413).json({ success: false, message: 'Image files must be 5 MB or smaller.' });
      req.resume();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (finished) return;
    try {
      const body = Buffer.concat(chunks, length);
      let offset = body.indexOf(boundary);
      if (offset !== 0) throw new Error('The image upload form is invalid.');
      offset += boundary.length;
      let image = null;
      let closed = false;
      while (offset < body.length) {
        if (body.subarray(offset, offset + 2).equals(Buffer.from('--'))) { closed = true; break; }
        if (!body.subarray(offset, offset + 2).equals(Buffer.from('\r\n'))) throw new Error('The image upload form is invalid.');
        offset += 2;
        const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), offset);
        if (headerEnd < 0) throw new Error('The image upload form is invalid.');
        const headers = Object.fromEntries(body.subarray(offset, headerEnd).toString('latin1').split('\r\n').map((line) => {
          const index = line.indexOf(':');
          return index < 0 ? ['', ''] : [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()];
        }).filter(([key]) => key));
        const disposition = headers['content-disposition'] || '';
        const name = disposition.match(/(?:^|;)\s*name="([^"]+)"/i)?.[1];
        const filename = disposition.match(/(?:^|;)\s*filename="([^"]*)"/i)?.[1];
        const start = headerEnd + 4;
        const nextBoundary = body.indexOf(Buffer.concat([Buffer.from('\r\n'), boundary]), start);
        if (nextBoundary < 0) throw new Error('The image upload form is incomplete.');
        const part = body.subarray(start, nextBoundary);
        if (filename !== undefined) {
          if (name !== 'image' || image || !filename) throw new Error('Upload exactly one image file.');
          if (!part.length) throw new Error('The image file is empty.');
          if (part.length > MAX_FILE_SIZE) {
            const error = new Error('Image files must be 5 MB or smaller.');
            error.statusCode = 413;
            throw error;
          }
          image = { buffer: part, claimedType: (headers['content-type'] || '').toLowerCase() };
        } else if (name !== 'image' || part.length) {
          throw new Error('The upload form contains unsupported fields.');
        }
        offset = nextBoundary + 2 + boundary.length;
      }
      if (!closed || !image) throw new Error('Choose an image file to upload.');
      req.newsImage = image;
      next();
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message || 'The image upload form is invalid.' });
    }
  });
  req.on('error', () => { if (!res.headersSent) res.status(400).json({ success: false, message: 'The image upload was interrupted.' }); });
};

module.exports = { newsImageUpload };
