<!-- 
  GITHUB OAUTH ENVIRONMENT VARIABLES REFERENCE
  
  This is a checklist and reference guide for setting up GitHub OAuth in AKSAR.
  Copy the required variables to your .env files in both backend and frontend.
-->

# GitHub OAuth - Environment Variables Checklist

## Backend Configuration (`backend/.env`)

### Required for GitHub OAuth:

```env
# GitHub OAuth Credentials (from GitHub Developer Settings)
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>

# Backend Domain (must match GitHub OAuth callback URL)
BACKEND_DOMAIN="http://localhost:8001/api/v1"   # Development
# BACKEND_DOMAIN="https://yourdomain.com/api/v1"   # Production
```

### Get These Values From:
1. Go to: https://github.com/settings/developers
2. Click: OAuth Apps → New OAuth App
3. Fill in the form:
   - Application name: `AKSAR Dev` or `AKSAR`
   - Homepage URL: `http://localhost:5173` (dev) or `https://yourdomain.com` (prod)
   - Authorization callback URL: `{BACKEND_DOMAIN}/user/signup-github/callback`
4. Copy the **Client ID** and generate **Client Secret**

### Other Required Backend Variables:

```env
# Server Configuration
PORT=8001

# Database
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.kycma.mongodb.net/<db_name>"

# JWT Configuration
JWT_SECRET="your-secure-jwt-secret-key"

# Frontend URLs
PUBLIC_FRONTEND_DOMAIN="http://localhost:5173"                    # Development
# PUBLIC_FRONTEND_DOMAIN="https://yourdomain.com"                 # Production

PUBLIC_FRONTEND_SIGNUP_ROUTE="http://localhost:5173/signup"       # Development
# PUBLIC_FRONTEND_SIGNUP_ROUTE="https://yourdomain.com/signup"    # Production

# Email Configuration (for password notification after GitHub signup)
PUBLIC_GMAIL="your-public-email@gmail.com"
MAILER_HOST="sandbox.smtp.mailtrap.io"
MAILER_PORT=2525
MAILER_USER="your-mailtrap-user"
MAILER_PASS="your-mailtrap-password"
```

---

## Frontend Configuration (`frontend/.env`)

### Required for GitHub OAuth:

```env
# API Endpoint for GitHub OAuth buttons
VITE_PUBLIC_COURSE_YUGA_USER_API="http://localhost:8001/api/v1/user"    # Development
# VITE_PUBLIC_COURSE_YUGA_USER_API="https://yourdomain.com/api/v1/user"  # Production

# Other API Endpoints
VITE_PUBLIC_COURSE_YUGA_COURSE_API="http://localhost:8001/api/v1/course"
VITE_PUBLIC_COURSE_YUGA_VIDEO_API="http://localhost:8001/api/v1/video"
```

---

## Quick Validation Checklist

### Backend Setup
- [ ] `GITHUB_CLIENT_ID` is set in `backend/.env`
- [ ] `GITHUB_CLIENT_SECRET` is set in `backend/.env`
- [ ] `BACKEND_DOMAIN` is set to your backend URL
- [ ] `BACKEND_DOMAIN` callback URL matches GitHub OAuth App settings
- [ ] `PUBLIC_FRONTEND_DOMAIN` is set
- [ ] Passport is initialized in `backend/src/server.ts`
- [ ] GitHub strategy is configured in `backend/src/controllers/auth/githubAuth.controllers.ts`
- [ ] GitHub routes exist in `backend/src/routes/user.route.ts`

### Frontend Setup
- [ ] `VITE_PUBLIC_COURSE_YUGA_USER_API` is set to backend user API
- [ ] GitHub icon button exists in LoginModal.tsx
- [ ] GitHub icon button exists in SignupModal.tsx
- [ ] `handleGithubBtn()` function is defined and functional
- [ ] Auth context properly handles URL tokens in `authContext.tsx`

---

## Common Mistakes to Avoid

❌ **DON'T:**
- Commit `.env` files to git
- Use the same credentials for dev and production
- Forget to update `BACKEND_DOMAIN` when deploying
- Share your `GITHUB_CLIENT_SECRET` publicly

✅ **DO:**
- Use `.env.local` for local development (gitignored)
- Create separate GitHub OAuth Apps for dev and production
- Match callback URLs exactly (including protocol: http/https)
- Regenerate Client Secret if accidentally exposed
- Store `GITHUB_CLIENT_SECRET` securely (use environment variables)

---

## Testing the Setup

### Test in Development:

```bash
# Terminal 1 - Start Backend
cd backend
npm install
npm run dev
# Backend should run on: http://localhost:8001

# Terminal 2 - Start Frontend
cd frontend
npm install
npm run dev
# Frontend should run on: http://localhost:5173
```

### Test GitHub Authentication:

1. Open http://localhost:5173 in browser
2. Click **Login** or **Sign Up**
3. Click the **GitHub** icon button
4. Authorize the application on GitHub
5. You should be redirected back and logged in automatically

---

## Variable Reference by File

### backend/src/controllers/auth/githubAuth.controllers.ts
```typescript
// Uses these environment variables:
- process.env.GITHUB_CLIENT_ID
- process.env.GITHUB_CLIENT_SECRET
- process.env.BACKEND_DOMAIN
- process.env.PUBLIC_FRONTEND_DOMAIN
- process.env.JWT_SECRET
```

### frontend/src/context/authContext.tsx
```typescript
// Token extracted from URL and stored in cookies
// Automatically handles: ?token=<jwt-token>
```

### frontend/src/components/modals/LoginModal.tsx & SignupModal.tsx
```typescript
// Uses this environment variable:
- VITE_PUBLIC_COURSE_YUGA_USER_API (accessed via USER_API constant)
```

---

## Production Deployment Checklist

- [ ] Create new GitHub OAuth App for production domain
- [ ] Update `backend/.env` with production credentials
- [ ] Update `BACKEND_DOMAIN` to production URL (use https://)
- [ ] Update `PUBLIC_FRONTEND_DOMAIN` to production URL (use https://)
- [ ] Update `frontend/.env` with production API URL
- [ ] Ensure SSL certificate is valid for production domain
- [ ] Test authentication flow in production environment
- [ ] Monitor backend logs for any errors
- [ ] Verify cookies are set with secure flag in production

