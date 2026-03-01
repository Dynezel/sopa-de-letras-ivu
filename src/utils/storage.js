const KEY = "wh_mygroup";

export const getMyGroup = () => {
  try { return JSON.parse(localStorage.getItem(KEY)); }
  catch { return null; }
};

export const setMyGroup = (group) => {
  try { localStorage.setItem(KEY, JSON.stringify(group)); }
  catch {}
};

export const clearMyGroup = () => {
  try { localStorage.removeItem(KEY); }
  catch {}
};
