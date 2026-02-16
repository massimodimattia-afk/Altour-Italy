# Altour Italy - Escursioni e Formazione Outdoor

## Overview
A Vite + React + TypeScript web application for Altour Italy, an outdoor excursion and training company. Uses Tailwind CSS for styling and Supabase as the backend database.

## Project Architecture
- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS 3
- **Backend**: Supabase (external)
- **Language**: Italian (UI)
- **Port**: 5000 (development)

## Directory Structure
- `src/` - React source code
  - `components/` - Reusable UI components
  - `pages/` - Page-level components
  - `lib/` - Utilities (Supabase client, image utils)
  - `types/` - TypeScript type definitions
- `public/` - Static assets (logos, icons, manifest)
- `supabase/` - Supabase migrations and edge functions

## Key Commands
- `npm run dev` - Start dev server on port 5000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Recent Changes
- 2026-02-16: Initial Replit setup, configured Vite for port 5000 with host 0.0.0.0
