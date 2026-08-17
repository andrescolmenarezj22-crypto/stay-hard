/* JobFinder — Local Storage */
const Store = {
  KEY: 'jobfinder_data',

  defaults: {
    profile: null,
    savedJobs: [],
    preferences: { dark: true, notifications: false }
  },

  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? { ...this.defaults, ...JSON.parse(raw) } : { ...this.defaults };
    } catch {
      return { ...this.defaults };
    }
  },

  set(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  },

  update(patch) {
    const current = this.get();
    const next = { ...current, ...patch };
    this.set(next);
    return next;
  },

  clear() {
    localStorage.removeItem(this.KEY);
  }
};
