export const SAVE_KEY = 'taso-arena-save-v1';

export function loadSave(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !data.player || !data.collection) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(save, storage = globalThis.localStorage) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(storage = globalThis.localStorage) {
  try { storage?.removeItem(SAVE_KEY); } catch { /* yoksay */ }
}
