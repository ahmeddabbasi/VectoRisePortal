# VectoRise Portal — Frontend

Next.js 15 admin + employee portal for VectoRise Workforce.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000/login`

Set `NEXT_PUBLIC_API_URL` in `.env.local` to your backend URL.

## Production (Vercel)

1. Import this repo in [Vercel](https://vercel.com)
2. Framework: **Next.js** (root is this repo)
3. Environment variable: `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`
4. Deploy

Update backend `CORS_ORIGINS` to include your Vercel URL.

## Backend

Pair with [VectoRisePortal-Backend](https://github.com/ahmeddabbasi/VectoRisePortal-Backend).
