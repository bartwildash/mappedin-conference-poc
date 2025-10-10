# Deployment Guide - GitHub Pages

## Quick Deploy (Automatic)

### Step 1: Commit Changes

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add smart search and zoom-based label visibility (v1.1.0)

- Enhanced search using standard Mappedin Search.query() API
- Zoom-based label visibility for progressive disclosure
- 4-tier label system with rank priorities
- No breaking changes, fully backwards compatible

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to main branch
git push origin main
```

### Step 2: GitHub Actions Auto-Deploy

GitHub Actions will automatically:
1. ✅ Checkout code
2. ✅ Install dependencies (`npm ci`)
3. ✅ Build project (`npm run build`)
4. ✅ Deploy `dist/` to GitHub Pages

**Deployment Time:** ~2-3 minutes

### Step 3: Verify Deployment

Visit: **https://bartwildash.github.io/mappedin-conference-poc/**

## What's Being Deployed

### Files Deployed to GitHub Pages
```
dist/
├── index.html                    # Main app (minified)
├── assets/
│   ├── index-DOLS7EvE.js        # Bundled JS (3.1 MB)
│   ├── index-DXfiSx10.css       # Bundled CSS (25 KB)
│   └── [other assets]
├── js/
│   └── search-module.js         # Search module (13 KB)
└── map/
    └── [map assets]
```

### New Features in This Deployment

✨ **Smart Search (v1.1.0)**
- Standard Mappedin Search API implementation
- `Search.query()` for full object retrieval
- `Search.suggest()` for fast autocomplete
- Enhanced booth number search

✨ **Zoom-Based Labels (v1.1.0)**
- Progressive label disclosure
- Zoom thresholds: 0 → 18 → 20 → 22
- 4 label categories with rank priorities
- Camera event listener

## Monitor Deployment

### View GitHub Actions Status

1. Go to: https://github.com/bartwildash/mappedin-conference-poc/actions
2. Click on latest workflow run
3. Monitor progress:
   - 🟡 In Progress
   - ✅ Success (green)
   - ❌ Failed (red)

### Check Deployment Logs

```bash
# View latest workflow run
gh run list --limit 1

# View workflow logs
gh run view --log
```

## Troubleshooting Deployment

### Build Fails

**Error: "Module not found"**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error: "Permission denied"**
- Check GitHub Pages settings
- Ensure GitHub Actions has write permissions
- Repository Settings → Actions → General → Workflow permissions

### Page Not Loading

**404 Error**
- Check base path in `vite.config.js` matches repo name
- Current: `base: '/mappedin-conference-poc/'`

**Blank Page**
- Check browser console for errors
- Verify Mappedin credentials are set
- Test locally: `npm run build && npm run preview`

### Old Version Showing

**Clear Cache:**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Incognito/Private mode
- Clear browser cache

## Manual Deployment (Alternative)

If GitHub Actions is unavailable:

### Option 1: Deploy via gh-pages CLI

```bash
# Install gh-pages
npm install -g gh-pages

# Build and deploy
npm run build
gh-pages -d dist
```

### Option 2: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
npm run build
netlify deploy --prod --dir=dist
```

## Environment Variables (if needed)

GitHub Actions uses these secrets (if configured):

```yaml
# .github/workflows/deploy.yml
env:
  VITE_MAPPEDIN_KEY: ${{ secrets.MAPPEDIN_KEY }}
  VITE_MAPPEDIN_SECRET: ${{ secrets.MAPPEDIN_SECRET }}
```

**Note:** Current implementation has credentials in code (for demo purposes).
For production, use environment variables.

## Post-Deployment Testing

### Automated Tests
```bash
# Run after deployment
npm run test        # Unit tests (if configured)
npm run e2e         # E2E tests (if configured)
```

### Manual Testing Checklist

Visit deployed site and verify:

- [ ] Map loads correctly
- [ ] Search functionality works
  - [ ] Search for exhibitor name
  - [ ] Search for booth number
  - [ ] Camera focuses on result
- [ ] Label visibility works
  - [ ] Zoom out: Only exhibitors visible
  - [ ] Zoom to 19: Main areas appear
  - [ ] Zoom to 21: Amenities appear
  - [ ] Zoom to 23: All booths appear
- [ ] Navigation works
  - [ ] Click "Directions" on exhibitor card
  - [ ] Set start location
  - [ ] Path displays correctly
- [ ] Mobile responsive
  - [ ] Test on iOS Safari
  - [ ] Test on Android Chrome
  - [ ] Touch interactions work

### Performance Testing

```bash
# Lighthouse audit
npx lighthouse https://bartwildash.github.io/mappedin-conference-poc/

# Check bundle size
npm run build
du -sh dist/
```

## Rollback Plan

### Revert to Previous Version

```bash
# Find previous commit
git log --oneline

# Revert to specific commit
git revert <commit-hash>
git push origin main

# Or reset to previous version
git reset --hard <commit-hash>
git push origin main --force  # Use with caution!
```

### Quick Fix Deployment

```bash
# Make fix
# ... edit files ...

# Quick commit and deploy
git add .
git commit -m "hotfix: [description]"
git push origin main
```

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally
- [ ] Build succeeds without errors
- [ ] Preview build works (`npm run preview`)
- [ ] Credentials are correct
- [ ] Documentation is updated
- [ ] Version number bumped
- [ ] Changelog updated (if applicable)
- [ ] Team notified of deployment

## GitHub Pages Configuration

### Current Settings

- **Source**: GitHub Actions
- **Branch**: gh-pages (auto-created)
- **Path**: / (root)
- **Base URL**: `/mappedin-conference-poc/`

### Update Base URL (if repo renamed)

Edit `vite.config.js`:
```javascript
export default defineConfig({
  base: '/NEW-REPO-NAME/',  // Update this
  // ...
})
```

## Support

**GitHub Actions Issues:**
- Check: https://github.com/bartwildash/mappedin-conference-poc/actions

**Deployment Issues:**
- Create issue: https://github.com/bartwildash/mappedin-conference-poc/issues

**Mappedin SDK Issues:**
- Docs: https://developer.mappedin.com/web-sdk

---

## Summary

✅ **Zero-config deployment** - Just push to main
✅ **Automatic builds** - GitHub Actions handles everything
✅ **No migration needed** - Backwards compatible
✅ **2-3 minute deployment** - Fast CI/CD pipeline

**Next Step:** Run `git add .`, `git commit`, and `git push` to deploy! 🚀
