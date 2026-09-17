# Database schema

Logical model for v1. Physical implementation: PostgreSQL via Prisma (`apps/api/prisma/schema.prisma`). All primary keys are UUID unless noted.

Rules that constrain these tables: [business logic](../business-logic.md).

## 1. Enums

```text
Role              admin | front_desk | teacher | student | parent
CefrLevel         A1 | A2 | B1 | B2 | C1 | C2
CourseType        group | private
EnrollmentStatus  pending_payment | active | completed | dropped
AttendanceStatus  present | absent | excused
PaymentStatus     draft | open | paid | void | overdue
SessionStatus     scheduled | completed | cancelled | rescheduled
CreditTxType      purchase | lesson_consumed | cancellation_forfeit | adjustment | expiry
LevelChangeSource placement | evaluation | admin
DeliveryMode      onsite | remote
```

## 2. Entity-relationship (core)

```text
User 1──1 Student
User 1──1 Teacher
User 1──* ParentStudentLink *──1 Student

Course 1──* Batch 1──* LessonSession
Batch  *──1 Teacher (primary)
LessonSession *──1 Teacher (actual)

Student 1──* Enrollment *──1 Batch
Student 1──* Attendance *──1 LessonSession
Student 1──* Invoice 1──* CreditTransaction
Student 1──* PlacementTest
Student 1──* StudentLevelHistory
Enrollment 1──0..1 ProgressReport
Enrollment 1──0..1 Certificate
LessonSession 1──* Homework
```

## 3. Tables

### users

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| name | text | |
| email | citext unique | login |
| password_hash | text nullable | null if IdP-only |
| role | Role | single role |
| phone | text nullable | E.164 preferred |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

### students

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| user_id | UUID FK users unique | |
| cefr_level | CefrLevel nullable | |
| target_level | CefrLevel nullable | |
| lesson_credits_remaining | numeric(6,2) | cache; default 0 |
| created_at | timestamptz | |

### parent_student_links

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| parent_user_id | UUID FK users | role must be parent |
| student_id | UUID FK students | |
| relationship | text nullable | |

Unique `(parent_user_id, student_id)`.

### teachers

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| user_id | UUID FK users unique | |
| specializations | text[] | e.g. `{IELTS,Business}` |
| is_native | boolean | default false |
| hourly_rate | numeric(10,2) | |
| zoom_personal_link | text nullable | |
| created_at | timestamptz | |

### teacher_availabilities

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| teacher_id | UUID FK teachers | |
| weekday | smallint nullable | 0–6; null if date-specific |
| start_time | time | local school TZ |
| end_time | time | |
| specific_date | date nullable | exception window |
| is_blocked | boolean | true = unavailable |

### courses

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| title | text | |
| cefr_level | CefrLevel | |
| course_type | CourseType | |
| required_specialization | text | |
| default_capacity | int | private → 1 |
| default_session_minutes | int | e.g. 60 |

### batches

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| course_id | UUID FK courses | |
| teacher_id | UUID FK teachers | primary instructor |
| schedule_day_time | text | human + parseable, e.g. `Tue 18:00-19:30` |
| room_number | text nullable | |
| meeting_url | text nullable | |
| capacity | int | |
| starts_on | date | |
| ends_on | date | |
| delivery_mode | DeliveryMode | |

### enrollments

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| student_id | UUID FK students | |
| batch_id | UUID FK batches | |
| status | EnrollmentStatus | |
| pay_later_until | date nullable | |
| created_at | timestamptz | |

Unique active/pending pair: one `(student_id, batch_id)` row; status changes in place.

### lesson_sessions

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| batch_id | UUID FK batches nullable | null = ad-hoc private |
| teacher_id | UUID FK teachers | who teaches |
| student_id | UUID FK students nullable | required if private |
| starts_at | timestamptz | |
| ends_at | timestamptz | |
| room_number | text nullable | |
| meeting_url | text nullable | |
| meeting_external_id | text nullable | Zoom/Meet id |
| status | SessionStatus | |
| cancellation_reason | text nullable | |

### attendance

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| lesson_session_id | UUID FK | preferred over denormalized batch+date |
| batch_id | UUID FK batches | denormalized for queries |
| student_id | UUID FK students | |
| date | date | session local date |
| status | AttendanceStatus | |

Unique `(lesson_session_id, student_id)`.

