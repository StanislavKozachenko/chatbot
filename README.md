# Chatbot

An open-source AI chat application built with Next.js and the AI SDK.

## Features

- [Next.js](https://nextjs.org) App Router
  - Streaming chat responses with real-time UI updates
  - Server Components and Route Handlers for data fetching
- [AI SDK](https://ai-sdk.dev) with [Groq](https://groq.com)
  - Fast LLM inference via Llama 3.3 70B
  - Automatic model switch to Llama 4 Scout for image inputs
- [Supabase](https://supabase.com)
  - Postgres for chat history and user data
  - Auth for email/password sign-in and anonymous access
  - Realtime for cross-tab sync
  - Storage for image and document uploads
- [shadcn/ui](https://ui.shadcn.com) with [Tailwind CSS](https://tailwindcss.com)
- Document RAG — upload PDF, DOCX, or TXT and ask questions about the content
- Anonymous access — try 3 messages without an account

## Running locally

**Prerequisites:** Node.js 18+

**1. Clone the repository**

```bash
git clone https://github.com/StanislavKozachenko/chatbot.git
cd chatbot
```

**2. Set up environment variables**

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api)
- `SUPABASE_SERVICE_ROLE_KEY` — from the same page, under *Service role* (keep this secret)
- `GROQ_API_KEY` — from [console.groq.com/keys](https://console.groq.com/keys)
- `COHERE_API_KEY` — from [dashboard.cohere.com](https://dashboard.cohere.com) (optional, only needed for document RAG)

**3. Apply database migrations**

In your [Supabase SQL editor](https://supabase.com/dashboard/project/_/sql), run each file from `supabase/migrations/` in order. This only needs to be done once.

**4. Install dependencies and start the dev server**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test                   # unit tests (Vitest)
npm run test:e2e:browser   # browser E2E tests (Playwright)
npm run test:e2e:api       # API-level tests (Playwright)
```

E2E tests require a `.env.test` file — copy `.env.test.example` and fill in `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`. Create this user once in your [Supabase Auth dashboard](https://supabase.com/dashboard/project/_/auth/users) before running the tests.

## Contributing

Contributions are welcome. Here's how to get started:

1. **Open an issue first** — for any new feature or non-trivial change, open an issue to describe what you want to do and why. This avoids duplicate work and lets us align on the approach before you write code. Bug fixes and typos can skip this step.
2. Fork the repository and clone your fork
3. Create a feature branch: `git checkout -b feat/your-feature`
4. Set up the project locally following the [Running locally](#running-locally) steps
5. Make your changes and add tests where applicable
6. Run the test suite to make sure everything passes: `npm test`
7. Push your branch and open a pull request against `main`, referencing the issue
