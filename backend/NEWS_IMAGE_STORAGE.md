# News image storage

Uploaded news images are served publicly because published news is public. The API accepts JPEG, PNG, and WebP files up to 5 MB and stores them under a random filename.

In development, files are stored in `backend/private/news-images` (ignored by Git). In production, set `NEWS_IMAGE_STORAGE_PATH` to an absolute, persistent directory. Keep it separate from private student and payment document storage. For multiple API replicas, mount the same directory on each replica and back it up with the site's public media assets.
