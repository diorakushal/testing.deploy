# ✅ Complete Environment Variables Configuration

## 🔑 Your Supabase API Keys

**Publishable Key (Anon Key):**
```
sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9
```

**Secret Key:**
- Masked in dashboard: `sb_secret_uZvYy••••••••••••••••`
- Click the eye icon in Supabase dashboard to reveal the full key
- Use this for backend operations requiring elevated privileges

---

## 🔧 Backend Environment Variables (Railway/Render)

Copy and paste these into your hosting platform:

```env
SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY=sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9
DATABASE_URL=postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-0-us-east-1.pooler.supabase.com:6543/postgres
ALLOWED_ORIGINS=https://block-book.com,https://www.block-book.com
PORT=5000
NODE_ENV=production
```

**Optional (if you need service role key for admin operations):**
```env
SUPABASE_SERVICE_ROLE_KEY=[click eye icon in Supabase to reveal full secret key]
```

---

## 🎨 Frontend Environment Variables (Vercel)

Copy and paste these into Vercel:

```env
NEXT_PUBLIC_API_URL=https://api.block-book.com/api
NEXT_PUBLIC_SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9
```

---

## 📋 Quick Setup Instructions

### For Backend (Railway/Render)

1. Go to your service → **Variables** or **Environment**
2. Add each variable one by one:

   | Variable Name | Value |
   |--------------|-------|
   | `SUPABASE_URL` | `https://robjixmkmrmryrqzivdd.supabase.co` |
   | `SUPABASE_ANON_KEY` | `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9` |
   | `DATABASE_URL` | `postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-0-us-east-1.pooler.supabase.com:6543/postgres` |
   | `ALLOWED_ORIGINS` | `https://block-book.com,https://www.block-book.com` |
   | `PORT` | `5000` |
   | `NODE_ENV` | `production` |

3. Save and redeploy

### For Frontend (Vercel)

1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable:

   | Variable Name | Value |
   |--------------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://api.block-book.com/api` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://robjixmkmrmryrqzivdd.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9` |

3. Select environments: **Production**, **Preview**, **Development**
4. Save and redeploy

---

## 🔒 Security Notes

### Publishable Key (Anon Key)
- ✅ Safe to use in browser
- ✅ Safe to expose in frontend code
- ✅ Requires Row Level Security (RLS) to be enabled on tables
- ✅ Used for: `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Secret Key (Service Role Key)
- ⚠️ **NEVER expose in frontend**
- ⚠️ **NEVER commit to git**
- ✅ Only use in backend/server environments
- ✅ Has full access - bypasses RLS
- ✅ Use for: Admin operations, server-side operations

---

## 🧪 Testing Your Configuration

### Test Backend

1. Deploy with the environment variables above
2. Test health endpoint:
   ```bash
   curl https://api.block-book.com/health
   ```
3. Should return:
   ```json
   {
     "status": "healthy",
     "timestamp": "...",
     "database": "connected"
   }
   ```

### Test Frontend

1. Deploy with the environment variables above
2. Visit `https://block-book.com`
3. Check browser console (should be no errors)
4. Try logging in - should connect to Supabase
5. Check Network tab - API calls should work

---

## 📝 Local Development (.env files)

### Backend `.env` (for local testing)

```env
SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY=sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9
DATABASE_URL=postgresql://postgres.robjixmkmrmryrqzivdd:Block-Book%402002@aws-0-us-east-1.pooler.supabase.com:6543/postgres
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
PORT=5000
```

### Frontend `.env.local` (for local testing)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Y8B7C3AhTRonpnMNd04nhg_vot-w2o9
```

---

## ✅ Verification Checklist

### Backend
- [ ] `SUPABASE_URL` set correctly
- [ ] `SUPABASE_ANON_KEY` set to publishable key
- [ ] `DATABASE_URL` includes encoded password
- [ ] `ALLOWED_ORIGINS` includes production domain
- [ ] Health check returns "healthy"

### Frontend
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set to publishable key
- [ ] `NEXT_PUBLIC_API_URL` points to backend
- [ ] App loads without errors
- [ ] Login works

---

## 🆘 Troubleshooting

### "Invalid API key" errors
- Verify you're using the **publishable key** (starts with `sb_publishable_`)
- Check for typos or extra spaces
- Make sure key is set in hosting platform (not just local .env)

### Authentication not working
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches backend `SUPABASE_ANON_KEY`
- Check that both use the same publishable key
- Verify Supabase project is active

### Database connection fails
- Check `DATABASE_URL` has password encoded (`%40` for `@`)
- Verify using Transaction Pooler (port 6543)
- Check Supabase dashboard for connection issues

---

## 📚 Related Documentation

- **Database URL:** `DATABASE_URL_COMPLETE.md`
- **Hosting Setup:** `HOSTING_PLATFORM_SETUP.md`
- **DNS Configuration:** `DNS_CONFIGURATION_GUIDE.md`
- **Deployment Guide:** `PRODUCTION_DEPLOYMENT.md`

---

**Your environment variables are now complete and ready for deployment!** 🚀

