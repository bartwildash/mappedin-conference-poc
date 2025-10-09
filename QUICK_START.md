# ⚡ Quick Start Guide

## 🎯 Goal
Get the POC running in **5 minutes** for demo/testing.

---

## 📦 What You Have

A complete POC at: `~/github/mappedin-conference-poc`

**Features:**
- ✅ 3D venue map (ICC)
- ✅ Exhibitor discovery
- ✅ Smart search
- ✅ Website + Mobile versions

---

## 🚀 Run the Demo (3 Steps)

### 1. Install Dependencies
```bash
cd ~/github/mappedin-conference-poc
npm install
```

### 2. Start Server
```bash
npm run dev
```

### 3. Open Browser
- **Landing Page**: http://localhost:5173
- **Website Demo**: http://localhost:5173/map
- **Mobile Demo**: http://localhost:5173/map/app.html

---

## 🎬 Demo Flow (2 Minutes)

### Website Version
1. Open `/map/index.html`
2. Pan/zoom around 3D map
3. Click any booth marker
4. See exhibitor card appear
5. Type in search bar
6. Click result → Jump to booth

### Mobile/App Version
1. Open `/map/app.html`
2. Click booth marker
3. Check console for postMessage
4. Test deep-link: Add `?stallNo=2G19` to URL

---

## 🔧 Connect Your Data

### Update API URL
```javascript
// In: public/map/index.html (line ~172)
const API_URL = 'https://your-api.com/api/exhibitor-directory';
```

### Configure Mappedin
```javascript
// Already set for ICC venue:
const MAPPEDIN_CONFIG = {
  mapId: '688ea50e362b1d000ba0822b',
  key: 'mik_iND9Ra87M1Ca4DD444be4063d',
  secret: 'mis_esa0RDim6GGkbO2f7m6jNca0ADvFcZc8IzigafkC2dq85341024'
};
```

---

## 📚 Key Documents

**For Stakeholders:**
- 📊 [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) - Full POC report
- 🎯 [POC_PLAN.md](./POC_PLAN.md) - Vision & demo script

**For Developers:**
- 📖 [README.md](./README.md) - Project overview
- 🛠️ [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Dev guide
- 📋 [BACKLOG.md](./BACKLOG.md) - Roadmap

**For Deep-Dives:**
- 🏗️ [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical specs
- 🔌 [docs/INTEGRATION.md](./docs/INTEGRATION.md) - React Native setup
- 📡 [docs/API.md](./docs/API.md) - API requirements

---

## ✅ Pre-Demo Checklist

### Must Do
- [ ] Run `npm run dev` - Verify it starts
- [ ] Open browser - Check map loads
- [ ] Click a booth - Verify card shows
- [ ] Test search - Type any exhibitor name
- [ ] Check console - No errors

### Should Do
- [ ] Test on mobile device
- [ ] Connect to real API (optional)
- [ ] Practice demo script (2 min)
- [ ] Prepare backup (screenshots)

### Nice to Have
- [ ] Customize brand colors
- [ ] Add your exhibitor logos
- [ ] Test with stakeholders

---

## 🐛 Troubleshooting

### Map doesn't load
```bash
# Check Mappedin credentials
# Verify internet connection
# Open browser console for errors
```

### No markers showing
```bash
# Exhibitor API might be unreachable
# Check CORS configuration
# Verify stallNo matches externalId
```

### postMessage not working
```bash
# Only works in React Native WebView
# Use console.log to debug in browser
```

---

## 🚀 Next Steps

### Today
1. Test the POC locally
2. Review documentation
3. Prepare for demo

### Tomorrow
4. Present to stakeholders
5. Get approval
6. Plan v1.0 production

### This Week
7. Build production version (1 week)
8. Add navigation/wayfinding
9. Deploy & launch

---

## 📞 Need Help?

**Documentation:**
- Full specs: `/docs` folder
- Quick ref: This file

**Common Issues:**
- CORS errors → Check API configuration
- Map not loading → Verify Mappedin credentials
- Search not working → Check exhibitor data format

**Support:**
- Technical: Check `/docs/IMPLEMENTATION.md`
- Architecture: Check `/docs/ARCHITECTURE.md`
- API: Check `/docs/API.md`

---

## 🎯 Success = Demo Working

**In 5 minutes you should have:**
- ✅ Server running
- ✅ Map visible in browser
- ✅ Booths clickable
- ✅ Cards displaying
- ✅ Search functional

**If yes → You're ready to demo! 🎉**

---

**Current Status:** 🟢 POC Complete
**Location:** `~/github/mappedin-conference-poc`
**Ready for:** Stakeholder Demo
