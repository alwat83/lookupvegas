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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## AI Workflows & Memory

**Deployment (Firebase App Hosting):**
- **DO NOT USE VERCEL** for deployment.
- Deployment is fully automated via Firebase App Hosting.
- To deploy to production: Simply commit all changes and push to the `main` branch on GitHub (`git pull` -> `git add .` -> `git commit -m "..."` -> `git push`). Firebase will automatically pick up the new commit, trigger a build, and roll out the release.

**Environment & Core Commands:**
- Always use `npx` for executing commands on this system.
- Standard Next.js commands: `npx next dev`, `npx next build`, `npx next start`
- Tech Stack includes Next.js, Firebase, Stripe, and Leaflet.

**Monitoring & Logging:**
- View live server and CDN logs directly in the **Firebase Console**.
- Navigate to **App Hosting -> [Backend Name] -> Logs** tab to query specific 500 or 400 errors.
- Do not attempt to use `npx firebase apphosting:backends:logs` as it is an unsupported command. Use the GUI console instead.
