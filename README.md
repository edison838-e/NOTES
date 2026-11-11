# NOTES — public writing space

A minimalist, black-and-white public notes website. Visitors can read; only the person with the admin password can edit. Notes are stored on the server and saved automatically. The admin can set a direct audio-file URL for background music.

## Run locally

1. Install Node.js 18 or newer.
2. In this folder, run `npm install`.
3. Set two environment variables:
   - `ADMIN_PASSWORD`: your private editing password.
   - `SESSION_SECRET`: a long random secret (at least 32 random characters).
4. Run `npm start`.
5. Open `http://localhost:3000`.

Example (macOS/Linux):
```bash
ADMIN_PASSWORD='choose-a-strong-password' SESSION_SECRET='replace-with-a-long-random-secret' npm start
```

## Put it online

Deploy this folder as a Node web service on a host that supports a **persistent disk**. Set:
- `ADMIN_PASSWORD` to a strong password that you do not use elsewhere.
- `SESSION_SECRET` to a long random secret.
- `NODE_ENV` to `production`.
- `DATA_DIR` to the host's persistent-disk mount path (for example `/var/data`).

The app listens on the `PORT` supplied by the host. Attach a persistent disk to the service and set `DATA_DIR` to its mount path; otherwise notes may be lost when the service is redeployed or restarted.

Use HTTPS. Do not share your admin password. The site is public: anyone with its address can read the notes.

## Add music

Unlock editing with your password, click the play control, and paste a **direct URL** to an MP3 or other browser-playable audio file. A normal YouTube/Spotify page link is not a direct audio file and will not work. Browsers require visitors to press Play before audio starts.

## Important

- This starter site stores notes in a JSON file on the server. Use one running app instance with a persistent disk.
- Editing access is password-protected. Public visitors can read all published notes.
- Back up the `data/site.json` file periodically.
