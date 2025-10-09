# Parent & Co-Exhibitor Relationship Patterns

## Overview
When multiple companies share a booth/stand, we need to handle parent exhibitors and co-exhibitors. This document outlines the expected API response structures and how to handle them in the map integration.

---

## Possible API Response Patterns

### Pattern 1: Nested Co-Exhibitors Array
**Description**: Parent exhibitor contains array of co-exhibitors

```json
{
  "id": "34171",
  "companyName": "Boeing Australia",
  "stallNo": "2G19",
  "logoUrl": "https://...",
  "profileDesc": "Leading aerospace manufacturer...",
  "categories": ["AEROSPACE", "DEFENCE"],
  "coExhibitors": [
    {
      "id": "34172",
      "companyName": "Boeing Defence Systems",
      "logoUrl": "https://...",
      "profileDesc": "Defence division...",
      "categories": ["DEFENCE"]
    },
    {
      "id": "34173",
      "companyName": "Boeing Services",
      "logoUrl": "https://...",
      "profileDesc": "Maintenance services...",
      "categories": ["BUSINESS AVIATION"]
    }
  ],
  "products": [...],
  "brochures": [...]
}
```

**Characteristics**:
- ✅ Clean hierarchy (parent → children)
- ✅ Single API response per booth
- ✅ Easy to display as expandable list
- ⚠️ Co-exhibitors may have limited data (no products/brochures of their own)

---

### Pattern 2: Flat List with Parent Reference
**Description**: All exhibitors in flat array, co-exhibitors reference parent via `parentId`

```json
[
  {
    "id": "34171",
    "companyName": "Boeing Australia",
    "stallNo": "2G19",
    "isParent": true,
    "parentId": null,
    "logoUrl": "https://...",
    "profileDesc": "...",
    "products": [...]
  },
  {
    "id": "34172",
    "companyName": "Boeing Defence Systems",
    "stallNo": "2G19",
    "isParent": false,
    "parentId": "34171",
    "logoUrl": "https://...",
    "profileDesc": "...",
    "products": []
  },
  {
    "id": "34173",
    "companyName": "Boeing Services",
    "stallNo": "2G19",
    "isParent": false,
    "parentId": "34171",
    "logoUrl": "https://...",
    "profileDesc": "...",
    "products": []
  }
]
```

**Characteristics**:
- ✅ Each company has full record
- ✅ Can search/filter co-exhibitors independently
- ⚠️ Need to group by `stallNo` + `parentId` to display together
- ⚠️ Multiple records returned for same booth

---

### Pattern 3: Listing Name Field
**Description**: Company name vs. display name on floor plan

```json
{
  "id": "34171",
  "companyName": "Boeing Defence Systems Pty Ltd",  // ← Legal entity name
  "listingName": "Boeing Australia",                // ← What's shown on booth
  "stallNo": "2G19",
  "logoUrl": "https://...",
  "profileDesc": "..."
}
```

**Characteristics**:
- ✅ Simple structure (no co-exhibitors)
- ✅ Clear distinction between legal name and display name
- ⚠️ Doesn't handle multiple companies at same booth
- **Use case**: When "co-exhibitors" are just alternate names/divisions of same company

---

### Pattern 4: Multiple Records, Same stallNo
**Description**: Each company has separate record, all with same `stallNo`

```json
[
  {
    "id": "34171",
    "companyName": "Boeing Australia",
    "stallNo": "2G19",
    "logoUrl": "https://...",
    "isPrimary": true
  },
  {
    "id": "34172",
    "companyName": "Boeing Defence Systems",
    "stallNo": "2G19",
    "logoUrl": "https://...",
    "isPrimary": false
  }
]
```

**Characteristics**:
- ✅ Simple equality matching on `stallNo`
- ✅ Each company fully independent
- ⚠️ Need to determine which is "primary" for display
- ⚠️ Multiple API results for single booth

---

## API Query Strategies

### Strategy A: Single Booth Query (Returns All Exhibitors)
```
GET /api/exhibitor-directory?stallNo=2G19

Response:
[
  { "id": "34171", "companyName": "Boeing Australia", "stallNo": "2G19", "isParent": true },
  { "id": "34172", "companyName": "Boeing Defence", "stallNo": "2G19", "parentId": "34171" }
]
```

