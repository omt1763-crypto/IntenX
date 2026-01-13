# Supabase Configuration Changes Required

## Redirect URLs Update

Your Supabase project has redirect URLs configured for the old domain. These need to be updated to the new domain.

### Current URLs (OLD - Need to Remove):
- ❌ https://intenx-1.onrender.com/auth/verify-email
- ❌ https://intenx-1.onrender.com/auth/reset-password
- ✅ http://localhost:3000/auth/verify-email (Keep this for local development)

### New URLs (REQUIRED):
- ✅ https://www.aiinterviewx.com/auth/verify-email
- ✅ https://www.aiinterviewx.com/auth/reset-password
- ✅ http://localhost:3000/auth/verify-email (local development)

---

## Step-by-Step Instructions

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your IntenX project
3. Click on **Authentication** in the left sidebar
4. Click on **Providers**

### 2. Configure Redirect URLs
1. Find the section labeled **Redirect URLs** (or **Auth → URL Configuration**)
2. You'll see a list of current URLs

### 3. Remove Old URLs
1. Click the **Remove (X)** button next to:
   - `https://intenx-1.onrender.com/auth/verify-email`
   - `https://intenx-1.onrender.com/auth/reset-password`

### 4. Add New URLs
1. Click **Add URL**
2. Enter: `https://www.aiinterviewx.com/auth/verify-email`
3. Click **Add URL** again
4. Enter: `https://www.aiinterviewx.com/auth/reset-password`
5. Keep `http://localhost:3000/auth/verify-email` for local development

### 5. Save Changes
- Click **Save** if there's a save button
- Changes typically save automatically in Supabase

---

## Site URL Configuration (ALSO REQUIRED)

While you're in Supabase settings:

1. Go to **Settings** → **General** (or **Project Settings**)
2. Find **Site URL** setting
3. Change from: `https://intenx-1.onrender.com`
4. Change to: `https://www.aiinterviewx.com`
5. Save

This ensures password reset and email verification links in emails use the correct domain.

---

## Additional Endpoints to Update

While in the Settings, also check these and update if present:

- **JWT Secret**: Should be the same (no change needed)
- **API URL**: Should be your Supabase API (no change needed)
- **Project URL**: Should remain as is (Supabase-managed)

---

## Testing After Changes

1. **Verify Email Flow**:
   - Go to `/auth/signup`
   - Sign up with a test email
   - Check your email for the verification link
   - Link should go to `https://www.aiinterviewx.com/auth/verify-email`
   - Should redirect to login or dashboard after verification

2. **Password Reset Flow**:
   - Go to `/auth/forgot-password`
   - Enter your email
   - Check your email for the reset link
   - Link should go to `https://www.aiinterviewx.com/auth/reset-password`
   - Should show the password reset form

---

## Important Notes

- These changes must be done in Supabase Dashboard - **they cannot be changed from the app code**
- The middleware we added will redirect old domain requests to new domain as a backup
- Changes take effect immediately in most cases
- Test thoroughly after making changes

---

## Troubleshooting

If verification/reset links still go to old domain:
1. Clear your browser cache
2. Check Supabase settings again to confirm changes were saved
3. Wait a few minutes for changes to propagate
4. Check that you're in the correct Supabase project

---

## Optional: CORS Settings

If you see CORS errors, also check:
1. **Settings** → **API**
2. Find **CORS** settings
3. Add `https://www.aiinterviewx.com` to the allowed origins

