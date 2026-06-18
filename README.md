# Jewellery Label Printing System

Simple sticker printing for jewellery shops — built for shop staff, not developers.

## Quick Start

```bash
npm run install:all
copy backend\.env.example backend\.env
npm run seed --prefix backend
npm run dev
```

Open http://localhost:5173 — you land directly on **PRINT LABELS**.

## First-Time Setup (Shop Owner)

1. Click **Admin** at the bottom of the sidebar
2. Choose a password (minimum 4 characters) — no default password exists
3. Go to **Shop Setup** and enter:
   - Store name (appears on every label)
   - Logo (optional)
   - Default sticker format & label design
   - Default behaviour: New Sheet or Continue Existing Sheet

## Daily Use (Staff)

Only 2 menu items: **Print Labels** and **Label Data**

### Quick Print (~20 seconds)

1. Tap **QUICK PRINT**
2. Select products (search by design no, ring, etc.)
3. Tap first empty sticker — rest fills automatically
4. Tap **Print** → confirm → done

### Shortcuts on home screen

- **Recent Products** — tap to print again instantly
- **Recent Prints** — tap to reprint last jobs
- **Previous Prints** — full history (inside Print Labels)

### Sticker sheet shortcuts

- **NEW SHEET** — starts from sticker #1
- **CONTINUE EXISTING SHEET** — mark used stickers, then tap first empty one

## Admin (Password Protected)

- Sticker Formats
- Label Design
- Print Adjustment
- Shop Setup

## Tech Stack

React · Express · MongoDB · TypeScript · Tailwind
