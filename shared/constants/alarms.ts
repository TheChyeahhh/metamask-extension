/**
 * Alarm names used throughout the extension.
 * These are passed to the browser.alarms API (Chrome alarms API) and
 * must remain stable — they are the canonical alarm identifiers.
 */
export enum Alarm {
  AutoLockTimeout = 'AUTO_LOCK_TIMEOUT_ALARM',
  MetaMetricsFinalizeEventFragment = 'METAMETRICS_FINALIZE_EVENT_FRAGMENT_ALARM',
}