# Backend Server Restart Required

## Issue
The backend server needs to be restarted to load the new `/api/crypto-price` endpoint.

## Solution

### Stop the current backend server:
1. Find the process: `ps aux | grep "node server"`
2. Kill it: `kill <PID>` (replace <PID> with the process ID)
   - Or if running in a terminal, press `Ctrl+C`

### Restart the backend server:
```bash
cd backend
npm start
```

Or if using nodemon:
```bash
cd backend
npm run dev
```

### Verify the endpoint is working:
```bash
curl http://localhost:5000/api/crypto-price?ids=usd-coin
```

You should see JSON with the price data, not an error.

## Why this happened
The `/api/crypto-price` endpoint was added to `backend/server.js`, but the running server process was started before this change, so it doesn't have the new route registered.



