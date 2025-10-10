/**
 * Exhibitor Card UI Component
 *
 * Vanilla JavaScript implementation of ExhibitorDetailsCard
 * Styled with clone-card minimalist pattern
 */

class ExhibitorCardUI {
  constructor(controller, options = {}) {
    this.controller = controller;
    this.options = options;

    // Callbacks
    this.onDirections = options.onDirections;
    this.onWebsiteClick = options.onWebsiteClick;

    // State
    this.container = null;
    this.isOpen = false;
    this.currentExhibitor = null;
    this.currentSpace = null;
  }

  /**
   * Initialize the card UI
   */
  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'ex-card';
    this.container.style.display = 'none';
    document.body.appendChild(this.container);

    console.log('✅ Exhibitor card UI initialized');
    return this;
  }

  /**
   * Open card with exhibitor data
   */
  open(payload) {
    const { exhibitor, space, floor } = payload;

    this.currentExhibitor = exhibitor;
    this.currentSpace = space;
    this.isOpen = true;

    // Render card
    this.render(exhibitor, space, floor);

    // Show container
    this.container.style.display = 'block';

    // Animate in
    requestAnimationFrame(() => {
      this.container.style.opacity = '0';
      this.container.style.transform = 'translateY(-10px)';
      requestAnimationFrame(() => {
        this.container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        this.container.style.opacity = '1';
        this.container.style.transform = 'translateY(0)';
      });
    });
  }

  /**
   * Close card
   */
  close() {
    this.isOpen = false;
    this.currentExhibitor = null;
    this.currentSpace = null;

    // Animate out
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      this.container.style.display = 'none';
      this.container.innerHTML = '';
    }, 300);
  }

  /**
   * Render card content
   */
  render(exhibitor, space, floor) {
    const floorName = floor?.name || exhibitor.floorName || '—';
    const isOpen = exhibitor.isOpen !== undefined ? exhibitor.isOpen : true;

    this.container.innerHTML = `
      <!-- Header -->
      <div class="ex-header">
        <div class="ex-left">
          ${exhibitor.logoUrl ? `
            <img class="ex-logo" src="${this.escapeHtml(exhibitor.logoUrl)}" alt="${this.escapeHtml(exhibitor.name)}" />
          ` : ''}
          <div class="ex-title">${this.escapeHtml(exhibitor.name)}</div>
          <div class="ex-sub">
            ${this.escapeHtml(floorName)}
            <span> · </span>
            <span class="${isOpen ? 'open' : 'closed'}">
              ${isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>
        <div class="ex-actions">
          ${exhibitor.website ? `
            <a class="icon-btn" href="${this.escapeHtml(exhibitor.website)}" target="_blank" rel="noopener noreferrer" title="Website">
              🌐
            </a>
          ` : ''}
          <button class="icon-btn" id="closeExhibitorCard" title="Close">
            ✕
          </button>
        </div>
      </div>

      <!-- Directions CTA -->
      ${space ? `
        <div class="ex-cta">
          <button class="dir-btn" id="exhibitorDirections">
            Get Directions
          </button>
        </div>
      ` : ''}

      <!-- Capabilities -->
      ${exhibitor.capabilities && exhibitor.capabilities.length > 0 ? `
        <div class="ex-section-title">Capabilities</div>
        <div class="chip-row">
          ${exhibitor.capabilities.map(cap => `
            <span class="chip">${this.escapeHtml(cap)}</span>
          `).join('')}
        </div>
      ` : ''}

      <!-- Categories -->
      ${exhibitor.categories && exhibitor.categories.length > 0 ? `
        <div class="ex-section-title">Categories</div>
        <div class="chip-row">
          ${exhibitor.categories.map(cat => `
            <span class="chip chip--light">${this.escapeHtml(cat)}</span>
          `).join('')}
        </div>
      ` : ''}

      <!-- Co-exhibitors -->
      ${exhibitor.coExhibitorIds && exhibitor.coExhibitorIds.length > 0 ? `
        <div class="ex-section-title">Co-exhibitors</div>
        <ul class="co-list" id="coExhibitorsList"></ul>
      ` : ''}
    `;

    // Attach event listeners
    this.attachEventListeners(exhibitor, space);

    // Render co-exhibitors if any
    if (exhibitor.coExhibitorIds && exhibitor.coExhibitorIds.length > 0) {
      this.renderCoExhibitors(exhibitor.coExhibitorIds);
    }
  }

  /**
   * Render co-exhibitors list
   */
  renderCoExhibitors(coExhibitorIds) {
    const coList = document.getElementById('coExhibitorsList');
    if (!coList) return;

    const coExhibitors = this.controller.getCoExhibitors(this.currentExhibitor);

    coList.innerHTML = coExhibitors.map(ex => `
      <li>
        ${ex.logoUrl ? `
          <img class="co-logo" src="${this.escapeHtml(ex.logoUrl)}" alt="${this.escapeHtml(ex.name)}" />
        ` : ''}
        <span>${this.escapeHtml(ex.name)}</span>
      </li>
    `).join('');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners(exhibitor, space) {
    // Close button
    const closeBtn = document.getElementById('closeExhibitorCard');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
        this.controller.clearSelection();
      });
    }

    // Directions button
    const directionsBtn = document.getElementById('exhibitorDirections');
    if (directionsBtn && space) {
      directionsBtn.addEventListener('click', () => {
        if (this.onDirections) {
          this.onDirections({
            exhibitor,
            space,
            label: exhibitor.name
          });
        } else {
          // Default: Trigger custom event
          window.dispatchEvent(new CustomEvent('set-directions-destination', {
            detail: {
              space,
              label: exhibitor.name,
              exhibitor
            }
          }));
        }

        console.log('📍 Get directions to:', exhibitor.name);
      });
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy the card
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.isOpen = false;
  }

  /**
   * Check if card is open
   */
  getIsOpen() {
    return this.isOpen;
  }

  /**
   * Get current exhibitor
   */
  getCurrentExhibitor() {
    return this.currentExhibitor;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExhibitorCardUI;
} else {
  window.ExhibitorCardUI = ExhibitorCardUI;
}
