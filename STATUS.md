# Status — LanguageBridgeBot

**Last updated:** 2026-06-21
**Maturity:** 🟢 `status-production-ready` (with one TODO + a coverage gap)

## What's done

- LINE webhook handler with signature validation
- Translation engine (Google Translate) supporting 35+ languages with auto-detection
- Bot commands: `/help`, `/languages`, `/set`, `/status`, `/about`, `/reset`
- Follow / group-join events now reply with the welcome message (previously stubbed TODOs)
- Unfollow / leave / beacon events documented as intentional no-ops (no reply token)
- Premium tier with Stripe (subscription service, monetization service)
- MongoDB persistence (databaseService)
- Cache service, context service, rate limiter, anti-spam
- Circuit breaker + retry + deduplication for translation calls
- OCR service, voice service, multi-bot service, A/B testing service
- Dashboard + analytics + monitoring services
- Free vs premium tier enforcement (20 messages/day default)
- 75 tests across 8 suites
- Docker + `railway.json` + Railway-ready

## What's left

- **`src/utils/validators.js:196`** — admin check is a `// TODO` waiting on a LINE API integration (`isUserGroupAdmin`-style call). Bounded fix.
- **Coverage gap:** Jest coverage threshold is 70% (statements/branches/functions/lines), actual is **37.8%**. `pnpm test` passes (threshold only enforced on coverage runs), but `pnpm test:coverage` fails. Closing the gap means real tests for `paymentService`, `voiceService`, `ocrService`, `subscriptionService`, `usageService`, `monitoringService`, `analyticsService` — significant effort.
- **Live deploy** to Railway needs: LINE channel access token + LINE channel secret, MongoDB URI, Google Translate API key, optional Stripe keys (creds-gated, owner action)

## Quality gates

| Gate | Status |
|---|---|
| Build | n/a (Node script, no build step) |
| Lint | ✅ 0 errors |
| Tests | ✅ 75 / 8 suites |
| Coverage | ⚠️ 37.8% (threshold 70%) |

## Deployment

Not yet deployed. Railway + Docker config present.
