# Blockbook Email Template Setup

This guide shows you how to update your Supabase email template to match the Cash App-style design with blockbook branding.

## Email Template Design

The template features:
- ✅ Clean, professional design with white content box on light gray background
- ✅ Blockbook logo (black square with "B") and brand name
- ✅ "Sign-In Code" heading
- ✅ Large, prominent 8-digit code display
- ✅ Security warnings (matching Cash App style)
- ✅ Expiration notice
- ✅ Professional footer

## How to Update Supabase Email Template

### Step 1: Access Email Templates

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. Find the **"Magic Link"** template (this is used for OTP)

### Step 2: Update the Template

**Subject Line:**
```
Your Sign-In Code
```

**Email Body (HTML):**

Copy and paste the HTML from `BLOCKBOOK_EMAIL_TEMPLATE.html` into the template editor.

**OR use this simplified version (better email client compatibility):**

```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <tr>
    <td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; padding: 40px 32px; max-width: 500px; width: 100%;">
        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom: 32px;">
            <div style="display: inline-block;">
              <div style="display: inline-flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; background-color: #000000; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-size: 28px; font-weight: bold;">B</span>
                </div>
                <span style="font-size: 24px; font-weight: bold; color: #000000; letter-spacing: -0.02em;">blockbook</span>
              </div>
            </div>
          </td>
        </tr>
        
        <!-- Heading -->
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #000000; letter-spacing: -0.02em;">Sign-In Code</h1>
          </td>
        </tr>
        
        <!-- Code -->
        <tr>
          <td align="center" style="padding-bottom: 32px;">
            <div style="font-size: 48px; font-weight: 700; color: #000000; letter-spacing: 8px; font-family: 'Courier New', monospace; padding: 20px 0; white-space: nowrap; overflow: hidden;">
              {{ .Token }}
            </div>
          </td>
        </tr>
        
        <!-- Security Message -->
        <tr>
          <td style="padding-bottom: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #666666;">
              This code is for you and only you to use to sign in to blockbook.
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
              To prevent fraud on your account, never share it anywhere or for any reason with anyone, including people posing as blockbook.
            </p>
          </td>
        </tr>
        
        <!-- Expiration Notice -->
        <tr>
          <td style="padding-bottom: 32px; border-top: 1px solid #e5e5e5; padding-top: 24px;">
            <p style="margin: 0; font-size: 13px; color: #999999; text-align: center;">
              This code expires in 1 hour.
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="padding-top: 24px; border-top: 1px solid #e5e5e5;">
            <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #999999; text-align: center;">
              If you didn't request this code, you can safely ignore this email.
            </p>
            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #999999; text-align: center;">
              © blockbook. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

### Step 3: Save the Template

1. Click **"Save"** or **"Update Template"**
2. The changes take effect immediately

## Template Features

### Design Elements
- **Background**: Light gray (#f5f5f5) - matches email client background
- **Content Box**: White (#ffffff) with rounded corners and subtle shadow
- **Logo**: Black square with white "B" + "blockbook" text
- **Code Display**: Large, bold, monospace font with letter spacing
- **Typography**: Clean, modern sans-serif fonts

### Security Features
- Clear security warnings
- Expiration notice (1 hour)
- Professional footer with safety message

### Brand Consistency
- Matches login page UI/UX
- Black and white color scheme
- Clean, minimalist design
- Professional appearance

## Testing

After updating the template:

1. Sign up or log in with a test email
2. Check your inbox for the email
3. Verify:
   - ✅ Logo and branding appear correctly
   - ✅ Code is displayed prominently
   - ✅ Security messages are visible
   - ✅ Layout looks good on mobile and desktop

## Notes

- The template uses `{{ .Token }}` which Supabase automatically replaces with the 8-digit code
- Email clients may render some CSS differently - test in multiple clients
- The template is optimized for modern email clients (Gmail, Apple Mail, Outlook)
- For maximum compatibility, all styles are inline

## Customization

You can customize:
- **Colors**: Change `#000000` (black) and `#f5f5f5` (gray) to match your brand
- **Font sizes**: Adjust the `font-size` values
- **Spacing**: Modify `padding` and `margin` values
- **Logo**: Replace the "B" square with an actual logo image URL if needed

