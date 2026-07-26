// Seconds remaining until the next local midnight relative to `now`.
// Used to expire the daily pick cache so a fresh pick appears each day.
function secondsUntilMidnight(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 1000));
}

// ISO timestamp of the next local midnight (the daily reset moment).
function nextMidnight(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.toISOString();
}

// Date key (YYYY-MM-DD) used to scope the daily pick cache per calendar day.
function dateKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

module.exports = { secondsUntilMidnight, nextMidnight, dateKey };
