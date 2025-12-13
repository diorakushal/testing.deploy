# ✅ Quick Deployment Checklist for block-book.com

Use this checklist to ensure everything is configured correctly for production.

---

## 📋 Pre-Deployment

- [x] Domain purchased: `block-book.com`
- [ ] GitHub repository is up to date
- [ ] All code changes committed and pushed
- [ ] Environment variables documented

---

## 🔧 Backend Setup (Railway/Render)

### Environment Variables
- [ ] `SUPABASE_URL` = `https://robjixmkmrmryrqzivdd.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = [your anon key]
- [ ] `DATABASE_URL` = [your database connection string]
- [ ] `ALLOWED_ORIGINS` = `https://block-book.com,https://www.block-book.com`
- [ ] `PORT` = `5000`
- [ ] `NODE_ENV` = `production`

### Deployment
- [ ] Service created on Railway/Render
- [ ] Root directory set to `backend`
- [ ] Start command set to `npm start`
- [ ] Environment variables added
- [ ] Service deployed successfully
- [ ] Health check works: `curl https://api.block-book.com/health`

### Domain
- [ ] Custom domain `api.block-book.com` added
- [ ] CNAME record added in DNS
- [ ] SSL certificate active

---

## 🎨 Frontend Setup (Vercel)

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` = `https://api.block-book.com/api`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://robjixmkmrmryrqzivdd.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = [your anon key]

### Deployment
- [ ] Project created on Vercel
- [ ] Root directory set to `frontend`
- [ ] Framework preset: Next.js
- [ ] Environment variables added
- [ ] Project deployed successfully

### Domain
- [ ] Custom domain `block-book.com` added
- [ ] `www.block-book.com` added (optional)
- [ ] DNS records added (A or CNAME)
- [ ] SSL certificate active

---

## 🌐 DNS Configuration

### Records Added
- [ ] A record for `block-book.com` → Vercel IP
- [ ] CNAME for `www.block-book.com` → Vercel
- [ ] CNAME for `api.block-book.com` → Railway/Render

### Verification
- [ ] DNS propagated (check with `dig` or online tools)
- [ ] `block-book.com` resolves correctly
- [ ] `api.block-book.com` resolves correctly
- [ ] SSL certificates issued (wait 5-15 minutes)

---

## 🧪 Testing

### Backend Tests
- [ ] Health endpoint: `https://api.block-book.com/health` returns 200
- [ ] Database connection works
- [ ] Authentication endpoints work
- [ ] CORS allows frontend domain

### Frontend Tests
- [ ] Site loads at `https://block-book.com`
- [ ] No console errors
- [ ] Login works
- [ ] API calls go to `api.block-book.com`
- [ ] Authentication headers are sent
- [ ] Payment request creation works
- [ ] Payment sending works

### Integration Tests
- [ ] End-to-end payment flow works
- [ ] Contact management works
- [ ] Preferred wallets work
- [ ] User search works
- [ ] All features functional

---

## 🔒 Security Verification

- [ ] No hardcoded credentials in code
- [ ] Environment variables secured in hosting platform
- [ ] CORS properly configured
- [ ] HTTPS enabled on all domains
- [ ] Authentication required for protected endpoints
- [ ] Input validation working

---

## 📊 Monitoring Setup

- [ ] Health check monitoring configured
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Uptime monitoring configured
- [ ] Log aggregation set up

---

## ✅ Final Verification

### URLs
- [ ] `https://block-book.com` - Frontend loads
- [ ] `https://www.block-book.com` - WWW redirects (if configured)
- [ ] `https://api.block-book.com/health` - Backend healthy

### Functionality
- [ ] User can sign up
- [ ] User can log in
- [ ] User can create payment request
- [ ] User can send payment
- [ ] User can manage contacts
- [ ] User can set preferred wallets

### Performance
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] No memory leaks
- [ ] Database queries optimized

---

## 🎉 Launch Ready!

Once all items are checked:
- [ ] Announce launch
- [ ] Monitor for issues
- [ ] Collect user feedback
- [ ] Plan improvements

---

## 📚 Reference Documents

- **DNS Setup:** `DNS_CONFIGURATION_GUIDE.md`
- **Hosting Setup:** `HOSTING_PLATFORM_SETUP.md`
- **Deployment Guide:** `PRODUCTION_DEPLOYMENT.md`
- **Environment Templates:** `PRODUCTION_ENV_TEMPLATE.md`

---

**Use this checklist to ensure a smooth deployment!** ✅

