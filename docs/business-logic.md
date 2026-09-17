# Business logic — English Language School

This document defines how the school actually runs. Features, database tables, APIs, and UI must implement these rules. Open product decisions are marked **[Decision]**.

## 1. Purpose

Operate an English language school that:

- Places students on the CEFR scale (A1–C2) and tracks progression
- Sells **group cohort** seats and **private 1-on-1** credit packages
- Assigns teachers by availability, specialization, and delivery mode (room or Zoom)
- Records attendance, homework, and end-of-term reports
- Issues certificates when completion rules are met
- Bills tuition, tracks credits, and reminds families about classes and overdue invoices

## 2. Actors and identities

| Actor              | Identity                                                  | Notes                                              |
| ------------------ | --------------------------------------------------------- | -------------------------------------------------- |
| Admin / Director   | `User` with role `admin`                                  | School-wide operations and finance                 |
| Front Desk / Sales | `User` with role `front_desk`                             | Onboarding, placement, enrollment, collections     |
| Teacher            | `User` + `Teacher` profile                                | Schedule, attendance, homework, evaluations        |
| Student            | `User` + `Student` profile                                | Own calendar, credits, certificates, invoices      |
| Parent / Guardian  | `User` with role `parent`, linked to one or more students | Same student-facing permissions on linked children |

A person may have only one **login role** at a time. A teacher who is also a student needs two user accounts **[Decision: no dual-role accounts]**.

Passwords and identity provider details are an infrastructure concern (see SRS). Business rules always refer to the internal `User` and role.

## 3. CEFR, placement, and progression

### 3.1 Levels

Canonical ordered scale:

`A1 < A2 < B1 < B2 < C1 < C2`

Every student has:

- `cefr_level` — current assessed level (nullable until first placement)
- `target_level` — goal (must be ≥ current level when both are set)

Courses are tagged with a single `cefr_level`. A student may enroll in:

- A **group** course at their current level, or one level above with Admin or Front Desk override (reason required)
- A **private** course at current, target, or one adjacent level (teacher agrees via assignment)

### 3.2 Diagnostic placement

1. Front Desk creates a placement test record: student, date, scores (listening, reading, writing, speaking, overall), recommended CEFR, notes.
2. Overall score maps to a recommended level using a configurable score band table (Admin maintains bands).
3. Front Desk **confirms** the placement. Confirming sets `student.cefr_level` and writes a level-history row (`source = placement`).
4. Unconfirmed tests do not change the student’s level.
5. A student may have many tests over time; only confirmed tests change level.

### 3.3 Level-up (progression)

A student’s `cefr_level` increases only when:

- A teacher submits an **end-of-term evaluation** recommending the next level **and** Admin/Front Desk **approves**, or
- A new confirmed placement test recommends a higher level

Level **never decreases** automatically. Downgrade requires Admin action and a reason.

Every change appends `StudentLevelHistory` (from, to, source, actor, timestamp).

## 4. Products: group vs private

### 4.1 Group (cohort)

- Product is a **Course** with `course_type = group` and `default_capacity`.
- Delivery is a **Batch**: one course, one primary teacher, repeating `schedule_day_time`, room and/or Zoom link, start/end dates, capacity (defaults from course).
- Student buys a **seat** for that batch (tuition invoice), not a pool of hours.
- Enrollment status: `active` | `completed` | `dropped`.
- Capacity: active enrollments ≤ batch capacity. Waitlist is out of scope for v1 **[Decision]**.

### 4.2 Private (1-on-1 packages)

- Product is a **Course** with `course_type = private` (capacity always 1).
- Student buys a **package**: `credit_hours_bought` on an invoice. On payment, those hours are added to `student.lesson_credits_remaining`.
- Each delivered private lesson deducts credits (see §6).
- Scheduling is per session against teacher availability, not a fixed cohort calendar (though a recurring slot may be stored as a private batch for convenience).

### 4.3 Credit ledger

`lesson_credits_remaining` is a cached balance. The source of truth is `CreditTransaction`:

| Type                   | Effect                                        |
| ---------------------- | --------------------------------------------- |
| `purchase`             | + hours from a paid invoice                   |
| `lesson_consumed`      | − duration of a completed private lesson      |
| `cancellation_forfeit` | − hours when late cancel rules apply          |
| `adjustment`           | Admin/Front Desk correction (reason required) |
| `expiry`               | − remaining hours when a package expires      |

