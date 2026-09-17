# Software Requirements Specification (SRS)

**Product:** English Language School Management System  
**Version:** 0.1 (v1 scope)  
**Status:** Draft — derived from [business logic](../business-logic.md)  
**Stack:** NestJS API (`apps/api`) + Next.js web (`apps/web`)

This SRS states **what** the system must do. Rules and numbers live in business logic; if they conflict, business logic wins.

## 1. Introduction

### 1.1 Purpose

Specify requirements for a system that manages placement, scheduling, teaching operations, academic records, and billing for an English language school.

### 1.2 Scope

**In scope (v1):** CEFR placement and progression, group batches, private credit packages, teacher allocation, attendance, homework (publish), progress reports, certificates, invoicing, payment capture, cancellation/reschedule rules, automated reminders.

**Out of scope (v1):** listed in business logic §12.

### 1.3 Definitions

| Term           | Meaning                                                            |
| -------------- | ------------------------------------------------------------------ |
| CEFR           | Common European Framework of Reference for Languages (A1–C2)       |
| Batch          | A scheduled group offering of a course with a teacher and calendar |
| Credit hour    | Unit of prepaid private instruction; 1.0 = one hour                |
| Lesson session | A single class occurrence                                          |
| Enrollment     | Student ↔ batch (group) relationship                               |

## 2. Overall description

### 2.1 Product perspective

```
[Student/Parent/Staff browsers]
        │
        ▼
  apps/web (Next.js)
        │  HTTPS JSON
        ▼
  apps/api (NestJS :3001)
        ├── PostgreSQL (Prisma)
        ├── Payments (Stripe / PayPal / local GW)
        ├── Zoom or Google Meet
        └── WhatsApp / Twilio / SendGrid
```

### 2.2 User classes

Admin/Director, Front Desk/Sales, Teacher, Student, Parent — see [RBAC matrix](./rbac-matrix.md).

### 2.3 Assumptions

- One school (single tenant) in v1
- Classes are either on-site (room) or remote (meeting link), not hybrid in the same session **[aligned with allocation rules]**
- Official language of UI: configurable; default English with room for a second locale later

## 3. Functional requirements

### FR-1 CEFR level and placement tracking

| ID     | Requirement                                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| FR-1.1 | The system shall store each student’s current and target CEFR level using the canonical scale A1–C2.                  |
| FR-1.2 | Front Desk shall record diagnostic placement tests (skill scores, overall, recommended level, notes).                 |
| FR-1.3 | Confirming a placement test shall set current CEFR and append level history.                                          |
| FR-1.4 | The system shall prevent automatic CEFR downgrade; Admin may downgrade with a reason.                                 |
| FR-1.5 | Approved teacher evaluations or new confirmed placements shall be the only staff paths to raise CEFR (besides Admin). |
| FR-1.6 | Admin shall maintain score-to-level band configuration.                                                               |

### FR-2 Credit and package scheduling

| ID     | Requirement                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| FR-2.1 | Courses shall be `group` or `private`.                                                                          |
| FR-2.2 | Group delivery shall use batches with capacity, repeating schedule, date range, room and/or meeting link.       |
| FR-2.3 | The system shall refuse a group enrollment that would exceed capacity.                                          |
| FR-2.4 | Private packages shall add credit hours to the student ledger only after invoice `paid`.                        |
| FR-2.5 | Booking a private session shall fail if remaining credits are less than session length.                         |
| FR-2.6 | Completing a private session shall consume credits via an immutable ledger entry and update the cached balance. |
| FR-2.7 | Package expiry shall consume remaining hours per business logic (default 12 months).                            |

### FR-3 Teacher allocation and availability

| ID     | Requirement                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| FR-3.1 | Teachers shall have specializations, native/bilingual flag, hourly rate, and optional personal meeting link.  |
| FR-3.2 | Teachers shall publish recurring availability and exception blocks.                                           |
| FR-3.3 | Assignment shall require specialization match, availability, no overlap (including buffer), and room or link. |
| FR-3.4 | The system shall create or attach a virtual classroom link for remote sessions (see integrations spec).       |
| FR-3.5 | Admin/Front Desk shall reassign a session to a substitute; payroll uses the teaching teacher.                 |

### FR-4 Attendance and progress reports

| ID     | Requirement                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------ |
| FR-4.1 | Teachers shall mark attendance per session: present, absent, excused.                            |
| FR-4.2 | The system shall auto-mark unmarked group attendance as absent 24 hours after session end.       |
| FR-4.3 | Teachers shall post homework visible to enrolled students and linked parents.                    |
| FR-4.4 | Teachers shall submit one progress report per enrollment (editable until term lock).             |
| FR-4.5 | The system shall generate a certificate when completion, pass, and attendance threshold are met. |
| FR-4.6 | Students and parents shall download issued certificates.                                         |

### FR-5 Billing and automated reminders

| ID     | Requirement                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------- |
| FR-5.1 | Front Desk shall create invoices for group tuition and private packages.                                  |
| FR-5.2 | Payment webhooks and Front Desk “recorded payment” shall move invoices to `paid` and apply seats/credits. |
| FR-5.3 | The system shall mark invoices overdue after the due date and notify per reminder schedule.               |
| FR-5.4 | Cancellation and reschedule shall apply the notice windows and credit forfeit rules in business logic §8. |
| FR-5.5 | The system shall send class reminders 24 hours before sessions.                                           |
| FR-5.6 | The system shall notify when credits ≤ 2 hours and 14 days before package expiry.                         |
| FR-5.7 | Admin shall refund/void with audit; students cannot self-void.                                            |

## 4. Non-functional requirements

| ID    | Requirement                                                                                |
| ----- | ------------------------------------------------------------------------------------------ |
| NFR-1 | Authenticated API; role checks on every mutating route and on sensitive reads.             |
| NFR-2 | Passwords stored as hashes only, or delegated to the identity provider — never reversible. |
| NFR-3 | Payment secrets and webhook signing secrets stay on the API, never in the Next.js bundle.  |
| NFR-4 | Audit log for money, CEFR changes, refunds, and certificate revocation.                    |
| NFR-5 | Reminder jobs idempotent (one notification per event per channel).                         |
| NFR-6 | API documented at `/api` (Swagger) for staff integrations.                                 |
| NFR-7 | Web UI usable on desktop and common mobile widths for Front Desk and student calendar.     |

## 5. Requirement traceability to modules (planned)

| Area                            | API module (planned)                         | Web module (planned) |
| ------------------------------- | -------------------------------------------- | -------------------- |
| Auth / users                    | `auth`, `users`                              | `auth`, `users`      |
| Students / placement            | `students`, `placement-tests`                | `students`           |
| Courses / batches               | `courses`, `batches`                         | `courses`            |
| Enrollments / sessions          | `enrollments`, `sessions`                    | `calendar`           |
| Attendance / homework / reports | `attendance`, `homework`, `progress-reports` | teacher console      |
| Credits / invoices              | `credits`, `invoices`                        | `billing`            |
| Certificates                    | `certificates`                               | student portal       |
| Teachers / availability         | `teachers`                                   | `teachers`           |
| Notifications                   | `infrastructure/notifications`               | preferences UI       |
