import { FisherYatesShuffle } from './common';
import l from './localize';
import Vue from 'vue';

/**
 * The amount of tips we have. Based on this number (minus one),
 * we will fetch tips from the localization files.
 */
const TIP_COUNT = 30;
/*
 * The modifier key for keyboard shortcuts based on the user's platform.
 */

let isMac = process.platform === 'darwin';
const MODIFIER_KEY = !isMac ? 'Ctrl' : '⌘';
const ALT_KEY = !isMac ? 'Alt' : '⌥';
/*
 * An array of tip indices to track the current order of tips.
 */
let tips: number[] = [];
/**
 * Zero-based index of the currently selected tip in the tips collection.
 *
 * Initialized to 0 so the first tip is shown by default.
 *
 * @example
 * // Advance to the next tip with wrap-around
 * if (tips.length) {
 *   currentTipIndex = (currentTipIndex + 1) % tips.length;
 * }
 */
export const currentTipIndex = Vue.observable({ value: 0 });

/**
 * Generate the initial list of tips and shuffle them.
 */
function generateTips() {
  tips = [];
  for (let i = 0; i < TIP_COUNT; i++) {
    tips.push(i);
  }
  shuffleTips();
}
/**
 *  Move the tip cursor to the next tip and return that tip value.
 * @returns The next tip value (a number), or `undefined` if the tips list is empty.
 */
export function nextTip(): number {
  validateTips();
  if (tips.length) {
    currentTipIndex.value = (currentTipIndex.value + 1) % tips.length;
  }
  return tips[currentTipIndex.value];
}

/**
 * Move the tip cursor to the previous tip and return that tip value.
 *
 * @returns The previous tip value (a number), or `undefined` if the tips list is empty.
 */
export function previousTip(): number {
  validateTips();
  if (tips.length) {
    currentTipIndex.value =
      (currentTipIndex.value - 1 + tips.length) % tips.length;
  }
  return tips[currentTipIndex.value];
}

/**
 * Shuffle the order of tips and reset the current tip index to zero.
 */
export function shuffleTips() {
  FisherYatesShuffle(tips);
  currentTipIndex.value = 0;
}

/**
 * Ensure that the tips array is populated.
 */
function validateTips() {
  if (tips.length < 1) {
    generateTips();
  }
}

/**
 * Get the current tip string from the localization files.
 * @returns The localized tip string.
 */
export default function tip(): string {
  validateTips();
  return l(`tips.${tips[currentTipIndex.value]}`, MODIFIER_KEY, ALT_KEY);
}
