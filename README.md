# Workshop Registration System

A robust, concurrency-safe workshop scheduling and attendee registration platform built with a **Laravel REST API** (PHP 8.2+ / MySQL InnoDB) and a **Next.js (App Router)** frontend (React 19 / TypeScript / Tailwind CSS).

---

## 1. Local Setup Instructions

### Prerequisites
- **PHP**: 8.2 or higher (with `pdo_mysql`, `curl`, `mbstring`, `openssl`, and `bcmath` extensions enabled)
- **Composer**: 2.x
- **MySQL**: 8.0+ (running locally on port `3306`)
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher

---

### Backend Setup (`workshop-backend`)

1. **Navigate to the backend directory**:
   ```bash
   cd workshop-backend
   ```

2. **Install PHP dependencies**:
   ```bash
   composer install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and generate an application key:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Configure MySQL Database Connection**:
   Update your `.env` file with your local MySQL credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=workshop_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```
   *(Ensure the `workshop_db` database exists in MySQL before running migrations: `CREATE DATABASE workshop_db;`)*

5. **Run Database Migrations & Pre-Seeded Data**:
   ```bash
   php artisan migrate:fresh --seed
   ```

6. **Start the Laravel API Server**:
   ```bash
   php artisan serve
   ```
   *The backend REST API is now live at: `http://127.0.0.1:8000`*

---

### Frontend Setup (`workshop-frontend`)

1. **Navigate to the frontend directory**:
   ```bash
   cd workshop-frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create or verify `.env.local` pointing to the Laravel backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

4. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```
   *The application UI is now accessible at: `http://localhost:3000`*

---

### Pre-Seeded Test Credentials

The database seeder creates standard test accounts across all roles. All accounts use the password: **`password`**

| Role | Email | Password | Intended Views & Permissions |
|---|---|---|---|
| **Admin** | `admin@workshop.test` | `password` | **`/admin/users`** — User management, role provisioning, account toggling. Strictly restricted from workshop CRUD and bookings (returns 403 Forbidden). |
| **Manager** | `manager@workshop.test` | `password` | **`/dashboard`** — Full workshop lifecycle management (Create, Edit, View), register attendees, cancel bookings, view registration history. |
| **Staff** | `staff@workshop.test` | `password` | **`/dashboard`** — Browse scheduled workshops, register attendees, cancel bookings, view registration history. Restricted from workshop CRUD and user management (returns 403 Forbidden). |
| **Staff 2** | `staff2@workshop.test` | `password` | **`/dashboard`** — Secondary staff account for testing multi-user interactions and concurrent booking scenarios. |

---

### Verification & Automated Testing

1. **Backend Automated Test Suite (17 tests, 68 assertions)**:
   ```bash
   cd workshop-backend
   php artisan test
   ```
   *Validates authentication, RBAC policy enforcement, concurrency bounds, capacity reduction guards, and filter scopes.*

2. **High-Concurrency Race Condition Verification Script**:
   Test 20 simultaneous HTTP cURL requests racing for the final seat:
   ```bash
   php workshop-backend/scripts/smoke_race.php http://127.0.0.1:8000/api
   ```
   *Simulates multi-threaded contention. Exactly 1 request succeeds with HTTP 201; 19 requests fail with HTTP 422 `capacity_exceeded`. Zero over-registrations occur.*

3. **Frontend Production Build Verification**:
   ```bash
   cd workshop-frontend
   npm run build
   ```
   *Ensures zero TypeScript errors, clean JSX contracts, and optimized Next.js App Router bundles.*

---

## 2. Architecture & Design Document (One-Page Deliverable)

### Technology Stack Choices & Justification

- **Laravel 11/12 REST API**: Selected for its mature architectural patterns, built-in Sanctum token authentication, expressive Eloquent ORM, database transaction management, dedicated Form Request validation, and fine-grained Authorization Policies. It allows rapid delivery of enterprise-grade security and business validation without external scaffolding.
- **MySQL (InnoDB)**: Chosen specifically for true ACID transaction guarantees, row-level locking primitives (`SELECT ... FOR UPDATE`), and foreign key integrity. While lightweight file databases like SQLite are simpler to set up, their table-level lock escalation cannot reliably guarantee mutual exclusion across concurrent PHP processes without database-level concurrency locks.
- **Next.js (App Router) & React 19**: Provides modern component architecture, clean client/server separation, fast compilation via Turbopack, and type safety across the application.
- **Tailwind CSS**: Utility-first CSS allows complete control over layout, typography, and responsive states without CSS bloat. A unified Light SaaS design system (Slate background with pure white cards and Indigo accents) was configured to prevent OS-level dark mode discrepancies across different browsers.

---

### Concurrency & Over-Registration Prevention

The primary architectural challenge of the registration domain is preventing over-booking when multiple staff members register attendees for the last remaining seat at the exact same second.

#### Core Booking Lifecycle & Transactional Flow
The booking operation is orchestrated inside an atomic database transaction through the following sequence:

