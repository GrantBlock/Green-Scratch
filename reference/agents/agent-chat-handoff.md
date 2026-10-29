# Handoff: Block Concepts Agent Chat → Website Embed

Paste or attach this file in the chat that is building the website. It describes what exists today, what has to change to run on a public site, and what needs a decision.

---

## 1. What exists today

A local-only chat app for three agents: **Pato** (Quoting), **Hukata** (Building), **Kosala** (Supporting).

| Piece | File | Notes |
|---|---|---|
| Backend | `server.py` (Flask) | Two routes: `GET /api/agents`, `POST /api/chat`. Serves the static frontend. |
| Prompt builder | `prompts.py` | Builds each agent's system prompt on every request from markdown docs in `../Block Concepts Vault/agents/` (Mandate + Personality from `0N-*.md`, Core Guardrails from `guardrails/<agent>-core.md`). Also holds agent metadata (name, stage, color, glyph, blurb). |
| Frontend | `static/index.html`, `app.js`, `style.css` | Vanilla JS, no build step. Dark theme, IBM Plex fonts (Google Fonts), sidebar of chats, agent gallery, chat view with a SWITCH control. |
| Model | Ollama, local | `llama3.2:3b` at `http://localhost:11434`, set in `.env` (`OLLAMA_MODEL`, `OLLAMA_HOST`). |
| Config | `.env`, `requirements.txt` | Python deps: `flask`, `requests`, `python-dotenv`. |
| Launcher | `Start Agent Chat.bat`, `Agent Chat.lnk` | Windows-only convenience. Not needed on a website. |

### API contract (what a website integration must preserve or replace)

- `GET /api/agents` → `[{key, name, stage, color, glyph, blurb}]`
- `POST /api/chat` with `{agent: "pato"|"hukata"|"kosala", history: [{role: "user"|"assistant", content}]}`
  - success → `{reply: string}`
  - failure → `{error: string}` with status 400 or 502
- Stateless: the full message history is sent on every call. The server stores nothing.
- No streaming. The server waits for the full reply (120 s timeout).

### Frontend behavior to carry over

- Several chats, each owned by one agent. The SWITCH buttons reassign the whole existing chat to a different agent persona.
- Chats are stored in the visitor's browser (`localStorage`, key `bc-agent-chats-v1`). Nothing is saved server-side.
- The frontend calls `/api/...` with relative URLs, so it assumes the page and the backend share an origin.

---

## 2. Requirements to run on a public website

### Must change

1. **Model hosting.** Ollama on this PC is not reachable from a public site, and a 3B model is weak at holding a persona. Use a hosted model API (Anthropic or similar), called from the server only. This is a cost decision: someone pays per message, and it was previously ruled out for personal use. See §4.
2. **API key handling.** The key lives in server environment variables only. Never in the page or the JS.
3. **Production server.** `app.run(debug=True)` is a dev server with the debugger exposed. Replace with a WSGI server (gunicorn on Linux, waitress on Windows) behind HTTPS on a real domain.
4. **Abuse protection.** The current app has none. A public endpoint that calls a paid model needs: per-IP rate limits, a daily spend cap, a max message length, a max history length (the full history is resent each call and grows token cost), and optionally a bot check (CAPTCHA/Turnstile).
5. **Prompt source.** `prompts.py` reads markdown from a sibling folder on this PC. The deployed server needs those files. Either copy them in at deploy time or move the extracted text into the deploy bundle. The "edit a doc and the agent changes" behavior then needs a sync or redeploy step.
6. **Responsive layout.** The sidebar is a fixed 290 px with one breakpoint at 720 px. It is not usable on phones as is. It needs a collapsible sidebar or a single-column mobile layout.
7. **Embedding method.** Pick one:
   - **iframe** of the app hosted at its own URL (fastest, least intrusive; needs `frame-ancestors`/`X-Frame-Options` set to allow the site).
   - **Widget** (a floating chat bubble loaded by one script tag; needs the frontend refactored to scope its CSS and avoid global styles).
   - **Native port** into the site's own framework (most work, best integration).
   If the site and the API are on different origins, add CORS rules or put both behind one reverse proxy.

### Should change

- **Streaming replies.** Required for good feel with a hosted model; currently the whole reply arrives at once.
- **Markdown rendering** in replies (currently plain text with `white-space: pre-wrap`).
- **Branding.** Match the site (Steel Blue brand). The fixed dark theme and IBM Plex fonts are from the reference design.
- **Logging.** Record conversations server-side, with notice to visitors, if you want to follow up on leads. Today nothing is logged.
- **Handoff to a human.** Pato collects quote details; there is no way to send them to a person (email/CRM/form). See §4.
- **Visitor notice.** A short "AI assistant, not a binding quote" line and a privacy statement.

---

## 3. Risks specific to this content

- **System prompts can leak.** Visitors can often coax a model into repeating its instructions. The prompts include internal material from the vault docs (stage boundaries, guardrails that reference the 60/30/10 billing milestones, Master Register, internal numbering). Review exactly what is included before exposing it, and strip anything internal from the public prompt.
- **Binding commitments.** Pato's role is quoting. A public agent must not state firm prices, lead times, or tax treatment. Guardrails in the prompt are not enforcement; a visitor can push past them. Add hard limits in code or in the page copy.
- **Wrong audience for two agents.** Hukata (building, schedule, change orders) and Kosala (support, warranty) were written for internal or post-sale use. Decide which agents are public. A customer-facing site may only want Pato plus a support entry point.
- **Model quality.** A small local model will drift out of character and ignore guardrails. Test the chosen hosted model against the guardrails list in `agents/guardrails/*-core.md` before launch.

---

## 4. Decisions needed from Grant before building

1. Which website platform and hosting (WordPress, Squarespace, custom, other)? This sets the embed method.
2. Which agents appear on the public site: all three, or Pato only?
3. Who pays for model usage, and what monthly cap is acceptable?
4. Where do collected quote details go (email to whom, CRM, form)?
5. Should visitors' chats be saved server-side, or stay only in their browser?
6. Does the vault-docs-edit-changes-the-agent workflow need to survive on the live site, or is redeploy on change fine?

---

## 5. Suggested build order for the website chat

1. Decide the answers in §4.
2. Move the model call to a hosted API, keeping the `/api/chat` contract above.
3. Add rate limits, length caps and a spend cap.
4. Write a public-safe version of each agent's system prompt.
5. Make the layout responsive and match site branding.
6. Embed (iframe first), add streaming, then lead handoff and logging.
7. Test against each agent's core guardrails with adversarial prompts before going live.
