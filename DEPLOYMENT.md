# 🚀 Deployment Guide - Dream Weaver AI

## Overview

This guide covers deploying Dream Weaver AI to Vercel. The application is designed to be deployed without requiring server-side API key storage - users provide their own OpenRouter API keys through the UI.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Git repository with your code

## Vercel Deployment (Recommended)

### Step 1: Prepare Your Repository

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify `.gitignore` excludes sensitive files:**
   ```
   .env*.local
   .env
   /public/generated/*
   ```

### Step 2: Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js framework

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

**Required:**
- `NEXT_PUBLIC_SITE_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- `NEXT_PUBLIC_SITE_NAME`: `Dream Weaver AI`

**Optional (NOT recommended for production):**
- `OPENROUTER_API_KEY`: Server-side fallback key (users should provide their own)

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployed URL

## Post-Deployment

### Testing

1. Visit your deployment URL
2. You should see an API key input banner
3. Enter a valid OpenRouter API key
4. Test story generation

### Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` to your custom domain

## User Workflow

### First-Time Users

1. Visit the site
2. See "OpenRouter API Key Required" banner
3. Click "Get API Key" → Opens [OpenRouter](https://openrouter.ai/keys)
4. Sign up and create a free API key
5. Paste key into input field
6. Click "Save Key"
7. Key is stored in browser localStorage (private, local-only)
8. Start generating anime!

### Privacy & Security

✅ **User API keys are stored locally** in browser localStorage  
✅ **Keys never touch your server** - sent directly to OpenRouter  
✅ **Users control their own API usage** and costs  
✅ **No server-side API key management** required  

## Troubleshooting

### Build Fails

**Error: `Module not found`**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally and commit `package-lock.json`

**Error: `Type errors`**
- Run `npm run build` locally first
- Fix TypeScript errors before deploying

### Runtime Errors

**"API key required" despite providing key**
- Check browser console for errors
- Verify key is saved in localStorage: DevTools → Application → Local Storage
- Try removing and re-adding the key

**Image generation fails**
- Check OpenRouter dashboard for API usage/credits
- Verify API key has correct permissions
- Check browser network tab for error responses

**Slow performance**
- Vercel free tier has some limitations
- Consider upgrading to Pro for better performance
- Image generation is inherently slow (~30-60s per image)

### Environment Variables Not Working

1. Verify variables are set in Vercel dashboard
2. Variables starting with `NEXT_PUBLIC_` are exposed to browser
3. Redeploy after changing environment variables
4. Check build logs for confirmation

## Monitoring

### View Logs

1. Vercel Dashboard → Your Project → Deployments
2. Click on a deployment → "Function Logs"
3. Real-time logs during generation

### Check Usage

1. Users can check their API usage at [OpenRouter Activity](https://openrouter.ai/activity)
2. Serverless function execution times visible in Vercel logs

## Cost Considerations

### Vercel Costs

- **Free Tier**: Sufficient for personal use
  - 100 GB bandwidth/month
  - 100 GB-hours serverless function execution
  - No credit card required

- **Pro ($20/month)**: For production apps
  - Unlimited bandwidth
  - Better performance
  - Team collaboration

### OpenRouter Costs

Users pay for their own API usage:
- **3 scenes**: ~$0.13
- **5 scenes**: ~$0.21
- **10 scenes**: ~$0.42

Free tier credits available on OpenRouter for new users.

## Scaling

### Performance Tips

1. **Enable caching**: Use Vercel's edge caching for static assets
2. **Optimize images**: Already configured with Next.js Image component
3. **Database for history**: Consider adding Vercel KV or similar for persistent history
4. **CDN for generated images**: Use Vercel Blob Storage or S3

### Adding Features

**Persistent History:**
```bash
npm install @vercel/kv
```

**User Authentication:**
```bash
npm install next-auth
```

**Image Storage:**
```bash
npm install @vercel/blob
```

## Alternative Deployment Platforms

While Vercel is recommended, you can also deploy to:

- **Netlify**: Similar to Vercel, supports Next.js
- **Railway**: Good for full-stack apps
- **AWS Amplify**: If using AWS ecosystem
- **Self-hosted**: Use `npm run build && npm start`

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [OpenRouter API Docs](https://openrouter.ai/docs)

## Security Best Practices

1. ✅ Never commit `.env*.local` files
2. ✅ Don't set `OPENROUTER_API_KEY` in Vercel (let users provide their own)
3. ✅ Keep dependencies updated: `npm audit`
4. ✅ Use environment variables for configuration
5. ✅ Monitor Vercel logs for suspicious activity

## Maintenance

### Updating the App

```bash
git add .
git commit -m "Update: description of changes"
git push origin main
```

Vercel automatically deploys on push to main branch.

### Rolling Back

1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

**Ready to deploy? Follow the steps above and your anime generator will be live in minutes! 🎨✨**
