# Project Overview and Request Flow

This document describes the **Customer Management System** in detail and explains how requests move from the frontend to the backend and database, using two concrete examples.

---

## 1. Project Description

### 1.1 What It Is

The **Customer Management System** is a full‑stack web application for managing:

- **Stores** – Multiple store locations (e.g. Con Cafe, Bar, Host Club).
- **Users** – Staff accounts with roles: **Cast**, **Staff**, **Manager**, **Admin**.
- **Customers** – Customer records per store, with optional profile, detail, and preference data.
- **Visit records** – Per‑customer visits (date, spending, payment, cast, etc.).
- **Daily summaries** – Per‑store, per‑day totals (sales, expenses, labor, notes).
- **Staff members** – Links users to stores (e.g. cast assigned to a store).

Access is **role‑based** and **store‑scoped**: admins see all stores; other roles see only data for their assigned store.

### 1.2 Technology Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | React 18, TypeScript, React Router, Axios, Tailwind CSS. Runs in the browser (e.g. `http://localhost:3000`). |
| Backend   | Django 6, Django REST Framework (DRF). Exposes a REST API (e.g. `http://localhost:8000/api/`). |
| Auth      | Custom JWT (Simple JWT): access + refresh tokens; payload carries `user_id`; backend resolves to app user (`CmsUser`), not Django’s `User`. |
| Database  | PostgreSQL. Django ORM and migrations; tables such as `stores`, `users`, `customers`, `visit_records`, etc. |

### 1.3 High‑Level Architecture

```
[Browser]  ←→  [React app (port 3000)]  ←→  [Django API (port 8000)]  ←→  [PostgreSQL]
                    ↑                                    ↑
              Axios (API base URL              DRF views, serializers,
              from .env e.g. /api)             JWT auth, ORM
```

- The React app uses an **API base URL** (e.g. `/api` in dev via proxy, or full URL in production) and sends all API calls there.
- In development, the frontend dev server often **proxies** `/api` to `http://localhost:8000`, so the browser talks to the same origin and the backend serves `/api/...`.
- The Django app mounts the API under **`/api/`** (`backend/backend/urls.py`: `path('api/', include('api.urls'))`). So a frontend request to `/api/customers/` hits Django’s `api` app.
- The backend uses **JWT** in the `Authorization` header to identify the user and applies **per‑view logic** (e.g. store filtering, role checks) before touching the database.

---

## 2. Request Flow: Two Examples

Below we trace **one auth flow (login)** and **one data flow (customer list)** from the UI to the database and back.

---

### Example 1: Login (Frontend → Backend → Database → Response)

**Goal:** User submits email and password; the app validates them, loads the user from the DB, returns JWT tokens and user info.

#### Step 1 – Frontend: User submits the form

- **Where:** Login page (`frontend/src/pages/Login.tsx`). User enters email and password and clicks “ログイン”.
- **What happens:** The form’s `onSubmit` calls `login(email, password)` from **AuthContext** (`frontend/src/contexts/AuthContext.tsx`).

#### Step 2 – Frontend: Auth context sends HTTP request

- **Where:** `AuthContext.tsx`, inside `login()`:
  ```ts
  const res = await axios.post<LoginResponse>(`${API}/auth/login/`, { email, password });
  ```
- **Details:**
  - `API` comes from `frontend/src/config.ts`: `process.env.REACT_APP_API_URL || '/api'`. So the request URL is typically **`/api/auth/login/`** (same origin in dev because of proxy).
  - Body: JSON `{ email, password }`.
  - No `Authorization` header yet (user is not logged in).
- **Network:** Browser sends `POST /api/auth/login/` to the same origin; the dev server proxies it to `http://localhost:8000/api/auth/login/`.

#### Step 3 – Backend: Django receives the request

- **Where:** Django’s URL routing. Root URLconf includes `path('api/', include('api.urls'))`, and `api/urls.py` has:
  ```python
  path("auth/login/", views.jwt_login),
  ```
- So `POST /api/auth/login/` is handled by the **`jwt_login`** function in `backend/api/views.py`.

#### Step 4 – Backend: Validate input and load user from DB

- **Where:** `jwt_login()` in `backend/api/views.py`.
- **Logic:**
  1. Read `email` and `password` from `request.data`.
  2. If either is missing → return `400` “email and password required”.
  3. **Database access:** `user = CmsUser.objects.get(email=email)`.
     - This runs a **SQL query** (e.g. `SELECT * FROM users WHERE email = %s`) via Django ORM against PostgreSQL.
  4. If no row is found (`CmsUser.DoesNotExist`) → return `401` “Invalid email or password”.
  5. **Password check:** `check_password(password, user.password_hash)` (Django’s hasher; no extra DB call).
  6. If it fails → return `401` “Invalid email or password”.

So for a **valid** login, the only database interaction in this view is **one read** from the `users` table.

#### Step 5 – Backend: Build tokens and response

- **Where:** Same view calls `_login_response(user)`.
- **Logic:**
  1. Wrap the ORM `user` in `CmsUserAuth` (for Simple JWT).
  2. `RefreshToken.for_user(wrapper)` builds access and refresh tokens; the payload includes `user_id` (and whatever Simple JWT adds).
  3. Read `user.store_id` and optionally `user.store.name` (one more query if you access `user.store` and it wasn’t selected).
  4. Return a JSON **Response** with:
     - `access`, `refresh` (JWT strings),
     - `user_id`, `username`, `email`, `role`, `store_id`, `store_name`.

