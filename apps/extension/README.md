# Lever Autofill — browser extension

Fills job-application forms from your Lever resume profile. It **never submits** —
you review everything and click submit yourself.

## How it works
1. You're signed into the Lever web app in the same browser.
2. The extension popup calls the app's `/api/profile/export` (your session
   cookie authenticates it) and caches your default resume profile locally.
3. On any application page, **Autofill this page** maps your profile to the
   form fields (name, email, phone, links, location, and your saved answers).

## Load it (Chrome / Edge, unpacked)
1. Go to `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select this `apps/extension` folder.
3. Open the Lever app and sign in.
4. Click the extension icon → set the App URL (default `http://localhost:3000`)
   → **Sync my profile**.
5. Visit a job application page → **Autofill this page** → review → submit.

## Notes / limits
- Matching is heuristic; complex ATS forms (Workday multi-step, custom widgets)
  won't all fill perfectly — fill the rest manually.
- It only fills **empty** fields, so it won't clobber what you've typed.
- For production, add your deployed app origin to `host_permissions` in
  `manifest.json`.
