# M1 KlimaChat: full-screen conversational interface with Amazon Quick stand-in

The change implements the M1 KlimaChat module: a full-screen chat UI (`ChatWidget`) seeded with the Filipino greeting, user/agent message bubbles, a single suggestion chip under the latest agent message, a three-dot typing indicator, and a POST Route Handler at `/api/chat` that stands in for the Amazon Quick agent with deterministic Filipino-persona replies. Chat types (`MessageRole`, `IMessage`, `IMessageEmbed`, `ISuggestion`, `IChatResponse`) are centralized in `src/types/index.ts`, and the home page is reduced to rendering `<ChatWidget />`. The embedding path (weather/alert/crop inline cards) is wired end-to-end with placeholder cards so later modules can slot in real components without touching the message pipeline. Watch for: the Amazon Quick integration is an explicitly-marked TODO stub (confirmed, by design for M1); two files carry a private helper sub-component alongside the exported one (confirmed, minor vs. the "one component per file" rule); no automated tests exist (confirmed, no runner configured).

**Verdict**: APPROVED

## High-level view

The design keeps all chat state local to `ChatWidget` via `useState` (messages, the single active suggestion, input text, loading flag) and talks to the server only through `fetch("/api/chat")`. The "One Action" principle is enforced structurally: there is a single `suggestion` slot, cleared the moment a message is sent and repopulated only from the server reply, so more than one chip can never render.

The API surface is a single named `POST` handler returning `IChatResponse` (`reply`, optional `suggestion`, optional `embed`). The Amazon Quick agent is not wired; `buildReply` returns canned Filipino replies and the handler is marked with a TODO pointing at where the real server-side Quick call goes. No secret or env var is read, so nothing server-only leaks to the client — appropriate for a stub, and the comment correctly flags that the eventual key stays server-side.

Both exact-match strings (greeting and error) are correct, and the error string is duplicated in two places (client `ERROR_MESSAGE` and server `FALLBACK_MESSAGE`) that must stay in sync. The error path is well-formed: a non-OK response or network throw surfaces the Filipino fallback as an agent bubble rather than crashing.

Styling stays within Tailwind v4 utilities and the brand tokens (navy panel, teal agent bubbles, white user bubbles, Alert Red reserved for emergency embeds). The typing animation is defined as a theme keyframe in `globals.css` rather than an inline style, and the existing `prefers-color-scheme` dark block is left intact.

<details>
<summary>Issues (2)</summary>

1. **Multi-component files** — `MessageBubble.tsx` (`EmbedCard` + `MessageBubble`) and `ChatWidget.tsx` (`TypingIndicator` + `ChatWidget`) each define a private helper component alongside the exported one, which bends the project's "one component per file" rule. Non-blocking; the helpers are unexported and local. Consider extracting if they grow.
2. **Duplicated error string** — the exact Filipino error text lives in both `ChatWidget` (`ERROR_MESSAGE`) and `route.ts` (`FALLBACK_MESSAGE`). Non-blocking, but a shared constant would prevent drift.

</details>

<details>
<summary>Details</summary>

## Single-suggestion enforcement and the "One Action" principle

The one-chip-at-a-time requirement is met structurally rather than by filtering a list. `ChatWidget` holds a single `suggestion: ISuggestion | undefined`. On send it is set to `undefined`, and it is repopulated only from `data.suggestion` on a successful reply. The chip renders only when `!isLoading && suggestion`, below the latest agent message. Because there is one slot, the UI cannot show two chips. Clicking the chip calls `handleSuggestionSelect`, which routes the chip label through the same `sendMessage` path as typed input, so a chip tap becomes a real user message bubble.

## Chat request/response contract and the Amazon Quick stub

The client POSTs `{ message }` and expects `IChatResponse` (`reply`, optional `suggestion`, optional `embed`). The server reads the body as `Partial<IChatRequestBody>` and coerces a missing/non-string `message` to `""` rather than trusting the shape, guarding malformed input without reaching for `any`.

`buildReply` is a deterministic stub returning canned Filipino replies. The real Amazon Quick call is an explicit `TODO(Amazon Quick)` noting it must run server-side so no key is exposed. The integration is deferred past M1 — nothing in this change reads a secret or env var, so there is no client exposure to flag yet, but the eventual wiring is where that risk lands.

## Error handling and the duplicated fallback string

The client treats a non-OK HTTP status as a throw and the `catch` appends the Filipino error message as an agent bubble, so both network failure and a 500 surface the same user-facing text. The server's own `catch` returns `{ reply: FALLBACK_MESSAGE }` with status 500, which the client then overrides with its own identical `ERROR_MESSAGE`. The behavior is correct, but the exact string is maintained in two places; a shared constant would remove the drift risk.

## Embedding path and emergency styling

`IMessageEmbed` is a discriminated union over `weather | alert | crop`, and `EmbedCard` switches on `kind`. The alert branch applies Alert Red (`#E53E3E`) only when `severity === "emergency"`, keeping that color reserved for emergencies per the design tokens, and every card renders `Pinagmulan:` source attribution — the weather-data attribution rule holds even in the stub.

## Verification evidence

`.agents/tasks/m1-verification.md` records `npm run lint` passing (exit 0, no errors/warnings) and `npm run build` passing under Next.js 16.3.8 with strict TypeScript and no type errors, including the `ƒ /api/chat` POST handler and static `/` route. Per instructions these suites were not re-run. The note correctly discloses that no runtime/visual check was done and no test runner is configured (no tests added). The `LayoutProps<"/">` global type in `layout.tsx` is pre-existing scaffold (the diff only changed `metadata` text), and the passing build confirms it type-checks under Next 16.

</details>

<details>
<summary>File map</summary>

- `src/types/index.ts` — chat types: `MessageRole`, `IMessage`, discriminated `IMessageEmbed` (weather/alert/crop) with embed data interfaces, `ISuggestion`, `IChatResponse`.
- `src/app/api/chat/route.ts` — named `POST` Route Handler; try/catch with Filipino 500 fallback; deterministic Filipino `buildReply` stub with a TODO for the server-side Amazon Quick call.
- `src/components/chat/MessageBubble.tsx` — exported `IMessageBubbleProps`; user=white/right, agent=teal/left; private `EmbedCard` placeholder with source attribution and emergency Alert Red.
- `src/components/chat/SuggestionChip.tsx` — exported `ISuggestionChipProps`; teal pill `<button>` with focus ring.
- `src/components/chat/ChatWidget.tsx` — `"use client"`; seeded greeting + one suggestion; local state; fetch to `/api/chat`; private `TypingIndicator` (three animated dots); autofocus, Enter-to-send, disabled-when-empty/loading; auto-scroll; navy panel, mobile full-width / desktop ~60%.
- `src/components/chat/index.ts` — barrel exporting the three components and their prop interfaces.
- `src/app/page.tsx` — scaffold replaced with a server component rendering `<ChatWidget />`.
- `src/app/layout.tsx` — metadata title "KlimaGuard PH" + Filipino description; fonts/globals intact.
- `src/app/globals.css` — added `--animate-typing-dot` theme var + `@keyframes typing-dot`; existing dark `@media` block preserved.
- `README.md` — structure/modules checklist update (hook-driven, non-code).

Full diff: `git diff main` plus untracked files under `src/app/api/chat/` and `src/components/chat/*.tsx`.

</details>
