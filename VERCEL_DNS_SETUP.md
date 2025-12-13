# Vercel + Resend DNS Setup Guide

## Important: You Need a Custom Domain

**❌ You CANNOT add DNS records to Vercel subdomains** (like `your-app.vercel.app`)

**✅ You MUST use a custom domain you own** (like `block-book.com`)

---

## Option 1: Use Root Domain (Simplest)

If you own `block-book.com`:

### Step 1: Add Domain to Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `block-book.com`
3. Follow Vercel's DNS setup to point domain to Vercel

### Step 2: Add DNS Records in Vercel for Email
1. Go to Vercel Dashboard → Domains → Click on your domain
2. Go to **DNS Records** tab
3. Add the records from Resend:

#### Record 1: MX for SPF (Sending)
- **Type**: `MX`
- **Name**: `send` (just `send`, not `send.block-book.com`)
- **Value**: `feedback-smtp.us-east-1.amazonses.com` (from Resend)
- **TTL**: `60` (default)
- **Priority**: `10`

#### Record 2: TXT for SPF (Sending)
- **Type**: `TXT`
- **Name**: `send` (just `send`, not `send.block-book.com`)
- **Value**: `"v=spf1 include:amazonses.com ~all"` (from Resend - copy exact value)
- **TTL**: `60` (default)

#### Record 3: TXT for DKIM (Required)
- **Type**: `TXT`
- **Name**: `resend._domainkey` (just `resend._domainkey`, not `resend._domainkey.block-book.com`)
- **Value**: `p=MIGfMA0GCSqGSIb3DQEB...` (from Resend - copy the full long value)
- **TTL**: `60` (default)

#### Record 4: TXT for DMARC (Optional but Recommended)
- **Type**: `TXT`
- **Name**: `_dmarc` (just `_dmarc`)
- **Value**: `v=DMARC1; p=none;` (from Resend)
- **TTL**: `60` (default)

### Step 3: Verify in Resend
1. Go back to Resend Dashboard → Domains
2. Click "Verify DNS Records"
3. Wait for verification (can take a few minutes to 24 hours)

---

## Option 2: Use Email Subdomain (Recommended)

**Better practice:** Use a subdomain like `emails.block-book.com` for email

### Step 1: Add Subdomain to Vercel
1. Go to Vercel Dashboard → Domains
2. Add subdomain: `emails.block-book.com`
3. Point it to your Vercel project (or just use it for DNS)

### Step 2: Add DNS Records for Subdomain
Add the same 4 records above, but they'll be for the `emails` subdomain.

**Note:** In Vercel DNS, when adding records:
- If Name is `send`, it creates `send.emails.block-book.com`
- This is correct for Resend!

### Step 3: Add Domain in Resend
1. Add `emails.block-book.com` to Resend (not just `block-book.com`)
2. Copy the DNS records Resend provides
3. Add them to Vercel DNS (following steps above)
4. Verify in Resend

---

## What Records Do You Actually Need?

Based on the Resend interface you showed:

### Required for Sending Emails:
1. ✅ **DKIM** - `resend._domainkey` TXT record (REQUIRED)
2. ✅ **SPF** - `send` MX record (REQUIRED for sending)
3. ✅ **SPF** - `send` TXT record (REQUIRED for sending)

### Optional but Recommended:
4. ⚠️ **DMARC** - `_dmarc` TXT record (improves deliverability)

### For Receiving Emails (Not Needed for Payment Notifications):
5. ❌ **MX Record** for `@` - Only needed if you want to receive emails

**For Blockbook payment notifications, you only need records 1-3 (DKIM + SPF)**

---

## Quick Checklist

### Prerequisites:
- [ ] You own a custom domain (e.g., `block-book.com`)
- [ ] Domain is added to Vercel project
- [ ] Domain is added to Resend dashboard

### DNS Records to Add in Vercel:
- [ ] MX record for `send` subdomain
- [ ] TXT record for `send` subdomain (SPF)
- [ ] TXT record for `resend._domainkey` (DKIM)
- [ ] (Optional) TXT record for `_dmarc`

### After Adding Records:
- [ ] Click "Verify DNS Records" in Resend
- [ ] Wait for verification (check status)
- [ ] Create sender email address (e.g., `notifications@yourdomain.com`)
- [ ] Update `EMAIL_FROM` in Render environment variables

---

## Vercel DNS Record Format

**Important:** When adding records in Vercel:

### ✅ Correct:
- Name: `send` → Creates `send.yourdomain.com`
- Name: `resend._domainkey` → Creates `resend._domainkey.yourdomain.com`

### ❌ Wrong:
- Name: `send.yourdomain.com` → This is incorrect!
- Name: `send.block-book.com` → Omit the domain part

**Vercel automatically appends your domain to the Name field.**

---

## Example: Complete Setup

If your domain is `block-book.com`:

1. **In Resend:**
   - Add domain: `block-book.com`
   - Copy the DNS records shown

2. **In Vercel DNS:**
   ```
   Type: MX
   Name: send
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10
   TTL: 60

   Type: TXT
   Name: send
   Value: "v=spf1 include:amazonses.com ~all"
   TTL: 60

   Type: TXT
   Name: resend._domainkey
   Value: p=MIGfMA0GCSqGSIb3DQEB... (full value from Resend)
   TTL: 60

   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none;
   TTL: 60
   ```

3. **Verify in Resend:**
   - Click "Verify DNS Records"
   - Wait for status to change to "Verified"

4. **Create Email Address:**
   - In Resend, create: `notifications@block-book.com`
   - Use: `Blockbook <notifications@block-book.com>`

5. **Update Environment Variable:**
   - In Render: `EMAIL_FROM=Blockbook <notifications@block-book.com>`

---

## Troubleshooting

### "Domain not verified" after 24 hours?
- Check DNS records are exactly as shown in Resend
- Make sure you didn't include the domain in the Name field
- Verify records are live: Use `dig` or online DNS checker
- Wait up to 72 hours for DNS propagation

### "Cannot add DNS records" in Vercel?
- Make sure you're using a custom domain, not `*.vercel.app`
- Verify domain is added to your Vercel project first
- Check you have access to DNS management for that domain

### Records showing but not verifying?
- Double-check values match exactly (including quotes for TXT records)
- Ensure TTL and Priority match Resend's requirements
- Try removing and re-adding records

---

## Summary

**Answer:** You add DNS records to your **custom domain** in Vercel (like `block-book.com`), NOT to the Vercel subdomain (`*.vercel.app`).

You need:
1. ✅ Custom domain added to Vercel
2. ✅ Domain added to Resend
3. ✅ 3-4 DNS records added in Vercel (DKIM + SPF, optional DMARC)
4. ✅ Verify in Resend dashboard
5. ✅ Create sender email and update environment variables

