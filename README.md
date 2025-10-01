# Anime Maker - Web Frontend 🎨

A beautiful Next.js web application for generating anime scenes using AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenRouter API key

### Installation

```bash
cd frontend
npm install
```

### Configuration

1. Copy the environment file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your OpenRouter API key:
```env
OPENROUTER_API_KEY=your_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Anime Maker
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── generate/route.ts    # Main generation endpoint (SSE streaming)
│   │   └── presets/route.ts     # Preset management
│   ├── page.tsx                  # Home page (to be created)
│   └── layout.tsx                # Root layout (to be created)
├── components/                   # UI components (to be created)
├── lib/
│   ├── openrouter.ts            # OpenRouter API client
│   └── generators.ts            # Generation pipeline logic
├── types/
│   └── index.ts                 # TypeScript type definitions
└── public/                      # Static assets
```

## 🎨 Features

### Completed ✅
- **OpenRouter Integration** - Direct API calls to Gemini models
- **Generation Pipeline** - Story, prompts, images, verification
- **Streaming API** - Real-time progress updates via Server-Sent Events
- **Type Safety** - Full TypeScript support

### To Build 🚧
- **UI Components** - Interactive form, progress bar, image gallery
- **Preset Management** - Save/load favorite settings
- **Main Page** - Complete user interface
- **Styling** - Tailwind CSS with animations

## 🔧 API Endpoints

### POST /api/generate
Generates anime scenes with real-time streaming progress.

**Request Body:**
```json
{
  "outline": "Story description",
  "characters": [
    {"name": "Yuki", "traits": "shy, ice magic, blue hair"}
  ],
  "style": "shoujo",
  "episodes": 1,
  "scenes_per_episode": 3
}
```

**Response:** Server-Sent Events stream with progress updates

**Event Format:**
```json
{
  "stage": "story" | "prompts" | "image" | "verification" | "complete",
  "progress": 0-100,
  "message": "Status message",
  "data": { ... }
}
```

## 💰 Cost Estimation

Based on OpenRouter pricing:
- 3 scenes: ~$0.13
- 5 scenes: ~$0.21
- 10 scenes: ~$0.42

## 🛠️ Development

### Adding UI Components

Create components in `components/` directory:
```typescript
// components/StoryForm.tsx
export function StoryForm() {
  // Your component
}
```

### Testing the API

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "outline": "Test story",
    "characters": [{"name": "Test", "traits": "brave"}],
    "style": "shounen",
    "episodes": 1,
    "scenes_per_episode": 1
  }'
```

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel
```

Make sure to add environment variables in Vercel dashboard.

## 🎯 Next Steps

1. **Create UI Components:**
   - `components/StoryForm.tsx` - Input form
   - `components/CharacterBuilder.tsx` - Character cards
   - `components/ProgressStream.tsx` - Real-time progress
   - `components/ImageGallery.tsx` - Results display

2. **Create Main Page:**
   - `app/page.tsx` - Home with form and results
   - `app/layout.tsx` - Root layout with styling

3. **Add Preset Management:**
   - `app/api/presets/route.ts` - CRUD operations
   - `components/PresetSelector.tsx` - UI for presets

4. **Polish UI:**
   - Add Tailwind styling
   - Add animations with Framer Motion
   - Add loading states and error handling

## 🐛 Troubleshooting

**"OPENROUTER_API_KEY is not set"**
- Make sure `.env.local` exists with your API key
- Restart the dev server after adding the key

**Image generation fails**
- Check OpenRouter API quota
- Verify model names in `lib/generators.ts`

**TypeScript errors**
- Run `npm install` to ensure all dependencies are installed
- Check that types are correctly imported

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

## 🤝 Contributing

The frontend is built with:
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenRouter** - AI model access

Ready to build the UI! 🎨