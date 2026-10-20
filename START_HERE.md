# Start here: GitHub → Render → Gemini

1. Extract the ZIP. Create an empty GitHub repository and upload the extracted **contents**. `package.json`, `server.cjs`, `render.yaml` and `dist` must be visible at the repository's top level.
2. In Render, select **New → Web Service**, connect GitHub and select that repository.
3. Choose **Node**, **Free**, leave **Root Directory blank**, use build command **`npm ci --omit=dev`** and start command **`npm start`**.
4. In Render's **Environment** section add:

| Name | Value |
| --- | --- |
| `GEMINI_API_KEY` | Your real key — enter it privately in Render |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
| `REQUEST_COOLDOWN_SECONDS` | `60` |
| `DAILY_REQUEST_LIMIT` | `20` |
| `NODE_VERSION` | `22` |

5. Deploy. Render will provide the public website URL.
6. Open **Grading status** on the website. Wait for the initial cooldown, then try a written-answer grading request.

**Do not upload the ZIP itself or your real key to GitHub. No GitHub Pages setup is needed.**

Use the new Render-ready package instead of the previous static-only version. Full instructions and limitations are in `README.md`. The `SUBMISSION.md` file contains draft paragraphs for your assignment.
