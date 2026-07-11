This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


mendapatkan AUTH_SECRET = openssl rand -base64 32


# 1. Stop dev server (Ctrl+C di terminal)

# 2. Hapus cache Next.js (opsional tapi recommended)
# Windows PowerShell:
Remove-Item -Recurse -Force .next
npx prisma generate

# 3. Mulai Server
npm run dev


__Hapus cache Prisma (di terminal PowerShell):__

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules.prisma -ErrorAction SilentlyContinue
echo "DONE"
```

__3. Regenerate Prisma Client:__

```powershell
npx prisma generate
```

__4. Start dev server:__

```powershell
npm run dev
```

__5. Test API check-user (di terminal BARU):__

```powershell
curl -X POST http://localhost:3000/api/check-user -H "Content-Type: application/json" -d "{\"email\":\"admin@notetube.ai\"}"
```

__6. Test Login:__

- Buka `http://localhost:3000/login`
