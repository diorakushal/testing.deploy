# 🔒 Fix: "Not Secure" Warning - Enable HTTPS on Vercel

## Problem

Your browser shows "Not Secure" for `block-book.com` because:
- The site is being accessed via **HTTP** instead of **HTTPS**
- No SSL certificate is configured for your custom domain

## Why This Happens

When you deploy to Vercel:
- ✅ Vercel automatically provides HTTPS for `*.vercel.app` domains
- ❌ Custom domains (like `block-book.com`) need to be configured separately

## Solution: Add Custom Domain in Vercel

### Step 1: Add Domain in Vercel

1. Go to your Vercel dashboard
2. Click on your project
3. Go to **Settings** → **Domains**
4. Click **"Add Domain"** or **"Add"**
5. Enter: `block-book.com`
6. Click **"Add"**

### Step 2: Configure DNS Records

Vercel will show you DNS records to add. You'll need to add these to your domain registrar (where you bought `block-book.com`):

**Option A: A Record (Recommended)**
```
Type: A
Name: @ (or blank)
Value: 76.76.21.21
```

**Option B: CNAME Record**
```
Type: CNAME
Name: @ (or www)
Value: cname.vercel-dns.com
```

**Also add for www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: Add DNS Records at Your Domain Registrar

1. Go to your domain registrar (GoDaddy, Namecheap, Google Domains, etc.)
2. Find **DNS Settings** or **DNS Management**
3. Add the records Vercel provided
4. Save changes

### Step 4: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate
- Usually takes **15-30 minutes**
- Vercel will show status: "Valid Configuration" when ready

### Step 5: SSL Certificate (Automatic)

Once DNS is configured:
- ✅ Vercel **automatically provisions** an SSL certificate
- ✅ Your site will be accessible via `https://block-book.com`
- ✅ "Not Secure" warning will disappear

## Quick Check: Are You Using Custom Domain?

**If you're accessing:**
- `https://your-app.vercel.app` → Should already have HTTPS ✅
- `http://block-book.com` → Needs custom domain setup ❌
- `https://block-book.com` → Needs custom domain + SSL ✅

## Alternative: Use Vercel Domain Temporarily

If you want to test immediately:
1. Use your Vercel domain: `https://your-app.vercel.app`
2. This already has HTTPS enabled
3. Set up custom domain later

## Verify HTTPS is Working

After DNS propagates:
1. Visit `https://block-book.com` (note the `https://`)
2. You should see a **lock icon** 🔒 in the address bar
3. No "Not Secure" warning
4. Browser shows "Secure" or "Connection is secure"

## Troubleshooting

### Still Shows "Not Secure" After Setup

1. **Clear browser cache** - Old HTTP redirects might be cached
2. **Check DNS propagation** - Use https://dnschecker.org
3. **Verify DNS records** - Make sure they match Vercel's requirements
4. **Wait longer** - SSL certificate provisioning can take up to 24 hours

### DNS Not Propagating

1. Check DNS records are correct
2. Remove conflicting records (old A/CNAME records)
3. Contact your domain registrar support

### Mixed Content Warnings

If you see "Mixed Content" warnings:
- Some resources are loading over HTTP
- Update all URLs to use `https://`
- Check `NEXT_PUBLIC_API_URL` uses `https://`

## Expected Result

After setup:
- ✅ `https://block-book.com` works
- ✅ `https://www.block-book.com` works (if configured)
- ✅ Lock icon in browser
- ✅ "Secure" or "Connection is secure" message
- ✅ No "Not Secure" warnings

---

**Add your custom domain in Vercel and configure DNS records to enable HTTPS!** 🔒


