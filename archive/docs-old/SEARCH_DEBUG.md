# 🔍 Search Debug Guide

## Issue: Search Always Says "No Results"

### ✅ Debugging Added

I've added extensive console logging to help diagnose the issue.

**When you load the page, check the browser console for:**

1. **Sample booth numbers available:**
   ```
   📋 Sample booth numbers for search: ["ABC123", "DEF456", ...]
   ```

2. **Exhibitor data matching:**
   ```
   ✅ Exhibitor booths found on map: ["3J84", "3A90"]
   ❌ Exhibitor booths NOT found on map: ["3C74", "3F92", "4A126"]
   ```

3. **When you search, you'll see:**
   ```
   🔍 Search query: ASC
   📊 Search data available:
     - exhibitorMarkers: 150
     - exhibitorData keys: ["3J84", "3A90", "3C74", "3F92", "4A126"]
     - Space matches: 0
     - Exhibitor matches: 0
     - Total results: 0
   ```

---

## 🎯 Most Likely Cause

**The mock exhibitor booth numbers don't match the actual ICC venue booth IDs.**

Our mock data uses:
- `3J84`, `3A90`, `3C74`, `3F92`, `4A126`

But the ICC venue map probably uses different booth numbering like:
- `101`, `102`, `A-23`, etc.

---

## 🔧 Solutions

### **Option 1: Use Actual Booth Numbers (Quick Fix)**

**Steps:**

1. **Open the page:** http://localhost:5173/

2. **Check console for actual booth numbers:**
   ```
   📋 Sample booth numbers for search: [...]
   ```

3. **Update mock data to use real booth numbers:**

```javascript
// Replace lines 367-416 in index.html with REAL booth numbers
const exhibitorData = {
  'ACTUAL_BOOTH_1': [{  // Use real booth number from console
    name: 'ASC Pty Ltd',
    country: 'Australia',
    description: '...',
    website: 'https://asc.com.au'
  }],
  'ACTUAL_BOOTH_2': [{
    name: 'Aerius Marine',
    country: 'Australia',
    description: '...'
  }],
  // etc...
};
```

---

### **Option 2: Search Any Booth (Testing)**

**Add a "search all booths" feature:**

Add this button to test clicking any booth:

```javascript
// Add this function after setupSearch()
function showRandomBooth() {
  if (exhibitorMarkers.length > 0) {
    const randomIndex = Math.floor(Math.random() * exhibitorMarkers.length);
    const { space } = exhibitorMarkers[randomIndex];

    console.log('🎲 Random booth:', space.externalId);
    showCardForSpace(space, true);
    mapView.Camera.focusOn(space);
  }
}

// Add button to HTML
<button onclick="showRandomBooth()">Show Random Booth</button>
```

---

### **Option 3: Make Search Work With ANY Space**

**Modify search to find ANY space, not just exhibitor booths:**

```javascript
function performSearch(query) {
  const searchTerm = query.toLowerCase();

  // Search ALL spaces, not just exhibitor booths
  const allSpaces = mapData.getByType('space');

  const matches = allSpaces.filter(space =>
    space.externalId?.toLowerCase().includes(searchTerm) ||
    space.name?.toLowerCase().includes(searchTerm)
  );

  if (matches.length > 0) {
    const firstMatch = matches[0];
    showCardForSpace(firstMatch, true);
    mapView.Camera.focusOn(firstMatch);
    status.textContent = `✅ Found: ${firstMatch.name || firstMatch.externalId}`;
  } else {
    status.textContent = `❌ No results for "${query}"`;
  }
}
```

---

## 🧪 Testing Steps

### **Step 1: Check Console Logs**

1. Open http://localhost:5173/
2. Open browser DevTools Console (F12)
3. Look for these logs:

```
📋 Sample booth numbers for search: [...]
✅ Exhibitor booths found on map: [...]
❌ Exhibitor booths NOT found on map: [...]
```

**If you see:**
```
❌ Exhibitor booths NOT found on map: ["3J84", "3A90", "3C74", "3F92", "4A126"]
```

**That's the problem!** The mock data booth numbers don't exist in the map.

---

### **Step 2: Find Real Booth Numbers**

From the console log:
```
📋 Sample booth numbers for search: ["A101", "A102", "B201", ...]
```

These are the REAL booth numbers you should use.

---

### **Step 3: Try Searching a Real Booth**

Search for one of the booth numbers from the console log.

**Example:**
- If console shows: `["A101", "A102", "B201"]`
- Try searching: `A101`

If that works, then you just need to update the mock data with real booth numbers!

---

## 📝 What to Tell Me

After checking the console, tell me:

1. **How many spaces have externalId?**
   ```
   📍 Found X spaces with externalId
   ```

2. **What are the sample booth numbers?**
   ```
   📋 Sample booth numbers for search: [...]
   ```

3. **Which exhibitor booths were found/not found?**
   ```
   ✅ Exhibitor booths found on map: [...]
   ❌ Exhibitor booths NOT found on map: [...]
   ```

4. **What happens when you search?**
   ```
   🔍 Search query: ASC
   - Space matches: X
   - Exhibitor matches: X
   - Total results: X
   ```

---

## 🎯 Quick Test Searches

Try these searches to see what happens:

1. **Search for first booth number from console:**
   - Copy a booth number from `📋 Sample booth numbers for search`
   - Paste it in search

2. **Search for "space" or "room":**
   - Might match space names

3. **Click directly on the map:**
   - Any space should show a card
   - Check if it has an externalId (booth number)

---

## ✅ Expected Behavior When Fixed

**When search works, you should see:**

```
🔍 Search query: ASC
📊 Search data available:
  - exhibitorMarkers: 150
  - exhibitorData keys: ["A101", "A102", ...]
  - Space matches: 1
  - Exhibitor matches: 1
  - Total results: 1

✅ Found: ASC Pty Ltd
```

And the camera should focus on the booth and show the exhibitor card!

---

## 🚀 Next Steps

1. **Check console logs** (instructions above)
2. **Share what you see** (the log outputs)
3. **I'll provide exact fix** based on what the console shows

**The debugging code is ready - just need to see what the console tells us!**
