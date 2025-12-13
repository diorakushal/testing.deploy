# Vercel Environment Variables Setup

## Frontend Environment Variables Needed

Since email notifications are handled by the backend (Render), Vercel only needs these frontend-specific variables:

### Required Environment Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://robjixmkmrmryrqzivdd.supabase.co`
   - Used for: Supabase authentication and database access

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw`
   - Used for: Supabase authentication

3. **NEXT_PUBLIC_API_URL**
   - Value: Your Render backend URL (e.g., `https://your-backend-service.onrender.com/api`)
   - Used for: API calls to your backend

## How to Add to Vercel

### Step-by-Step:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your frontend project**
3. **Go to Settings → Environment Variables**
4. **Add each variable:**

   Click "Add New" for each:

   **Variable 1:**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://robjixmkmrmryrqzivdd.supabase.co`
   - Environment: Production, Preview, Development (select all)
   - Click "Save"

   **Variable 2:**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYmppeG1rbXJtcnlycXppdmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU3NzcsImV4cCI6MjA3OTU5MTc3N30.PbSL6JQq6EfQ4ZQyYvR2kJ9NavDajYfLiiIrgq_KMUw`
   - Environment: Production, Preview, Development (select all)
   - Click "Save"

   **Variable 3:**
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: Your Render backend URL (find this in your Render dashboard)
   - Format: `https://your-service-name.onrender.com/api`
   - Environment: Production, Preview, Development (select all)
   - Click "Save"

5. **Redeploy** (Vercel should automatically redeploy, or trigger manually)

## Important Notes

- **Email notifications don't need Vercel configuration** - they're sent from the backend (Render)
- **NEXT_PUBLIC_ prefix** is required for Next.js to expose these to the browser
- Make sure to select all environments (Production, Preview, Development) for each variable
- After adding variables, Vercel will automatically trigger a new deployment

## Verify Setup

After deployment:
1. Check Vercel deployment logs for any errors
2. Test authentication (login/signup)
3. Test API calls (should connect to Render backend)
4. Verify your custom domain (block-book.com) is working

## Find Your Render Backend URL

1. Go to Render dashboard: https://dashboard.render.com
2. Click on your backend service
3. Find the URL in the service overview (usually `https://your-service-name.onrender.com`)
4. The API URL will be: `https://your-service-name.onrender.com/api`

