# 🔧 Troubleshooting Guide

## Map Failed to Load?

### Quick Diagnostics

**Step 1: Try the Simple Test**
```bash
cd ~/github/mappedin-conference-poc
open public/map/test-simple.html
```

This minimal version will show you exactly what's wrong.

---

### Common Issues & Fixes

#### 1. ❌ "Failed to fetch" or "Network Error"

**Cause:** No internet connection or Mappedin CDN blocked

**Fix:**
- Check internet connection
- Try different network (turn off VPN if using one)
- Check browser console (F12) for specific error

---

#### 2. ❌ "Invalid credentials" or "401 Unauthorized"

**Cause:** Mappedin API keys incorrect or expired

**Fix:**
```javascript
// Check these credentials are correct:
mapId: '688ea50e362b1d000ba0822b'
key: 'mik_iND9Ra87M1Ca4DD444be4063d'
secret: 'mis_esa0RDim6GGkbO2f7m6jNca0ADvFcZc8IzigafkC2dq85341024'
```

**Test with Mappedin directly:**
https://developer.mappedin.com/web-sdk/getting-started

---

#### 3. ❌ "Module not found" or "import error"

**Cause:** BlueDot module import issue

**Fix:** The enhanced version uses ES modules. Try:

**Option A:** Use the original version (no BlueDot):
```bash
open public/map/index.html
```

**Option B:** Run with a dev server:
```bash
cd ~/github/mappedin-conference-poc
npx vite public/map --port 3000
# Open http://localhost:3000/index-enhanced.html
```

---

#### 4. ❌ Blank screen, no error

**Cause:** JavaScript error before map loads

**Fix:**
1. Open browser console (F12)
2. Look for red errors
3. Share the error message

**Quick check:**
```bash
# Open simple test - it has better error messages
open public/map/test-simple.html
```

---

#### 5. ❌ Map loads but no exhibitors

**Cause:** API endpoint not accessible (expected for POC!)

**Fix:** This is OK! The POC works without real data.

**What you can still test:**
- ✅ Map loads and renders
- ✅ Pan/zoom/rotate
- ✅ Drop pin (parachute animation)
- ✅ Blue dot button
- ✅ Search bar (won't return results without data)

**For demo:** Say "The exhibitor data would come from your API here"

---

#### 6. ❌ "CORS error" in console

**Cause:** API doesn't allow cross-origin requests

**Expected for POC!** Your API needs CORS configured.

**Temporary fix for testing:**
```javascript
// Mock some data in the browser console:
localStorage.setItem('exhibitors', JSON.stringify([
  {
    "id": "1",
    "companyName": "Test Company",
    "stallNo": "2G19",
    "categories": ["AEROSPACE"],
    "profileDesc": "Test exhibitor for demo",
    "website": "https://example.com"
  }
]));
```

Then refresh page - it will use cached data!

---

## Step-by-Step Debug

### 1. Open Browser Console
- **Chrome/Edge:** Press F12 or Cmd+Option+I (Mac)
- **Safari:** Enable Develop menu first, then Cmd+Option+I
- **Firefox:** Press F12

### 2. Check Console Tab
Look for:
- ❌ Red errors (critical)
- ⚠️ Yellow warnings (usually OK)
- ℹ️ Blue info (usually OK)

### 3. Common Error Messages

**"Failed to load resource"**
- Internet issue or CDN blocked
- Try different network

**"Uncaught TypeError"**
- JavaScript error
- Try `test-simple.html` instead

**"Mixed content"**
- HTTP/HTTPS issue
- Make sure you're using HTTPS URLs

**"Module import failed"**
- ES modules issue
- Use dev server or switch to `index.html`

---

## Quick Fixes by File

### If `index-enhanced.html` fails:

**Try 1:** Original version (no BlueDot)
```bash
open public/map/index.html
```

**Try 2:** Simple test
```bash
open public/map/test-simple.html
```

**Try 3:** Dev server
```bash
npx vite public/map --port 3000
# Open http://localhost:3000/index-enhanced.html
```

---

## Verify Mappedin Credentials

Test these credentials work:

**Method 1: Official Playground**
1. Go to: https://developer.mappedin.com/web-sdk/getting-started
2. Replace their credentials with yours:
   ```javascript
   mapId: '688ea50e362b1d000ba0822b'
   key: 'mik_iND9Ra87M1Ca4DD444be4063d'
   secret: 'mis_esa0RDim6GGkbO2f7m6jNca0ADvFcZc8IzigafkC2dq85341024'
   ```
3. If it works there, your credentials are fine

**Method 2: API Test**
```bash
curl -X POST https://api.mappedin.com/2/maps/688ea50e362b1d000ba0822b \
  -H "Content-Type: application/json" \
  -d '{
    "key": "mik_iND9Ra87M1Ca4DD444be4063d",
    "secret": "mis_esa0RDim6GGkbO2f7m6jNca0ADvFcZc8IzigafkC2dq85341024"
  }'
```

Should return venue data, not an error.

---

## Still Not Working?

### Share This Info:

1. **Which file are you opening?**
   - index.html
   - index-enhanced.html
   - test-simple.html

2. **What browser?**
   - Chrome/Edge/Safari/Firefox
   - Version?

3. **Error message from console?**
   - Open console (F12)
   - Copy the red error text

4. **What do you see?**
   - Blank screen?
   - Loading spinner forever?
   - Error message?

5. **Screenshot of console?**
   - Press F12
   - Take screenshot of Console tab

---

## Fallback: Demo Without Map

If Mappedin won't load, you can still demo the concept:

**Show:**
1. ✅ Architecture docs (how it would work)
2. ✅ Screenshots of working version
3. ✅ Code walkthrough
4. ✅ Explain the features

**Say:**
"The Mappedin SDK loads from their CDN. In production, we'd optimize this. But here's how it works..."

Then show the code and explain the architecture.

---

## Test Checklist

Run through this:

- [ ] Internet connected?
- [ ] Tried `test-simple.html`?
- [ ] Checked browser console (F12)?
- [ ] Tried different browser?
- [ ] Tried dev server (`npx vite`)?
- [ ] Verified Mappedin credentials?

If all above ✅ and still broken:
→ Share console error message for help!

---

## Pro Tips

### For Demo Day:

**Always have backups:**
1. ✅ Screenshots of working map
2. ✅ Screen recording of features
3. ✅ Architecture slides
4. ✅ Offline version (if possible)

### Quick Test Before Demo:
```bash
# 30 seconds before presenting:
cd ~/github/mappedin-conference-poc
open public/map/test-simple.html

# Look for: "✅ Success! Loaded X spaces"
# If you see that → You're good to go!
```

---

## Contact

**Mappedin Support:**
- Docs: https://developer.mappedin.com
- Support: support@mappedin.com

**For this POC:**
- Check: `docs/MAPPEDIN_OFFICIAL_METHODS.md`
- Review: `IMPLEMENTATION.md`

---

**Most Common Fix:** Use `test-simple.html` - it has better error messages!

```bash
open ~/github/mappedin-conference-poc/public/map/test-simple.html
```
