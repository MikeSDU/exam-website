# Accounting Exam Lab — GitHub + Render + Gemini

English-language accounting analytics practice with 41 source-based exercises, timed mock exams, instant SQL/numerical checks, and explained indicative Danish practice grades.

**GitHub stores the code. Render runs the website and backend. Gemini grades answers.** Your Gemini key is entered only into Render's private environment settings. Students do not enter or receive the key. GitHub Pages is not needed for this version.

## 1. Upload to GitHub

1. Extract `Accounting_Exam_Lab_GitHub.zip` on your computer.
2. Create an empty GitHub repository, for example `accounting-exam-lab`.
3. Upload the **extracted files and folders**, not the ZIP itself. At the repository's top level you must see:

| File/folder | Purpose |
| --- | --- |
| `package.json` and `package-lock.json` | Node app and startup/test commands |
| `server.cjs` | Render HTTP server |
| `render.yaml` | Render deployment configuration |
| `server/` | Grading queue, quota controls and SQL verification |
| `dist/` | Website, question bank, original datasets and SQLite engine |
| `tests/` | Automated verification |
| `scripts/` | Rebuild the question bank from course materials |
| `README.md`, `START_HERE.md`, `SUBMISSION.md` | Setup and assignment notes |
| `.github/` | Optional automated GitHub checks |
| `.gitignore`, `.env.example` | Ignore rules and empty example configuration |

Do not put everything inside an extra enclosing folder in the repository. **Never put your real API key in a source file, `.env.example`, a GitHub issue or a commit.** The empty example file is safe to upload; a real `.env` file is ignored and must remain private.

## 2. Create the Render Web Service

Simple dashboard setup:

1. Sign in to Render and select **New → Web Service**.
2. Connect GitHub and choose your new repository.
3. Use these settings:

