import * as lucideIcons from 'lucide-static';

/**
 * Get SVG string for an icon with custom styling
 * @param iconName - Name of the Lucide icon (kebab-case)
 * @param color - Fill/stroke color (default: currentColor)
 * @param size - Icon size in pixels (default: 24)
 */
export function getIconSVG(iconName: string, color = 'currentColor', size = 24): string {
  // Convert kebab-case to PascalCase (e.g., 'coffee' -> 'Coffee', 'arrow-up' -> 'ArrowUp')
  const pascalName = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const svgString = (lucideIcons as any)[pascalName];

  if (!svgString) {
    console.warn(`Icon "${iconName}" (${pascalName}) not found in Lucide icons`);
    return '';
  }

  // lucide-static returns complete SVG strings, we just need to customize the color and size
  return svgString
    .replace(/width="\d+"/, `width="${size}"`)
    .replace(/height="\d+"/, `height="${size}"`)
    .replace(/stroke="[^"]*"/, `stroke="${color}"`);
}

/**
 * Amenity icon mappings
 */
export const AMENITY_ICONS = {
  // Food & Drink
  cafe: 'coffee',
  coffee: 'coffee',
  food: 'utensils',
  restaurant: 'utensils',

  // Restrooms
  restroom: 'toilet',
  toilet: 'toilet',
  washroom: 'toilet',
  bathroom: 'toilet',

  // Navigation
  elevator: 'arrow-up-down',
  stairs: 'move-vertical',
  escalator: 'arrow-up',
  ramp: 'accessibility',

  // Info & Services
  information: 'info',
  info: 'info',
  help: 'help-circle',
  reception: 'phone',
  atm: 'credit-card',
  service: 'headset',

  // Facilities
  prayer: 'heart',
  media: 'video',
  meeting: 'users',
  boardroom: 'users',
  security: 'shield',

  // Accessibility
  accessible: 'accessibility',
  wheelchair: 'accessibility'
} as const;

/**
 * Get icon name for an amenity type
 */
export function getAmenityIcon(amenityType: string): string {
  const type = amenityType.toLowerCase();

  // Try direct match first
  if (AMENITY_ICONS[type as keyof typeof AMENITY_ICONS]) {
    return AMENITY_ICONS[type as keyof typeof AMENITY_ICONS];
  }

  // Try partial match
  for (const [key, value] of Object.entries(AMENITY_ICONS)) {
    if (type.includes(key) || key.includes(type)) {
      return value;
    }
  }

  // Default to info icon
  return 'info';
}
