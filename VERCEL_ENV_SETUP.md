# Vercel Environment Variables Setup

## Update Frontend URL (if needed)

If your frontend needs to know its own URL for email links, you may want to add:

```
NEXT_PUBLIC_FRONTEND_URL=https://your-vercel-domain.vercel.app
```

However, this is likely already configured or handled automatically.

## Steps

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your frontend project**
3. **Go to Settings → Environment Variables**
4. **Add if needed** (usually not required for email notifications):
   - `NEXT_PUBLIC_FRONTEND_URL` = Your Vercel deployment URL

5. **Click "Save"**
6. **Redeploy** if you made changes

**Note**: The email notifications are sent from the backend (Render), so most email-related environment variables should be added to Render, not Vercel.

