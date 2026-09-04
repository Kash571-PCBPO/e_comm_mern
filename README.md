# MERN E-Commerce Application

Full-stack folder structure scaffold (feature-based frontend, module-based backend MVC).

## Structure
- frontend/  -> React (Vite) client, feature-based folders
- backend/   -> Node.js + Express + MongoDB (Mongoose), module-based MVC

## Backend quick start
1. cd backend
2. npm install
3. Update .env with your real MONGO_URI (a local MongoDB or MongoDB Atlas connection string)
4. npm run dev
5. Check http://localhost:5000/api/health
6. Test the DB connection via the CRUD endpoints under /api/test (see backend/src/modules/test)

## DB Connection Test (CRUD)
Base URL: /api/test
- POST   /api/test        { "message": "hello" }
- GET    /api/test
- GET    /api/test/:id
- PUT    /api/test/:id    { "message": "updated" }
- DELETE /api/test/:id

A successful POST + GET confirms the app can read/write to MongoDB.

## CI/CD (GitHub Actions)

Pipeline: `.github/workflows/ci-cd.yml` — one workflow, three environments.

**Flow**: every push/PR runs tests -> on push (not PR), one backend image and one
frontend image get built ONCE and pushed to GHCR, tagged with the commit SHA
-> the SAME images get deployed to whichever environment matches the branch/tag:
- push to `dev` -> deploys to the `dev` environment automatically
- push to `qa` -> deploys to the `qa` environment (add a required reviewer so it pauses for approval)
- push a tag like `v1.2.0` -> deploys to `production` (add a required reviewer here too)

### One-time setup in GitHub
1. Repo Settings -> Environments -> create `dev`, `qa`, `production`.
2. On `qa` and `production`: enable "Required reviewers" and add yourself/your team.
3. On each environment, add:
   - Secret `MONGO_URI` (that environment's real MongoDB connection string)
   - Variable `API_BASE_URL` (that environment's browser-reachable API URL)
   - Variable `APP_URL` (optional — shown as a link on the deployment)
4. Create a `qa` branch if you don't have one yet: `git checkout -b qa && git push -u origin qa`.
5. Enable GitHub Container Registry: no action needed — `GITHUB_TOKEN` already has
   `packages: write` via the `permissions:` block in the workflow.

### Why one workflow file instead of three
Three separate pipelines mean three copies of the same build logic to keep in
sync, and no shared guarantee that qa is testing the exact bytes that will
reach production. One workflow with branch/tag-gated jobs, each pointing at
its own GitHub Environment, gives you: a single source of truth for the
pipeline, environment-scoped secrets/approvals without duplicating YAML, and
a guarantee that "dev", "qa", and "production" always refer to the same built
artifact at different stages of promotion — never three different builds.

### Fill in the actual deploy step
The `run:` lines under each `deploy-*` job are placeholders. Replace with
whatever matches your hosting (SSH + `docker compose pull && up -d`, a
Kubernetes `kubectl set image`, or a managed platform's deploy CLI/action).
