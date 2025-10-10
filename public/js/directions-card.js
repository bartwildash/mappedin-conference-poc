/**
 * DirectionsCard Component
 *
 * Reusable turn-by-turn directions display based on Mappedin Web SDK v6
 *
 * Features:
 * - Turn-by-turn instructions
 * - Connection type icons (elevator, stairs, etc.)
 * - Accessible route support
 * - Distance formatting (metric + imperial)
 * - Step navigation
 *
 * Based on implementation from index.html (lines 1439-1485)
 *
 * IMPORTANT CLUES FOUND:
 * - instruction.action.type: String like "Turn left", "Turn right", "Continue straight"
 * - instruction.action (without .type): Sometimes just a string "Continue"
 * - instruction.distance: Distance to next instruction in meters
 * - instruction.node.connection.connectionType: "elevator", "stairs", "escalator", etc.
 * - instruction.connection.type: Alternative property path for connection type
 * - instruction.coordinate: [x, y, z] array for 3D position
 */

class DirectionsCard {
  constructor(options = {}) {
    this.accessibleMode = options.accessibleMode || false;
    this.onBack = options.onBack;
    this.onSwap = options.onSwap;
    this.onSelectFrom = options.onSelectFrom;
    this.onSelectTo = options.onSelectTo;
    this.onStepClick = options.onStepClick; // Callback when a step is clicked

    // Connection type icons (based on Mappedin SDK connection types)
    this.connectionIcons = {
      'elevator': '🛗',
      'stairs': '🪜',
      'ramp': '♿',
      'door': '🚪',
      'portal': '🚪',
      'escalator': '🔼',
      'shuttle': '🚐',
      'slide': '🛝',
      'security': '🔒',
      'bridge': '🌉',
      'tunnel': '🚇',
      'walkway': '🚶'
    };

    // Action type icons (for turn direction)
    this.actionIcons = {
      'left': '⬅️',
      'right': '➡️',
      'straight': '⬆️',
      'up': '⬆️',
      'down': '⬇️',
      'continue': '➡️',
      'proceed': '➡️'
    };
  }

  /**
   * Render the directions card
   * @param {Object} directions - Mappedin directions object
   * @param {string} originName - From location name
   * @param {string} destName - To location name
   * @returns {HTMLElement} - Rendered card element
   */
  render(directions, originName, destName) {
    const container = document.createElement('div');
    container.className = 'directions-card';
    container.innerHTML = this.buildHTML(directions, originName, destName);

    // Attach event listeners after rendering
    setTimeout(() => this.attachEventListeners(container, directions), 0);

    return container;
  }

  /**
   * Build HTML structure
   */
  buildHTML(directions, originName, destName) {
    const accessIcon = this.accessibleMode ? '♿' : '🚶';
    const accessText = this.accessibleMode ? 'Accessible Route' : 'Standard Route';

    return `
      <div class="directions-card__header">
        ${this.onBack ? '<button class="back-btn" data-action="back">←</button>' : ''}
        <h3 class="directions-card__title">Directions</h3>
        ${this.onSwap ? '<button class="swap-btn" data-action="swap">↕</button>' : ''}
      </div>

      <div class="directions-card__route-points">
        <div class="route-point">
          <span class="pin pin--from"></span>
          ${originName
            ? `<button class="chip chip--from" data-action="select-from">${this.escapeHtml(originName)}</button>`
            : `<input type="text" class="input" placeholder="Choose Departure" readonly data-action="select-from">`
          }
        </div>
        <div class="route-point">
          <span class="pin pin--to"></span>
          ${destName
            ? `<button class="chip chip--to" data-action="select-to">${this.escapeHtml(destName)}</button>`
            : `<input type="text" class="input" placeholder="Choose Destination" readonly data-action="select-to">`
          }
        </div>
      </div>

      <hr class="divider">

      ${directions ? this.buildRouteInfo(directions, accessIcon, accessText) : ''}
      ${directions ? this.buildInstructions(directions.instructions) : this.buildEmptyState()}
    `;
  }

