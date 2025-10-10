# Directions Card Implementation Guide

## Overview

Your app already has a functional turn-by-turn directions system! This guide shows what you have and how to enhance it.

## Current Implementation (index.html)

### ✅ What You Already Have

**Features:**
- ✅ Turn-by-turn instructions display (lines 1439-1500)
- ✅ Accessible routing support (♿)
- ✅ Distance display (metric + imperial)
- ✅ Connection type icons (elevator, stairs, escalator)
- ✅ Collapsible instructions panel
- ✅ Path visualization on map

### How It Works

**1. Get Directions** (line 1323-1326):
```javascript
const directions = await mapData.getDirections(selectedFromLocation, destination, {
  accessible: accessibleMode  // ✅ Respects accessibility preference
});
```

**2. Draw Path on Map** (line 1329-1341):
```javascript
mapView.Navigation.draw(directions, {
  pathOptions: {
    nearRadius: 1.5,
    farRadius: 0.8,
    color: '#667eea'
  },
  pathDisplayOptions: {
    displayArrowsOnPath: true
  }
});
```

**3. Display Instructions** (line 1440-1500):
```javascript
function buildTurnByTurnInstructions(directions) {
  directions.instructions.forEach((instruction, index) => {
    const icon = connectionIcons[instruction.node?.connection?.connectionType] || '➡️';
    const actionText = instruction.action || 'Continue';
    const distanceM = instruction.distance?.toFixed(1) || '0';
    // ... build HTML
  });
}
```

## Directions Object Structure

### What Mappedin Returns

```typescript
{
  distance: number,           // Total distance in meters
  path: Node[],              // Array of nodes representing the path
  instructions: Instruction[] // Turn-by-turn instructions
}
```

### Instruction Object

```typescript
{
  action: string,            // e.g., "Turn left", "Continue straight"
  distance: number,          // Distance to next instruction (meters)
  node: {
    connection?: {
      connectionType: string // "elevator", "escalator", "stairs", etc.
    }
  },
  coordinate: [number, number, number] // [x, y, z] position
}
```

## React-Style DirectionsCard (Like Your Sample)

Here's how to convert your implementation to a reusable component:

### Vanilla JS Version (For Your Current Setup)

```javascript
// public/js/directions-card.js
class DirectionsCard {
  constructor(options = {}) {
    this.onBack = options.onBack;
    this.onSwap = options.onSwap;
    this.onSelectFrom = options.onSelectFrom;
    this.onSelectTo = options.onSelectTo;
    this.accessibleMode = options.accessibleMode || false;
  }

  render(directions, originName, destName) {
    const container = document.createElement('div');
    container.className = 'directions-card';
    container.innerHTML = this.buildHTML(directions, originName, destName);

    // Attach event listeners
    this.attachEventListeners(container);

    return container;
  }

  buildHTML(directions, originName, destName) {
    const accessIcon = this.accessibleMode ? '♿' : '🚶';
    const accessText = this.accessibleMode ? 'Accessible Route' : 'Standard Route';

    return `
      <div class="card-header">
        <button class="back-btn">←</button>
        <h3>Directions</h3>
        ${this.onSwap ? '<button class="swap-btn">↕</button>' : ''}
      </div>

      <!-- From/To -->
      <div class="route-points">
        <div class="point">
          <span class="pin from"></span>
          ${originName
            ? `<button class="chip">${originName}</button>`
            : '<input placeholder="Choose Departure" readonly>'
          }
        </div>
        <div class="point">
          <span class="pin to"></span>
          ${destName
            ? `<button class="chip">${destName}</button>`
            : '<input placeholder="Choose Destination" readonly>'
          }
        </div>
      </div>

      <hr class="divider">

      <!-- Route Info -->
      ${directions ? `
        <div class="route-info">
          <div class="route-type">
            ${accessIcon} ${accessText}
          </div>
          <div class="route-distance">
            📏 ${Math.round(directions.distance)}m
            (${Math.round(directions.distance * 3.28)}ft)
          </div>
        </div>
      ` : ''}

      <!-- Instructions -->
      <div class="instructions-list">
        ${this.buildInstructions(directions)}
      </div>
    `;
  }

  buildInstructions(directions) {
    if (!directions || !directions.instructions || directions.instructions.length === 0) {
      return '<div class="hint">Select departure & destination to see route</div>';
    }

    const connectionIcons = {
      'elevator': '🛗',
      'escalator': '🔼',
      'stairs': '🪜',
      'ramp': '♿'
    };

    let html = '<ol class="steps">';

    directions.instructions.forEach((instruction, index) => {
      const connectionType = instruction.node?.connection?.connectionType;
      const icon = connectionIcons[connectionType] || '➡️';
      const distanceM = Math.round(instruction.distance || 0);
      const distanceFt = Math.round((instruction.distance || 0) * 3.28084);

      html += `
        <li class="step">
          <span class="step-icon">${icon}</span>
          <div class="step-body">
            <div class="step-text">${instruction.action || 'Continue'}</div>
            ${distanceM > 0 ? `
              <div class="step-meta">
                ${distanceM}m (${distanceFt}ft)
              </div>
            ` : ''}
          </div>
        </li>
      `;
    });

    html += '</ol>';
    return html;
  }

  attachEventListeners(container) {
    const backBtn = container.querySelector('.back-btn');
    if (backBtn && this.onBack) {
      backBtn.addEventListener('click', this.onBack);
    }

    const swapBtn = container.querySelector('.swap-btn');
    if (swapBtn && this.onSwap) {
      swapBtn.addEventListener('click', this.onSwap);
    }

    const fromInput = container.querySelector('.point:first-child button, .point:first-child input');
    if (fromInput && this.onSelectFrom) {
      fromInput.addEventListener('click', this.onSelectFrom);
    }

    const toInput = container.querySelector('.point:last-child button, .point:last-child input');
    if (toInput && this.onSelectTo) {
      toInput.addEventListener('click', this.onSelectTo);
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DirectionsCard;
} else {
  window.DirectionsCard = DirectionsCard;
}
```

