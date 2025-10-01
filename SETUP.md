# 🚀 Anime Maker - Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
# Copy the environment template
cp .env.local.example .env.local

# Edit .env.local and add your OpenRouter API key
# Get your key from: https://openrouter.ai/keys
```

Your `.env.local` should look like:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Anime Maker
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 What You'll See

### Home Page
- **Left Side**: Interactive form to input your anime story
- **Right Side**: Real-time progress and results

### Features
1. **Story Input**: Describe your anime plot
2. **Character Builder**: Add up to 5 characters with traits
3. **Style Selector**: Choose from 6 anime styles
4. **Scene Slider**: Select 1-10 scenes to generate
5. **Cost Estimator**: See approximate cost before generating
6. **Real-time Progress**: Watch each stage complete live
7. **Results Gallery**: View all generated scenes with scores
8. **Download**: Download individual scenes or all at once

## 📁 Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── generate/route.ts    # SSE streaming endpoint
│   ├── page.tsx                  # Main page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/
│   ├── StoryForm.tsx             # Input form
│   ├── ProgressStream.tsx        # Real-time progress
│   └── ImageGallery.tsx          # Results display
├── lib/
│   ├── openrouter.ts             # OpenRouter client
│   ├── generators.ts             # Generation logic
│   └── utils.ts                  # Utilities
├── types/
│   └── index.ts                  # TypeScript types
└── public/                       # Static assets
```

## 💰 Costs

Based on OpenRouter pricing:
- **1 scene**: ~$0.07
- **3 scenes**: ~$0.21
- **5 scenes**: ~$0.35
- **10 scenes**: ~$0.70

## 🐛 Troubleshooting

### "OPENROUTER_API_KEY is not set"
- Make sure `.env.local` exists in the `frontend/` directory
- Check that the file contains your API key
- Restart the dev server after adding the key

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

### TypeScript errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Images not generating
- Check your OpenRouter API key is valid
- Verify you have sufficient credits
- Check browser console for errors

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard:
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (your Vercel URL)

## 🎯 Usage Tips

1. **Start Small**: Begin with 2-3 scenes to test
2. **Be Specific**: Detailed character descriptions get better results
3. **Choose Style**: Different styles create different aesthetics
4. **Review Scores**: Check verification scores to see quality
5. **Retry if Needed**: Generation can be retried if results aren't perfect

## 📚 Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **OpenRouter API**: AI model access
- **Server-Sent Events**: Real-time streaming
- **Gemini Models**: Story, image, and verification

## 🎨 Features Implemented

✅ Interactive story form with validation
✅ Character builder (up to 5 characters)
✅ Anime style selector (6 options)
✅ Scene count slider (1-10)
✅ Cost estimation
✅ Real-time progress streaming
✅ Stage-by-stage indicators
✅ Image gallery with scores
✅ Verification details
✅ Download individual/all images
✅ Collapsible script viewer
✅ Beautiful gradient UI
✅ Responsive design
✅ Error handling

## 🔧 Development

### Adding New Anime Styles
Edit `components/StoryForm.tsx`:
```typescript
const ANIME_STYLES = [
  { value: 'your-style', label: 'Your Style', description: 'Description' },
  // ...
];
```

### Adjusting Models
Edit `lib/generators.ts`:
```typescript
const MODELS = {
  story: 'google/gemini-2.5-flash-lite',
  // Change models here
};
```

## 🤝 Support

Having issues? Check:
1. Console logs (F12 in browser)
2. Terminal output
3. Network tab for API calls
4. OpenRouter dashboard for usage

Enjoy creating anime! ✨🎨