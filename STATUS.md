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

## File-by-file checklist

### Entry + config
- [x] `src/index.js` — Express app + health endpoint + dashboard mount
- [x] `src/swagger.js` — API docs
- [x] `src/config/environment.js` — env loader
- [x] `src/config/constants.js` — supported languages, default settings

### Bot (`src/bot/`)
- [x] `webhook.js` — LINE webhook with sig validation; follow/join welcome implemented; unfollow/leave/beacon are intentional no-ops
- [x] `messageHandler.js` — main message router
- [x] `commands.js` — `/help`, `/languages`, `/set`, `/status`, `/about`, `/reset`
- [x] `richMenu.js` — rich menu + postback handler

### Services (`src/services/`)
- [x] `translationService.js` — Google Translate with circuit breaker + retry + dedup
- [x] `databaseService.js` — MongoDB persistence
- [x] `cacheService.js` — translation cache
- [x] `contextService.js` — conversation context
- [x] `usageService.js` — daily usage tracking (free tier limit)
- [x] `subscriptionService.js` — Stripe subscription state
- [x] `paymentService.js` — Stripe checkout/webhooks
- [x] `analyticsService.js` — usage analytics
- [x] `monitoringService.js` — health metrics
- [x] `ocrService.js` — Google Vision OCR (image messages)
- [x] `voiceService.js` — Google Speech (voice messages)
- [x] `multiBotService.js` — multiple-bot orchestration (feature flag)
- [x] `abTestingService.js` — A/B testing (feature flag)

### Utils (`src/utils/`)
- [x] `validators.js` — input validation (1 TODO at line 196 for admin check)
- [x] `messageFormatter.js` — LINE message construction
- [x] `errorHandler.js`, `circuitBreaker.js`, `performance.js`, `antiSpam.js`, `rateLimiter.js`

### Middleware
- [x] `middleware/security.js` — security headers
- [x] `middleware/logger.js` — request logging

### Dashboard (`src/dashboard/`)
- [x] `dashboard/index.js` — admin dashboard server
- [x] `dashboard/analytics.js` — analytics view (trend data: "coming soon" placeholder)

### Tests
- [x] `tests/unit/messageFormatter.test.js`
- [x] `tests/unit/translationService.test.js`
- [x] `tests/unit/validators.test.js`
- [x] `tests/unit/cacheService.test.js`
- [x] `tests/unit/webhookEvents.test.js` — added this session (follow/join/unfollow/leave coverage)
- [x] `tests/integration/database.test.js`
- [x] `tests/integration/webhook.test.js`
- [x] `tests/integration/fullFlow.test.js`
- [x] **75 tests passing** but **coverage is 37.8% vs 70% threshold** — `pnpm test` passes, `pnpm test:coverage` fails

### Quality + scaffolding
- [x] Lint green
- [x] Complete `.env.example`
- [x] Dockerfile + `docker-compose.yml`
- [x] `railway.json`

### Not done
- [ ] **`validators.js:196`** — admin check via LINE API (currently a TODO)
- [ ] Raise coverage 37.8% → 70% (needs tests for payment / voice / OCR / subscription / usage / analytics / monitoring services)
- [ ] Dashboard "Trend data" — currently a placeholder message
- [ ] Live deploy needs: LINE channel token + LINE channel secret, MongoDB URI, Google Translate API key, optional Stripe + Google Vision/Speech keys

## Categorized work remaining

| Item | Effort | Bucket | Blocker | Priority |
|------|--------|--------|---------|----------|
| `validators.js:196` admin check via LINE API | ~1–2h | 🟦 Pure code | none — just needs implementation | P2 |
| Raise coverage 38% → 70% | ~1d | 🟦 Pure code | none — write tests for the 7 untested services | P2 |
| Dashboard "Trend data" placeholder | ~2h | 🟦 Pure code | none — implement trend data collection | P3 |
| Live deploy to Railway | ~1h | 🔑 Needs creds | LINE channel tokens + MongoDB + Google Translate (+ optional Stripe/Vision/Speech) | P1 |

## Release plan

1. **Bounded engineering (no creds needed):** implement admin check, push coverage to 70%, implement trend data.
2. **Get creds + deploy:**
   - LINE Developers Console (free) → create channel, copy access token + secret
   - MongoDB Atlas free tier → get connection string
   - Google Cloud → enable Translation API, get API key
   - Optional: Stripe live keys (for premium), Google Vision (for OCR), Google Speech (for voice)
   - Push image to Railway via `railway.json`
3. **Smoke test:**
   - Add the LINE webhook URL in Console: `https://<your-domain>/webhook`
   - Send a test message; confirm translation + history persistence
4. **Tag release:** `gh release create v1.0.0 --title "LanguageBridgeBot v1.0.0"`

### Deploy prerequisites
- `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`
- `MONGODB_URI`
- `GOOGLE_TRANSLATE_API_KEY`
- `ADMIN_TOKEN`, `DASHBOARD_SECRET_KEY`
- Optional: `STRIPE_*` keys, `GOOGLE_VISION_API_KEY`, `GOOGLE_SPEECH_API_KEY`, `OPENAI_API_KEY`
- Railway account (or any container host with `docker-compose.yml` support)
