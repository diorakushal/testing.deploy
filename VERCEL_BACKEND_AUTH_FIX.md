# 🔧 Fix: 401 Unauthorized Errors on Backend API

## The Problem

Frontend was getting 401 errors when calling backend API endpoints:
```
GET https://block-book-api.onrender.com/api/payment-sends 401 (Unauthorized)
```

## Root Cause

The backend requires authentication for `/api/payment-sends` endpoint (uses `authenticateUser` middleware), but the frontend was using `axios.get()` directly without authentication headers.

## The Fix

Updated frontend files to use the authenticated `api` client from `@/lib/api-client` instead of direct `axios` calls:

### Files Updated:

1. **`frontend/app/feed/page.tsx`**
   - Changed `axios.get()` → `api.get()` for payment-sends endpoints
   - Fixed response handling (api.get returns data directly, not `{ data: ... }`)

2. **`frontend/app/user/[username]/page.tsx`**
   - Changed `axios.get()` → `api.get()` for payment-sends endpoints
   - Fixed response handling

### How It Works

The `api` client from `@/lib/api-client`:
- Automatically gets the current Supabase session token
- Includes `Authorization: Bearer <token>` header in all requests
- Handles token refresh if expired
- Redirects to login if authentication fails

## Before vs After

### Before (❌ No Auth):
```typescript
axios.get(`${API_URL}/payment-sends`, {
  params: { sender_user_id: userId }
})
```

### After (✅ With Auth):
```typescript
api.get('/payment-sends', {
  params: { sender_user_id: userId }
})
```

## Response Handling

**Important:** `api.get()` returns data directly, not `{ data: ... }`:

```typescript
// ❌ Wrong (old axios way)
const result = await axios.get(...);
const data = result.data;

// ✅ Correct (api client way)
const data = await api.get(...);
```

## Testing

After deploying:
1. Log in to the app
2. Navigate to Feed page
3. Should see payment sends without 401 errors
4. Navigate to user profile page
5. Should see transactions without 401 errors

---

**All API calls to authenticated endpoints must use the `api` client!** ✅
