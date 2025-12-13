# Render Environment Variables Setup

## Add Resend Configuration to Render

1. **Go to your Render Dashboard**: https://dashboard.render.com
2. **Select your backend service** (the Node.js/Express service)
3. **Go to Environment tab**
4. **Add these environment variables:**

```
RESEND_API_KEY=re_QXmwG3oK_NPZbTGB9PBjcYpTqKdz9Rs2L
EMAIL_FROM=Blockbook <onboarding@resend.dev>
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

**Note**: Replace `https://your-vercel-domain.vercel.app` with your actual Vercel deployment URL.

5. **Click "Save Changes"**
6. **Render will automatically redeploy** your service with the new environment variables

## Verify Setup

After redeployment, check your Render logs to ensure:
- No errors about missing RESEND_API_KEY
- Backend starts successfully
- Email notifications work when testing

