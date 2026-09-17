# API integration specification

Third-party systems used by `apps/api` only. Next.js must not hold provider secrets. Adapters live under `apps/api/src/infrastructure/` (payments, meetings, notifications). Feature modules call adapters; they do not embed vendor SDKs.

Business events that trigger integrations: [business logic](../business-logic.md) §5.3, §9.

## 1. Common rules

| Rule | Detail |
| ---- | ------ |
| Secrets | Env via `apps/api` config (`configuration.ts`). Never `NEXT_PUBLIC_*` for secret keys. |
| Timeouts | Outbound HTTP ≤ 10s; retries with backoff for 5xx and network errors only. |
| Idempotency | Provider `Idempotency-Key` or our `dedupe_key` on notifications; payment webhook processed once per event id. |
| Failure | Persist `failed` + error; do not block attendance if Zoom create fails — fall back to `zoom_personal_link` and alert Front Desk. |
| PII | Send minimum fields (name, phone, email, amount). No CEFR or attendance in payment metadata beyond invoice id. |
| School TZ | All “24 hours before class” calculations use school timezone, not UTC date lines. |

## 2. Payment processing

**Providers (choose one primary, keep adapter interface):** Stripe, PayPal, or a local gateway (same `PaymentProvider` port).

### 2.1 Use cases

| School event | Provider operation |
| ------------ | ------------------ |
| Student/parent pays `open` invoice | Create checkout session / order; redirect or hosted fields |
| Front Desk records cash | No provider call; mark paid internally with method `offline` |
| Webhook `payment_succeeded` | Set invoice `paid`, `external_payment_id`, apply enrollment/credits |
| Webhook `payment_failed` | Leave `open`; optional notify |
| Admin refund | Provider refund; on success, credit reversal per business logic |

### 2.2 Data we send

- `amount`, `currency`, `invoice.id` as merchant reference
- Customer email/name from `users`
- Success/cancel URLs on `apps/web` billing return routes

### 2.3 Data we store

- `invoices.external_payment_id`
- `invoices.payment_status`
- Webhook event id in processed-events table (or `audit_logs`)

### 2.4 Webhooks

- Endpoint on Nest, e.g. `POST /integrations/payments/webhook`
- Verify signature (Stripe `Stripe-Signature`, PayPal transmission id, or local HMAC)
- Respond 2xx only after DB commit of invoice transition
- Unknown invoice id: log and 2xx to avoid infinite retry **after** alerting

### 2.5 Do not

- Charge cards from the browser with the secret key
- Grant credits on `checkout.session.created` — only on successful capture/webhook
- Support partial capture in v1

## 3. Virtual classrooms

**Providers:** Zoom Meeting API **or** Google Meet (Calendar + Meet). One provider enabled per school in settings.

### 3.1 Use cases

| School event | Provider operation |
| ------------ | ------------------ |
| Remote `LessonSession` created | Create meeting; save `meeting_url`, `meeting_external_id` |
| Session rescheduled | Update meeting time |
| Session cancelled | Delete or cancel meeting |
| Teacher has no API meeting | Copy `teachers.zoom_personal_link` onto the session and flag `using_personal_link` |

### 3.2 Zoom (typical)

- Server-to-server OAuth (account credentials) or user-managed OAuth later
- Create meeting: topic = course title + date, start/duration from session, waiting room on
- Host: teacher email if licensed; otherwise school generic user **[Decision]**

### 3.3 Google Meet

- Create a Calendar event with `conferenceData`; attendees = teacher + student emails (private) or teacher only (group — students use LMS link)
- Store Meet URL on the session

### 3.4 Calendar display

Web shows `meeting_url` to enrolled students, linked parents, assigned teacher, Front Desk, Admin. Do not list URLs on public pages.

## 4. Messaging

Three channels; user `notification_preferences` picks allowed channels (default: email on, SMS/WhatsApp off until number verified).

| Channel | Provider | Typical payload |
| ------- | -------- | --------------- |
| Email | SendGrid | Transactional template id, `to`, substitutions |
| SMS | Twilio | E.164 `users.phone`, body ≤ 160 where possible |
| WhatsApp | WhatsApp Business API (Cloud or BSP) | Pre-approved templates only |

### 4.1 Templates (keys)

| `template_key` | When | Channels |
| -------------- | ---- | -------- |
| `session_reminder_24h` | 24h before `starts_at` | all |
| `invoice_due_3d` | 3 days before `due_at` | email, sms |
| `invoice_overdue` | daily while overdue, max 5 | email, sms |
| `credits_low` | balance ≤ 2.0 hours | email |
| `package_expiry_14d` | 14 days before expiry | email |
| `batch_rescheduled` | batch time/room/teacher change | all |
| `session_cancelled` | session cancelled | all |

### 4.2 Idempotency

`notification_logs.dedupe_key` examples:

- `session_reminder_24h:{sessionId}:{userId}`
- `invoice_overdue:{invoiceId}:{date}`

Jobs skip insert-conflict.

### 4.3 WhatsApp specifics

- Use template messages for business-initiated reminders (outside 24-hour session window)
- If template not approved, fall back to email and log

### 4.4 Opt-out

Honor provider STOP for SMS; store `sms_opt_out` on user. Do not send marketing. Operational reminders may still email.

## 5. Job orchestration

| Job | Schedule | Side effects |
| --- | -------- | ------------ |
| Generate group sessions | On batch create/update | rows in `lesson_sessions` |
| Create remote meetings | On remote session insert | Zoom/Meet |
| Session reminders | Hourly | messaging |
| Invoice overdue | Daily | status + messaging |
| Attendance auto-absent | Hourly | attendance |
| Package expiry | Daily | credit `expiry` tx |

Use the existing Nest pattern: feature `*.processor.ts` + broker/queue under `infrastructure` when jobs are added.

## 6. Environment keys (indicative)

```text
PAYMENT_PROVIDER=stripe|paypal|local
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
GOOGLE_CALENDAR_CREDENTIALS=
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

Map these in `apps/api/src/config/configuration.ts` when implemented.

## 7. Sequence: pay invoice then grant credits

```text
Student → Web → API POST /invoices/:id/checkout
API → Stripe Checkout
Student pays
Stripe → API webhook
API: verify sig → invoice paid → credit_transactions.purchase
    → update lesson_credits_remaining
    → if group enrollment, status active
API → (optional) SendGrid receipt
```

Credits and seats **must not** change until webhook (or Front Desk offline payment) succeeds.