No write to the database in this step; it’s read‑only after the user lookup.

#### Step 6 – Frontend: Store tokens and user, then redirect

- **Where:** `AuthContext.tsx` – `login()` receives the response and calls `loginWithResponse(res.data)`.
- **What happens:**
  - Save `access` and `refresh` in `localStorage`.
  - Save user fields in `localStorage` as the “current user”.
  - Set Axios default header: `Authorization: Bearer <access>` so **subsequent** API calls are authenticated.
  - Update React state so the UI shows the user as logged in and can redirect (e.g. to home).

**End-to-end for login:**  
Browser → React (Axios) → HTTP `POST /api/auth/login/` → Django `jwt_login` → **one DB read** (`CmsUser` by email) → password check in memory → build JWTs and JSON response → back to React → store tokens and user, set header for future requests.

---

### Example 2: Loading the customer list (authenticated request)

**Goal:** The customer list page loads; the frontend requests the list of customers, and the backend returns only the customers the current user is allowed to see (by store and role).

#### Step 1 – Frontend: Page loads and requests data

- **Where:** Customer list page (`frontend/src/pages/CustomerList.tsx`). On mount it fetches stores and customers.
- **Example request:**  
  `axios.get<Customer[]>(`${API}/customers/`)`
- **Details:**
  - URL is again based on `API` (e.g. `/api/customers/`).
  - Axios was configured with `Authorization: Bearer <access>` after login, so this request includes the JWT.

#### Step 2 – Backend: Django routes and authenticates

- **Where:** `api/urls.py` registers `router.register(r"customers", views.CustomerViewSet, basename="customer")`, so `GET /api/customers/` is the **list** action of **CustomerViewSet**.
- **Before the view runs:** DRF runs the configured **authentication** class. The project uses **JWT** (e.g. `CmsUserJWTAuthentication`). It:
  1. Reads the `Authorization: Bearer <token>` header.
  2. Validates the token and reads `user_id` from the payload.
  3. **Database:** `CmsUser.objects.get(pk=user_id)` to load the app user.
  4. Wraps it in `CmsUserAuth` and sets `request.user` to that wrapper.

So the first DB hit for this request is **resolving the JWT to a user**.

#### Step 3 – Backend: ViewSet list and store scoping

- **Where:** `CustomerViewSet` in `backend/api/views.py`.
- **List flow:**
  1. DRF calls **`get_queryset(self)`** to get the base queryset for listing.
  2. In `CustomerViewSet.get_queryset()`:
     - Start from `Customer.objects.all()`.
     - If the request user is **admin** (`_is_admin(request)`), return that full queryset.
     - Otherwise get the current user’s **store_id** (`_get_request_user_store_id(request)` from `request.user.cms_user.store_id`).
     - If there is no store_id, return an empty queryset.
     - Else return `qs.filter(store_id=store_id)` so only customers for that store are visible.
  3. DRF then uses that queryset to serve the list (with optional pagination). No extra query here beyond the filtered queryset.

#### Step 4 – Backend: Serialization and response

- **Where:** DRF uses **`CustomerSerializer`** (`backend/api/serializers.py`) for the `Customer` model.
- **Logic:**
  - For each `Customer` in the (already filtered) queryset, the serializer turns it into a dictionary with fields: `id`, `store`, `name`, `first_visit`, `contact_info`, `preferences`, `total_spend`.
  - The list of these dicts is rendered as JSON and sent in the HTTP response.

**Database:** The list query is a single **SELECT** on the `customers` table (with a `WHERE store_id = ...` when the user is not admin), plus the earlier **SELECT** for the user when validating the JWT. No writes.

#### Step 5 – Frontend: Store and render

- **Where:** `CustomerList.tsx` – in the `useEffect` and in `fetchCustomers()`, the response is received and `setCustomers(res.data)` is called.
- The component may also fetch stores with `axios.get(`${API}/stores/`)`, which goes through **StoreViewSet** and the same JWT + store‑scoping pattern (admin sees all stores; others see only their store).
- The table and filters are driven by `customers` and `stores` state; no further backend call is needed until the user edits, deletes, or navigates.

**End-to-end for customer list:**  
Browser (with JWT) → `GET /api/customers/` → Django → JWT auth → **DB: get user by id** → CustomerViewSet list → **get_queryset** (filter by store) → **DB: SELECT customers WHERE store_id = ?** → serialize with CustomerSerializer → JSON response → React sets state and renders the table.

---

## 3. Summary Diagram (Conceptual)

```
LOGIN:
  [Login form] → login() → POST /api/auth/login/ { email, password }
       → jwt_login → DB: SELECT user BY email → check_password
       → _login_response → JWT + user JSON
       → frontend: store tokens, set Authorization header

CUSTOMER LIST:
  [CustomerList mount] → GET /api/customers/ (Header: Bearer <access>)
       → JWT auth → DB: SELECT user BY id from token
       → CustomerViewSet.get_queryset() → filter by request user’s store_id
       → DB: SELECT customers WHERE store_id = ?
       → CustomerSerializer → JSON list
       → frontend: setCustomers(res.data) → render table
```

All other authenticated endpoints (stores, users, visit records, daily summaries, etc.) follow the same pattern: **JWT identifies the user**, then the view or viewset uses that user (and optionally store and role) to **scope the queryset** and optionally to **validate create/update** (e.g. store_id must match the user’s store). The frontend always uses the same `API` base URL and the same Axios instance that carries the JWT after login.
