<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- The NOVA app lives in src/nova and is rendered at `/`; navigation is in-app state, matching the original.
- CineStream API code (src/lib/cinestream.*, src/nova/cinestream*) stays unwired from Home until the CMS returns public JSON; Home uses built-in NOVA content so the app never shows an empty or broken screen.
- NOVA opens with the geometric-N StartupIntro (skippable, every launch), then the sample login and profile picker as overlays above Home; retain AuthProvider for existing profile consumers without granting guest users authenticated backend access.
- Phone OTP sessions live in service-role-only Cloud tables (users, otp_codes, sessions) accessed only from server functions; the browser never reads them directly.
- Catalog writes arrive through /api/public/ingest guarded by the INGEST_API_KEY header check; reads are public via RLS on published shows.
- Parental PIN entry is an isolated frontend dialog; enable the current-session toggle only after a complete PIN is confirmed, so cancelled setup cannot activate it.
- Keep profile insertion and trial offer rules in src/nova/profile-rules.ts with focused tests; shared values prevent presentation from diverging, and frontend plan selection must never imply payment authorization.
- Normalize device-local profile order on read and write through the shared profile rules, so selection and Profile show the same order even for older saved profiles.
- BannerWatchlist uses the player's existing per-title device-local watchlist keys so banner saves also appear on Profile and playback.
- Admin panel (/admin) uses Cloud email auth + user_roles 'admin'; every admin server function re-checks has_role before touching data, because the route guard only hides UI.
- Video storage is provider-independent: admin server functions (src/lib/media.functions.ts) talk only to the StorageAdapter registry in src/lib/storage/adapter.server.ts; providers plug in there, read credentials from project secrets, and the placeholder adapter refuses every storage operation so the UI never shows fake success.
- Video binaries never touch the database: media_assets, video_processing_jobs, video_subtitles and storage_providers hold metadata and private object keys only, and are admin-only via has_role RLS.
- Sample playback uses the shared ResumePlayer as a full-viewport portaled watch screen so Home and notification entry points keep the same controls and never inherit shell stacking or navigation. Preview watchlist, heart likes, and resume progress are device-local; downloads use the actual sample asset and sharing reopens the title through the Home query parameter without implying backend persistence.
- Related watch-screen titles use the browser-safe preview catalog with bundled artwork and genre matching; selecting one remounts playback by title so progress and actions never leak between titles. All preview titles use the uploaded sample until a real catalog is connected.
- TV/desktop apps hide phone-only sections via navItemsFor/PHONE_ONLY_NAV_IDS in src/nova/navigation.ts, so SideRail, BottomNav and App rendering stay in sync.
- TV/desktop apps skip guest welcome popups and show a required login gate (DesktopLogin without onClose, or SampleLogin on TV) before the app, so big-screen users always enter signed in.
