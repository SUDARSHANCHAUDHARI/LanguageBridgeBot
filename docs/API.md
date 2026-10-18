# API Documentation

## Overview

LanguageBridgeBot provides RESTful API endpoints for monitoring, analytics, and administration.

**Base URL:** `https://example.com`

## Authentication

Most endpoints require authentication using the `DASHBOARD_SECRET_KEY` environment variable.

### Headers
```
Authorization: YOUR_DASHBOARD_SECRET_KEY
```

## Endpoints

### Health Check

#### `GET /health`

Check server health status.

**No authentication required**

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "api": "available",
  "cache": "operational",
  "memory": {
    "used": "150MB",
    "total": "512MB"
  },
  "timestamp": "2024-01-09T10:00:00.000Z"
}
```

---

### Dashboard

#### `GET /dashboard`

Get dashboard overview with statistics.

**Authentication:** Required

**Response:**
```json
{
  "status": "ok",
  "dashboard": {
    "stats": {
      "totalGroups": 150,
      "totalMessages": 5000,
      "totalTranslations": 12000,
      "activeUsers": 200,
      "cacheHitRate": 0.75,
      "avgResponseTime": 250
    },
    "health": { ... },
    "groups": [ ... ]
  }
}
```

---

#### `GET /dashboard/groups`

Get all active groups with statistics.

**Authentication:** Required

**Response:**
```json
{
  "status": "ok",
  "groups": [
    {
      "groupId": "C1234567890",
      "groupName": "My Group",
      "languages": ["en", "th", "ja"],
      "isPremium": false,
      "stats": {
        "totalUsage": 500,
        "dailyUsage": 50,
        "lastActive": "2024-01-09T10:00:00.000Z"
      }
    }
  ],
  "total": 150
}
```

---

#### `GET /dashboard/groups/:groupId`

Get detailed information about a specific group.

**Authentication:** Required

**Parameters:**
- `groupId` (path) - LINE group ID

**Response:**
```json
{
  "status": "ok",
  "group": {
    "groupId": "C1234567890",
    "config": {
      "languages": ["en", "th", "ja"],
      "groupName": "My Group"
    },
    "stats": {
      "totalUsage": 500,
      "dailyUsage": 50,
      "lastActive": "2024-01-09T10:00:00.000Z"
    }
  }
}
```

---

### Analytics

#### `GET /dashboard/analytics`

Get comprehensive analytics data.

**Authentication:** Required

**Response:**
```json
{
  "status": "ok",
  "analytics": {
    "totalMessages": 5000,
    "totalTranslations": 12000,
    "activeUsers": 200,
    "cacheHitRate": 0.75,
    "avgResponseTime": 250,
    "errorRate": 0.02,
    "topGroups": [ ... ],
    "totalGroups": 150,
    "abTesting": { ... }
  }
}
```

---

#### `GET /dashboard/analytics/trends`

Get usage trends over time.

**Authentication:** Required

**Query Parameters:**
- `period` (optional) - `daily`, `weekly`, or `monthly` (default: `daily`)

**Response:**
```json
{
  "status": "ok",
  "trends": {
    "period": "daily",
    "data": [
      {
        "date": "2024-01-09",
        "messages": 150,
        "translations": 300
      }
    ]
  }
}
```

---

#### `GET /dashboard/analytics/languages`

Get language usage statistics.

**Authentication:** Required

**Response:**
```json
{
  "status": "ok",
  "languages": {
    "mostTranslatedFrom": [
      { "lang": "en", "count": 2000 },
      { "lang": "th", "count": 1500 }
    ],
    "mostTranslatedTo": [
      { "lang": "en", "count": 1800 },
      { "lang": "th", "count": 1200 }
    ],
    "languagePairs": [
      { "from": "en", "to": "th", "count": 500 }
    ]
  }
}
```

---

#### `GET /dashboard/analytics/performance`

Get performance metrics.

**Authentication:** Required

**Response:**
```json
{
  "status": "ok",
  "performance": {
    "avgResponseTime": 250,
    "cacheHitRate": 0.75,
    "errorRate": 0.02,
    "systemHealth": { ... }
  }
}
```

---

### Admin

#### `GET /admin/stats`

Get comprehensive admin statistics.

**Authentication:** Required (via `X-Admin-Token` header or `ADMIN_TOKEN` env var)

**Headers:**
```
X-Admin-Token: YOUR_ADMIN_TOKEN
```

**Response:**
```json
{
  "analytics": { ... },
  "system": {
    "memory": { ... },
    "cpu": { ... }
  },
  "groups": {
    "active": 150,
    "list": [ ... ]
  },
  "health": { ... },
  "timestamp": "2024-01-09T10:00:00.000Z"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "status": "error"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Dashboard endpoints:** 100 requests per minute
- **Admin endpoints:** 50 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641734400
```

---

## Webhooks

### LINE Webhook

**Endpoint:** `POST /webhook`

Receives events from LINE platform. See LINE Messaging API documentation for event structure.

### Stripe Webhook

**Endpoint:** `POST /webhook/stripe`

Receives payment events from Stripe for premium subscriptions.

---

## Swagger/OpenAPI

For interactive API documentation, see `/api-docs` endpoint (if Swagger UI is enabled).

---

## Examples

### cURL Examples

**Health Check:**
```bash
curl https://example.com/health
```

**Get Dashboard Stats:**
```bash
curl -H "Authorization: YOUR_DASHBOARD_SECRET_KEY" \
  https://YOUR_DOMAIN/dashboard
```

**Get Group Details:**
```bash
curl -H "Authorization: YOUR_DASHBOARD_SECRET_KEY" \
  https://YOUR_DOMAIN/dashboard/groups/C1234567890
```

---

## Support

For API support, please refer to the main documentation or contact the development team.
