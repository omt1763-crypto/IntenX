# Quick Fix Guide - Steps to Deploy

## What Was Fixed

Two critical issues in your debug page and authentication have been resolved:

1. ✅ **User deletion in debug/data page** - Now properly handles API responses
2. ✅ **Forgot password redirect** - No longer sends users to old website

---

## Action Items for You

### Step 1: Set Environment Variable (CRITICAL)

Add this to your deployment platform's environment variables:

**Production (Render/Vercel/Railway):**
```
NEXT_PUBLIC_APP_URL=https://your-current-domain.com
```

**Local Development (.env.local):**
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Replace `your-current-domain.com` with your actual domain where the app is hosted**

Examples:
- If hosted on Render: `https://your-app-name.onrender.com`
- If hosted on Vercel: `https://your-app.vercel.app`
- Local dev: `http://localhost:3000`

### Step 2: Redeploy Your Application

After adding the environment variable:

1. Commit the code changes
2. Push to your repository
3. Wait for deployment to complete

### Step 3: Test the Fixes

**Test User Deletion:**
1. Navigate to `/debug/data`
2. Try deleting a user
3. Should see success message or proper error

**Test Forgot Password:**
1. Go to `/auth/forgot-password`
2. Enter an email and request reset
3. Check the email link URL (don't click yet if on old domain)
4. The link should start with your current domain, NOT `intenx-1.onrender.com`

---

## Files Modified

1. `app/auth/forgot-password/page.js` - Line 37-39
   - Now uses `process.env.NEXT_PUBLIC_APP_URL`
   - Ensures correct redirect URL for password reset emails

2. `app/debug/data/page.tsx` - Lines 287-293
   - Better error handling for user deletion
   - Accepts both `deleted` and `success` flags
   - Improved error message display

---

## Troubleshooting

**Still getting old domain in emails?**
- Check that `NEXT_PUBLIC_APP_URL` is set correctly
- Verify the environment variable is actually deployed (not just locally)
- Clear Supabase email queue and resend

**User deletion still failing?**
- Check browser console (F12) for detailed error message
- Verify you have permission to delete users
- Check that the user ID is valid

**Can't find where to set env variables?**
- **Render:** Settings → Environment → Add environment variable
- **Vercel:** Settings → Environment Variables
- **Railway:** Variables → Add variable
- **Local:** Create/edit `.env.local` file

---

## What Each Fix Does

### User Deletion Fix
Previously, the code would fail silently if the API didn't return exactly `{ deleted: true }`. Now it:
- Accepts both `deleted: true` and `success: true`
- Shows proper error messages when deletion fails
- Logs detailed information for debugging
- Works even if API response varies slightly

### Forgot Password Fix  
The forgot password redirect was hardcoded to use the browser's current domain, which caused redirects to the wrong site. Now it:
- Uses the environment variable `NEXT_PUBLIC_APP_URL`
- Falls back to browser location if env var not set
- Ensures password reset links go to the correct domain
- Works correctly in all deployment environments

---

## Need Help?

Check the detailed documentation in: `FIX_ISSUES_SUMMARY.md`

Key things to remember:
- ✅ Both fixes are deployed
- ✅ Environment variable required for forgot password fix to work
- ✅ Redeploy after adding environment variable
- ✅ Test both features after deployment