### Usage in Your index.html

```javascript
// Initialize
const directionsCard = new DirectionsCard({
  accessibleMode: accessibleMode,
  onBack: () => {
    // Hide directions, show exhibitor card
    navigationPanel.style.display = 'none';
    directionsBtn.style.display = 'flex';
  },
  onSwap: () => {
    // Swap from/to locations
    const temp = selectedFromLocation;
    selectedFromLocation = destination;
    destination = temp;
  },
  onSelectFrom: () => {
    // Show location picker for "from"
  },
  onSelectTo: () => {
    // Show location picker for "to"
  }
});

// Render when directions available
const cardElement = directionsCard.render(
  directions,
  selectedFromLocation.name,
  destination.name
);

document.getElementById('turnByTurnContent').appendChild(cardElement);
```

## Enhanced Features You Can Add

### 1. Step-by-Step Navigation

```javascript
class StepNavigator {
  constructor(instructions) {
    this.instructions = instructions;
    this.currentStep = 0;
  }

  next() {
    if (this.currentStep < this.instructions.length - 1) {
      this.currentStep++;
      return this.getCurrentInstruction();
    }
    return null;
  }

  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      return this.getCurrentInstruction();
    }
    return null;
  }

  getCurrentInstruction() {
    return this.instructions[this.currentStep];
  }

  focusOnCurrentStep(mapView) {
    const instruction = this.getCurrentInstruction();
    if (instruction && instruction.coordinate) {
      mapView.Camera.focusOn({
        center: instruction.coordinate,
        zoomLevel: 22
      });
    }
  }
}
```

### 2. Audio Instructions

```javascript
function speakInstruction(instruction) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(instruction.action);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }
}

// Use it
directions.instructions.forEach((instruction, i) => {
  setTimeout(() => speakInstruction(instruction), i * 3000);
});
```

### 3. Estimated Time

```javascript
function calculateWalkingTime(distance, speedMps = 1.4) {
  // Average walking speed: 1.4 m/s (5 km/h)
  const timeSeconds = distance / speedMps;
  const minutes = Math.ceil(timeSeconds / 60);
  return minutes;
}

// Display
const walkTime = calculateWalkingTime(directions.distance);
// "Estimated time: 5 minutes"
```

### 4. Alternative Routes

```javascript
async function getAlternativeRoutes(from, to) {
  // Standard route
  const standardRoute = await mapData.getDirections(from, to, {
    accessible: false
  });

  // Accessible route
  const accessibleRoute = await mapData.getDirections(from, to, {
    accessible: true
  });

  return {
    standard: {
      ...standardRoute,
      time: calculateWalkingTime(standardRoute.distance)
    },
    accessible: {
      ...accessibleRoute,
      time: calculateWalkingTime(accessibleRoute.distance)
    }
  };
}
```

## Styling (CSS)

```css
.directions-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.back-btn, .swap-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
}

.route-points {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.point {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pin {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pin.from {
  background: #667eea;
}

.pin.to {
  background: #f56565;
}

.chip {
  padding: 8px 16px;
  background: #e0e7ff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  color: #667eea;
}

.steps {
  list-style: none;
  padding: 0;
  margin: 0;
}

.step {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.step:last-child {
  border-bottom: none;
}

.step-icon {
  font-size: 20px;
  width: 28px;
  text-align: center;
}

.step-body {
  flex: 1;
}

.step-text {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.step-meta {
  font-size: 12px;
  color: #666;
}

.route-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.route-type {
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
  margin-bottom: 4px;
}

.route-distance {
  font-size: 13px;
  color: #666;
}
```

## Best Practices

### 1. Error Handling

```javascript
async function getDirectionsSafely(from, to, options = {}) {
  try {
    const directions = await mapData.getDirections(from, to, options);

    if (!directions) {
      throw new Error('No route found');
    }

    if (!directions.instructions || directions.instructions.length === 0) {
      console.warn('Directions found but no instructions available');
    }

    return directions;
  } catch (error) {
    console.error('Failed to get directions:', error);

    // Show user-friendly message
    showError('Could not calculate route. Please try different locations.');

    return null;
  }
}
```

### 2. Accessibility

```javascript
// ARIA labels for screen readers
<button
  aria-label="Go back to exhibitor details"
  class="back-btn"
>
  ←
</button>

<ol
  class="steps"
  aria-label="Turn-by-turn navigation instructions"
  role="list"
>
  <li role="listitem">...</li>
</ol>
```

### 3. Mobile Optimization

```css
@media (max-width: 768px) {
  .directions-card {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 70vh;
    border-radius: 16px 16px 0 0;
    overflow-y: auto;
  }

  .steps {
    padding-bottom: 100px; /* Space for bottom nav */
  }
}
```

## Integration with Your Current Code

Your current implementation at **index.html:1439-1500** already includes:

✅ Connection type icons
✅ Distance formatting (m + ft)
✅ Accessible mode indication
✅ Collapsible UI

**To enhance it:**

1. Extract the `buildTurnByTurnInstructions` function
2. Make it accept configuration options
3. Add step navigation controls
4. Add time estimates
5. Improve mobile UX

## Reference

- **Your Implementation**: `index.html` lines 1439-1500
- **Mappedin Docs**: https://developer.mappedin.com/web-sdk/wayfinding
- **Sample Code**: Your `DirectionsCardClone.tsx`

---

**Bottom Line:** You already have a solid turn-by-turn directions system! The guide above shows how to extract it into a reusable component and add enhancements. 🎉
