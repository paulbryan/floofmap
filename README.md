# Floofmap

Floofmap is a modern web application for dog walkers and pet lovers, built with Vite, React, TypeScript, Tailwind CSS, and Supabase.

## Project info

**Live Demo:** https://floofmap.com

**Lovable Project:** https://lovable.dev/projects/floofmap

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Visit the [Floofmap Project on Lovable](https://lovable.dev/projects/floofmap) to prompt changes and deploy instantly. Changes made via Lovable are committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, clone this repo and push changes. Pushed changes will also be reflected in Lovable.

**Requirements:**

- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

Follow these steps:

```sh

# Step 1: Clone the repository
git clone `https://github.com/paulbryan/floofmap`

# Step 2: Navigate to the project directory
cd floofmap

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s) in the repo.
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Supabase Database Setup

This app uses a [Supabase](https://supabase.com/) database for backend, authentication, storage, and edge functions.

### 1. Create a Supabase Project

1. Go to [Supabase](https://app.supabase.com/) and sign in or create an account.
2. Click **New project** and fill in the details (name, password, region).
3. Wait for your project to be provisioned.

### 2. Get Your Project Credentials

1. In your Supabase project dashboard, go to **Project Settings > API**.
2. Copy your **Project URL** and **anon/public API key**.
3. Create a `.env` file in the root of this repo and add:

   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Run Database Migrations

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you haven't already:
   ```sh
   npm install -g supabase
   ```
2. Authenticate the CLI:
   ```sh
   supabase login
   ```
3. Link the CLI to your project:
   ```sh
   supabase link --project-ref <your-project-ref>
   ```
   (You can find your project ref in the project dashboard URL or settings.)
4. Run the migrations:
   ```sh
   supabase db push
   ```

This will apply all SQL migration scripts in the `supabase/migrations/` directory to your Supabase database.

---

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) (backend, auth, storage, edge functions)

## Deployment

Deploy via [Lovable](https://lovable.dev/projects/floofmap): open the project and click Share → Publish.

## Custom Domains

To connect a custom domain, go to Project → Settings → Domains in Lovable and click Connect Domain.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

For more details, see the code in the `src/` and `supabase/` directories.
