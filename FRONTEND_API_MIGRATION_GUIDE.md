# Frontend API Migration Guide

This guide shows how to update your frontend API calls to use the new authenticated API client.

## 🎯 Quick Migration Pattern

### Before (Old Way)
```typescript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Unauthenticated call
const response = await axios.get(`${API_URL}/users/search?q=john`);

// Authenticated call (missing auth header!)
const response = await axios.post(`${API_URL}/payment-requests`, {
  requesterAddress: address,
  amount: 100
});
```

### After (New Way)
```typescript
import { api, publicApi } from '@/lib/api-client';

// Public endpoint (no auth needed)
const response = await publicApi.get('/users/search', {
  params: { q: 'john' }
});

// Authenticated endpoint (auth header automatically included)
const response = await api.post('/payment-requests', {
  requesterAddress: address,
  amount: 100
});
```

---

## 📝 Migration Steps

### Step 1: Import the API Client

Replace:
```typescript
import axios from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
```

With:
```typescript
import { api, publicApi } from '@/lib/api-client';
```

### Step 2: Update API Calls

#### For Authenticated Endpoints (POST, PATCH, DELETE on protected routes)

**Before:**
```typescript
await axios.post(`${API_URL}/payment-requests`, data);
await axios.patch(`${API_URL}/payment-requests/${id}/paid`, data);
await axios.delete(`${API_URL}/payment-requests/${id}`);
```

**After:**
```typescript
await api.post('/payment-requests', data);
await api.patch(`/payment-requests/${id}/paid`, data);
await api.delete(`/payment-requests/${id}`);
```

#### For Public Endpoints (GET requests that don't require auth)

**Before:**
```typescript
await axios.get(`${API_URL}/users/search?q=${query}`);
await axios.get(`${API_URL}/payment-requests`);
```

**After:**
```typescript
await publicApi.get('/users/search', { params: { q: query } });
await publicApi.get('/payment-requests');
```

---

## 🔍 Endpoint Classification

### Public Endpoints (Use `publicApi`)
- `GET /api/users/search` - Search users
- `GET /api/users/:address` - Get user profile
- `GET /api/payment-requests` - Get payment requests (public feed)
- `GET /api/payment-requests/:id` - Get single payment request
- `GET /api/preferred-wallets/user/:userId` - Get user's preferred wallets (for sending)
- `GET /api/crypto-price` - Get crypto prices

### Authenticated Endpoints (Use `api`)
- `POST /api/payment-requests` - Create payment request
- `PATCH /api/payment-requests/:id/paid` - Mark as paid
- `PATCH /api/payment-requests/:id/cancel` - Cancel request
- `DELETE /api/payment-requests/:id` - Delete request
- `POST /api/payment-sends` - Create payment send
- `GET /api/payment-sends` - Get user's payment sends
- `PATCH /api/payment-sends/:id/confirmed` - Update status
- `GET /api/contacts` - Get user's contacts
- `POST /api/contacts` - Add contact
- `PATCH /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/preferred-wallets` - Get user's preferred wallets
- `POST /api/preferred-wallets` - Create/update preferred wallet
- `DELETE /api/preferred-wallets/:id` - Delete preferred wallet

---

## 📋 Files That Need Updates

### High Priority (Already Updated)
- ✅ `components/CreatePaymentRequestComposer.tsx`
- ✅ `components/PaymentRequestCard.tsx`
- ✅ `components/CreateMarketSidebar.tsx`

### Still Need Updates

#### Contacts Management
- `app/settings/page.tsx` - Contacts and preferred wallets
- `components/UserProfileModal.tsx` - Add/update contacts
- `app/[username]/page.tsx` - Contact management
- `app/user/[username]/page.tsx` - Contact operations

#### Payment Operations
- `app/feed/page.tsx` - Fetch payment requests/sends
- `app/payment-request/[id]/page.tsx` - View payment request

#### Preferred Wallets
- `app/preferred-wallets/page.tsx` - Manage preferred wallets
- `components/PreferredWalletsModal.tsx` - Preferred wallet operations
- `app/auth/verify-otp/page.tsx` - Preferred wallets check
- `app/auth/confirm/page.tsx` - Preferred wallets check

#### User Operations
- `app/profile/page.tsx` - Get user profile
- `app/search/page.tsx` - Search users
- `components/Header.tsx` - User search

---

## 🔧 Example Migrations

### Example 1: Create Payment Request

