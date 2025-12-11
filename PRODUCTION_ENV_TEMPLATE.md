# Production Environment Variables Template

Use these templates to configure your production environment variables.

## 🔧 Backend Production `.env`

Create or update `backend/.env` with these values:

```env
# ==============================================================================
# SUPABASE CONFIGURATION
# ==============================================================================
SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================
DATABASE_URL=postgresql://postgres.robjixmkmrmryrqzivdd:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# ==============================================================================
# SERVER CONFIGURATION
# ==============================================================================
PORT=5000
NODE_ENV=production

# ==============================================================================
# CORS CONFIGURATION - PRODUCTION
# ==============================================================================
# Add your production domain
ALLOWED_ORIGINS=https://block-book.com,https://www.block-book.com,https://api.block-book.com

# ==============================================================================
# OPTIONAL: Frontend URL (will be added to default CORS origins)
# ==============================================================================
FRONTEND_URL=https://block-book.com
```

## 🎨 Frontend Production `.env.production`

Create `frontend/.env.production` with these values:

```env
# ==============================================================================
# API CONFIGURATION - PRODUCTION
# ==============================================================================
# If using subdomain for API:
NEXT_PUBLIC_API_URL=https://api.block-book.com/api

# OR if API is on same domain:
# NEXT_PUBLIC_API_URL=https://block-book.com/api

# ==============================================================================
# SUPABASE CONFIGURATION
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://robjixmkmrmryrqzivdd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# ==============================================================================
# WALLET CONNECT (Optional)
# ==============================================================================
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## 📝 Quick Setup Commands

### Backend
```bash
cd backend
# Edit .env file with production values above
```

### Frontend
```bash
cd frontend
# Create .env.production file with production values above
```

## ⚠️ Important Notes

1. **Never commit these files** - They contain sensitive credentials
2. **Use hosting platform env vars** - Set these in your hosting provider's dashboard
3. **Different for each environment** - Dev, staging, and production should have different values
4. **Rotate credentials** - If exposed, rotate immediately

## 🔒 Security Reminders

- ✅ Use HTTPS in production
- ✅ Keep credentials secure
- ✅ Use environment variables (not hardcoded)
- ✅ Restrict CORS to your domain only
- ✅ Enable rate limiting
- ✅ Set up error monitoring
