/**
 * Versey — UI Module (ES Module)
 * Manages DOM updates, theme persistence, notifications, modal interactions,
 * and user control bindings.
 */

const THEME_STORAGE_KEY = 'versey_color_theme';

export class UIManager {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;

    // State
    this.currentFormat = 'post';
    this.currentImageTheme = 'cream';

    // Element references
    this.elements = {
      html: document.documentElement,
      themeToggle: document.getElementById('theme-toggle'),
      themeColorMeta: document.getElementById('theme-color-meta'),
      prevDayBtn: document.getElementById('prev-day-btn'),
      nextDayBtn: document.getElementById('next-day-btn'),
      todayBtn: document.getElementById('today-btn'),
      currentDateText: document.getElementById('current-date-text'),
      verseCard: document.getElementById('verse-card'),
      verseContent: document.getElementById('verse-content'),
      verseSkeleton: document.getElementById('verse-skeleton'),
      verseCategory: document.getElementById('verse-category'),
      verseDayNumber: document.getElementById('verse-day-number'),
      verseText: document.getElementById('verse-text'),
      verseReference: document.getElementById('verse-reference'),
      sharePrimaryBtn: document.getElementById('share-primary-btn'),
      copyTextBtn: document.getElementById('copy-text-btn'),
      downloadImageBtn: document.getElementById('download-image-btn'),
      formatBtns: document.querySelectorAll('.format-btn'),
      swatchBtns: document.querySelectorAll('.swatch-btn'),
      previewFormatText: document.getElementById('preview-format-text'),
      verseCanvas: document.getElementById('verse-canvas'),
      canvasLoadingOverlay: document.getElementById('canvas-loading-overlay'),
      shareModalBackdrop: document.getElementById('share-modal-backdrop'),
      modalCloseBtn: document.getElementById('modal-close-btn'),
      modalVerseSnippet: document.getElementById('modal-verse-snippet'),
      modalVerseRef: document.getElementById('modal-verse-ref'),
      modalCopyLinkBtn: document.getElementById('modal-copy-link-btn'),
      shareLinks: {
        wa: document.getElementById('share-link-wa'),
        x: document.getElementById('share-link-x'),
        fb: document.getElementById('share-link-fb'),
        tg: document.getElementById('share-link-tg'),
        email: document.getElementById('share-link-email')
      },
      toastContainer: document.getElementById('toast-container')
    };

