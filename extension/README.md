# TheraBee EHR Transfer — Chrome Extension

Transfers saved SOAP session notes from TheraBee into EHR systems. MVP supports **TherapyNotes**.

## Install (unpacked)

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this `extension/` folder.
3. Click the extension icon and sign in with your TheraBee account.

## Usage

1. Open a TherapyNotes progress-note page (a page with Subjective/Objective/Assessment/Plan fields).
2. Open the popup — the header shows whether the page is supported.
3. Select your EHR (saved as your default), a client, and a session note.
4. Review the note preview and click **Transfer**.
5. The extension fills the SOAP fields, validates insertion, and shows per-field results. A metadata-only transfer log is recorded.

## Safety behavior

- Fields are detected with confidence scoring (labels, names, ARIA attributes, nearby headings). If a field can't be confidently identified, **nothing is inserted into it**.
- The extension only runs on `*.therapynotes.com`.
- Transfer never happens without an explicit click.
- Logs store metadata only, never note content.

## Configuration

`popup.js` → `CONFIG`:

- `BACKEND_URL` — TheraBee backend (default: production Render URL; use `http://localhost:8000` for local dev).
- `APPWRITE_ENDPOINT` / `APPWRITE_PROJECT_ID` — Appwrite auth.