**Before:**
```typescript
const response = await axios.post(`${API_URL}/payment-requests`, {
  requesterAddress: address,
  requesterUserId: userId,
  amount: formData.amount,
  tokenSymbol: 'USDC',
  tokenAddress: BASE_USDC_ADDRESS,
  chainId: BASE_CHAIN_ID,
  chainName: BASE_CHAIN_NAME,
  caption: formData.caption || null
});
```

**After:**
```typescript
// Note: requesterUserId is now automatically added from auth token
const response = await api.post('/payment-requests', {
  requesterAddress: address,
  amount: formData.amount,
  tokenSymbol: 'USDC',
  tokenAddress: BASE_USDC_ADDRESS,
  chainId: BASE_CHAIN_ID,
  chainName: BASE_CHAIN_NAME,
  caption: formData.caption || null
});
```

### Example 2: Get Payment Requests

**Before:**
```typescript
const response = await axios.get(`${API_URL}/payment-requests`);
```

**After:**
```typescript
const response = await publicApi.get('/payment-requests');
```

### Example 3: Get User's Contacts

**Before:**
```typescript
const response = await axios.get(`${API_URL}/contacts?userId=${userId}`);
```

**After:**
```typescript
// userId is now automatically taken from auth token
const response = await api.get('/contacts');
```

### Example 4: Add Contact

**Before:**
```typescript
const response = await axios.post(`${API_URL}/contacts`, {
  userId: currentUserId,
  contactUserId: user.id,
  nickname: nickname || null
});
```

**After:**
```typescript
// userId is now automatically taken from auth token
const response = await api.post('/contacts', {
  contactUserId: user.id,
  nickname: nickname || null
});
```

### Example 5: Delete Contact

**Before:**
```typescript
await axios.delete(`${API_URL}/contacts/${contactId}?userId=${userId}`);
```

**After:**
```typescript
// userId is now automatically taken from auth token
await api.delete(`/contacts/${contactId}`);
```

---

## ⚠️ Important Notes

### 1. Remove `userId` from Request Bodies

The authenticated API client automatically includes the user ID from the JWT token. You should **remove** `userId` or `requesterUserId` from request bodies:

**Don't do this:**
```typescript
await api.post('/payment-requests', {
  requesterUserId: userId, // ❌ Not needed - comes from token
  ...
});
```

**Do this:**
```typescript
await api.post('/payment-requests', {
  // ✅ userId automatically included from auth token
  ...
});
```

### 2. Response Format

The new API client returns the data directly, not `response.data`:

**Before:**
```typescript
const response = await axios.post(...);
const data = response.data;
```

**After:**
```typescript
const data = await api.post(...); // Data is returned directly
```

### 3. Error Handling

Error handling remains the same:

```typescript
try {
  const data = await api.post('/payment-requests', payload);
  // Success
} catch (error: any) {
  if (error.response?.status === 401) {
    // User will be automatically redirected to login
  }
  // Handle other errors
}
```

### 4. Query Parameters

Use the `params` option for query parameters:

**Before:**
```typescript
await axios.get(`${API_URL}/users/search?q=${query}&userId=${userId}`);
```

**After:**
```typescript
await publicApi.get('/users/search', {
  params: { q: query, userId: userId }
});
```

---

## 🧪 Testing After Migration

After updating a file, test:

1. ✅ File imports without errors
2. ✅ API calls work (check browser network tab)
3. ✅ Authentication headers are sent (check `Authorization` header)
4. ✅ No 401 errors for authenticated endpoints
5. ✅ Data loads correctly
6. ✅ Errors are handled properly

---

## 🚀 Quick Migration Script

For each file:

1. Find: `import axios from 'axios';`
2. Replace with: `import { api, publicApi } from '@/lib/api-client';`
3. Remove: `const API_URL = ...`
4. Update all `axios.get/post/patch/delete` calls:
   - Protected endpoints → `api.get/post/patch/delete`
   - Public endpoints → `publicApi.get/post/patch/delete`
5. Remove `/api` prefix from URLs (already in base URL)
6. Remove `userId` from request bodies (comes from token)
7. Change `response.data` to just `response` (or `data`)

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check network tab for request/response details
3. Verify authentication token is being sent
4. Check backend logs for authentication errors
5. Review `CRITICAL_FIXES_APPLIED.md` for API changes

---

## ✅ Migration Checklist

For each file:
- [ ] Import updated to use `api` or `publicApi`
- [ ] `API_URL` constant removed
- [ ] All API calls updated
- [ ] `userId` removed from request bodies
- [ ] Response handling updated (remove `.data`)
- [ ] Error handling still works
- [ ] Tested in browser
- [ ] No console errors
- [ ] Authentication headers present in network tab