Blueprint used `(batch_id, student_id, date)`. That remains queryable; session id is the integrity key so reschedules do not duplicate days.

### placement_tests

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| student_id | UUID FK students | |
| taken_at | timestamptz | |
| listening | numeric(5,2) nullable | |
| reading | numeric(5,2) nullable | |
| writing | numeric(5,2) nullable | |
| speaking | numeric(5,2) nullable | |
| overall | numeric(5,2) | |
| recommended_level | CefrLevel | |
| confirmed_at | timestamptz nullable | |
| confirmed_by_user_id | UUID FK users nullable | |
| notes | text nullable | |

### student_level_history

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| student_id | UUID FK students | |
| from_level | CefrLevel nullable | |
| to_level | CefrLevel | |
| source | LevelChangeSource | |
| actor_user_id | UUID FK users | |
| created_at | timestamptz | |

### homework

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| lesson_session_id | UUID FK nullable | |
| batch_id | UUID FK nullable | |
| teacher_id | UUID FK teachers | |
| title | text | |
| body | text | |
| due_at | timestamptz nullable | |
| created_at | timestamptz | |

### progress_reports

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| enrollment_id | UUID FK enrollments unique | |
| teacher_id | UUID FK teachers | |
| skill_scores | jsonb | |
| overall_comment | text | |
| recommended_level | CefrLevel nullable | |
| passed | boolean | |
| submitted_at | timestamptz | |
| locked_at | timestamptz nullable | |

Private packages may attach a report to a milestone enrollment or a dedicated private “enrollment” row against a private batch **[Decision: private uses a batch of capacity 1]**.

### certificates

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| enrollment_id | UUID FK unique | |
| student_id | UUID FK | |
| serial_number | text unique | |
| issued_at | timestamptz | |
| revoked_at | timestamptz nullable | |
| pdf_storage_key | text | |

### invoices

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| student_id | UUID FK students | |
| enrollment_id | UUID FK nullable | group |
| amount | numeric(12,2) | |
| currency | char(3) | default school currency |
| credit_hours_bought | numeric(6,2) | 0 for group |
| payment_status | PaymentStatus | |
| due_at | timestamptz nullable | |
| paid_at | timestamptz nullable | |
| external_payment_id | text nullable | |
| created_at | timestamptz | |

### credit_transactions

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| student_id | UUID FK students | |
| invoice_id | UUID FK nullable | |
| lesson_session_id | UUID FK nullable | |
| type | CreditTxType | |
| hours | numeric(6,2) | signed (+ purchase, − consume) |
| reason | text nullable | required for adjustment |
| created_at | timestamptz | |
| created_by_user_id | UUID FK nullable | |

### notification_logs

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| user_id | UUID FK | |
| channel | text | `email` \| `sms` \| `whatsapp` |
| template_key | text | |
| dedupe_key | text unique | idempotency |
| sent_at | timestamptz | |
| status | text | `sent` \| `failed` |
| provider_message_id | text nullable | |

### audit_logs

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| actor_user_id | UUID FK nullable | |
| action | text | |
| entity_type | text | |
| entity_id | UUID | |
| payload | jsonb | |
| created_at | timestamptz | |

### placement_score_bands (config)

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID PK | |
| min_score | numeric | inclusive |
| max_score | numeric | exclusive except last |
| cefr_level | CefrLevel | |

## 4. Indexes (minimum)

- `enrollments (batch_id)` where status in (`pending_payment`, `active`) — capacity checks
- `lesson_sessions (teacher_id, starts_at, ends_at)` — overlap
- `attendance (student_id, date)`
- `invoices (student_id, payment_status)`
- `credit_transactions (student_id, created_at)`

## 5. Mapping from the original blueprint

| Blueprint | This schema |
| --------- | ----------- |
| Users, Students, Teachers, Courses, Batches, Enrollments, Attendance, Invoices | Kept and extended |
| Attendance keyed by batch+date | Plus `lesson_session_id` |
| `lesson_credits_remaining` only on Students | Ledger table added |
| Missing placement, sessions, reports, certificates, parents | Added |

## 6. Integrity notes

- Application (and later DB constraints/triggers) must keep `students.lesson_credits_remaining` = `sum(credit_transactions.hours)`.
- Group capacity: `count(enrollments where status in pending_payment, active)` ≤ `batches.capacity`.
- Do not store raw card data. Payment tokens live at the provider; we store `external_payment_id`.
