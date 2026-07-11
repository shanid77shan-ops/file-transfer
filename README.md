# File Transfer

A responsive, cross-platform file sharing app built with React, Vite, Tailwind CSS, and Supabase.

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env` and fill in your project URL and anon key:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these values in **Supabase Dashboard → Project Settings → API**.

### 3. Run the database migration

Open **Supabase Dashboard → SQL Editor**, paste the contents of `supabase/migrations/001_create_files_table.sql`, and run it.

This creates:

- A `files` metadata table
- A public `shared-files` storage bucket
- Row Level Security policies for anonymous read/upload

### 4. Start the dev server

```bash
npm run dev
```

Open the local URL shown in your terminal (usually `http://localhost:5173`).

## Features

- Drag-and-drop or tap-to-upload on mobile
- Upload progress indicator
- File gallery with type icons, size, and upload date
- Download and copy public link actions
- Graceful handling of missing env vars and upload errors

## Production build

```bash
npm run build
npm run preview
```

## Security note

The default policies allow anyone with your anon key to upload and list files. For a private app, add Supabase Auth and restrict RLS policies to authenticated users.
