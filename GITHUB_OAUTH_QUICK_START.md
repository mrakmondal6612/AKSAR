<!-- 
  QUICK START GUIDE FOR GITHUB OAUTH TESTING
  
  This guide provides a quick way to test GitHub OAuth authentication locally.
  Follow these steps to get everything running in 5-10 minutes.
-->

# GitHub OAuth - Quick Start Guide

## 5-Minute Setup

### Step 1: Get GitHub OAuth Credentials (2 min)

1. Visit: https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Fill in:
   ```
   Application name: AKSAR Dev
   Homepage URL: http://localhost:5173
   Authorization callback URL: http://localhost:8001/api/v1/user/signup-github/callback
   ```
3. Create app and copy:
   - **Client ID** 
   - **Client Secret** (click "Generate a new client secret")

### Step 2: Configure Backend (2 min)

1. Edit `backend/.env`:
   ```env
   GITHUB_CLIENT_ID=your_copied_client_id
   GITHUB_CLIENT_SECRET=your_copied_client_secret
   BACKEND_DOMAIN="http://localhost:8001/api/v1"
   ```

2. Verify other required variables exist:
   ```env
   PORT=8001
   MONGODB_URI="your_mongodb_uri"
   JWT_SECRET="your_secret_key"
   PUBLIC_FRONTEND_DOMAIN="http://localhost:5173"
   ```

### Step 3: Configure Frontend (1 min)

1. Edit `frontend/.env`:
   ```env
   VITE_PUBLIC_COURSE_AKSAR_USER_API="http://localhost:8001/api/v1/user"
   ```

### Step 4: Start Backend (start watching logs)

```bash
cd backend
npm install
npm run dev
```

You should see: `Server started on port: 8001`

### Step 5: Start Frontend (in new terminal)

```bash
cd frontend
npm install
npm run dev
```

You should see: `http://localhost:5173`

---

## Testing GitHub Login

1. Open http://localhost:5173 in your browser
2. Click **Login** button
3. Click **GitHub icon** (with cat logo)
4. Authorize application on GitHub
5. You should be automatically logged in! 🎉

---

## Testing GitHub Signup

1. Open http://localhost:5173 in your browser
2. Click **Sign Up** button
3. Click **GitHub icon** (with cat logo)
4. Authorize application on GitHub
5. New account created and logged in! 🎉

---

## Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| "Redirect URI mismatch" | Check GitHub OAuth app callback URL matches exactly: `http://localhost:8001/api/v1/user/signup-github/callback` |
| GitHub button not working | Verify `VITE_PUBLIC_COURSE_AKSAR_USER_API` is set in `frontend/.env` |
| "Invalid credentials" | Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct in `backend/.env` |
| Not logged in after auth | Check browser console for errors, look at backend logs |
| Stuck on GitHub page | Clear browser cookies and try again |

---

## What Happens Behind the Scenes

```
1. User clicks GitHub button
        ↓
2. Frontend redirects to: http://localhost:8001/api/v1/user/signup-github
        ↓
3. Backend redirects to: GitHub OAuth page
        ↓
4. User authorizes application
        ↓
5. GitHub redirects to: http://localhost:8001/api/v1/user/signup-github/callback
        ↓
6. Backend verifies credentials and creates/finds user
        ↓
7. Backend redirects to: http://localhost:5173?token=<jwt-token>
        ↓
8. Frontend extracts token and logs in user
        ↓
✓ User is now logged in!
```

---

## Next Steps After Testing

### If Everything Works ✓
- Proceed to production deployment
- Follow: [GITHUB_OAUTH_SETUP.md](./GITHUB_OAUTH_SETUP.md)

### If Something Breaks ✗
1. Check backend terminal for error messages
2. Open browser DevTools → Console tab
3. Check browser Network tab to see API calls
4. Review [GITHUB_OAUTH_SETUP.md](./GITHUB_OAUTH_SETUP.md) troubleshooting section

---

## Environment Files Reference

**backend/.env** should have:
```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
BACKEND_DOMAIN="http://localhost:8001/api/v1"
PORT=8001
MONGODB_URI=...
JWT_SECRET=...
PUBLIC_FRONTEND_DOMAIN="http://localhost:5173"
PUBLIC_GMAIL=...
MAILER_HOST=...
MAILER_PORT=...
MAILER_USER=...
MAILER_PASS=...
```

**frontend/.env** should have:
```env
VITE_PUBLIC_COURSE_AKSAR_USER_API="http://localhost:8001/api/v1/user"
VITE_PUBLIC_COURSE_AKSAR_COURSE_API="http://localhost:8001/api/v1/course"
VITE_PUBLIC_COURSE_AKSAR_VIDEO_API="http://localhost:8001/api/v1/video"
```

---

## File Checklist

| File | Should Have | Status |
|------|-----------|--------|
| `backend/src/controllers/auth/githubAuth.controllers.ts` | GitHub strategy config | ✓ Already exists |
| `backend/src/routes/user.route.ts` | GitHub routes | ✓ Already exists |
| `backend/src/server.ts` | Passport initialization | ✓ Already exists |
| `frontend/src/components/modals/LoginModal.tsx` | GitHub button | ✓ Already exists |
| `frontend/src/components/modals/SignupModal.tsx` | GitHub button | ✓ Already exists |
| `frontend/src/context/authContext.tsx` | Token handling | ✓ Already exists |
| `backend/.env` | GitHub credentials | ⚠️ Need to add |
| `frontend/.env` | API URL | ⚠️ Need to add |

---

## Support

- Stuck? Review [GITHUB_OAUTH_SETUP.md](./GITHUB_OAUTH_SETUP.md) for detailed explanations
- GitHub Docs: https://docs.github.com/en/developers/apps/building-oauth-apps
- Passport GitHub: http://www.passportjs.org/strategies/github/
