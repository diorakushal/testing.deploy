# Fix: Remove Duplicate Key Causing Conflict

## Problem

You have **both** variables set in Vercel:
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` = `sb_publishable_...` ❌ (wrong)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJ...` ✅ (correct JWT)

The code checks `PUBLISHABLE_DEFAULT_KEY` **FIRST**, so it uses the wrong one!

```typescript
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY 
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Solution: Delete the Wrong Variable

### Option 1: Delete `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (Recommended)

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Find `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
3. Click the **3 dots (⋯)** menu
4. Click **Delete**
5. Confirm deletion
6. **Redeploy** your project

This will make the code use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the correct JWT token).

---

### Option 2: Update `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` Instead

If you prefer to keep using that variable name:

1. Go to Vercel → Settings → Environment Variables
2. Find `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
3. Update its value to the JWT token:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw
   ```
4. Save
5. **Redeploy**

---

## Recommended: Option 1

**Delete `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`** because:
- ✅ You already have the correct `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- ✅ Less confusion (one variable instead of two)
- ✅ Standard naming convention

---

## After Fix

1. Delete or update the wrong variable
2. Redeploy Vercel
3. Hard refresh browser (`Cmd+Shift+R` / `Ctrl+Shift+R`)
4. Check console - should show:
   ```
   [Supabase Config] Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Test login - should work!

---

## Quick Checklist

- [ ] Go to Vercel → Environment Variables
- [ ] Delete `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (the `sb_publishable_...` one)
- [ ] Keep `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the JWT token one)
- [ ] Redeploy
- [ ] Clear browser cache / hard refresh
- [ ] Test login