1. **Acquire Exclusive Mutex**: The application issues a pessimistic row-level lock (`SELECT ... FOR UPDATE`) against the target workshop record by primary key. MySQL InnoDB places an exclusive lock on the row, preventing any concurrent transaction from modifying or proceeding past this point until the current transaction commits or rolls back.
2. **State & Schedule Validation**: The workshop status is validated to confirm it is currently scheduled, and the start timestamp is verified to ensure the event has not already started. If either condition fails, the transaction immediately terminates with an HTTP 422 Unprocessable Entity response.
3. **Live Capacity Verification Under Mutex**: The system counts active registration records associated with this workshop. Because the workshop row is exclusively locked, no concurrent process can insert or cancel registrations for this workshop. If the active count meets or exceeds maximum capacity, the request aborts with HTTP 422 ("This workshop is fully booked").
4. **Duplicate Attendee Guard**: The database checks for an existing active registration with the identical attendee email for this workshop. Duplicate bookings are rejected with HTTP 422, preventing accidental double-clicks or repeated submissions.
5. **Persistence & Atomic Commit**: A new registration record is inserted with active status, attendee details, and the foreign key of the authenticated staff member (`registered_by`). The transaction commits, releasing the InnoDB row lock for subsequent requests.

#### Concurrency Mechanics Step-by-Step
1. **Parallel Requests**: When Staff Member A and Staff Member B submit a booking request for the 1 remaining seat at the exact same millisecond, both requests enter a `DB::transaction()`.
2. **Pessimistic Row Locking (`lockForUpdate()`)**: Request A executes `Workshop::whereKey($id)->lockForUpdate()`. MySQL InnoDB grants an exclusive `X` row lock on the workshop row to Request A.
3. **Lock Contention**: Request B executes the exact same query, but MySQL detects the existing row lock and pauses Request B in a lock-wait state at the database engine level.
4. **Serialization & State Mutex**: Request A counts active registrations (`count = capacity - 1`), verifies that space is available, inserts the new attendee registration row, and completes the transaction (`COMMIT`).
5. **Lock Hand-off**: The moment Request A commits, MySQL releases the exclusive row lock. Request B immediately resumes execution inside its transaction.
6. **Fresh Committed State**: Request B's query executes and reads the fresh committed state: `activeCount` now equals `capacity`.
7. **Safe Failure**: Request B detects `$activeCount >= $locked->capacity` and immediately aborts with HTTP 422 (`"This workshop is fully booked."`).
8. **Capacity Reduction Protection**: The same locking strategy is implemented when a Manager updates workshop details. In `WorkshopController::update()`, reducing capacity executes under `lockForUpdate()`, checking that new capacity is not lower than current active bookings, preventing concurrent bookings from slipping in mid-edit.

---

### Design Decisions & Trade-offs

1. **Lightweight Attendee Records vs. Full User Accounts**:
   - *Decision*: Attendees are modeled directly inside the `registrations` table (`attendee_name`, `attendee_email`) rather than requiring rows in the `users` table.
   - *Rationale*: Community workshop attendees are external participants registered on-site or over the phone by staff. Forcing attendee account creation would require password management, email verification, and session storage, introducing unnecessary friction and security surface area.
   - *Trade-off*: An attendee who registers for multiple workshops has duplicate name/email records across those registration rows. This was accepted in favor of operational simplicity.

2. **Immutable Registration History (Soft Cancellation Audit Trail)**:
   - *Decision*: Registrations are never hard-deleted (`DELETE FROM registrations`). Cancellations transition the record to `status = 'cancelled'`, recording `cancelled_by` (foreign key to `users`) and `cancelled_at` timestamps.
   - *Rationale*: Maintains a full audit log of which staff member processed a registration or cancellation, preventing disputes and enabling historical reporting. If an attendee cancels and later decides to re-register, a new active record is created without conflict.

3. **Strict Backend-Level RBAC (HTTP 403 Forbidden)**:
   - *Decision*: Authorization is strictly enforced at the API layer via Laravel Policies (`WorkshopPolicy`, `RegistrationPolicy`, `UserPolicy`) and role middleware (`EnsureUserHasRole`), refusing unauthorized requests with HTTP 403.
   - *Rationale*: Frontend route guards improve user experience, but client-side checks can be bypassed. Administrators are strictly forbidden from booking attendees (they manage users), and Staff are strictly forbidden from modifying workshops. An Axios interceptor automatically routes any 403 API response to a dedicated Access Restricted UI page.

4. **Database Row Locks vs. Redis Distributed Locking (Redlock)**:
   - *Decision*: Pessimistic row locking directly inside MySQL InnoDB was chosen over Redis distributed locks.
   - *Rationale*: A database transaction is already required to insert the registration record. Using `lockForUpdate()` utilizes MySQL's native ACID engine without introducing dual-state synchronization problems, network split risks, or additional service dependencies (Redis/Valkey). For single-node relational workloads, this provides maximum reliability with zero external infrastructure overhead.

---

### Assumptions Made & Skipped Features

#### Assumptions Made
- **Attendee Uniqueness**: An attendee is uniquely identified per workshop by their email address. Duplicate active registrations for the same email in the same workshop are rejected. However, an attendee may register for multiple distinct workshops.
- **Seat Re-allocation**: Cancelling a registration immediately frees that seat back up for real-time booking by other attendees.
- **Timezone**: All workshop start and end dates are recorded and evaluated in the venue's local timezone.
- **Single Currency & Free Admissions**: Workshops are community-funded and do not require on-the-spot financial transactions.

#### Skipped Features (3-Hour Time Constraint)
- **Waitlist Management**: Automated queue promotion when an active registration is cancelled.
- **Email & SMS Notifications**: Dispatching booking confirmation emails and calendar invites (`.ics` files) via queue workers.
- **Payment Gateway Integration**: Stripe or Square checkout flows for paid ticket tiers.
- **Roster Exporting**: Generating PDF sign-in sheets or exporting CSV attendee lists.
