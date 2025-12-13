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

1. Copy the HTML from `BLOCKBOOK_EMAIL_TEMPLATE.html`
2. **IMPORTANT**: Replace `https://yourdomain.com/applogo.jpg` with your actual logo URL:
   - For Vercel: `https://your-app.vercel.app/applogo.jpg`
   - For custom domain: `https://yourdomain.com/applogo.jpg`
   - The logo file is located at `frontend/public/applogo.jpg` and will be accessible at your deployed frontend URL
3. Paste the updated HTML into the Supabase template editor

**The template includes:**
- Blockbook logo image (`applogo.jpg`) and brand name
- Clean, professional design matching your app's UI
- Large, prominent code display
- Security warnings
- Expiration notice
- Professional footer

### Step 3: Save the Template

1. Click **"Save"** or **"Update Template"**
2. The changes take effect immediately

## Template Features

### Design Elements
- **Background**: Light gray (#f5f5f5) - matches email client background
- **Content Box**: White (#ffffff) with rounded corners and subtle shadow
- **Logo**: Blockbook logo image (`applogo.jpg`) + "blockbook" text
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

## Logo Configuration

**Important**: The template uses a placeholder URL for the logo. Before using the template:

1. Deploy your frontend to Vercel (or your hosting platform)
2. Verify the logo is accessible at: `https://your-domain.com/applogo.jpg`
3. Replace `https://yourdomain.com/applogo.jpg` in the template with your actual URL

**Logo file location**: `frontend/public/applogo.jpg`

## Customization

You can customize:
- **Colors**: Change `#000000` (black) and `#f5f5f5` (gray) to match your brand
- **Font sizes**: Adjust the `font-size` values
- **Spacing**: Modify `padding` and `margin` values
- **Logo size**: Adjust `width` and `height` in the `<img>` tag (currently 48px)

