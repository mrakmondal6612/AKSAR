# GitHub OAuth Setup Guide for AKSAR

This guide provides step-by-step instructions to set up GitHub login authentication for the AKSAR application.

## Prerequisites
- GitHub account
- Administrative access to the AKSAR GitHub repository (optional, but recommended)
- Backend and frontend URLs (local or production)

---

## Step 1: Create GitHub OAuth Application

### 1.1 Navigate to GitHub Developer Settings
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. In the left sidebar, click **OAuth Apps**
3. Click the **New OAuth App** button

### 1.2 Fill in OAuth Application Details

Complete the OAuth application form with the following information:

| Field | Local Development | Production |
|-------|------------------|------------|
| **Application name** | AKSAR Dev (or your preferred name) | AKSAR |
| **Homepage URL** | `http://localhost:5173` | `https://yourdomain.com` |
| **Application description** | Course learning platform with GitHub authentication | Course learning platform with GitHub authentication |
| **Authorization callback URL** | `http://localhost:8001/api/v1/user/signup-github/callback` | `https://yourdomain.com/api/v1/user/signup-github/callback` |

**Important:** The callback URL must exactly match your backend GitHub callback route.

### 1.3 Generate Client Credentials

After creating the application:
1. Copy the **Client ID** (you'll see it immediately on the success page)
2. Click **Generate a new client secret**
3. Copy the **Client Secret** (you'll only see this once, so save it securely)

---

## Step 2: Configure Environment Variables

### 2.1 Backend Setup (.env file)

Create or update your backend `.env` file with the following GitHub OAuth variables:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

**Location:** `backend/.env`

**Example:**
```env
GITHUB_CLIENT_ID=Iv1.abc1234567890def
GITHUB_CLIENT_SECRET=abcdef1234567890ghijklmnopqrstuvwxyz1234
```

### 2.2 Backend Domain Configuration

Ensure your `BACKEND_DOMAIN` environment variable is correctly set:

```env
BACKEND_DOMAIN="http://localhost:8001/api/v1"  # Development
# OR
BACKEND_DOMAIN="https://yourdomain.com/api/v1"  # Production
```

This URL is used to construct the GitHub callback URL in the Passport strategy configuration.

### 2.3 Frontend Configuration (.env file)

The frontend uses the `VITE_PUBLIC_COURSE_YUGA_USER_API` variable to make API calls:

```env
VITE_PUBLIC_COURSE_YUGA_USER_API="http://localhost:8001/api/v1/user"  # Development
# OR
VITE_PUBLIC_COURSE_YUGA_USER_API="https://yourdomain.com/api/v1/user"  # Production
```

**Location:** `frontend/.env`

---

## Step 3: Verify Backend Implementation

### 3.1 Check Dependencies

Ensure the following npm packages are installed in the backend:

```bash
npm list passport passport-github2
```

Should output:
```
passport@^0.7.0
passport-github2@^0.1.12
```

If not installed, run:
```bash
npm install passport passport-github2
```

### 3.2 Verify Passport Configuration

Check that `backend/src/controllers/auth/githubAuth.controllers.ts` contains:

1. **GitHub Strategy Configuration** - Initializes Passport with GitHub credentials
2. **User serialization/deserialization** - Handles session management
3. **Request handlers:**
   - `handleGithubSignUpFunction` - Initiates GitHub OAuth flow
   - `handleGithubSignUpCallbackFunction` - Handles callback after GitHub authentication

### 3.3 Verify Routes

Check that `backend/src/routes/user.route.ts` has these routes defined:

```typescript
userRoute.get("/signup-github", handleGithubSignUpFunction);
userRoute.get("/signup-github/callback", handleGithubSignUpCallbackFunction);
```

### 3.4 Server Configuration

Verify that `backend/src/server.ts` initializes Passport:

```typescript
import passport from "passport";

app.use(passport.initialize());
```

---

## Step 4: Verify Frontend Implementation

### 4.1 GitHub Login Button

Check that login/signup modals have GitHub authentication buttons:

- **Files to verify:**
  - `frontend/src/components/modals/LoginModal.tsx`
  - `frontend/src/components/modals/SignupModal.tsx`

- **Button handler function:**
  ```typescript
  const handelGithubBtn = () => {
    try {
      window.location.href = `${USER_API}/signup-github`;
    } catch (error: any) {
      ErrorToast("An error occurred Github OAuth" + error);
    }
  }
  ```

### 4.2 Token Handling

Verify that the auth context (`frontend/src/context/authContext.tsx`) handles URL tokens:

```typescript
useEffect(() => {
  const handleTokenAndLoadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      setTokenCookie(tokenFromUrl);
      // ... rest of token handling
    }
  };
}, []);
```

---

## Step 5: Test the GitHub Authentication Flow

### 5.1 Start Backend

```bash
cd backend
npm install
npm run dev
```

The backend should start on `http://localhost:8001`

### 5.2 Start Frontend

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

The frontend should start on `http://localhost:5173`

### 5.3 Test Login Flow

1. Navigate to `http://localhost:5173`
2. Click the **Login** button
3. Look for the **GitHub Icon** button in the login modal
4. Click the GitHub button
5. You'll be redirected to GitHub to authorize the application
6. After authorization, you'll be redirected back to the application with a token
7. The application will automatically log you in and set a cookie

### 5.4 Test Signup Flow

1. Navigate to `http://localhost:5173/signup`
2. Look for the **GitHub Icon** button in the signup modal
3. Follow the same flow as login
4. First-time users will create a new account with GitHub data

---

## Step 6: GitHub Scopes

The current implementation requests the following GitHub scopes:

```typescript
passport.authenticate("github", { scope: ["user:email"] })
```

### Available Scopes

| Scope | Permission |
|-------|-----------|
| `user:email` | Read user email addresses |
| `read:user` | Read user profile data (default) |

**Current Setup:** Only `user:email` is requested (minimal permissions for security)

To add more scopes in the future, modify the scope array in:
- File: `backend/src/controllers/auth/githubAuth.controllers.ts`
- Function: `handleGithubSignUpFunction`

---

## Step 7: User Data Mapping

When a user authenticates via GitHub, the following data is extracted:

| GitHub Data | AKSAR Field | Notes |
|------------|-----------|-------|
| `profile.emails[0].value` | `email` | Primary GitHub email or fetched via API |
| `profile.displayName` | `firstName`, `lastName` | Split by spaces |
| `profile.username` | `userName` | Replaces spaces with underscores |
| `profile.photos[0].value` | `profileImageUrl` | GitHub avatar URL |

### Default Values
- **Role:** `STUDENT`
- **Email Verification:** `true` (auto-verified via GitHub)
- **Password:** Auto-generated and sent via email

---

## Step 8: Security Considerations

### 8.1 Client Secret Protection
- **Never commit** the `GITHUB_CLIENT_SECRET` to version control
- Use `.env` files and add `.env` to `.gitignore`
- Always use environment variables in production

### 8.2 HTTPS for Production
- GitHub OAuth requires HTTPS for production deployments
- Ensure your production domain has a valid SSL certificate
- Update the callback URL to use `https://`

### 8.3 Token Security
- JWT tokens are stored in HTTP-only cookies (managed by `cookieService`)
- Tokens expire in 15 days (configurable in `githubAuth.controllers.ts`)

### 8.4 CORS Configuration
Verify CORS is properly configured in `backend/src/server.ts`:
```typescript
app.use(cors({
    origin: process.env.PUBLIC_FRONTEND_DOMAIN || "http://localhost:5173",
    optionsSuccessStatus: 200
}));
```

---

## Troubleshooting

### Issue: "Redirect URI mismatch"
**Cause:** The callback URL in GitHub settings doesn't match the backend URL
**Solution:**
1. Go to GitHub OAuth App settings
2. Update "Authorization callback URL" to match your `BACKEND_DOMAIN/user/signup-github/callback`
3. Ensure the protocol (http/https) matches

### Issue: "No email found in GitHub profile"
**Cause:** User's GitHub email is private
**Solution:**
1. The app fetches email via GitHub API as fallback
2. If still failing, user must make email public on GitHub

### Issue: "Client ID or Client Secret incorrect"
**Cause:** Environment variables not set correctly
**Solution:**
1. Verify `.env` file in backend root directory
2. Check that `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
3. Restart backend server after changing `.env`
4. Use `.env.local` for local development to avoid committing secrets

### Issue: "Invalid state" error during callback
**Cause:** Passport session state mismatch
**Solution:**
1. Clear browser cookies
2. Restart the backend server
3. Try authentication flow again

---

## Next Steps

### Custom Workflow Enhancements
1. Add GitHub profile link to user profile
2. Fetch and display user's GitHub repositories
3. Add GitHub username to user profile
4. Implement GitHub team-based access control

### Production Deployment
1. Create a production GitHub OAuth App on GitHub
2. Update production `.env` with production credentials
3. Set `BACKEND_DOMAIN` to production URL
4. Set `PUBLIC_FRONTEND_DOMAIN` to production frontend URL
5. Deploy frontend and backend to production servers

---

## Useful Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Passport.js GitHub Strategy](http://www.passportjs.org/strategies/github/)
- [AKSAR Backend GitHub Auth](./backend/src/controllers/auth/githubAuth.controllers.ts)
- [AKSAR Frontend Auth Context](./frontend/src/context/authContext.tsx)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the GitHub OAuth documentation
3. Check backend console logs for detailed errors
4. Verify all environment variables are set correctly