**Usage**:
- Query once per booth click
- Display all companies together

---

### Strategy B: Parent-Only Query (Co-Exhibitors Nested)
```
GET /api/exhibitor-directory?stallNo=2G19

Response:
{
  "id": "34171",
  "companyName": "Boeing Australia",
  "stallNo": "2G19",
  "coExhibitors": [
    { "id": "34172", "companyName": "Boeing Defence" }
  ]
}
```

**Usage**:
- Single object response
- Co-exhibitors embedded

---

### Strategy C: Get All, Filter Client-Side
```
GET /api/exhibitor-directory

Response: [... all 500 exhibitors ...]

// Client filters by stallNo
const boothExhibitors = allExhibitors.filter(e => e.stallNo === '2G19');
```

**Usage**:
- Load all once (but we're avoiding this for performance)
- Only viable if <100 exhibitors total

---

## UI/UX Handling Methods

### Method 1: Expandable Parent Card

**When booth has co-exhibitors, show expandable card:**

```
┌─────────────────────────────────────────┐
│ 🏢 Boeing Australia               [v]  │  ← Parent (click to expand)
│ Booth 2G19 • AEROSPACE, DEFENCE         │
│                                         │
│ Leading aerospace manufacturer...       │
├─────────────────────────────────────────┤
│ Also at this booth: (2)            [^]  │  ← Click to collapse
│                                         │
│  └─ 🏢 Boeing Defence Systems           │  ← Co-exhibitor 1
│     DEFENCE                             │
│                                         │
│  └─ 🏢 Boeing Services                  │  ← Co-exhibitor 2
│     BUSINESS AVIATION                   │
└─────────────────────────────────────────┘
```

**Code Example**:
```javascript
function showExhibitorCard(stallNo, exhibitors) {
  const parent = exhibitors.find(e => e.isParent || !e.parentId);
  const coExhibitors = exhibitors.filter(e => e.parentId === parent.id);

  const cardHTML = `
    <div class="exhibitor-card">
      <!-- Parent -->
      <div class="parent-exhibitor">
        <img src="${parent.logoUrl}" />
        <h3>${parent.companyName}</h3>
        <p>Booth ${parent.stallNo}</p>
        <p>${parent.profileDesc}</p>
      </div>

      <!-- Co-Exhibitors -->
      ${coExhibitors.length > 0 ? `
        <div class="co-exhibitors">
          <h4>Also at this booth: (${coExhibitors.length})</h4>
          ${coExhibitors.map(co => `
            <div class="co-exhibitor">
              <img src="${co.logoUrl}" />
              <span>${co.companyName}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}
```

---

### Method 2: Tabbed Interface

**When booth has multiple exhibitors, show tabs:**

```
┌─────────────────────────────────────────┐
│ Booth 2G19                              │
│                                         │
│ [ Boeing Australia ] [ Boeing Defence ] │  ← Tabs
│ ─────────────────────                   │
│                                         │
│ 🏢 Boeing Australia                     │  ← Active tab content
│ AEROSPACE, DEFENCE                      │
│                                         │
│ Leading aerospace manufacturer...       │
│                                         │
│ [Navigate to Booth] [View Website]      │
└─────────────────────────────────────────┘
```

**Code Example**:
```javascript
function createTabbedCard(stallNo, exhibitors) {
  return `
    <div class="exhibitor-card">
      <div class="booth-header">Booth ${stallNo}</div>

      <div class="tabs">
        ${exhibitors.map((ex, i) => `
          <button class="tab ${i === 0 ? 'active' : ''}"
                  onclick="switchTab(${i})">
            ${ex.companyName}
          </button>
        `).join('')}
      </div>

      <div class="tab-content">
        ${exhibitors.map((ex, i) => `
          <div class="tab-panel ${i === 0 ? 'active' : ''}" id="tab-${i}">
            <img src="${ex.logoUrl}" />
            <h3>${ex.companyName}</h3>
            <p>${ex.profileDesc}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
```

---

### Method 3: Combined Card (All Equal)

**Show all companies equally (no parent/child hierarchy):**

```
┌─────────────────────────────────────────┐
│ Booth 2G19 • 3 Exhibitors               │
├─────────────────────────────────────────┤
│ 🏢 Boeing Australia                     │
│    AEROSPACE, DEFENCE                   │
│    [View Details]                       │
├─────────────────────────────────────────┤
│ 🏢 Boeing Defence Systems               │
│    DEFENCE                              │
│    [View Details]                       │
├─────────────────────────────────────────┤
│ 🏢 Boeing Services                      │
│    BUSINESS AVIATION                    │
│    [View Details]                       │
└─────────────────────────────────────────┘
```

**Code Example**:
```javascript
function showCombinedCard(stallNo, exhibitors) {
  return `
    <div class="exhibitor-card">
      <div class="booth-header">
        Booth ${stallNo} • ${exhibitors.length} Exhibitor${exhibitors.length > 1 ? 's' : ''}
      </div>

      ${exhibitors.map(ex => `
        <div class="exhibitor-item">
          <img src="${ex.logoUrl}" />
          <div>
            <h4>${ex.companyName}</h4>
            <p class="categories">${ex.categories.join(', ')}</p>
            <button onclick="showFullDetails('${ex.id}')">View Details</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
```

---

## Search Behavior with Co-Exhibitors

### Option 1: Search All Companies
**User types "Boeing Defence" → Show in results**

```javascript
function searchExhibitors(query) {
  const allCompanies = [];

  exhibitorsData.forEach(exhibitor => {
    // Add parent
    allCompanies.push({
      id: exhibitor.id,
      name: exhibitor.companyName,
      stallNo: exhibitor.stallNo,
      isParent: true
    });

    // Add co-exhibitors
    exhibitor.coExhibitors?.forEach(co => {
      allCompanies.push({
        id: co.id,
        name: co.companyName,
        stallNo: exhibitor.stallNo,
        isParent: false
      });
    });
  });

  return allCompanies.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );
}
```

**Search result click**:
```
User searches: "Boeing Defence"
Result: "Boeing Defence Systems - Booth 2G19"
Click → Focus on booth 2G19
      → Show card with all companies at booth
      → Highlight "Boeing Defence Systems"
```

---

### Option 2: Search Parents Only
**User types "Boeing Defence" → Show parent company**

```javascript
function searchExhibitors(query) {
  return exhibitorsData
    .filter(ex =>
      ex.companyName.toLowerCase().includes(query) ||
      ex.coExhibitors?.some(co =>
        co.companyName.toLowerCase().includes(query)
      )
    )
    .map(ex => ({
      id: ex.id,
      name: ex.companyName,
      stallNo: ex.stallNo,
      matchedCompany: getMatchedCompanyName(ex, query)
    }));
}
```

**Search result**:
```
User searches: "Boeing Defence"
Result: "Boeing Australia - Booth 2G19"
       (Matches: Boeing Defence Systems)
Click → Focus on booth
      → Show parent card with co-exhibitors
```

---

## Marker Display Options

### Option A: Single Marker (Parent Logo)
```javascript
function createBoothMarker(stallNo, exhibitors) {
  const parent = exhibitors.find(e => e.isParent) || exhibitors[0];

  return mapView.Markers.add(space, `
    <div class="booth-marker">
      <img src="${parent.logoUrl}" />
      ${exhibitors.length > 1 ? `<span class="badge">${exhibitors.length}</span>` : ''}
    </div>
  `, { anchor: 'bottom', rank: 4 });
}
```

**Visual**:
```
┌─────┐
│LOGO │
│  3  │  ← Badge showing 3 companies
└─────┘
```

---

### Option B: Stacked Logos
```javascript
function createBoothMarker(stallNo, exhibitors) {
  const logos = exhibitors.slice(0, 3).map(e => e.logoUrl);

  return mapView.Markers.add(space, `
    <div class="booth-marker stacked">
      ${logos.map((url, i) => `
        <img src="${url}" style="z-index: ${3-i}; margin-left: ${i*-10}px;" />
      `).join('')}
    </div>
  `, { anchor: 'bottom', rank: 4 });
}
```

**Visual**:
```
┌─┬─┬─┐
│ │ │ │  ← 3 logos overlapping
└─┴─┴─┘
```

---

### Option C: Text Badge (No Logos)
```javascript
function createBoothMarker(stallNo, exhibitors) {
  const label = exhibitors.length > 1
    ? `${exhibitors[0].companyName} +${exhibitors.length - 1}`
    : exhibitors[0].companyName;

  return mapView.Markers.add(space, `
    <div class="booth-marker text">
      ${label}
    </div>
  `, { anchor: 'bottom', rank: 4 });
}
```

**Visual**:
```
┌─────────────────┐
│ Boeing +2 more  │
└─────────────────┘
```

---

## React Native App Integration

### Sending Multiple Exhibitors to App

```javascript
// WebView → React Native
marker.addEventListener('click', async () => {
  const exhibitors = await fetchExhibitorsByStallNo(space.externalId);

  sendToApp('exhibitorClick', {
    stallNo: space.externalId,
    exhibitors: exhibitors,  // Array of all companies at booth
    primaryExhibitor: exhibitors.find(e => e.isParent) || exhibitors[0]
  });
});
```

```typescript
// React Native handler
const handleWebViewMessage = (event: any) => {
  const { type, payload } = JSON.parse(event.nativeEvent.data);

  if (type === 'exhibitorClick') {
    if (payload.exhibitors.length === 1) {
      // Single exhibitor - show details
      setSelectedExhibitor(payload.exhibitors[0]);
    } else {
      // Multiple exhibitors - show list or tabs
      setBoothExhibitors(payload.exhibitors);
      setShowMultiExhibitorSheet(true);
    }
  }
};
```

---

## Recommendations

### Preferred Pattern: **Pattern 1 (Nested Co-Exhibitors)**

**Why**:
- ✅ Clear hierarchy
- ✅ Single API call per booth
- ✅ Easy to display (parent + expandable co-exhibitors)
- ✅ Works well with lazy loading

**API Response**:
```json
{
  "id": "34171",
  "companyName": "Boeing Australia",
  "stallNo": "2G19",
  "isParent": true,
  "coExhibitors": [
    { "id": "34172", "companyName": "Boeing Defence" }
  ]
}
```

**UI Handling**:
- Show parent company prominently
- "Also at this booth (2)" expandable section
- Search includes co-exhibitor names but navigates to parent booth

---

### Fallback Pattern: **Pattern 2 (Flat with Parent Reference)**

**If API returns flat list**:

**Client-side grouping**:
```javascript
async function fetchBoothExhibitors(stallNo) {
  const response = await fetch(`/api/exhibitor-directory?stallNo=${stallNo}`);
  const exhibitors = await response.json();

  // Group by parent
  const parent = exhibitors.find(e => !e.parentId);
  const coExhibitors = exhibitors.filter(e => e.parentId === parent?.id);

  return {
    parent: parent || exhibitors[0],
    coExhibitors: coExhibitors
  };
}
```

---

## Questions for Your API Team

1. **Which pattern does your API use?**
   - Nested co-exhibitors? (`coExhibitors` array)
   - Flat list with parent reference? (`parentId` field)
   - Multiple records with same `stallNo`?
   - Listing name field? (`listingName` vs `companyName`)

2. **How to identify parent vs co-exhibitor?**
   - Field name: `isParent`, `isPrimary`, `parentId`?
   - Or just first record in array?

3. **When querying by `stallNo`, what's returned?**
   - Single parent with nested co-exhibitors?
   - Array of all companies (parent + co-exhibitors)?

4. **Do co-exhibitors have full data?**
   - Own products, brochures, videos?
   - Or just basic info (name, logo, description)?

5. **Search behavior expected?**
   - Should co-exhibitor names appear in search?
   - Should they navigate to parent booth or have own listing?

---

## Implementation Checklist

Once API pattern is confirmed:

- [ ] Update `fetchExhibitorByStallNo()` to handle multiple exhibitors
- [ ] Create UI component for parent + co-exhibitors display
- [ ] Update search to include co-exhibitor company names
- [ ] Update marker to show badge if multiple exhibitors
- [ ] Test React Native bottom sheet with multi-exhibitor data
- [ ] Handle edge cases (parent-only, co-exhibitors-only, all equal)
- [ ] Update cache strategy for grouped exhibitors

---

**Next Step**: Get sample API response with co-exhibitors and confirm which pattern it uses! 🚀