Credits never go below zero. Booking a private lesson is rejected if remaining credits < session duration.

**[Decision]** Unused package hours expire 12 months after purchase unless Admin extends.

## 5. Teacher allocation and availability

### 5.1 Teacher profile

- `specializations` — e.g. General, Business English, IELTS, TOEFL (multi-select)
- `hourly_rate` — used for payroll reporting, not shown to students
- `is_native` / bilingual flag
- `zoom_personal_link` — fallback if the Zoom API does not create a unique meeting

A batch or private session may be assigned only if:

1. The teacher’s specializations include the course’s required specialization
2. The teacher is marked available for the full session window
3. No overlapping assignment (including buffer **[Decision: 15 minutes]** between back-to-back rooms)
4. Delivery mode is satisfied: on-site needs a free `room_number`; remote needs a meeting link (generated or personal)

### 5.2 Availability

Teachers maintain weekly recurring availability plus date-specific blocks (vacation, illness).

Front Desk / Admin assigns teachers. Teachers cannot self-assign to billed sessions in v1.

### 5.3 Substitute teachers

Admin/Front Desk may reassign a session to another eligible teacher. Attendance and payroll follow the teacher who actually taught (`LessonSession.teacher_id`).

## 6. Sessions, attendance, and credits

### 6.1 Lesson session

A **LessonSession** is one occurrence: batch (optional for ad-hoc private), teacher, start/end, room or meeting URL, status `scheduled` | `completed` | `cancelled` | `rescheduled`.

Group batches generate sessions from the repeating schedule between start and end dates (skip school holidays — Admin calendar).

### 6.2 Attendance (group)

Teachers mark each enrolled student: `present` | `absent` | `excused`.

- Default before class: unmarked (does not count as absent)
- After class end + 24 hours, unmarked rows auto-fill `absent` **[Decision]**
- `excused` does not consume private credits (group has no per-lesson credit)
- Attendance can be edited by the same teacher within 48 hours, then only by Admin

### 6.3 Private lesson completion

When a private session is marked `completed`:

1. Create attendance `present` for that student
2. Insert `lesson_consumed` for the session duration
3. Decrement `lesson_credits_remaining`

If the session is cancelled, see §8.

## 7. Homework, progress, certificates

### 7.1 Homework

Teachers post homework against a session or batch. Students (and parents) can view it. Submission tracking is optional in v1 (view-only assignments are enough).

### 7.2 End-of-term evaluation

At batch end (or package milestone), the teacher submits a **ProgressReport**: scores/comments per skill, overall comment, recommended next CEFR, pass/fail.

Only one submitted report per enrollment (updates allowed until Admin locks the term).

### 7.3 Certificates

A certificate is generated when **all** are true:

- Enrollment status is `completed` (not dropped)
- Attendance rate ≥ 80% of scheduled sessions (excused counts as attended for this ratio) **[Decision]**
- Progress report exists with `pass = true`

Certificate PDF is stored and downloadable by student/parent. Serial number is unique. Revocation is Admin-only.

Completing an enrollment does not auto-change CEFR; that still follows §3.3.

## 8. Cancellation and rescheduling

Applies to **scheduled sessions** (group and private). School-wide holidays are cancellations initiated by Admin (no student penalty).

| Initiator        | Notice before start       | Group                                                                                 | Private                                               |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| School / teacher | Any                       | Session cancelled or substitute; no student fee                                       | Session cancelled; credits not consumed               |
| Student / parent | ≥ 24 hours **[Decision]** | Front Desk may move to another batch if seat exists; no refund of group tuition in v1 | Credits returned to balance (session not consumed)    |
| Student / parent | < 24 hours                | Marked absent unless Admin excuses                                                    | `cancellation_forfeit`: credits consumed as if taught |
| No-show          | —                         | `absent`                                                                              | Same as late cancel: forfeit credits                  |

Reschedule (student-initiated, private, ≥ 24 hours): cancel original without forfeit, book a new slot if teacher available and credits sufficient (credits unchanged until the new session completes).

Group reschedule of an entire batch (time/room/teacher) is Admin/Front Desk only; notify enrolled students.

