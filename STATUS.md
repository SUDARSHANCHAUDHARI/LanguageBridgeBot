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