  /**
   * Build route information section
   */
  buildRouteInfo(directions, accessIcon, accessText) {
    const distanceM = Math.round(directions.distance);
    const distanceFt = Math.round(directions.distance * 3.28084);
    const distanceKm = (directions.distance / 1000).toFixed(2);
    const distanceMiles = (directions.distance / 1609.344).toFixed(2);

    // Estimate walking time (1.4 m/s average walking speed)
    const timeSeconds = directions.distance / 1.4;
    const timeMinutes = Math.ceil(timeSeconds / 60);

    return `
      <div class="directions-card__route-info">
        <div class="route-type">
          ${accessIcon} ${accessText}
        </div>
        <div class="route-stats">
          <div class="stat">
            <span class="stat-label">📏 Distance:</span>
            <span class="stat-value">${distanceM}m (${distanceFt}ft)</span>
            <span class="stat-alt">${distanceKm}km (${distanceMiles}mi)</span>
          </div>
          <div class="stat">
            <span class="stat-label">⏱️ Time:</span>
            <span class="stat-value">~${timeMinutes} min</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Build turn-by-turn instructions
   *
   * CRITICAL: Based on actual Mappedin SDK structure found in index.html:970-987
   */
  buildInstructions(instructions) {
    if (!instructions || instructions.length === 0) {
      return this.buildEmptyState();
    }

    let html = '<ol class="directions-card__steps">';

    instructions.forEach((instruction, index) => {
      // Extract action - handle both instruction.action.type and instruction.action
      // CLUE from line 970: instruction.action?.type || 'proceed'
      const actionText = this.getActionText(instruction);

      // Extract distance
      const distance = instruction.distance || 0;
      const distanceM = Math.round(distance);
      const distanceFt = Math.round(distance * 3.28084);

      // Extract connection type - handle both paths
      // CLUE from line 972: instruction.connection
      // CLUE from line 1465: instruction.node?.connection?.connectionType
      const connectionType = this.getConnectionType(instruction);

      // Get appropriate icon
      const icon = this.getInstructionIcon(instruction, actionText, connectionType);

      html += `
        <li class="step" data-step-index="${index}">
          <span class="step-icon">${icon}</span>
          <div class="step-body">
            <div class="step-text">${this.escapeHtml(actionText)}</div>
            ${distance > 0 ? `
              <div class="step-meta">
                ${distanceM}m (${distanceFt}ft)
                ${connectionType ? ` • <span class="connection-type">${this.escapeHtml(connectionType)}</span>` : ''}
              </div>
            ` : ''}
          </div>
        </li>
      `;
    });

    html += '</ol>';
    return html;
  }

  /**
   * Get action text from instruction
   * Handles multiple formats found in Mappedin SDK
   */
  getActionText(instruction) {
    // Try instruction.action.type first (line 970)
    if (instruction.action?.type) {
      return instruction.action.type;
    }

    // Fallback to instruction.action as string (line 1466)
    if (typeof instruction.action === 'string') {
      return instruction.action;
    }

    // Default
    return 'Continue';
  }

  /**
   * Get connection type from instruction
   * Handles multiple property paths
   */
  getConnectionType(instruction) {
    // Try instruction.connection.type first (line 972, 976)
    if (instruction.connection?.type) {
      return instruction.connection.type;
    }

    // Try instruction.node.connection.connectionType (line 1465, 1478)
    if (instruction.node?.connection?.connectionType) {
      return instruction.node.connection.connectionType;
    }

    return null;
  }

  /**
   * Get appropriate icon for instruction
   */
  getInstructionIcon(instruction, actionText, connectionType) {
    // Priority 1: Connection type icon
    if (connectionType && this.connectionIcons[connectionType]) {
      return this.connectionIcons[connectionType];
    }

    // Priority 2: Action-based icon (from line 977-981)
    const actionLower = actionText.toLowerCase();
    if (actionLower.includes('left')) {
      return '⬅️';
    }
    if (actionLower.includes('right')) {
      return '➡️';
    }
    if (actionLower.includes('up') || actionLower.includes('climb')) {
      return '⬆️';
    }
    if (actionLower.includes('down') || actionLower.includes('descend')) {
      return '⬇️';
    }

    // Default: straight arrow
    return '➡️';
  }

  /**
   * Build empty state when no directions
   */
  buildEmptyState() {
    return `
      <div class="directions-card__empty">
        <p>Select departure and destination to see route</p>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners(container, directions) {
    // Back button
    const backBtn = container.querySelector('[data-action="back"]');
    if (backBtn && this.onBack) {
      backBtn.addEventListener('click', this.onBack);
    }

    // Swap button
    const swapBtn = container.querySelector('[data-action="swap"]');
    if (swapBtn && this.onSwap) {
      swapBtn.addEventListener('click', this.onSwap);
    }

    // From selection
    const fromElements = container.querySelectorAll('[data-action="select-from"]');
    fromElements.forEach(el => {
      if (this.onSelectFrom) {
        el.addEventListener('click', this.onSelectFrom);
      }
    });

    // To selection
    const toElements = container.querySelectorAll('[data-action="select-to"]');
    toElements.forEach(el => {
      if (this.onSelectTo) {
        el.addEventListener('click', this.onSelectTo);
      }
    });

    // Step clicks (for navigation to specific step)
    const steps = container.querySelectorAll('.step');
    steps.forEach((step, index) => {
      step.addEventListener('click', () => {
        if (this.onStepClick && directions && directions.instructions) {
          this.onStepClick(directions.instructions[index], index);
        }
      });
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Update accessible mode
   */
  setAccessibleMode(enabled) {
    this.accessibleMode = enabled;
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DirectionsCard;
} else {
  window.DirectionsCard = DirectionsCard;
}
