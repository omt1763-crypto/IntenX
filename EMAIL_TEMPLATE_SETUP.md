# Supabase Email Template Setup Guide

## Password Reset Email Template

The file `SUPABASE_EMAIL_TEMPLATE.html` contains a professional HTML email template for password reset emails.

### How to Use

1. **Go to Supabase Dashboard**
   - Navigate to your IntenX project
   - Go to **Authentication** → **Email Templates**

2. **Select Password Reset Template**
   - Click on **Reset Password** template
   - You should see a template editor

3. **Replace the Template Content**
   - Copy the entire HTML content from `SUPABASE_EMAIL_TEMPLATE.html`
   - Paste it into the Supabase template editor
   - The special variables like `{{ .ConfirmationURL }}` are automatically replaced by Supabase

4. **Save and Test**
   - Click **Save**
   - Send a test email to yourself to verify it looks good

### Template Variables

The template uses the following Supabase variables that are automatically filled:

- `{{ .ConfirmationURL }}` - The password reset link that users click
- Other variables available: `{{ .RedirectURL }}`, `{{ .Email }}`, `{{ .Token }}`

### Customization

You can customize:
- **Colors**: Change the gradient colors in the `<style>` section
- **Logo**: Replace the emoji with your actual logo
- **Links**: Update the footer links to match your domain
- **Text**: Adjust any of the greeting or message text

### Important Notes

1. Keep the `{{ .ConfirmationURL }}` variable in the button href
2. Keep the fallback link section for users whose email clients don't support the button
3. The template is responsive and works on mobile devices
4. Email clients may strip some CSS, but the structure remains readable

### Also Update

1. **Site URL in Supabase**
   - Go to **Project Settings** → **General**
   - Set Site URL to: `https://www.aiinterviewx.com`
   - This ensures password reset emails use the correct domain

2. **Redirect URL Configuration**
   - Make sure the middleware.ts properly routes recovery tokens to `/auth/reset-password`
   - This is already configured in the project

### Testing the Complete Flow

1. Go to `https://www.aiinterviewx.com/auth/forgot-password`
2. Enter your test email
3. Check your email for the reset link
4. Click the link - you should be redirected to `/auth/reset-password`
5. Enter your new password and confirm
6. Login with your new password

---

**If you need the email verification template as well, use similar structure but adjust the title and message to reflect email verification instead of password reset.**
