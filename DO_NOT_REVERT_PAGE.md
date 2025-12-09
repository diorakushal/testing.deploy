# ⚠️ CRITICAL: DO NOT REVERT page.tsx

## File: `frontend/app/page.tsx`

This file has been permanently updated and **MUST NOT** be reverted to previous versions.

### What Changed:

1. **Authentication Required** - Page now requires user to be logged in
2. **No Mock Data** - All mock payment request data has been removed
3. **Uses Header Component** - Must use `<Header />` component, NOT custom header
4. **Blockbook Branding** - Header component provides "Blockbook" branding (not "numo")

### DO NOT:

- ❌ Add back `mockPaymentRequests` array
- ❌ Remove authentication checks (`checkAuth`, `onAuthStateChange`)
- ❌ Create custom header with "numo" branding
- ❌ Remove `Header` component import and usage
- ❌ Revert to showing data without authentication

### If You See "numo" in Header:

This means the page is using a custom header instead of the `Header` component. The page.tsx file must use:

```tsx
import Header from '@/components/Header';

// In the return:
<Header 
  searchQuery={searchQuery} 
  onSearchChange={setSearchQuery}
  onWalletConnect={...}
/>
```

### Current Correct Structure:

- ✅ Uses `Header` component from `@/components/Header`
- ✅ Requires authentication (redirects to `/login` if not authenticated)
- ✅ Shows empty state if no API data (no mock data fallback)
- ✅ Uses "Blockbook" branding via Header component

### Last Updated:
This file was updated to remove mock data and use Header component. Do not revert.

