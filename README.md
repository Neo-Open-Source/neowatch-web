<p align="center">
  <img alt="NeoWatch" src="./public/neo-icon.png" width="48" />
</p>

<p align="center">
  <strong>NeoWatch Web</strong> — Streaming app for movies and TV shows.
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgit.disroot.org%2FNeo%2Fneowatch-web.git&project-name=neowatch-web">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
</p>

<div align="center">

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-19-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Apollo Client](https://img.shields.io/badge/Apollo%20Client-4.3-311C87?logo=apollographql)](https://www.apollographql.com/docs/react/)

</div>

---

## Features

- **Streaming** — Watch movies and TV shows with multiple player options
- **Browsing** — Discover trending, popular, and top-rated content
- **Search** — Find movies and shows with powerful search
- **Collections** — Organized content by genres and categories
- **User Experience** — Favorites, watch later, cross-device sync
- **Responsive** — Optimized for TV, desktop, tablet, and mobile
- **Spatial Navigation** — TV-friendly navigation with norigin-media
- **Multi-language** — English and Russian support

## Stack

| Category | Technology |
|----------|-----------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| Runtime | [React](https://react.dev/) 19 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v4 |
| State Management | [Apollo Client](https://www.apollographql.com/docs/react/) |
| GraphQL | [GraphQL](https://graphql.org/) |
| Streaming | [hls.js](https://github.com/video-dev/hls.js/) |
| Icons | [Lucide React](https://lucide.dev/) + [React Icons](https://react-icons.github.io/react-icons/) |
| Notifications | [Sonner](https://sonner.emilkowal.ski/) |
| Loading | [Next.js Toploader](https://github.com/tmrowco/nextjs-toploader) |
| Deployment | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.x or later
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn

### Setup

```bash
# Clone the repository
git clone https://git.disroot.org/Neo/neowatch-web.git
cd neowatch-web

# Copy environment variables
cp .env.example .env
# Edit .env with your API endpoint configuration

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | NeoWatch API base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_GRAPHQL_URL` | No | GraphQL endpoint URL | API_URL + `/graphql` |

## Project Structure

```
app/
  (main)/               # Main application pages
    layout.tsx          # Root layout
    page.tsx           # Home page
    globals.css        # Global styles
    providers.tsx      # React Query + Apollo providers
    components/        # Reusable UI components
    lib/               # Utilities and hooks
    api/               # API client configuration
    types/             # TypeScript types
    styles/            # Additional styles
  (watch)/              # Watch page
    [id]/page.tsx      # Media watch page
  (search)/            # Search page
    page.tsx           # Search results
  (favorites)/         # Favorites page
    page.tsx           # User favorites
  (later)/             # Watch later page
    page.tsx           # Watch later list
public/                 # Static assets
  images/             # App images and icons
```

## Key Features

### Streaming
- Multiple player support (Alloha, Collaps, CDN, HLS)
- Quality selection
- Subtitles support
- Playback history

### Navigation
- Spatial navigation for TV/remote control
- Keyboard shortcuts
- Focus management

### UI Components
- Responsive grid layouts
- Media cards with hover effects
- Loading states
- Error handling

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Deployment

### Vercel

The project is pre-configured for Vercel deployment. Simply import the repository and deploy.

```bash
vercel deploy
```

### Environment Setup

Set the following environment variables in your Vercel project:
- `NEXT_PUBLIC_API_URL` — Your NeoWatch API URL

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on `localhost:3000` |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## Technologies

- **Next.js 16** — React framework with App Router
- **React 19** — Latest React with Server Components
- **Tailwind CSS 4** — Utility-first CSS framework
- **Apollo Client** — GraphQL state management
- **hls.js** — HLS video streaming in browser
- **norigin-media** — Spatial navigation for TV interfaces
- **TypeScript** — Type safety across the application

## License

[MIT](LICENSE) © Neo-Open-Source
