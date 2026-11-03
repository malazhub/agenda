<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4dc31fa6-9cdd-4c0d-ab5b-3887c46d4985

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cloudflare data service

The public frontend remains on GitHub Pages. Account registration, Director access, and the session catalog use a separate Cloudflare Worker API; D1 stores account/session records and R2 is bound for session media. The Worker uses Cloudflare's native R2 binding, so the supplied S3-compatible endpoint is not needed by the app.

1. Authenticate Wrangler with the Cloudflare account. Create the D1 database with `npx wrangler d1 create agenda-db --config cloudflare/wrangler.toml` and the R2 bucket with `npx wrangler r2 bucket create agenda-session-media --config cloudflare/wrangler.toml`, then copy the generated D1 database ID into `cloudflare/wrangler.toml`. The Cloudflare account ID is configured there; do not add API tokens to the repository.
2. Set a random signing key of at least 32 characters as a Worker secret with `npx wrangler secret put SESSION_SIGNING_KEY --config cloudflare/wrangler.toml`.
3. Apply the schema with `npm run cloudflare:migrate`, then publish the API with `npm run cloudflare:deploy`.
4. Set `VITE_CLOUDFLARE_API_URL=http://localhost:8787` in `.env.local` for local development and `VITE_CLOUDFLARE_API_URL` to the deployed Worker URL in production. For Pages builds, add a GitHub Actions repository variable named `CLOUDFLARE_API_URL`. The Worker `ALLOWED_ORIGINS` list must include the app's origin.
5. To create the initial Director account, run `npm run cloudflare:bootstrap-director` in an interactive terminal. The script prompts for a username and masked password, then hashes the password before inserting the account. Re-running it for the same Director username replaces that account's password hash. For non-interactive use, set `DIRECTOR_USERNAME` and `DIRECTOR_PASSWORD` in the shell; clear both variables afterward.
6. Seed the 24 curated Khan Academy course resources per grade with `npm run cloudflare:seed-sessions`. The app randomly displays up to 20 stored sessions per grade. These are links to trusted course pages, not copies of third-party videos. Live entries can be added through the authenticated Director session API with a real HTTPS playback URL; the Live tab opens that URL directly.

Cloudflare credentials are not included. The initial D1 database ID, API URL, `SESSION_SIGNING_KEY`, Cloudflare authentication, and a live-video URL must be configured by the deployer.

For local development, set `SESSION_SIGNING_KEY` in the ignored `cloudflare/.dev.vars`, then run `npm run cloudflare:migrate:local`, `npm run cloudflare:seed-sessions -- --local`, and `npm run cloudflare:bootstrap-director -- --local` before starting `npm run cloudflare:dev`.
