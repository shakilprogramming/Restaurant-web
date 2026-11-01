This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
# Restaurant-web

## Google sign-in deployment setup

Configure these environment variables for the Vercel project:

- `DATABASE_URL`: connection string for the production PostgreSQL database.
- `GOOGLE_ID` and `GOOGLE_SECRET`: OAuth client credentials from Google Cloud.
- `NEXTAUTH_SECRET`: a long, random secret used to sign authentication tokens.
- `NEXTAUTH_URL`: the canonical deployed URL, including `https://`.

In the Google Cloud OAuth client, add the deployed domain to **Authorized
JavaScript origins** and add
`https://<your-domain>/api/auth/callback/google` to **Authorized redirect URIs**.
The redirect URI must match the domain used for sign-in.

After setting the variables, redeploy the Vercel project. Apply Prisma migrations
to the production database before the first sign-in so NextAuth can store users
and accounts.