    this.initTheme();
    this.bindEvents();
  }

  /* ------------------------------------------------------------------------
     Theme Management (Light / Dark)
     ------------------------------------------------------------------------ */
  initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }

    // Listen for OS system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  setTheme(theme) {
    this.elements.html.setAttribute('data-theme', theme);
    if (this.elements.themeColorMeta) {
      this.elements.themeColorMeta.setAttribute('content', theme === 'dark' ? '#141312' : '#faf8f5');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  toggleTheme() {
    const current = this.elements.html.getAttribute('data-theme') || 'light';
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
    this.showToast(`Switched to ${nextTheme} mode`);
  }

  /* ------------------------------------------------------------------------
     Verse Rendering & Loading States
     ------------------------------------------------------------------------ */
  setLoading(isLoading) {
    if (isLoading) {
      this.elements.verseCard.classList.add('is-loading');
    } else {
      this.elements.verseCard.classList.remove('is-loading');
    }
  }

  setCanvasLoading(isLoading) {
    if (this.elements.canvasLoadingOverlay) {
      if (isLoading) {
        this.elements.canvasLoadingOverlay.classList.add('active');
      } else {
        this.elements.canvasLoadingOverlay.classList.remove('active');
      }
    }
  }

  renderVerse(verse, formattedDate, isToday, totalDaysInYear = 365) {
    this.setLoading(false);

    if (this.elements.verseCategory) {
      this.elements.verseCategory.textContent = verse.category || 'Scripture';
    }
    if (this.elements.verseDayNumber) {
      this.elements.verseDayNumber.textContent = `Day ${verse.day || 1} of ${totalDaysInYear}`;
    }
    if (this.elements.verseText) {
      this.elements.verseText.textContent = verse.text;
    }
    if (this.elements.verseReference) {
      this.elements.verseReference.textContent = `— ${verse.reference}`;
    }
    if (this.elements.currentDateText) {
      this.elements.currentDateText.textContent = formattedDate;
      this.elements.currentDateText.setAttribute('datetime', new Date().toISOString().split('T')[0]);
    }

    // Toggle Today button badge visibility
    if (this.elements.todayBtn) {
      if (isToday) {
        this.elements.todayBtn.classList.add('hidden');
      } else {
        this.elements.todayBtn.classList.remove('hidden');
      }
    }

    // Update fallback modal preview content
    if (this.elements.modalVerseSnippet) {
      this.elements.modalVerseSnippet.textContent = `“${verse.text}”`;
    }
    if (this.elements.modalVerseRef) {
      this.elements.modalVerseRef.textContent = `— ${verse.reference} (KJV)`;
    }
  }

  /* ------------------------------------------------------------------------
     Customizer State & UI
     ------------------------------------------------------------------------ */
  setFormat(format) {
    this.currentFormat = format;
    this.elements.formatBtns.forEach((btn) => {
      const match = btn.dataset.format === format;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-checked', match ? 'true' : 'false');
    });

    if (this.elements.previewFormatText) {
      this.elements.previewFormatText.textContent =
        format === 'story' ? 'Story Format (9:16)' : 'Post Format (1:1)';
    }

    if (this.callbacks.onCustomizerChange) {
      this.callbacks.onCustomizerChange(this.currentFormat, this.currentImageTheme);
    }
  }

  setImageTheme(themeId) {
    this.currentImageTheme = themeId;
    this.elements.swatchBtns.forEach((btn) => {
      const match = btn.dataset.themeId === themeId;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-checked', match ? 'true' : 'false');
    });

    if (this.callbacks.onCustomizerChange) {
      this.callbacks.onCustomizerChange(this.currentFormat, this.currentImageTheme);
    }
  }

  /* ------------------------------------------------------------------------
     Modal Management
     ------------------------------------------------------------------------ */
  openShareModal(socialUrls) {
    if (socialUrls) {
      if (this.elements.shareLinks.wa) this.elements.shareLinks.wa.href = socialUrls.whatsapp;
      if (this.elements.shareLinks.x) this.elements.shareLinks.x.href = socialUrls.twitter;
      if (this.elements.shareLinks.fb) this.elements.shareLinks.fb.href = socialUrls.facebook;
      if (this.elements.shareLinks.tg) this.elements.shareLinks.tg.href = socialUrls.telegram;
      if (this.elements.shareLinks.email) this.elements.shareLinks.email.href = socialUrls.email;
    }

    this.elements.shareModalBackdrop.classList.add('is-open');
    this.elements.shareModalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  closeShareModal() {
    this.elements.shareModalBackdrop.classList.remove('is-open');
    this.elements.shareModalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ------------------------------------------------------------------------
     Toast Notifications
     ------------------------------------------------------------------------ */
  showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    this.elements.toastContainer.appendChild(toast);

    // Trigger reflow for CSS animation
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      }, { once: true });
    }, duration);
  }

  /* ------------------------------------------------------------------------
     Event Bindings
     ------------------------------------------------------------------------ */
  bindEvents() {
    // Theme toggle
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

    // Navigation buttons
    this.elements.prevDayBtn.addEventListener('click', () => {
      if (this.callbacks.onNavigateDay) this.callbacks.onNavigateDay(-1);
    });

    this.elements.nextDayBtn.addEventListener('click', () => {
      if (this.callbacks.onNavigateDay) this.callbacks.onNavigateDay(1);
    });

    this.elements.todayBtn.addEventListener('click', () => {
      if (this.callbacks.onJumpToday) this.callbacks.onJumpToday();
    });

    // Action buttons
    this.elements.sharePrimaryBtn.addEventListener('click', () => {
      if (this.callbacks.onSharePrimary) this.callbacks.onSharePrimary();
    });

    this.elements.copyTextBtn.addEventListener('click', () => {
      if (this.callbacks.onCopyText) this.callbacks.onCopyText();
    });

    this.elements.downloadImageBtn.addEventListener('click', () => {
      if (this.callbacks.onDownloadImage) this.callbacks.onDownloadImage();
    });

    // Customizer format buttons
    this.elements.formatBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setFormat(btn.dataset.format);
      });
    });

    // Customizer theme swatches
    this.elements.swatchBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setImageTheme(btn.dataset.themeId);
      });
    });

    // Share modal close buttons & overlay click
    this.elements.modalCloseBtn.addEventListener('click', () => this.closeShareModal());
    this.elements.shareModalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.elements.shareModalBackdrop) {
        this.closeShareModal();
      }
    });

    // Modal Copy Link button
    this.elements.modalCopyLinkBtn.addEventListener('click', () => {
      if (this.callbacks.onCopyLink) this.callbacks.onCopyLink();
    });

    // Keyboard navigation (Left / Right arrow for days, Escape for modal)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.shareModalBackdrop.classList.contains('is-open')) {
        this.closeShareModal();
      } else if (e.key === 'ArrowLeft' && !this.elements.shareModalBackdrop.classList.contains('is-open')) {
        if (this.callbacks.onNavigateDay) this.callbacks.onNavigateDay(-1);
      } else if (e.key === 'ArrowRight' && !this.elements.shareModalBackdrop.classList.contains('is-open')) {
        if (this.callbacks.onNavigateDay) this.callbacks.onNavigateDay(1);
      }
    });
  }
}
