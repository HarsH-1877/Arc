# Arc Platform

A peer-relative competitive programming analytics platform built with TypeScript, Next.js, Express, and PostgreSQL.

## 📖 Quick Start

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup instructions.

**TL;DR:**
```bash
# 1. Setup database
psql -U postgres -c "CREATE DATABASE arc_db"
psql -U postgres -d arc_db -f backend/database/schema.sql

# 2. Start backend
cd backend && npm run dev

# 3. Start frontend (new terminal)
cd frontend && npm run dev
```

Visit http://localhost:3000

## 🎯 Core Features

- **Handle Linking**: Connect Codeforces and LeetCode accounts
- **Historical Backfilling**: Auto-import last 90 days of CF rating history
- **Time-Series Tracking**: Daily snapshots for growth analytics
- **Peer-Relative Analytics** *(coming soon)*: Compare with friends, not global ranks
- **Growth Insights** *(coming soon)*: Velocity, percentiles, stagnation detection

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Recharts
- **Backend**: Express, TypeScript, PostgreSQL, JWT auth
- **APIs**: Codeforces REST API, LeetCode GraphQL

## 📂 Project Structure

```
Arc/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, etc.
│   │   └── config/          # DB connection
│   ├── database/schema.sql
│   └── .env
├── frontend/
│   ├── app/
│   │   ├── context/         # Auth context
│   │   ├── dashboard/       # Main app
│   │   ├── login/
│   │   └── onboarding/
│   └── components/          # Reusable UI
└── README.md
```

## 🧪 Testing

1. Create an account
2. Link your Codeforces or LeetCode handle
3. Add verification token to your profile
4. Verify ownership
5. Dashboard will show (with historical data for CF!)

## 📋 Current Status

✅ Auth system (signup/login with JWT)  
✅ Handle linking & verification  
✅ Codeforces historical backfill  
✅ LeetCode integration  
✅ Time-series snapshot storage  
✅ Dark theme UI  

⏳ Friends system  
⏳ Analytics dashboard  
⏳ Growth calculations  
⏳ Peer comparison

## 📄 License

MIT

---

Built as a resume-grade project demonstrating system design, data modeling, and full-stack TypeScript development.
