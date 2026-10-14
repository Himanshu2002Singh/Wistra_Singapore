# Student document storage

Student proof-of-enrollment files are stored outside the frontend and are never served as static files. The API assigns random storage keys, checks the PDF/JPEG/PNG file signature, limits files to 5 MB, and serves them as downloads only after the caller passes the existing application read permission check.

For production, set `STUDENT_DOCUMENT_STORAGE_PATH` to an absolute, private, persistent directory readable and writable by the API process. Keep it outside any web server document root and back it up using the organization's private-data retention policy. For multiple API replicas, mount the same protected persistent volume on each replica. The default development path is `backend/private/student-documents` and is ignored by Git.

The current repository has no private object-storage integration. A managed private object store can replace this filesystem adapter later, but requires a storage provider, bucket, credentials, and retention settings from the deployment owner.
