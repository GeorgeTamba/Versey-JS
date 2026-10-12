/**
 * Versey — Main Application Entry Point (ES Module)
 * Connects verse data, canvas image rendering, sharing, and UI state.
 */

import {
  getDayOfYear,
  getTotalDaysInYear,
  formatDate,
  loadVerses,
  getVerseForDay,
  getFallbackVerse
} from './verse.js';

import {
  renderVerseToCanvas,
  generateVerseBlob,
  generateVerseFile
} from './image.js';

import {
  isWebShareSupported,
  shareNative,
  formatVerseShareText,
  buildSocialShareUrls,
  copyToClipboard,
  downloadBlob,
  SITE_URL
} from './share.js';

import { UIManager } from './ui.js';

class VerseyApp {
  constructor() {
    this.versesData = [];
    this.currentDate = new Date();
    this.currentVerse = null;
    this.isRenderingCanvas = false;

    // Initialize UI Manager with callbacks
    this.ui = new UIManager({
      onNavigateDay: (delta) => this.navigateDay(delta),
      onJumpToday: () => this.jumpToToday(),
      onCustomizerChange: (format, themeId) => this.renderImagePreview(format, themeId),
      onSharePrimary: () => this.handleSharePrimary(),
      onCopyText: () => this.handleCopyText(),
      onDownloadImage: () => this.handleDownloadImage(),
      onCopyLink: () => this.handleCopyLink()
    });
  }

  /**
   * Initializes the application flow.
   */
  async init() {
    this.ui.setLoading(true);

    try {
      this.versesData = await loadVerses();
    } catch (error) {
      console.warn('Could not fetch external verses.json, using fallback scripture.', error);
      this.versesData = [getFallbackVerse(1)];
    }

    await this.updateCurrentView();
    this.registerServiceWorker();
  }

  /**
   * Registers service worker for offline PWA support.
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
          .catch((err) => console.warn('Service Worker registration skipped or failed:', err));
      });
    }
  }

  /**
   * Updates view based on this.currentDate.
   */
  async updateCurrentView() {
    this.ui.setLoading(true);

    const year = this.currentDate.getFullYear();
    const totalDays = getTotalDaysInYear(year);
    const dayOfYear = getDayOfYear(this.currentDate);

    // Check if currentDate is today
    const today = new Date();
    const isToday =
      this.currentDate.getDate() === today.getDate() &&
      this.currentDate.getMonth() === today.getMonth() &&
      this.currentDate.getFullYear() === today.getFullYear();

    this.currentVerse = getVerseForDay(this.versesData, dayOfYear);

    const formattedDate = formatDate(this.currentDate);
    this.ui.renderVerse(this.currentVerse, formattedDate, isToday, totalDays);

    // Render image on canvas
    await this.renderImagePreview(this.ui.currentFormat, this.ui.currentImageTheme);
  }

  /**
   * Navigates forward or backward by +/- delta days.
   * @param {number} delta 
   */
  async navigateDay(delta) {
    const nextDate = new Date(this.currentDate);
    nextDate.setDate(nextDate.getDate() + delta);
    this.currentDate = nextDate;
    await this.updateCurrentView();
  }

  /**
   * Resets date to today.
   */
  async jumpToToday() {
    this.currentDate = new Date();
    await this.updateCurrentView();
    this.ui.showToast('Jumped to today\'s verse');
  }

  /**
   * Renders the current verse to canvas preview.
   */
  async renderImagePreview(format, themeId) {
    if (!this.currentVerse || !this.ui.elements.verseCanvas) return;

    this.ui.setCanvasLoading(true);
    this.isRenderingCanvas = true;

    try {
      await renderVerseToCanvas(this.ui.elements.verseCanvas, this.currentVerse, format, themeId);
    } catch (err) {
      console.error('Failed to render canvas image', err);
    } finally {
      this.ui.setCanvasLoading(false);
      this.isRenderingCanvas = false;
    }
  }

  /**
   * Handles Primary "Share Verse" action.
   * Tries native Web Share API Level 2 (with image file),
   * falls back to modal if unavailable or not supported.
   */
  async handleSharePrimary() {
    if (!this.currentVerse) return;

    const canvas = this.ui.elements.verseCanvas;
    const format = this.ui.currentFormat;
    const themeId = this.ui.currentImageTheme;
    const shareText = formatVerseShareText(this.currentVerse);

    // If native share is supported, attempt it
    if (isWebShareSupported()) {
      try {
        let file = null;
        try {
          file = await generateVerseFile(canvas, this.currentVerse, format, themeId);
        } catch (fileErr) {
          console.warn('Could not generate image file for native share', fileErr);
        }

        const sharePayload = {
          title: `Verse of the Day — ${this.currentVerse.reference}`,
          text: shareText,
          url: SITE_URL
        };

        if (file) {
          sharePayload.files = [file];
        }

        const result = await shareNative(sharePayload);
        if (result.success) {
          this.ui.showToast('Shared successfully!');
          return;
        }

        if (result.cancelled) {
          // User closed share sheet intentionally
          return;
        }
      } catch (err) {
        console.warn('Native share threw, opening modal fallback', err);
      }
    }

    // Fallback: Open modal with direct platform links
    const socialUrls = buildSocialShareUrls(this.currentVerse, SITE_URL);
    this.ui.openShareModal(socialUrls);
  }

  /**
   * Handles copying text to clipboard.
   */
  async handleCopyText() {
    if (!this.currentVerse) return;

    const shareText = formatVerseShareText(this.currentVerse);
    const success = await copyToClipboard(shareText);

    if (success) {
      this.ui.showToast('Verse copied to clipboard!');
    } else {
      this.ui.showToast('Unable to copy text.');
    }
  }

  /**
   * Handles copying link inside the share modal.
   */
  async handleCopyLink() {
    const success = await copyToClipboard(SITE_URL);
    if (success) {
      this.ui.showToast('Link copied to clipboard!');
      this.ui.closeShareModal();
    } else {
      this.ui.showToast('Unable to copy link.');
    }
  }

  /**
   * Handles downloading the formatted Canvas image.
   */
  async handleDownloadImage() {
    if (!this.currentVerse || !this.ui.elements.verseCanvas) return;

    try {
      this.ui.showToast('Preparing image download...');
      const blob = await generateVerseBlob(
        this.ui.elements.verseCanvas,
        this.currentVerse,
        this.ui.currentFormat,
        this.ui.currentImageTheme
      );

      const cleanRef = (this.currentVerse.reference || 'verse')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      const filename = `versey-${cleanRef}-${this.ui.currentFormat}.png`;

      downloadBlob(blob, filename);
      this.ui.showToast('Image downloaded!');
    } catch (err) {
      console.error('Image download failed', err);
      this.ui.showToast('Failed to download image.');
    }
  }
}

// Bootstrap application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new VerseyApp();
  app.init();
});
