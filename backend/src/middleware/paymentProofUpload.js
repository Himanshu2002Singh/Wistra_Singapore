'use strict';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_BODY_SIZE = MAX_FILE_SIZE + 64 * 1024;

const mimeFromBytes = (buffer) => {
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  return null;
};

const parseHeaders = (buffer) => Object.fromEntries(buffer.toString('latin1').split('\r\n').flatMap((line) => {
  const i = line.indexOf(':'); return i > 0 ? [[line.slice(0, i).trim().toLowerCase(), line.slice(i + 1).trim()]] : [];
}));

const paymentProofUpload = (req, res, next) => {
  const match = String(req.headers['content-type'] || '').match(/^multipart\/form-data\s*;\s*boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) return res.status(400).json({ success: false, message: 'Submit payment proof as a multipart form with one supporting file.' });
  const boundary = Buffer.from(`--${(match[1] || match[2]).trim()}`);
  if (boundary.length < 5 || boundary.length > 200) return res.status(400).json({ success: false, message: 'The upload form is invalid.' });
  const chunks = []; let length = 0; let finished = false;
  req.on('data', (chunk) => {
    if (finished) return;
    length += chunk.length;
    if (length > MAX_BODY_SIZE) { finished = true; res.status(413).json({ success: false, message: 'Payment proof must be 5 MB or smaller.' }); req.resume(); return; }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (finished) return;
    try {
      const body = Buffer.concat(chunks, length); const fields = {}; let proof = null; let offset = body.indexOf(boundary);
      if (offset !== 0) throw new Error('Invalid multipart body.');
      offset += boundary.length;
      while (offset < body.length) {
        if (body.subarray(offset, offset + 2).equals(Buffer.from('--'))) break;
        if (!body.subarray(offset, offset + 2).equals(Buffer.from('\r\n'))) throw new Error('Invalid multipart body.');
        offset += 2;
        const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), offset);
        if (headerEnd < 0) throw new Error('Invalid multipart headers.');
        const headers = parseHeaders(body.subarray(offset, headerEnd));
        const disposition = headers['content-disposition'] || '';
        const fieldName = disposition.match(/(?:^|;)\s*name="([^"]+)"/i)?.[1];
        const filename = disposition.match(/(?:^|;)\s*filename="([^"]*)"/i)?.[1];
        if (!fieldName) throw new Error('Invalid multipart field.');
        const start = headerEnd + 4; const end = body.indexOf(Buffer.concat([Buffer.from('\r\n'), boundary]), start);
        if (end < 0) throw new Error('Incomplete multipart form.');
        const data = body.subarray(start, end);
        if (filename !== undefined) {
          if (fieldName !== 'proof' || proof) throw new Error('Upload exactly one payment proof file.');
          if (!filename || !data.length || data.length > MAX_FILE_SIZE) throw new Error('Choose a non-empty proof file up to 5 MB.');
          const mime = mimeFromBytes(data);
          if (!mime || (headers['content-type'] && headers['content-type'] !== mime && !(mime === 'image/jpeg' && headers['content-type'] === 'image/pjpeg'))) throw new Error('Upload a valid PDF, JPEG, or PNG proof file.');
          proof = { buffer: data, mime, originalName: filename.split(/[\\/]/).pop() };
        } else {
          if (Object.hasOwn(fields, fieldName) || fieldName === 'proof') throw new Error('The form contains duplicate or invalid fields.');
          fields[fieldName] = data.toString('utf8');
        }
        offset = end + 2 + boundary.length;
      }
      if (!proof) throw new Error('Upload a payment proof file.');
      req.body = fields; req.paymentProof = proof; next();
    } catch (error) { res.status(error.statusCode || 400).json({ success: false, message: error.message || 'The upload form is invalid.' }); }
  });
  req.on('error', () => { if (!res.headersSent) res.status(400).json({ success: false, message: 'The upload was interrupted.' }); });
};

module.exports = { paymentProofUpload };
