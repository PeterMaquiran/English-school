# Role-based access control (RBAC) matrix

Roles are stored on `users.role`. API guards enforce this matrix. UI hides actions the API would reject; the API is authoritative.

Parent permissions apply to **linked students only** (`parent_student_links`). Student permissions apply to **self** only. Teacher write access applies to **assigned sessions/batches** unless noted.

## 1. Roles

| Role | Primary job |
| ---- | ----------- |
| `admin` | Director: finance, payroll view, courses, settings, overrides |
| `front_desk` | Onboarding, placement, billing collection, enrollment |
| `teacher` | Schedule, attendance, homework, evaluations |
| `student` | Calendar, credits, certificates, pay invoices |
| `parent` | Same as student for each linked child |

## 2. Matrix

Legend: **F** full (CRUD as defined) · **R** read · **W** create/update (no delete unless stated) · **O** own/assigned/linked scope · **—** none · **X** execute (action)

| Resource / action | Admin | Front Desk | Teacher | Student | Parent |
| ----------------- | :---: | :--------: | :-----: | :-----: | :----: |
| **System settings** (score bands, school TZ, reminder flags) | F | — | — | — | — |
| **Users** list all | F | R (staff+students) | — | — | — |
| **Users** create Front Desk / Teacher / Admin | F | — | — | — | — |
| **Users** create Student / Parent | F | W | — | — | — |
| **Student profiles** | F | F | R (assigned) | O | O |
| **Teacher profiles** (incl. rate) | F | R (no rate) | O (no rate edit) | — | — |
| **Hourly rate / payroll export** | F | — | — | — | — |
| **Availability** | F | W | O | — | — |
| **Courses** | F | R | R | R (published) | R (published) |
| **Batches / sessions** create, assign teacher | F | W | — | — | — |
| **Batches / sessions** view | F | F | O | O | O |
| **Enroll student in batch** | F | W | — | — | — |
| **Drop enrollment** | F | W | — | — | — |
| **Placement tests** record/confirm | F | W | R (assigned) | R own | R linked |
| **CEFR override / downgrade** | F | — | — | — | — |
| **Approve level-up from evaluation** | F | W | — | — | — |
| **Attendance** mark | F | W | O | — | — |
| **Attendance** view | F | F | O | O | O |
| **Homework** post | F | — | O | — | — |
| **Homework** view | F | R | O | O | O |
| **Progress reports** submit | F | — | O | — | — |
| **Progress reports** lock term | F | — | — | — | — |
| **Progress reports** view | F | R | O | O | O |
| **Certificates** issue (system) / revoke | F | X issue retry | — | — | — |
| **Certificates** download | F | R | — | O | O |
| **Invoices** create / void | F | W | — | — | — |
| **Invoices** record offline payment | F | W | — | — | — |
| **Invoices** pay online | F | X on behalf | — | O | O |
| **Refunds** | F | — | — | — | — |
| **Financial analytics** (revenue, outstanding) | F | R (no payroll) | — | — | — |
| **Credit adjustments** | F | W (reason) | — | — | — |
| **Credits / ledger** view | F | F | — | O | O |
| **Book / reschedule private** (≥24h rules) | F | W | — | X request | X request |
| **Late cancel override (excuse)** | F | W | — | — | — |
| **Notification preferences** | F | W on behalf | O | O | O |

Student/parent **request** to book or reschedule: Front Desk (or Admin) confirms against availability in v1. Direct self-serve booking can be enabled later without changing data rules.

## 3. Field-level restrictions

| Field | Visible to |
| ----- | ---------- |
| `teachers.hourly_rate` | Admin only |
| Other students’ invoices | Admin, Front Desk |
| Audit log | Admin |
| Payment provider customer ids | Admin, API internals |

## 4. Guard mapping (API)

Planned Nest usage (`apps/api`):

- Authenticated routes: auth guard + user provisioning
- Role: `@Roles('admin' | 'front_desk' | …)` matching this matrix
- Scope (own/assigned/linked): service-layer checks after role

Never rely on hiding a button in `apps/web` as the only control.
