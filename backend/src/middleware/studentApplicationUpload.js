'use strict';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_BODY_SIZE = MAX_FILE_SIZE + 64 * 1024;

const parsePartHeaders = (headerBuffer) => {
  const headers = {};
  for (const line of headerBuffer.toString('latin1').split('\r\n')) {
    const separator = line.indexOf(':');
    if (separator > 0) headers[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
  }
  return headers;
};

const studentApplicationUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/^multipart\/form-data\s*;\s*boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) return res.status(400).json({ success: false, message: 'Submit the application as a multipart form with a supporting document.' });
  const boundary = Buffer.from(`--${(boundaryMatch[1] || boundaryMatch[2]).trim()}`);
  if (boundary.length < 5 || boundary.length > 200) return res.status(400).json({ success: false, message: 'The form upload is invalid.' });

  const chunks = [];
  let length = 0;
  let finished = false;
  req.on('data', (chunk) => {
    if (finished) return;
    length += chunk.length;
    if (length > MAX_BODY_SIZE) {
      finished = true;
      res.status(413).json({ success: false, message: 'The supporting document must be 5 MB or smaller.' });
      req.resume();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (finished) return;
    try {
      const body = Buffer.concat(chunks, length);
      const fields = {};
      let file = null;
      let closed = false;
      let offset = body.indexOf(boundary);
      if (offset !== 0) throw new Error('Invalid multipart body.');
      offset += boundary.length;
      while (offset < body.length) {
        if (body.subarray(offset, offset + 2).equals(Buffer.from('--'))) {
          closed = true;
          break;
        }
        if (!body.subarray(offset, offset + 2).equals(Buffer.from('\r\n'))) throw new Error('Invalid multipart body.');
        offset += 2;
        const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), offset);
        if (headerEnd < 0) throw new Error('Invalid multipart headers.');
        const headers = parsePartHeaders(body.subarray(offset, headerEnd));
        const disposition = headers['content-disposition'] || '';
        const nameMatch = disposition.match(/(?:^|;)\s*name="([^"]+)"/i);
        const filenameMatch = disposition.match(/(?:^|;)\s*filename="([^"]*)"/i);
        if (!nameMatch) throw new Error('Invalid multipart field.');
        const name = nameMatch[1];
        const dataStart = headerEnd + 4;
        const nextBoundary = body.indexOf(Buffer.concat([Buffer.from('\r\n'), boundary]), dataStart);
        if (nextBoundary < 0) throw new Error('Incomplete multipart body.');
        const part = body.subarray(dataStart, nextBoundary);
        if (filenameMatch) {
          if (name !== 'proof_of_enrollment' || file) throw new Error('Upload exactly one proof of enrollment document.');
          if (!filenameMatch[1]) throw new Error('Choose a proof of enrollment file.');
          if (!part.length) throw new Error('Choose a non-empty proof of enrollment file.');
          if (part.length > MAX_FILE_SIZE) {
            const error = new Error('The supporting document must be 5 MB or smaller.');
            error.statusCode = 413;
            throw error;
          }
          file = { originalName: filenameMatch[1].split(/[\\/]/).pop(), claimedType: (headers['content-type'] || '').toLowerCase(), buffer: part };
        } else {
          if (Object.hasOwn(fields, name) || name === 'proof_of_enrollment') throw new Error('The form contains duplicate or invalid fields.');
          fields[name] = part.toString('utf8');
        }
        offset = nextBoundary + 2 + boundary.length;
      }
      if (!closed) throw new Error('Incomplete multipart form.');
      req.body = fields;
      req.studentDocument = file;
      next();
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message || 'The multipart form is invalid.' });
    }
  });
  req.on('error', () => { if (!res.headersSent) res.status(400).json({ success: false, message: 'The upload was interrupted.' }); });
};

module.exports = { studentApplicationUpload, MAX_FILE_SIZE };
