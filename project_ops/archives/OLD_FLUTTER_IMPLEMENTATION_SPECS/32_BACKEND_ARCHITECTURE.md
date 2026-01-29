# Spayce - Backend Architecture

> **Document Purpose**: Complete specification of the backend API and infrastructure for recreation.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [API Endpoints](#api-endpoints)
5. [Authentication](#authentication)
6. [Database](#database)
7. [Configuration](#configuration)
8. [Deployment](#deployment)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPS                                │
│              (Flutter: macOS, iOS, Android, Windows, Web)           │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          FastAPI Server                             │
│                          (Python 3.11+)                             │
├─────────────────────────────────────────────────────────────────────┤
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│   │   Auth API    │  │   User API    │  │  Spaces API   │          │
│   │ /api/v1/auth  │  │ /api/v1/users │  │ /api/v1/spaces│          │
│   └───────┬───────┘  └───────┬───────┘  └───────┬───────┘          │
│           │                  │                  │                   │
│           └──────────────────┼──────────────────┘                   │
│                              │                                      │
│                    ┌─────────┴─────────┐                            │
│                    │  Firebase Admin   │                            │
│                    │   (Auth Verify)   │                            │
│                    └─────────┬─────────┘                            │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Neon PostgreSQL                               │
│                       (Cloud Database)                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. Client sends request with Firebase ID Token in Authorization header
2. FastAPI receives request
3. Dependency extracts and validates token via Firebase Admin SDK
4. If valid, request is processed
5. Response sent back to client
```

---

## Technology Stack

### Core Technologies

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.109.0 |
| Server | Uvicorn | 0.27.0 |
| Language | Python | 3.11+ |
| Database ORM | SQLAlchemy | 2.0.25 |
| Migrations | Alembic | 1.13.1 |
| Validation | Pydantic | 2.5.3 |
| Auth | Firebase Admin SDK | 6.4.0 |
| HTTP Client | httpx | 0.26.0 |

### Dependencies (requirements.txt)

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-dotenv==1.0.0
pydantic==2.5.3
pydantic-settings==2.1.0
firebase-admin==6.4.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
alembic==1.13.1
httpx==0.26.0
```

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   └── dependencies.py  # Auth dependencies
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py        # Application settings
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # SQLAlchemy models
│   └── services/
│       ├── __init__.py
│       └── firebase_auth.py # Firebase Admin wrapper
├── tests/
│   └── ...                  # Test files
├── .env                     # Environment variables
├── .env.example             # Example env file
├── requirements.txt         # Python dependencies
├── Dockerfile               # Docker configuration
└── pytest.ini              # Test configuration
```

---

## API Endpoints

### Base URL

```
Production: https://api.spayce.app/api/v1
Development: http://localhost:8000/api/v1
```

### Root Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/` | API info | No |
| GET | `/health` | Health check | No |

#### GET /
```json
{
  "message": "Spayce API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

#### GET /health
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### Authentication Endpoints

**Prefix**: `/api/v1/auth`

#### POST /verify

Verify a Firebase ID token.

**Request:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6..."
}
```

**Response (200):**
```json
{
  "valid": true,
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "email_verified": true
}
```

**Response (invalid token):**
```json
{
  "valid": false,
  "uid": null,
  "email": null,
  "email_verified": null
}
```

---

#### GET /me

Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response (200):**
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "display_name": "John Doe",
  "photo_url": "https://...",
  "email_verified": true,
  "provider": "google.com"
}
```

**Response (401):**
```json
{
  "detail": "Invalid or expired token"
}
```

---

#### GET /status

Check authentication status.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response (200):**
```json
{
  "authenticated": true,
  "uid": "firebase-user-id",
  "email": "user@example.com"
}
```

---

#### POST /refresh

Refresh authentication token (placeholder for future custom token implementation).

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response (200):**
```json
{
  "message": "Token is valid. Client should handle token refresh.",
  "uid": "firebase-user-id"
}
```

---

#### GET /health

Authentication service health check (no auth required).

**Response (200):**
```json
{
  "status": "healthy",
  "service": "authentication",
  "timestamp": "2026-01-17T13:30:00.000000"
}
```

---

### Pydantic Models

```python
class TokenVerifyRequest(BaseModel):
    token: str

class TokenVerifyResponse(BaseModel):
    valid: bool
    uid: Optional[str] = None
    email: Optional[str] = None
    email_verified: Optional[bool] = None

class UserProfileResponse(BaseModel):
    uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    email_verified: bool
    provider: str

class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
```

---

## Authentication

### Firebase Token Verification

```python
class FirebaseAuthService:
    _initialized = False
    
    @classmethod
    def initialize(cls):
        if cls._initialized:
            return
        
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        cls._initialized = True
    
    @classmethod
    async def verify_token(cls, token: str) -> Optional[dict]:
        try:
            decoded = auth.verify_id_token(token)
            return decoded
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return None
    
    @classmethod
    async def get_user(cls, uid: str) -> Optional[auth.UserRecord]:
        try:
            return auth.get_user(uid)
        except Exception as e:
            logger.error(f"Failed to get user: {e}")
            return None
```

### Auth Dependencies

```python
async def get_current_user(
    authorization: str = Header(None)
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )
    
    token = authorization.split(" ")[1]
    decoded = await FirebaseAuthService.verify_token(token)
    
    if not decoded:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    
    return decoded

async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    # Additional checks (e.g., user is not disabled)
    return current_user
```

---

## Database

### SQLAlchemy Models

#### User Model

```python
class User(Base):
    __tablename__ = "users"
    
    # Firebase UID as primary key
    uid = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    email_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # User preferences
    is_active = Column(Boolean, default=True)
```

### Database Schema

```sql
CREATE TABLE users (
    uid VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    display_name VARCHAR,
    photo_url VARCHAR,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
```

### Planned Tables (Future)

| Table | Purpose |
|-------|---------|
| `spaces` | User spaces metadata |
| `space_items` | Items within spaces |
| `profiles` | Browser profiles |
| `sync_state` | Cross-device sync tracking |

---

## Configuration

### Settings Class

```python
class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Spayce API"
    VERSION: str = "1.0.0"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: Union[list[str], str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:5000",
    ]
    
    # Firebase Settings
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    
    # Database Settings
    DATABASE_URL: str = "postgresql://user:password@localhost/spayce"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    class Config:
        env_file = ".env"
        case_sensitive = True
```

### Environment Variables

```env
# .env.example

# API Settings
API_V1_STR=/api/v1
PROJECT_NAME=Spayce API
VERSION=1.0.0

# CORS (comma-separated or JSON array)
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8080"]

# Firebase
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID=spayce-app

# Database
DATABASE_URL=postgresql://user:password@host:5432/spayce

# Security
SECRET_KEY=your-super-secret-key-change-this
```

---

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app ./app

# Run server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Running Locally

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Running in Production

```bash
# Run with production settings
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Health Checks

- **Root**: `GET /` - Returns API info
- **Health**: `GET /health` - Returns health status
- **Auth Health**: `GET /api/v1/auth/health` - Returns auth service status

---

## CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Allowed Origins

| Environment | Origins |
|-------------|---------|
| Development | `http://localhost:3000`, `http://localhost:8080` |
| Production | `https://app.spayce.app`, `https://spayce.app` |

---

## Error Handling

### Standard Error Response

```python
class HTTPException:
    status_code: int
    detail: str
```

### Common Error Codes

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

### Error Example

```json
{
  "detail": "Invalid or expired token"
}
```

---

## Logging

```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)
```

Log levels used:
- **INFO**: Request lifecycle, Firebase initialization
- **WARNING**: Non-critical issues
- **ERROR**: Token verification failures, database errors

---

## Future API Endpoints (Planned)

### Spaces API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/spaces` | List user's spaces |
| POST | `/api/v1/spaces` | Create space |
| GET | `/api/v1/spaces/{id}` | Get space details |
| PATCH | `/api/v1/spaces/{id}` | Update space |
| DELETE | `/api/v1/spaces/{id}` | Delete space |
| GET | `/api/v1/spaces/{id}/items` | List space items |
| POST | `/api/v1/spaces/{id}/items` | Add item to space |

### Sync API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/sync/status` | Get sync status |
| POST | `/api/v1/sync/push` | Push local changes |
| GET | `/api/v1/sync/pull` | Pull remote changes |

---

*Document Version: 1.0*  
*Last Updated: January 17, 2026*