## 9. Billing and reminders

### 9.1 Invoices

Created by Front Desk or automatically at enrollment / package purchase.

Fields: student, amount, currency, `credit_hours_bought` (0 for group tuition), `payment_status` (`draft` | `open` | `paid` | `void` | `overdue`), due date, line description.

Rules:

- `draft` is not payable and does not grant a seat or credits
- Moving to `open` reserves a group seat if attached to an enrollment
- `paid` (via gateway webhook or Front Desk cash/card recorded) activates enrollment and/or adds credits
- `void` releases a reserved seat; does not reverse a completed paid invoice (use refund flow)
- `overdue` when `open` and due date < today (job)

Partial payments in v1: not supported. Record the full amount or keep `open` **[Decision]**.

Refunds: Admin only; reverse credits if unused; do not auto-unenroll completed attendance history.

### 9.2 Group tuition vs packages

- Group: invoice for the batch price; payment required before status `active` unless Front Desk flags `pay_later` (Admin setting: max days) **[Decision: pay_later allowed, 7 days]**
- Private: invoice hours × rate (or packaged price); credits added only when `paid`

### 9.3 Reminders

Jobs (not user-triggered):

| Event                         | Channel (see integrations)            | Recipients               |
| ----------------------------- | ------------------------------------- | ------------------------ |
| Session in 24 hours           | WhatsApp / SMS / email per preference | Student, parent, teacher |
| Invoice 3 days before due     | email + SMS                           | Student, parent          |
| Invoice overdue daily (cap 5) | email + SMS                           | Student, parent          |
| Credits remaining ≤ 2 hours   | email                                 | Student, parent          |
| Package expiry 14 days prior  | email                                 | Student, parent          |

Do not send after opt-out. Teachers are not billed; they only get session reminders.

## 10. Core workflows (happy path)

### 10.1 New group student

1. Front Desk creates `User` + `Student` (or Parent + link)
2. Record and confirm placement test → CEFR
3. Choose course/batch with capacity and matching level
4. Create enrollment `pending_payment` + invoice `open`
5. Payment → enrollment `active`
6. Sessions appear on calendars; teacher takes attendance
7. Term end: report → optional certificate; enrollment `completed`

### 10.2 Private package

1. Onboard + placement as above
2. Sell package → invoice with `credit_hours_bought`
3. Payment → credit ledger `purchase`
4. Front Desk books sessions against teacher availability
5. Each completed lesson consumes credits
6. Low-balance reminder; renewal invoice repeats step 2

## 11. Invariants (must never break)

1. Active group enrollments in a batch ≤ capacity.
2. Private session duration ≤ student’s remaining credits at booking time.
3. Credit cache equals sum of ledger transactions.
4. Confirmed placement or approved evaluation is the only non-Admin path to raise CEFR.
5. Paid invoice is immutable except via refund/void that is fully audited.
6. A teacher cannot be assigned to overlapping sessions.
7. Students and parents see only their own (or linked) academic and billing data.
8. Certificates require pass + attendance threshold + completed enrollment.

## 12. Out of scope for v1

- Multi-branch franchising and inter-school transfers
- Waitlists and automatic promotion from waitlist
- Marketplace of freelance teachers
- Live classroom recording storage
- Partial invoice payments and installment plans (beyond a single due date)
- Dual-role single login

## 13. Traceability

| Business area        | SRS  | Schema                                               | RBAC                             | Integrations                              |
| -------------------- | ---- | ---------------------------------------------------- | -------------------------------- | ----------------------------------------- |
| CEFR & placement     | FR-1 | students, placement_tests, student_level_history     | Front Desk write, Teacher read   | —                                         |
| Packages & credits   | FR-2 | invoices, credit_transactions, students              | Front Desk, Student read         | Payments                                  |
| Teacher allocation   | FR-3 | teachers, availabilities, batches, lesson_sessions   | Admin/Front Desk assign          | Zoom / Meet                               |
| Attendance & reports | FR-4 | attendance, progress_reports, certificates, homework | Teacher write                    | —                                         |
| Billing & reminders  | FR-5 | invoices, notification_logs                          | Front Desk collect, Admin refund | Stripe/PayPal, WhatsApp, Twilio, SendGrid |
