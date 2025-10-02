# Model Selector Feature - Testing Guide

## Prerequisites
1. Start the development server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Open browser DevTools (F12) and go to:
   - **Console tab** - to see debug logs
   - **Network tab** - to see API calls

## Testing Steps

### Step 1: Add API Key (Required)
The Model Configuration feature only appears when you have an API key saved.

1. Click the **"API Key Required"** or **"API Key Connected"** button in the top-right
2. If you don't have a key:
   - Enter your OpenRouter API key (starts with `sk-or-v1-...`)
   - Click **"Save Key"**
3. The button should now show **"API Key Connected"** with a green checkmark

### Step 2: Access Model Configuration
1. Click the **"API Key Connected"** button to open the dropdown
2. You should see:
   - ✓ Key saved in browser
   - Remove Key button
   - View Usage link
   - **"Model Configuration"** section with a **"Configure"** button

### Step 3: Open Model Selectors
1. Click the **"Configure"** button in the Model Configuration section
2. You should see 3 model selectors appear:
   - 📝 Text Generation (Story & Prompts)
   - 🎨 Image Generation
   - 👁️ Image Verification

**Check Console:** You should see:
```
Model configuration panel opened
ModelSelector (text): 0 models, loading: true, error: null
ModelSelector (image): 0 models, loading: true, error: null
ModelSelector (vision): 0 models, loading: true, error: null
```

### Step 4: Verify API Calls
**Check Network Tab:** You should see 3 API calls:
- `GET /api/models?category=text`
- `GET /api/models?category=image`
- `GET /api/models?category=vision`

**Check Console:** After models load, you should see:
```
Fetching models from: /api/models?category=text
Fetched 50 models for category: text
ModelSelector (text): 50 models, loading: false, error: null
```

### Step 5: Test Search Functionality
1. Click on any model selector (e.g., Text Generation)
2. The dropdown should open showing a search box
3. Type in the search box (e.g., "grok", "claude", "gemini")
4. The list should filter **instantly without new API calls** (client-side filtering)
5. Search is debounced with 300ms delay

**Note:** Search does NOT make new API calls - it filters the already-fetched models client-side.

### Step 6: Select Models
1. Click on a model from the dropdown
2. The selector should show the selected model
3. Repeat for all 3 selectors (text, image, vision)
4. Click **"Save Configuration"**

**Check Console:** You should see the selection saved to localStorage.

### Step 7: Test Persistence
1. Refresh the page (F5)
2. Click the API Key dropdown again
3. You should see your saved models displayed:
   - 📝 Text: [your selected model]
   - 🎨 Image: [your selected model]  
   - 👁️ Verify: [your selected model]

### Step 8: Test Reset
1. Click "Configure" again
2. Change some models
3. Click **"Reset to Defaults"**
4. Models should revert to:
   - Text: `x-ai/grok-4-fast:free`
   - Image: `google/gemini-2.5-flash-image-preview`
   - Verification: `x-ai/grok-vision-beta`

## Troubleshooting

### No API calls in Network tab
**Possible causes:**
1. **No API key saved** - The Model Configuration section only shows when you have an API key
2. **Using cached models** - After first load, models are cached. Check console for "Using cached models" message
3. **Component not rendering** - Check console for "Model configuration panel opened" message

**Solutions:**
- Clear localStorage: `localStorage.clear()` in console, then refresh
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Check if API route works: Open `http://localhost:3000/api/models?category=text` directly

### Dropdown not opening
- Check if models are loaded: Look for `ModelSelector (text): 50 models` in console
- Check for errors: Look for red error messages in console

### No models showing
- Check if API route is accessible: `curl http://localhost:3000/api/models?category=text`
- Check console for fetch errors
- Verify OpenRouter API is accessible: `curl https://openrouter.ai/api/v1/models`

### Search not working
- Search is **client-side** - it filters already-fetched models
- Type slowly and watch the list update after 300ms
- Check console: `ModelSelector (text): X models` should show changing numbers

## Expected Debug Output

**On opening Model Configuration:**
```
Model configuration panel opened
Fetching models from: /api/models?category=text
Fetching models from: /api/models?category=image  
Fetching models from: /api/models?category=vision
```

**After models load:**
```
Fetched 50 models for category: text
ModelSelector (text): 50 models, loading: false, error: null
Fetched 30 models for category: image
ModelSelector (image): 30 models, loading: false, error: null
Fetched 20 models for category: vision
ModelSelector (vision): 20 models, loading: false, error: null
```

**On subsequent opens (cached):**
```
Model configuration panel opened
Using cached models for category: text
Using cached models for category: image
Using cached models for category: vision
```

## Manual API Test

Test the API endpoint directly:
```bash
# Test text models
curl http://localhost:3000/api/models?category=text

# Test image models
curl http://localhost:3000/api/models?category=image

# Test vision models
curl http://localhost:3000/api/models?category=vision

# Test search (not implemented server-side, done client-side)
curl http://localhost:3000/api/models?category=text&search=grok
```

All should return JSON with `data` array containing model objects.
