# 🚧 Dynamic Routing - Avoiding Obstructions

## Overview

Mappedin SDK allows you to dynamically alter navigation routes to avoid certain areas, such as:
- 🚧 Maintenance zones
- 💧 Spills or cleaning areas
- 🚫 Blocked pathways
- ⚠️ Temporary obstacles

## How It Works

The `mapData.getDirections()` method accepts a `zones` parameter that defines areas with navigation costs.

### Zone Cost System

- **Cost: 0** → Free passage (no additional cost)
- **Cost: 1-999** → Discouraged (higher cost = more discouraged)
- **Cost: Infinity** → **BLOCKED** (navigation will avoid if possible)
- **Multiple zones** → Costs add together

### TDirectionZone Interface

```typescript
interface TDirectionZone {
  cost: number;           // 0 to Infinity
  floor?: number;         // Specific floor, or all floors if omitted
  geometry: Feature;      // MultiPolygon or Polygon
}
```

## Implementation Examples

### Example 1: Block a Hallway for Maintenance

```javascript
// Define a blocked zone (Infinity cost = no passage)
const maintenanceZone = {
  cost: Infinity,
  floor: 1,
  geometry: {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-79.383186, 43.642567],
        [-79.383200, 43.642580],
        [-79.383220, 43.642560],
        [-79.383206, 43.642547],
        [-79.383186, 43.642567]
      ]]
    }
  }
};

// Get directions that avoid the maintenance zone
const directions = await mapData.getDirections(
  startSpace, 
  endSpace, 
  { zones: [maintenanceZone] }
);
```

### Example 2: Add Cost to Crowded Areas

```javascript
// Define a high-traffic zone (cost 10 = discouraged)
const crowdedZone = {
  cost: 10,
  floor: 1,
  geometry: crowdedAreaGeometry
};

// Define a spill zone (cost Infinity = blocked)
const spillZone = {
  cost: Infinity,
  floor: 2,
  geometry: spillAreaGeometry
};

// Get directions that avoid both zones
const directions = await mapData.getDirections(
  startSpace,
  endSpace,
  { zones: [crowdedZone, spillZone] }
);
```

### Example 3: Interactive Zone Creation

```javascript
// Example: Click to add temporary obstacles
let activeZones = [];

mapView.on('click', (event) => {
  if (event.coordinate) {
    // Create zone around click point
    const zone = createZoneAtCoordinate(event.coordinate, {
      cost: Infinity,  // Block this area
      radius: 5        // 5 meter radius
    });

    activeZones.push(zone);

    // Recalculate route with new zones
    updateDirections(activeZones);
  }
});

// Clear all zones
function clearZones() {
  activeZones = [];
  updateDirections([]);
}

// Recalculate with current zones
async function updateDirections(zones) {
  const directions = await mapData.getDirections(
    currentStart,
    currentDestination,
    { zones: zones }
  );

  mapView.Navigation.draw(directions);
}
```

## Use Cases

### Conference/Event Scenarios

1. **🎪 Event Setup Zones**
   ```javascript
   // Block areas being set up
   const setupZone = { cost: Infinity, floor: 1, geometry: setupArea };
   ```

2. **🍽️ Food Court Overflow**
   ```javascript
   // Add cost to crowded food areas during lunch
   const lunchCrowdZone = { cost: 20, floor: 1, geometry: foodCourtArea };
   ```

3. **🚧 Exhibitor Booth Installation**
   ```javascript
   // Block aisles during booth setup
   const installationZone = { cost: Infinity, geometry: aisleArea };
   ```

4. **♿ Accessibility Routes**
   ```javascript
   // Favor accessible paths (low cost)
   const accessiblePath = { cost: 0, geometry: rampArea };
   // Avoid stairs (high cost)
   const stairsZone = { cost: 50, geometry: stairsArea };
   ```

## Advanced Patterns

### Time-Based Zones

```javascript
// Change zone costs based on time of day
function getActiveZones() {
  const hour = new Date().getHours();
  const zones = [];

  // Lunch rush (12-2pm) - avoid food court
  if (hour >= 12 && hour < 14) {
    zones.push({
      cost: 30,
      floor: 1,
      geometry: foodCourtGeometry
    });
  }

  // Cleaning (8-9am) - block certain areas
  if (hour >= 8 && hour < 9) {
    zones.push({
      cost: Infinity,
      floor: 2,
      geometry: cleaningAreaGeometry
    });
  }

  return zones;
}

// Use time-based zones
const directions = await mapData.getDirections(
  start,
  end,
  { zones: getActiveZones() }
);
```

### Admin Control Panel

```javascript
// Allow admins to define temporary obstacles
class ObstacleManager {
  constructor(mapData, mapView) {
    this.mapData = mapData;
    this.mapView = mapView;
    this.obstacles = [];
  }

  addObstacle(geometry, cost = Infinity, floor = null) {
    const zone = { cost, floor, geometry };
    this.obstacles.push(zone);
    return zone;
  }

  removeObstacle(zone) {
    this.obstacles = this.obstacles.filter(z => z !== zone);
  }

  clearAll() {
    this.obstacles = [];
  }

  async getDirectionsWithObstacles(start, end) {
    return await this.mapData.getDirections(start, end, {
      zones: this.obstacles
    });
  }
}

// Usage
const manager = new ObstacleManager(mapData, mapView);

// Admin adds spill zone
manager.addObstacle(spillGeometry, Infinity, 1);

// Get route avoiding spill
const directions = await manager.getDirectionsWithObstacles(start, end);
```

## Testing Interactive Zones

The official Mappedin example allows:
- **Left click** → Add zone with cost 10 (discouraged)
- **Right click** → Add zone with cost Infinity (blocked)
- **Middle click** → Clear all zones
- **Stack zones** → See how costs add up

Try stacking multiple zones and observe how the SDK finds the lowest-cost route!

## Integration with Conference POC

### Future Enhancement Ideas:

1. **Admin Dashboard**
   - Allow staff to draw temporary block zones
   - Schedule zones for cleaning times
   - Define VIP-only areas

2. **Real-Time Updates**
   - API endpoint for active obstacles
   - Push notifications for route changes
   - Live zone updates via WebSocket

3. **Crowd Management**
   - Increase cost in crowded areas
   - Distribute traffic evenly
   - Suggest alternative routes

4. **Emergency Scenarios**
   - Block emergency exits during drills
   - Define evacuation zones
   - Priority routing for emergency personnel

## API Reference

### mapData.getDirections()

```typescript
getDirections(
  from: Space,
  to: Space,
  options?: {
    accessible?: boolean;
    smoothing?: boolean;
    zones?: TDirectionZone[];
  }
): Promise<Directions>
```

### TDirectionZone

```typescript
type TDirectionZone = {
  cost: number;           // 0 to Infinity
  floor?: number;         // Optional floor restriction
  geometry: Feature;      // GeoJSON Feature (Polygon/MultiPolygon)
}
```

## Key Takeaways

✅ **Zones add navigation cost** to specific areas
✅ **Cost Infinity** effectively blocks passage
✅ **Multiple zones** have additive costs
✅ **Floor optional** - omit to affect all floors
✅ **SDK finds lowest-cost route** automatically
✅ **Perfect for dynamic obstacles** like maintenance, crowds, events

## Resources

- Official Docs: `developer.mappedin.com/web-sdk/wayfinding`
- CodeSandbox: Interactive zone demo
- API Docs: `docs.mappedin.com/web/v6/latest/`

---

**Status:** 📚 Documented for future implementation
**Use Case:** Conference obstacle avoidance, crowd management, dynamic routing
**Priority:** Medium (nice-to-have for v2.0)