| Render setting | Value |
| --- | --- |
| Language/runtime | Node |
| Branch | `main` (or your repository's actual branch) |
| Root directory | Leave blank |
| Build command | `npm ci --omit=dev` |
| Start command | `npm start` |
| Instance type | Free |
| Health check path | `/healthz` |

4. Add the environment variables below before deploying.
5. Click **Deploy Web Service**. Render provides your public `https://…onrender.com` website URL.

Alternatively, select **New → Blueprint**, connect the repository and use the included `render.yaml`. It defines the free plan and prompts for `GEMINI_API_KEY` using `sync: false`; there is no key in the YAML. You only need **one** Web Service: it serves the pages, assets and API together.

## 3. Environment variables in Render

| Key | Value |
| --- | --- |
| `GEMINI_API_KEY` | Paste your actual Gemini API key here, privately |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
| `REQUEST_COOLDOWN_SECONDS` | `60` |
| `DAILY_REQUEST_LIMIT` | `20` |
| `MAX_QUEUE_LENGTH` | `2` |
| `MAX_PROVIDER_RETRIES` | `2` |
| `NODE_VERSION` | `22` |

Only the API key is essential; other values have defaults. These conservative request limits are **app settings**, not claims about Google's actual free quotas. Check your project limits in Google AI Studio. You can adjust the model and limits in Render without editing source. Other models checked in Google's current documentation are `gemini-3.8-flash` for stronger reasoning and `gemini-3.1-flash-lite` as an efficient alternative; access remains project-specific. The site never automatically switches to a paid-only model.

There is no API key input in the website. Visitors see grading status and a shared countdown instead. Requests go from the browser to the same Render service, then from Render to Google. No cross-origin frontend/backend configuration is required.

## 4. Check the deployed site

1. Open the Render URL and browse the question bank.
2. Open **Grading status**. It should show a configured service and the selected model. Startup includes a conservative 60-second cooldown.
3. Try P05 with `68`: local instant checks should work without using Gemini.
4. Try a written question such as E01 with a formula and explanation, then request Gemini grading. Watch the job status and review criterion marks.
5. Submit the Render URL and GitHub repository URL for the assignment; complete the placeholders in `SUBMISSION.md`.

If the status says setup is pending, add `GEMINI_API_KEY` to the Web Service's **Environment** settings and save/redeploy. If Google rejects the key or model, verify API permissions and model availability in AI Studio. The key is used only on the server and is never returned by the status API, included in frontend files, or written to app logs.

## How the request protection works

- One provider request at a time for the whole service, across all visitors.
- At least 60 seconds between provider attempts by default, with a visible countdown.
- At most two additional queued jobs by default. A full queue returns a retry message rather than overloading Gemini.
- One request assesses the whole attempt, up to eight questions and 3,500 characters per answer.
- A shared daily attempt cap; every actual provider attempt, including failed attempts and retries, consumes one count.
- Temporary Google HTTP 429 responses respect Retry-After/RetryInfo and receive at most two bounded retries with extended cooldowns. Daily/zero-quota errors are not retried.
- Each provider request times out after 90 seconds. The browser polls a job endpoint, avoiding a long open HTTP request. Cancelling aborts an active request when possible and preserves the draft.
- Identical validated assessments are cached server-side for up to 30 minutes (20 entries). Fully correct SQL/numerical-only attempts and blank answers can be assessed without any Gemini call.
- Only known server-side questions and marking guides are used. Clients cannot replace references, criteria, model IDs or verified evidence.
- SQL is checked again on the server in a disposable read-only worker with an eight-second timeout. Submitted browser check results are not trusted as grading evidence.
- Malformed/truncated model output never becomes a grade. Blank answers are always zero and demonstrably correct results get full criterion marks.

**Free Render limitations:** the service sleeps after 15 minutes without traffic; the first visit can take about a minute to start. Local files are ephemeral across sleeps, redeploys and host restarts. The service saves quota state to a local file so it can survive a process restart on the same filesystem, but **free Render cannot guarantee daily counter persistence**. Google remains the authority for the project-wide quota, including other apps using that project. A startup cooldown reduces restart bursts. For strict durable app quotas, use a persistent storage service or a paid disk and set `QUOTA_STATE_FILE` to that mount; no paid service is required by this package. Deploy only one instance unless you replace local quota/queue storage with a shared durable store.

## Data, privacy and grades

41 questions cover 18 SQL, 8 Excel/ETL, 8 payroll/audit and 7 regression tasks. Source downloads and assumptions are shown in the app. Songs and Chinook use the original course databases. Movies and optional Fiftyville are not included in this initial bank. P-card practice uses instructions and self-contained policy scenarios. Restaurant outputs are computed from the original workbook, not invented coefficients.

Drafts and the last 30 reports remain in browser storage. The server holds submitted grading jobs and results temporarily in memory (normally at most 30 minutes after completion, bounded to 100 job records) and does not log answers or save them to its quota-state file. Queued jobs can remain until a cooldown ends; cancellation removes them from the queue. The server sends only selected questions, relevant model output, references, criteria, submitted answers and verified-check evidence to Google. Google's free-tier data terms apply. Do not enter confidential workplace data. Google Fonts may load; system font fallbacks are provided.

Each question is worth 10 marks. Criterion marks are validated in code before calculating the displayed grade. Practice convention: 90%→12, 75%→10, 60%→7, 45%→4, 30%→02, >0%→00 and 0%→−3. **These are our illustrative thresholds, not official Danish percentage boundaries or the teacher's rubric.** Typed answers and AI judgements do not replace an oral examination. Instant-only reports leave written answers unassessed and withhold a whole-attempt grade if coverage is incomplete.

## Development and tests

Node 22 or newer (below 25); no npm runtime dependencies are required. sql.js 1.15.1 is vendored under its MIT license.

```bash
npm ci
npm test
npm start
```

For a local API key, create an ignored `.env` file from the empty `.env.example`, fill it privately, and run `node --env-file=.env server.cjs`. Open `http://localhost:3000`. Without a key, all course content and local checks still work. Do not use a static-only file server for this version's Gemini integration.

Tests cover all reference SQL queries, files, score conversion, validation, server-only secrets, canonical references, concurrent visitors, cooldowns, queue bounds, 429 backoff, daily caps, cancellation/access tokens, truncated responses, local-state restart behaviour and HTTP serving. A development DOM simulation also checks frontend interactions using mocked Render responses:

```bash
npm install --prefix /tmp/ael-qa jsdom
NODE_PATH=/tmp/ael-qa/node_modules node tests/dom-integration.cjs
```

Live Gemini and live Render deployment require the owner's service/key and were not exercised during package preparation. Browser visual QA was unavailable in the build environment.

To rebuild the question bank from the extracted course materials, install Python pandas/numpy/scipy/openpyxl and run `python scripts/build_content.py /path/to/materials`. Restaurant models use daily summed `netTotal`, date joins to weather and games, absent games coded zero assuming the list is complete, and conventional OLS standard errors. The app shows n=312 for the basic model and avoids causal claims.

## Official setup references

- https://render.com/docs/deploy-node-express-app (the same Web Service build/start setup applies to this native Node server)
- https://render.com/docs/configure-environment-variables
- https://render.com/docs/blueprint-spec
- https://render.com/docs/free
- https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits
