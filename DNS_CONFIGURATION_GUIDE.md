# 🌐 DNS Configuration Guide for block-book.com

This guide will help you configure DNS records to point your domain to your hosting providers.

## 📋 DNS Records Overview

You'll need to configure these DNS records:

1. **Frontend (Main Domain):** `block-book.com` → Vercel/Netlify
2. **Backend API (Subdomain):** `api.block-book.com` → Railway/Render
3. **WWW (Optional):** `www.block-book.com` → Vercel/Netlify

---

## 🎨 Frontend DNS Configuration

### Option 1: Vercel (Recommended)

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Add domain: `block-book.com`
   - Add domain: `www.block-book.com` (optional)
   - Vercel will show you the DNS records to add

2. **In Your Domain Registrar (GoDaddy, Namecheap, etc.):**
   
   **For Root Domain (block-book.com):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600
   ```
   
   **OR use CNAME (if your registrar supports it):**
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   TTL: 3600
   ```
   
   **For WWW (www.block-book.com):**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

### Option 2: Netlify

1. **In Netlify Dashboard:**
   - Go to Site settings → Domain management
   - Add custom domain: `block-book.com`
   - Netlify will show DNS records

2. **In Your Domain Registrar:**
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   TTL: 3600
   ```
   
   **For WWW:**
   ```
   Type: CNAME
   Name: www
   Value: block-book.com
   TTL: 3600
   ```

---

## ⚙️ Backend DNS Configuration (api.block-book.com)

### Option 1: Railway

1. **In Railway Dashboard:**
   - Go to your service → Settings → Networking
   - Add custom domain: `api.block-book.com`
   - Railway will provide the CNAME target

2. **In Your Domain Registrar:**
   ```
   Type: CNAME
   Name: api
   Value: [Railway-provided-domain].railway.app
   TTL: 3600
   ```

### Option 2: Render

1. **In Render Dashboard:**
   - Go to your service → Settings → Custom Domains
   - Add custom domain: `api.block-book.com`
   - Render will provide the CNAME target

2. **In Your Domain Registrar:**
   ```
   Type: CNAME
   Name: api
   Value: [Render-provided-domain].onrender.com
   TTL: 3600
   ```

### Option 3: DigitalOcean App Platform

1. **In DigitalOcean Dashboard:**
   - Go to your app → Settings → Domains
   - Add domain: `api.block-book.com`
   - DigitalOcean will provide the CNAME target

2. **In Your Domain Registrar:**
   ```
   Type: CNAME
   Name: api
   Value: [DigitalOcean-provided-domain]
   TTL: 3600
   ```

---

## 📝 Complete DNS Records Example

Here's what your DNS records should look like (example):

```
Type    Name    Value                           TTL
----    ----    -----                           ---
A       @       76.76.21.21 (Vercel)            3600
CNAME   www     cname.vercel-dns.com           3600
CNAME   api     your-app.railway.app           3600
```

---

## 🔧 Step-by-Step DNS Setup

### Step 1: Get Hosting Provider DNS Values

**For Frontend (Vercel):**
1. Log into Vercel
2. Go to your project → Settings → Domains
3. Click "Add" next to Domains
4. Enter `block-book.com`
5. Vercel will show you the DNS records to add

**For Backend (Railway/Render):**
1. Log into your backend hosting platform
2. Go to your service → Settings → Domains/Custom Domain
3. Add `api.block-book.com`
4. Platform will show you the CNAME target

### Step 2: Configure DNS in Your Domain Registrar

**Common Registrars:**

#### GoDaddy
1. Log into GoDaddy
2. Go to "My Products" → "DNS"
3. Find your domain `block-book.com`
4. Click "Manage DNS"
5. Add the records shown by your hosting providers

#### Namecheap
1. Log into Namecheap
2. Go to "Domain List"
3. Click "Manage" next to `block-book.com`
4. Go to "Advanced DNS" tab
5. Add the records

#### Cloudflare
1. Log into Cloudflare
2. Select your domain
3. Go to "DNS" → "Records"
4. Add the records
5. Make sure proxy is OFF (gray cloud) for API subdomain

#### Google Domains
1. Log into Google Domains
2. Click on your domain
3. Go to "DNS" tab
4. Add the records

### Step 3: Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours
- Usually takes 15-30 minutes
- Check propagation: https://www.whatsmydns.net

### Step 4: Verify DNS Configuration

**Check Frontend:**
```bash
dig block-book.com
# Should return your Vercel IP
```

**Check Backend:**
```bash
dig api.block-book.com
# Should return your backend hosting provider's domain
```

---

## 🧪 Testing DNS Configuration

### 1. Test Frontend Domain
```bash
# Should resolve to your frontend hosting
curl -I https://block-book.com
```

### 2. Test Backend Domain
```bash
# Should resolve to your backend hosting
curl -I https://api.block-book.com/health
```

### 3. Test in Browser
- Visit `https://block-book.com` - should load your app
- Check browser console for errors
- Test API calls - should go to `api.block-book.com`

---

## ⚠️ Common DNS Issues

### Issue: Domain not resolving
**Solution:**
- Wait for DNS propagation (can take up to 48 hours)
- Check DNS records are correct
- Verify TTL settings
- Clear DNS cache: `sudo dscacheutil -flushcache` (Mac) or `ipconfig /flushdns` (Windows)

### Issue: SSL Certificate errors
**Solution:**
- Wait for SSL certificate to be issued (automatic on Vercel/Railway)
- Can take a few minutes after DNS is configured
- Check hosting platform for SSL status

### Issue: CORS errors
**Solution:**
- Verify `ALLOWED_ORIGINS` includes `https://block-book.com`
- Check backend environment variables
- Restart backend after updating CORS

### Issue: Subdomain not working
**Solution:**
- Verify CNAME record is correct
- Check TTL is not too high (3600 is good)
- Wait for DNS propagation
- Verify hosting platform has the domain configured

---

## 🔒 SSL/HTTPS Configuration

Most hosting providers automatically provision SSL certificates:

- **Vercel:** Automatic SSL via Let's Encrypt
- **Railway:** Automatic SSL
- **Render:** Automatic SSL
- **Netlify:** Automatic SSL

**Wait time:** Usually 5-15 minutes after DNS is configured

**Verify SSL:**
```bash
curl -I https://block-book.com
# Should return 200 OK with HTTPS
```

---

## 📊 DNS Record Types Explained

### A Record
- Points domain to an IP address
- Use for root domain (`@` or blank)
- Example: `block-book.com` → `76.76.21.21`

### CNAME Record
- Points domain to another domain name
- Use for subdomains
- Example: `api.block-book.com` → `your-app.railway.app`

### TTL (Time To Live)
- How long DNS records are cached
- Lower = faster updates but more queries
- Recommended: 3600 seconds (1 hour)

---

## ✅ DNS Configuration Checklist

- [ ] Frontend domain added to hosting platform (Vercel)
- [ ] Backend subdomain added to hosting platform (Railway/Render)
- [ ] A record added for root domain (`block-book.com`)
- [ ] CNAME record added for www (`www.block-book.com`)
- [ ] CNAME record added for API (`api.block-book.com`)
- [ ] DNS propagation verified (wait 15-30 minutes)
- [ ] SSL certificates issued (automatic, wait 5-15 minutes)
- [ ] Frontend accessible at `https://block-book.com`
- [ ] Backend accessible at `https://api.block-book.com/health`
- [ ] No CORS errors in browser console

---

## 🆘 Need Help?

If DNS isn't working:

1. **Check DNS propagation:**
   - https://www.whatsmydns.net
   - Enter your domain and check globally

2. **Verify records:**
   ```bash
   dig block-book.com
   dig api.block-book.com
   ```

3. **Check hosting platform:**
   - Verify domain is added correctly
   - Check for any error messages
   - Review SSL certificate status

4. **Contact support:**
   - Your domain registrar support
   - Hosting platform support (Vercel, Railway, etc.)

---

**Once DNS is configured, your domain will be live!** 🚀

