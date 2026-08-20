/**
 * DisciplinaPro - Storage Layer
 * localStorage-based persistence with default data
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'disciplina_pro_data';

  var DEFAULT_PROFILE = {
    name: '',
    avatar: '🏃',
    level: 1,
    xp: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalXP: 0,
    totalMissions: 0,
    totalWorkouts: 0,
    totalMinutes: 0,
    activeDays: [],
    createdAt: new Date().toISOString()
  };

  var DEFAULT_SETTINGS = {
    theme: 'dark',
    sounds: true,
    notifications: true,
    exerciseTime: 30,
    restTime: 15,
    rounds: 3,
    roundRest: 60
  };

  function getDefaults() {
    return {
      profile: JSON.parse(JSON.stringify(DEFAULT_PROFILE)),
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      missions: {},
      routines: [],
      habits: [],
      achievements: [],
      favoriteQuotes: [],
      calendar: {}
    };
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaults();
      var parsed = JSON.parse(raw);
      var defaults = getDefaults();
      // Merge with defaults to handle new fields
      var result = {};
      for (var key in defaults) {
        if (parsed.hasOwnProperty(key)) {
          result[key] = parsed[key];
        } else {
          result[key] = defaults[key];
        }
      }
      return result;
    } catch (e) {
      return getDefaults();
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('DisciplinaPro: Could not save data', e);
    }
  }

  var data = null;

  window.Store = {
    init: function() {
      data = loadData();
    },

    get: function(key) {
      if (!data) data = loadData();
      return data[key];
    },

    set: function(key, value) {
      if (!data) data = loadData();
      data[key] = value;
      saveData(data);
    },

    reset: function() {
      data = getDefaults();
      saveData(data);
    },

    getAll: function() {
      if (!data) data = loadData();
      return JSON.parse(JSON.stringify(data));
    }
  };
})();
