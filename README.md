# 💧 Refill Web

> A full-stack water delivery ordering platform — browse refill stations, place orders, schedule deliveries, and track shipments in real time.

![Django](https://img.shields.io/badge/Django-4.1-092E20?style=flat&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat&logo=mysql&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-3.14-red?style=flat)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Project Structure](#2-project-structure)
3. [Quick Start](#3-quick-start)
4. [Configuration](#4-configuration)
5. [API Endpoints](#5-api-endpoints)
6. [Database Schema](#6-database-schema)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Development vs Production](#8-development-vs-production)
9. [Troubleshooting](#9-troubleshooting)
10. [Dependencies](#10-dependencies)

---

## 1. Overview

**Refill Web** is a full-stack web application built with:

| Layer         | Technology                           |
| ------------- | ------------------------------------ |
| Backend       | Django 4.1 + Django REST Framework   |
| Frontend      | React 18 + Vite 5                    |
| Database      | MySQL via XAMPP (localhost:3306)     |
| Auth          | Token Authentication (DRF AuthToken) |
| Communication | REST API with CORS support           |

---

## 2. Project Structure

```
refill_web/
├── backend/                        # Django REST API
│   ├── config/
│   │   ├── settings.py             # DB, CORS, Auth config
│   │   ├── urls.py                 # URL routing
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── users/                  # Auth, profiles, token login/logout
│   │   ├── products/               # Product catalog
│   │   └── orders/                 # Order management
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                       # React + Vite SPA
│   └── src/
│       ├── api/
│       │   ├── client.js           # Axios + token auth interceptor
│       │   ├── products.js
│       │   └── orders.js
│       ├── context/
│       │   ├── AuthContext.jsx     # Global auth state
│       │   └── OrdersContext.jsx   # Global orders state
│       ├── components/
│       │   ├── AppRouter.jsx       # Page routing
│       │   └── AppShell.jsx        # Sidebar + header layout
│       └── pages/
│           ├── WelcomePage.jsx
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── HomePage.jsx
│           ├── BrowsePage.jsx
│           ├── OrderPage.jsx
│           ├── SchedulePage.jsx
│           ├── HistoryPage.jsx
│           ├── TrackPage.jsx
│           └── ProfilePage.jsx
│
└── README.md
```

---

## 3. Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **XAMPP** with MySQL running on `localhost:3306`

### Backend

```bash
# 1. Set up virtual environment
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create database (XAMPP MySQL must be running)
mysql -u root
CREATE DATABASE refill_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# 4. Migrate and create superuser
python manage.py migrate
python manage.py createsuperuser

# 5. Start server
python manage.py runserver
```

| URL                           | Description  |
| ----------------------------- | ------------ |
| `http://localhost:8000`       | Backend API  |
| `http://localhost:8000/admin` | Django Admin |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

| URL                     | Description |
| ----------------------- | ----------- |
| `http://localhost:5173` | React App   |

---

## 4. Configuration

### Environment Variables

**`backend/.env`**

```env
DEBUG=True
SECRET_KEY=django-insecure-change-this-in-production
DB_NAME=refill_web
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
```

**`frontend/.env`**

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Database (`settings.py`)

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'refill_web',
        'USER': 'root',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'"
        }
    }
}
```

### CORS & CSRF (`settings.py`)

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ← must be first
    'django.middleware.common.CommonMiddleware',
    # ...
]
```

### Authentication (`settings.py`)

```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework.authtoken',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}
```

---

## 5. API Endpoints

### Auth — `/api/auth/`

| Method  | Endpoint                         | Description                  |
| ------- | -------------------------------- | ---------------------------- |
| `POST`  | `/api/auth/token/login/`         | Login — returns `auth_token` |
| `POST`  | `/api/auth/token/logout/`        | Logout — invalidates token   |
| `POST`  | `/api/auth/users/`               | Register new user            |
| `GET`   | `/api/auth/users/me/`            | Get current user info        |
| `GET`   | `/api/auth/profiles/my_profile/` | Get current user profile     |
| `PATCH` | `/api/auth/profiles/{id}/`       | Update user profile          |

### Products — `/api/products/`

| Method   | Endpoint                    | Description               |
| -------- | --------------------------- | ------------------------- |
| `GET`    | `/api/products/`            | List all products         |
| `POST`   | `/api/products/`            | Create product _(admin)_  |
| `GET`    | `/api/products/{id}/`       | Get product detail        |
| `PATCH`  | `/api/products/{id}/`       | Update product _(admin)_  |
| `DELETE` | `/api/products/{id}/`       | Delete product _(admin)_  |
| `GET`    | `/api/products/categories/` | List categories           |
| `POST`   | `/api/products/categories/` | Create category _(admin)_ |

### Orders — `/api/orders/`

| Method   | Endpoint            | Description                        |
| -------- | ------------------- | ---------------------------------- |
| `GET`    | `/api/orders/`      | List orders (own, or all if staff) |
| `POST`   | `/api/orders/`      | Create new order                   |
| `GET`    | `/api/orders/{id}/` | Get order detail                   |
| `PATCH`  | `/api/orders/{id}/` | Update order status                |
| `DELETE` | `/api/orders/{id}/` | Delete order                       |

---

## 6. Database Schema

### `UserProfile`

| Field         | Type                           |
| ------------- | ------------------------------ |
| `user`        | ForeignKey → Django User (1:1) |
| `phone`       | CharField, optional            |
| `address`     | CharField, optional            |
| `city`        | CharField, optional            |
| `state`       | CharField, optional            |
| `postal_code` | CharField, optional            |
| `created_at`  | DateTimeField, auto            |
| `updated_at`  | DateTimeField, auto            |

### `Category`

| Field         | Type                |
| ------------- | ------------------- |
| `name`        | CharField           |
| `description` | TextField, optional |
| `created_at`  | DateTimeField, auto |

### `Product`

| Field         | Type                         |
| ------------- | ---------------------------- |
| `name`        | CharField                    |
| `description` | TextField, optional          |
| `category`    | ForeignKey → Category        |
| `price`       | DecimalField                 |
| `stock`       | IntegerField                 |
| `image`       | ImageField, optional         |
| `is_active`   | BooleanField, default `True` |
| `created_at`  | DateTimeField, auto          |
| `updated_at`  | DateTimeField, auto          |

### `Order`

| Field              | Type                                                             |
| ------------------ | ---------------------------------------------------------------- |
| `user`             | ForeignKey → User                                                |
| `status`           | `pending` / `processing` / `shipped` / `delivered` / `cancelled` |
| `total_price`      | DecimalField, auto-computed                                      |
| `shipping_address` | CharField                                                        |
| `notes`            | TextField, optional                                              |
| `created_at`       | DateTimeField, auto                                              |
| `updated_at`       | DateTimeField, auto                                              |

### `OrderItem`

| Field        | Type                                  |
| ------------ | ------------------------------------- |
| `order`      | ForeignKey → Order                    |
| `product`    | ForeignKey → Product                  |
| `quantity`   | IntegerField                          |
| `price`      | DecimalField (snapshot at order time) |
| `created_at` | DateTimeField, auto                   |

---

## 7. Frontend Architecture

### Pages

| Page           | Route      | Description                                     |
| -------------- | ---------- | ----------------------------------------------- |
| `WelcomePage`  | `welcome`  | Landing — Sign In / Create Account              |
| `LoginPage`    | `login`    | Username + password form                        |
| `RegisterPage` | `register` | Create account, auto-login on success           |
| `HomePage`     | `home`     | Dashboard: stats, quick actions, recent orders  |
| `BrowsePage`   | `browse`   | Station grid with search, filters, and sort     |
| `OrderPage`    | `order`    | 3-step order flow: configure → review → confirm |
| `SchedulePage` | `schedule` | Recurring delivery scheduler                    |
| `HistoryPage`  | `history`  | Orders table with Track / Reorder actions       |
| `TrackPage`    | `track`    | Live status timeline                            |
| `ProfilePage`  | `profile`  | User info, stats, settings, sign out            |

### Auth Flow

1. User submits credentials on `LoginPage`
2. `POST /api/auth/token/login/` returns `auth_token`
3. Token stored in `localStorage` as `authToken`, user info as `authUser`
4. Every request attaches `Authorization: Token <token>` via Axios interceptor
5. On `401` response, `localStorage` is cleared and app reloads to `LoginPage`
6. Logout calls `POST /api/auth/token/logout/` then clears `localStorage`

### API Client (`src/api/client.js`)

```javascript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers["Authorization"] = `Token ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
apiClient.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.location.reload();
  }
  return Promise.reject(error);
});
```

---

## 8. Development vs Production

| Setting                 | Development                 | Production                       |
| ----------------------- | --------------------------- | -------------------------------- |
| `DEBUG`                 | `True`                      | `False`                          |
| `ALLOWED_HOSTS`         | `localhost, 127.0.0.1`      | `yourdomain.com`                 |
| `CORS_ORIGINS`          | `http://localhost:5173`     | `https://yourdomain.com`         |
| `CSRF_COOKIE_SECURE`    | `False`                     | `True`                           |
| `SESSION_COOKIE_SECURE` | `False`                     | `True`                           |
| `VITE_API_BASE_URL`     | `http://localhost:8000/api` | `https://api.yourdomain.com/api` |
| Backend server          | `manage.py runserver`       | Gunicorn                         |
| Frontend                | `npm run dev`               | `npm run build` → serve `dist/`  |

### Production Build

```bash
# Backend
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000

# Frontend
npm run build
# Serve the dist/ folder via Nginx or Apache
```

---

## 9. Troubleshooting

### `Can't connect to MySQL server`

Ensure XAMPP is running and MySQL is started on port `3306`.

### `CORS policy blocked`

Verify `CORS_ALLOWED_ORIGINS` in `settings.py` matches your frontend URL exactly. Confirm `CorsMiddleware` is the **first** item in `MIDDLEWARE`.

### `403 Forbidden` on POST

Token is missing or invalid. Check `localStorage` has `authToken`. Verify `TokenAuthentication` is in `DEFAULT_AUTHENTICATION_CLASSES`.

### `401 Unauthorized`

User is not logged in or the token has been invalidated. The app will automatically clear storage and redirect to the login screen.

### `Failed to resolve import`

A page file is in the wrong folder. Ensure all files in `pages/`, `components/`, and `context/` are placed at the correct paths matching the import statements in `AppRouter.jsx`.

### Port already in use

```bash
# Django on alternate port
python manage.py runserver 8001

# Vite on alternate port
npm run dev -- --port 3000
```

---

## 10. Dependencies

### Backend

| Package               | Version | Purpose               |
| --------------------- | ------- | --------------------- |
| `Django`              | 4.2     | Web framework         |
| `djangorestframework` | 3.14    | REST API              |
| `django-cors-headers` | 4.0     | CORS support          |
| `mysqlclient`         | 2.2     | MySQL adapter         |
| `python-decouple`     | 3.8     | Environment variables |

### Frontend

| Package | Version | Purpose                 |
| ------- | ------- | ----------------------- |
| `react` | 18      | UI framework            |
| `vite`  | 5       | Build tool & dev server |
| `axios` | 1.6     | HTTP client             |

---

## License

MIT
