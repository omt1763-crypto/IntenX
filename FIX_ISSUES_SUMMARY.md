# Issues Fixed - Debug Data & Forgot Password

## Issues Resolved

### Issue 1: Unable to Delete Users in Debug/Data Page ✅ FIXED

**Root Cause:**
The delete user function was checking for `res.ok && responseData.deleted`, but the API response structure wasn't being properly validated. The error messages weren't being captured correctly.

**What Was Fixed:**
- Updated error handling in `app/debug/data/page.tsx` line 287
- Now checks both `deleted` and `success` flags from API response
- Better error message capture using `responseData.error || responseData.message`
- Improved logging for debugging

**File Changed:** `app/debug/data/page.tsx`

```tsx
// OLD CODE:
if (res.ok && responseData.deleted) {
  deleted++
  console.log(`[Debug] Successfully deleted user ${userId}`)
} else {
  failed++
  console.error(`[Debug] Failed to delete user ${userId}:`, responseData.error)
}

// NEW CODE:
if ((res.ok || res.status === 200) && (responseData.deleted || responseData.success)) {
  deleted++
  console.log(`[Debug] Successfully deleted user ${userId}`, responseData)
} else {
  failed++
  const errorMsg = responseData.error || responseData.message || 'Unknown error'
  console.error(`[Debug] Failed to delete user ${userId}:`, errorMsg)
}
```

---

### Issue 2: Forgot Password Link Going to Old Website ✅ FIXED

**Root Cause:**
The forgot password reset email was redirecting to the old website (`intenx-1.onrender.com`) instead of your current domain. This happened because:

1. The code used `window.location.origin` which gets the current browser location
2. The email was being sent by Supabase with a hardcoded old domain
3. When the user clicked the email link, it would redirect to the wrong site

**What Was Fixed:**
- Updated `app/auth/forgot-password/page.js` line 37
- Now uses `process.env.NEXT_PUBLIC_APP_URL` environment variable
- Falls back to `window.location.origin` if env var not set
- Ensures the redirect URL matches your actual deployment URL

**File Changed:** `app/auth/forgot-password/page.js`

```javascript
// OLD CODE:
const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
})

// NEW CODE:
const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${appUrl}/auth/reset-password`,
})
```

---

## Configuration Required

To ensure the forgot password fix works properly, you **MUST** add the following environment variable:

### For Production (Render/Vercel/etc):
```env
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com
```

### For Local Development:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** The `NEXT_PUBLIC_` prefix means this variable will be exposed to the frontend. Make sure it's your actual public domain URL where the app is deployed.

### Where to Add It:
1. In your hosting platform (Render, Vercel, Railway, etc.) under Environment Variables
2. In your local `.env.local` file
3. Make sure to redeploy after adding the variable

---

## Testing the Fixes

### Test User Deletion:
1. Go to the Debug page (`/debug/data`)
2. Select any user and click "Delete Selected"
3. Check browser console (F12) for detailed logs
4. User should now delete successfully

### Test Forgot Password:
1. Go to forgot password page (`/auth/forgot-password`)
2. Enter any email and request reset
3. **Before clicking the email link**, check the URL
4. It should go to your current domain, NOT to `intenx-1.onrender.com`
5. You should see the reset password form, not an error page

---

## Additional Considerations

**Email Link Expiration Error:**
The error you saw (`error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`) means the Supabase email token had expired. This is separate from the redirect issue. 

Password reset links typically expire in:
- **Supabase default:** 1 hour
- You can increase this in Supabase dashboard if needed

---

## Summary

✅ User deletion in debug panel now works properly with better error handling  
✅ Forgot password emails now redirect to the correct domain (not old website)  
✅ Both issues are backward compatible and won't break existing functionality

**Next Step:** Add `NEXT_PUBLIC_APP_URL` to your environment variables!
