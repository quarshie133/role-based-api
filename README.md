# 🔐 Role-Based User Management API

A secure REST API built with **Node.js**, **Express**, and **Mongoose** that implements Role-Based Access Control (RBAC). Users are assigned roles (`admin` or `user`) that determine what endpoints they can access. Admins can manage users — block, unblock, promote, and demote — with every action recorded in an audit log.

---

## 🚀 Features

- User registration and login with **JWT authentication**
- **Password hashing** with bcrypt
- **Role-based access control** — `admin` and `user` roles
- Admin-only endpoints for user management
- **Block / Unblock** users with reasons
- **Promote / Demote** users between roles
- **Audit Log** — every admin action is recorded with who did it, when, and why
- Blocked users cannot log in or access protected routes
- Users cannot change their own role
- Admins cannot block or demote themselves

---

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT generation and verification |
| dotenv | Environment variable management |
| Nodemon | Auto-restart during development |

---

## 📁 Project Structure

```
role-based-api/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Signup and login logic
│   ├── adminController.js     # Admin-only actions
│   └── userController.js      # Regular user profile actions
├── middleware/
│   ├── authMiddleware.js      # JWT verification + block check
│   └── roleMiddleware.js      # Role authorization check
├── models/
│   ├── User.js                # User schema with role + block fields
│   └── AuditLog.js            # Audit log schema
├── routes/
│   ├── authRoutes.js          # Public auth routes
│   ├── adminRoutes.js         # Admin-only routes
│   └── userRoutes.js          # Logged-in user routes
├── .env                       # Environment variables (not committed)
├── .env.example               # Environment variable template
├── .gitignore
├── package.json
└── server.js                  # App entry point
```

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/) running locally **or** a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/role-based-api.git
cd role-based-api
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Create a `.env` file in the root directory:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/rolebasedapi
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
ADMIN_SECRET=admin_registration_secret_2024
```

> ⚠️ `ADMIN_SECRET` is required to register as an admin. Keep it private and never push it to GitHub.

**4. Start the development server**
```bash
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB Connected: localhost
```

---

## 📡 API Endpoints

### 🔓 Public Routes — No token required

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register as a user or admin |
| `POST` | `/api/auth/login` | Login and receive a JWT token |

---

### 👤 User Routes — Token required

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/me` | Get my own profile |
| `PUT` | `/api/users/me` | Update my own profile |

---

### 🛡️ Admin Routes — Token + Admin role required

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/users` | Get all registered users |
| `PATCH` | `/api/admin/users/:id/block` | Block a user |
| `PATCH` | `/api/admin/users/:id/unblock` | Unblock a user |
| `PATCH` | `/api/admin/users/:id/promote` | Promote user to admin |
| `PATCH` | `/api/admin/users/:id/demote` | Demote admin to user |
| `DELETE` | `/api/admin/users/:id` | Permanently delete a user |
| `GET` | `/api/admin/audit-logs` | View all audit logs |

---

## 📦 Request & Response Examples

### Register as Admin — `POST /api/auth/signup`

**Request Body:**
```json
{
  "username": "superadmin",
  "email": "admin@email.com",
  "password": "admin123",
  "adminSecret": "admin_registration_secret_2024"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "664abc123...",
    "username": "superadmin",
    "email": "admin@email.com",
    "role": "admin"
  }
}
```

---

### Register as Regular User — `POST /api/auth/signup`

**Request Body:**
```json
{
  "username": "regularuser",
  "email": "user@email.com",
  "password": "user123"
}
```

> No `adminSecret` needed — role defaults to `user`.

---

### Login — `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@email.com",
  "password": "admin123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "664abc123...",
    "username": "superadmin",
    "email": "admin@email.com",
    "role": "admin"
  }
}
```

---

### Block a User — `PATCH /api/admin/users/:id/block`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "reason": "Violated terms of service"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "regularuser has been blocked"
}
```

---

### View Audit Logs — `GET /api/admin/audit-logs`

**Response `200`:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "performedBy": { "username": "superadmin", "email": "admin@email.com" },
      "action": "USER_BLOCKED",
      "targetUser": { "username": "regularuser", "email": "user@email.com" },
      "details": "Admin blocked user user@email.com. Reason: Violated terms of service",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 🔒 How Authentication & Authorization Works

Every protected request goes through two layers of middleware:

```
REQUEST COMES IN
      ↓
protect middleware  →  Is there a token?     No  → 401 Unauthorized
                   →  Is token valid?        No  → 401 Invalid token
                   →  Is user blocked?       Yes → 403 Account blocked
      ↓ Passed
authorize('admin') →  Is role = admin?       No  → 403 Access denied
      ↓ Passed
Controller runs → Action logged to AuditLog
```

### Sending a Token in Postman

Add this to your request **Headers**:

| Key | Value |
|---|---|
| `Authorization` | `Bearer your_token_here` |

---

## ✅ User Schema & Validation

| Field | Type | Required | Notes |
|---|---|---|---|
| `username` | String | ✅ Yes | Min 3 characters, unique |
| `email` | String | ✅ Yes | Valid email format, unique |
| `password` | String | ✅ Yes | Min 6 characters, hashed before saving |
| `role` | String | ❌ No | `user` or `admin`, defaults to `user` |
| `isBlocked` | Boolean | ❌ No | Defaults to `false` |
| `blockedReason` | String | ❌ No | Set when user is blocked |
| `blockedAt` | Date | ❌ No | Timestamp of when user was blocked |

---

## 📋 Audit Log Actions

| Action | When It's Recorded |
|---|---|
| `USER_REGISTERED` | Any new user signs up |
| `USER_LOGGED_IN` | Any user logs in |
| `USER_BLOCKED` | Admin blocks a user |
| `USER_UNBLOCKED` | Admin unblocks a user |
| `USER_PROMOTED` | Admin promotes a user to admin |
| `USER_DEMOTED` | Admin demotes an admin to user |
| `USER_DELETED` | Admin permanently deletes a user |

---

## 📊 HTTP Status Codes Used

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request — validation error or invalid action |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — blocked account or insufficient role |
| `404` | Not Found — user doesn't exist |
| `500` | Internal Server Error |

---

## 🔴 Security Rules

- Admins **cannot block themselves**
- Admins **cannot demote themselves**
- Admins **cannot delete themselves**
- Admins **cannot block other admins**
- Users **cannot change their own role**
- Blocked users **cannot log in** even with a valid token
- Admin registration requires a secret key set in `.env`

---

## 🧪 Testing

All endpoints were tested using [Postman](https://www.postman.com/).

### Recommended Test Order
1. Register an admin account (with `adminSecret`)
2. Register a regular user account (no `adminSecret`)
3. Login as admin → copy the token
4. Use admin token to get all users
5. Block the regular user
6. Try logging in as the blocked user → should get `403`
7. Unblock the user
8. Promote the regular user to admin
9. View audit logs to see all recorded actions

---

## 📌 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`, `24h`) |
| `ADMIN_SECRET` | Secret key required to register as admin |

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙋‍♂️ Author

Built as a backend learning assignment covering role-based access control, JWT authentication, admin user management, middleware chaining, and audit logging with Node.js, Express, and MongoDB.
