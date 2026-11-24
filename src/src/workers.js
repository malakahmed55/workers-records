export const STORAGE_KEY = 'workers-records:v1';

export const SAMPLE_WORKERS = [
  { id: 1, name: 'Sara Mostafa', position: 'Programmer', salary: 5000 },
  { id: 2, name: 'Omar Hassan', position: 'Designer', salary: 4200 },
  { id: 3, name: 'Nour Ali', position: 'Accountant', salary: 4800 },
];

export function loadWorkers(storage = window.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return SAMPLE_WORKERS;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : SAMPLE_WORKERS;
  } catch {
    return SAMPLE_WORKERS;
  }
}

export function saveWorkers(workers, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(workers));
  } catch {
    /* storage full or blocked: the list still works for this visit */
  }
}

export function validate({ name, position, salary }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Name is required.';
  if (!position.trim()) errors.position = 'Position is required.';
  const n = Number(salary);
  if (String(salary).trim() === '' || Number.isNaN(n)) errors.salary = 'Enter a salary as a number.';
  else if (n < 0) errors.salary = 'Salary cannot be negative.';
  return errors;
}

export function nextId(workers) {
  return workers.reduce((m, w) => Math.max(m, w.id), 0) + 1;
}

export function filterWorkers(workers, query) {
  const q = query.trim().toLowerCase();
  if (!q) return workers;
  return workers.filter((w) => w.name.toLowerCase().includes(q) || w.position.toLowerCase().includes(q));
}

export function sortWorkers(workers, key, dir) {
  const m = dir === 'desc' ? -1 : 1;
  return [...workers].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * m;
    return String(x).localeCompare(String(y)) * m;
  });
}
