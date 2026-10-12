/**
 * Versey — Verse Module (ES Module)
 * Handles day calculations, leap years, verse fetching, and navigation.
 */

let cachedVerses = null;

/**
 * Checks if a given year is a leap year.
 * @param {number} year 
 * @returns {boolean}
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Returns total days in a given year (365 or 366).
 * @param {number} year 
 * @returns {number}
 */
export function getTotalDaysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Calculates day of the year (1 - 366) from a given Date object in local time.
 * @param {Date} date 
 * @returns {number} 1-based day index
 */
export function getDayOfYear(date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffTime = date.getTime() - startOfYear.getTime();
  const oneDayMs = 1000 * 60 * 60 * 24;
  return Math.floor(diffTime / oneDayMs) + 1;
}

/**
 * Formats a Date object for friendly display (e.g. "Monday, Oct 12, 2026").
 * @param {Date} date 
 * @returns {string}
 */
export function formatDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Fetches verses from `./data/verses.json`.
 * Caches in memory once loaded.
 * @returns {Promise<Array>} Array of verse objects
 */
export function loadVerses() {
  if (cachedVerses && cachedVerses.length > 0) {
    return Promise.resolve(cachedVerses);
  }

  return fetch('./data/verses.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load verses: HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Allow data to be an array directly or an object containing an array
      const versesList = Array.isArray(data) ? data : (data.verses || []);
      if (!versesList.length) {
        throw new Error('Verses list is empty in verses.json');
      }
      cachedVerses = versesList;
      return cachedVerses;
    });
}

/**
 * Finds the verse corresponding to a given day of year.
 * Robust to various item schemas: text/verse, ref/reference, topic/category.
 * @param {Array} verses 
 * @param {number} dayOfYear 1-based day number
 * @returns {Object} normalized verse object
 */
export function getVerseForDay(verses, dayOfYear) {
  if (!verses || !verses.length) {
    return getFallbackVerse(dayOfYear);
  }

  // 1. Try finding by matching `day` property
  let found = verses.find((v) => Number(v.day) === Number(dayOfYear));

  // 2. If not found, use modulo indexing
  if (!found) {
    const index = Math.max(0, (dayOfYear - 1) % verses.length);
    found = verses[index];
  }

  return normalizeVerse(found, dayOfYear);
}

/**
 * Standardizes verse property names.
 * @param {Object} rawVerse 
 * @param {number} day 
 * @returns {Object} { day, text, reference, category }
 */
export function normalizeVerse(rawVerse, day) {
  if (!rawVerse) {
    return getFallbackVerse(day);
  }

  return {
    day: rawVerse.day || day,
    text: (rawVerse.verse || rawVerse.text || '').trim(),
    reference: (rawVerse.reference || rawVerse.ref || 'Scripture').trim(),
    category: (rawVerse.category || rawVerse.topic || 'Inspiration').trim()
  };
}

/**
 * Fallback verse in case network/file fetch encounters an issue.
 * @param {number} day 
 * @returns {Object}
 */
export function getFallbackVerse(day = 1) {
  return {
    day,
    text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    reference: "John 3:16",
    category: "Love"
  };
}
