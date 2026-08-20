/**
 * DisciplinaPro - Storage Layer
 * localStorage-based persistence with default data
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'disciplina_pro_data';

  var DEFAULT_PROFILE = {
    name: '',
    avatar: '🪖',
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

  var DEFAULT_ROUTINE = {
    id: 'rutina-militar-7am',
    name: 'Rutina Militar — Modo Guerra',
    category: 'General',
    icon: '🪖',
    days: ['lun','mar','mie','jue','vie','sab','dom'],
    time: '07:00',
    active: true,
    reminder: true,
    exercises: [
      { id:'rm-01', name:'Despertar — Tender la cama, tomar agua, lavarse la cara', duration:120, sets:1, reps:1, rest:0, description:'7:00 AM. Nada de celular. Disciplina al despertar.' },
      { id:'rm-02', name:'Activación — Estiramientos', duration:600, sets:1, reps:1, rest:0, description:'7:10 AM. Estirar todo el cuerpo con control.' },
      { id:'rm-03', name:'Activación — Respiración profunda', duration:300, sets:1, reps:1, rest:0, description:'7:15 AM. Respirar profundo, 4 seg inhalar, 4 seg sostener, 4 seg exhalar.' },
      { id:'rm-04', name:'Cardio — Caminar o trotar', duration:900, sets:1, reps:1, rest:0, description:'7:25 AM. Ritmo constante, sin parar.' },
      { id:'rm-05', name:'Entrenamiento militar del día', duration:2700, sets:1, reps:1, rest:0, description:'7:45 AM. Seguir el plan semanal según el día.' },
      { id:'rm-06', name:'Ducha', duration:600, sets:1, reps:1, rest:0, description:'8:30 AM. Agua fría si es posible.' },
      { id:'rm-07', name:'Desayuno saludable', duration:600, sets:1, reps:1, rest:0, description:'8:45 AM. Proteína, frutas, agua.' },
      { id:'rm-08', name:'Prepararme para la escuela', duration:7200, sets:1, reps:1, rest:0, description:'9:00–11:00. Ducharse, vestirse, arreglarse, preparar mochila, revisar útiles y tareas.' },
      { id:'rm-09', name:'Almuerzo saludable', duration:1800, sets:1, reps:1, rest:0, description:'11:00–12:00. Comer bien, descansar breve.' },
      { id:'rm-10', name:'Descanso / Relajación', duration:1800, sets:1, reps:1, rest:0, description:'12:00–12:30. Desconexión total.' },
      { id:'rm-11', name:'Ir para la escuela', duration:1800, sets:1, reps:1, rest:0, description:'12:30. Salir con tiempo, llegar con calma y enfoque.' },
      { id:'rm-12', name:'Escuela — Enfoque 100%', duration:19800, sets:1, reps:1, rest:0, description:'12:30–6:00 PM. Clases, atención, participación.' },
      { id:'rm-13', name:'Llegar a casa — Descanso breve', duration:900, sets:1, reps:1, rest:0, description:'6:00 PM. Hidratarse, cambiarse.' },
      { id:'rm-14', name:'Tiempo libre / Relajación', duration:2700, sets:1, reps:1, rest:0, description:'6:15–7:00 PM. Ver algo ligero, relajarse.' },
      { id:'rm-15', name:'Segunda sesión — Estudiar / Leer / Tareas', duration:2700, sets:1, reps:1, rest:0, description:'7:00–7:45 PM. Aprender algo nuevo.' },
      { id:'rm-16', name:'Proyecto personal', duration:2700, sets:1, reps:1, rest:0, description:'7:45–8:30 PM. Diseño, edición, crear contenido.' },
      { id:'rm-17', name:'Finanzas — Registrar gastos, revisar ingresos', duration:1800, sets:1, reps:1, rest:0, description:'8:30–9:00 PM. Ahorrar, revisar inversiones.' },
      { id:'rm-18', name:'Organización — Limpiar y preparar', duration:1800, sets:1, reps:1, rest:0, description:'9:00–9:30 PM. Habitación, escritorio, ropa, agenda.' },
      { id:'rm-19', name:'Tracker de hábitos del día', duration:300, sets:1, reps:1, rest:0, description:'9:30–10:00 PM. Marcar todo lo completado.' },
      { id:'rm-20', name:'Relajación — Sin pantallas', duration:1200, sets:1, reps:1, rest:0, description:'10:00–10:20 PM. Música, leer, estiramientos.' },
      { id:'rm-21', name:'Prepararse para dormir', duration:600, sets:1, reps:1, rest:0, description:'10:20–10:30 PM. Cepillarse, alarma, luces bajas.' },
      { id:'rm-22', name:'Dormir — 8h 30min de sueño', duration:30600, sets:1, reps:1, rest:0, description:'10:30 PM. Descansar para estar mejor mañana.' }
    ]
  };

  function getTrainingForDay(dayIndex) {
    var plans = {
      1: { name:'Lunes — Fundamentos', exercises:[
        { id:'tr-l1', name:'Abdominales', duration:45, sets:1, reps:20, rest:10, description:'Core fuerte, control total.' },
        { id:'tr-l2', name:'Flexiones', duration:30, sets:1, reps:10, rest:10, description:'Forma perfecta, pecho al suelo.' },
        { id:'tr-l3', name:'Sentadillas con salto', duration:45, sets:1, reps:20, rest:15, description:'Explotar arriba, control abajo.' },
        { id:'tr-l4', name:'Plancha', duration:30, sets:1, reps:1, rest:10, description:'Cuerpo recto, sin bajar la cadera.' },
        { id:'tr-l5', name:'Mountain Climbers', duration:30, sets:1, reps:20, rest:10, description:'Rodillas al pecho, ritmo rápido.' },
        { id:'tr-l6', name:'Cuerda', duration:60, sets:1, reps:1, rest:10, description:'Saltar sin parar, ritmo constante.' },
        { id:'tr-l7', name:'Jumping Jacks', duration:30, sets:1, reps:30, rest:10, description:'Brazas y piernas abiertas, sincronizar.' },
        { id:'tr-l8', name:'Saltos laterales', duration:30, sets:1, reps:20, rest:10, description:'De lado a lado, mantener equilibrio.' }
      ]},
      2: { name:'Martes — Volumen', exercises:[
        { id:'tr-m1', name:'Abdominales', duration:50, sets:1, reps:30, rest:10, description:'Más repeticiones, misma disciplina.' },
        { id:'tr-m2', name:'Flexiones', duration:40, sets:1, reps:15, rest:10, description:'Aumentar la intensidad.' },
        { id:'tr-m3', name:'Sentadillas con salto', duration:50, sets:1, reps:30, rest:15, description:'Potencia en cada salto.' },
        { id:'tr-m4', name:'Plancha', duration:40, sets:1, reps:1, rest:10, description:'Aguantar 40 segundos sin moverse.' },
        { id:'tr-m5', name:'Mountain Climbers', duration:40, sets:1, reps:30, rest:10, description:'Más velocidad, mismo control.' },
        { id:'tr-m6', name:'Cuerda', duration:120, sets:1, reps:1, rest:15, description:'2 minutos seguidos.' },
        { id:'tr-m7', name:'Jumping Jacks', duration:40, sets:1, reps:40, rest:10, description:'40 repeticiones sin parar.' },
        { id:'tr-m8', name:'Saltos laterales', duration:40, sets:1, reps:30, rest:10, description:'30 saltos, controlar el ritmo.' }
      ]},
      3: { name:'Miércoles — Resistencia', exercises:[
        { id:'tr-x1', name:'Abdominales', duration:60, sets:1, reps:40, rest:10, description:'Resistencia mental y física.' },
        { id:'tr-x2', name:'Flexiones', duration:50, sets:1, reps:20, rest:10, description:'20 flexiones, una más una.' },
        { id:'tr-x3', name:'Sentadillas', duration:50, sets:1, reps:40, rest:15, description:'Sin salto, controlando el movimiento.' },
        { id:'tr-x4', name:'Plancha', duration:50, sets:1, reps:1, rest:10, description:'50 segundos, resistencia pura.' },
        { id:'tr-x5', name:'Mountain Climbers', duration:40, sets:1, reps:30, rest:10, description:'Ritmo sostenido.' },
        { id:'tr-x6', name:'Cuerda', duration:180, sets:1, reps:1, rest:15, description:'3 minutos, sin excusas.' },
        { id:'tr-x7', name:'Jumping Jacks', duration:50, sets:1, reps:50, rest:10, description:'50 repeticiones de corrido.' },
        { id:'tr-x8', name:'Saltos laterales', duration:50, sets:1, reps:40, rest:10, description:'40 saltos laterales, constancia.' }
      ]},
      4: { name:'Jueves — Volumen', exercises:[
        { id:'tr-j1', name:'Abdominales', duration:50, sets:1, reps:30, rest:10, description:'Mantener el ritmo de martes.' },
        { id:'tr-j2', name:'Flexiones', duration:40, sets:1, reps:15, rest:10, description:'15 flexiones perfectas.' },
        { id:'tr-j3', name:'Sentadillas con salto', duration:50, sets:1, reps:30, rest:15, description:'Cada salto cuenta.' },
        { id:'tr-j4', name:'Plancha', duration:40, sets:1, reps:1, rest:10, description:'40 segundos, firme.' },
        { id:'tr-j5', name:'Mountain Climbers', duration:40, sets:1, reps:30, rest:10, description:'30 climbers rápidos.' },
        { id:'tr-j6', name:'Cuerda', duration:120, sets:1, reps:1, rest:15, description:'2 minutos de cuerda.' },
        { id:'tr-j7', name:'Jumping Jacks', duration:40, sets:1, reps:40, rest:10, description:'40 jumping jacks.' },
        { id:'tr-j8', name:'Saltos laterales', duration:40, sets:1, reps:30, rest:10, description:'30 saltos, terminar fuerte.' }
      ]},
      5: { name:'Viernes — Élite', exercises:[
        { id:'tr-v1', name:'Abdominales', duration:60, sets:1, reps:50, rest:10, description:'50 abdominales, sin excusas.' },
        { id:'tr-v2', name:'Flexiones', duration:50, sets:1, reps:20, rest:10, description:'20 flexiones de guerrero.' },
        { id:'tr-v3', name:'Sentadillas', duration:60, sets:1, reps:50, rest:15, description:'50 sentadillas, resistencia total.' },
        { id:'tr-v4', name:'Plancha', duration:60, sets:1, reps:1, rest:10, description:'60 segundos, sin temblar.' },
        { id:'tr-v5', name:'Mountain Climbers', duration:50, sets:1, reps:50, rest:10, description:'50 climbers, velocidad máxima.' },
        { id:'tr-v6', name:'Cuerda', duration:240, sets:1, reps:1, rest:15, description:'4 minutos de cuerda, día de élite.' },
        { id:'tr-v7', name:'Jumping Jacks', duration:50, sets:1, reps:50, rest:10, description:'50 jumping jacks, sin parar.' },
        { id:'tr-v8', name:'Saltos laterales', duration:50, sets:1, reps:45, rest:10, description:'45 saltos laterales, terminar la semana fuerte.' }
      ]},
      6: { name:'Sábado — Cardio activo', exercises:[
        { id:'tr-s1', name:'Trote suave', duration:1800, sets:1, reps:1, rest:0, description:'30 minutos de trote a ritmo cómodo.' },
        { id:'tr-s2', name:'Estiramiento y movilidad', duration:900, sets:1, reps:1, rest:0, description:'15 minutos de movilidad articular y estiramientos.' }
      ]},
      0: { name:'Domingo — Descanso activo', exercises:[
        { id:'tr-d1', name:'Caminar', duration:1800, sets:1, reps:1, rest:0, description:'Caminata tranquila, activar el cuerpo.' },
        { id:'tr-d2', name:'Estirar', duration:600, sets:1, reps:1, rest:0, description:'Estiramientos suaves, relajar músculos.' }
      ]}
    };
    return plans[dayIndex] || plans[1];
  }

  var DEFAULT_HABITS = [
    { id:'hab-01', name:'Entrené', icon:'💪', time:'08:00', days:['lun','mar','mie','jue','vie','sab'], reminder:true, goal:'Completar entrenamiento del día', xp:15, completedDates:[] },
    { id:'hab-02', name:'Estudié', icon:'📚', time:'19:00', days:['lun','mar','mie','jue','vie'], reminder:true, goal:'Mínimo 2 horas de estudio', xp:15, completedDates:[] },
    { id:'hab-03', name:'Leí', icon:'📖', time:'22:00', days:['lun','mar','mie','jue','vie','sab','dom'], reminder:true, goal:'15 páginas mínimo', xp:10, completedDates:[] },
    { id:'hab-04', name:'Ahorré', icon:'💰', time:'21:00', days:['lun','mar','mie','jue','vie','sab'], reminder:false, goal:'Ahorrar al menos 10%', xp:10, completedDates:[] },
    { id:'hab-05', name:'Registré gastos', icon:'📝', time:'21:00', days:['lun','mar','mie','jue','vie','sab'], reminder:false, goal:'Registrar cada gasto del día', xp:10, completedDates:[] },
    { id:'hab-06', name:'Sin compras impulsivas', icon:'🚫', time:'22:00', days:['lun','mar','mie','jue','vie','sab','dom'], reminder:false, goal:'No comprar nada innecesario', xp:15, completedDates:[] },
    { id:'hab-07', name:'Tomé 2L de agua', icon:'💧', time:'20:00', days:['lun','mar','mie','jue','vie','sab','dom'], reminder:true, goal:'Beber al menos 2 litros', xp:10, completedDates:[] },
    { id:'hab-08', name:'Dormí antes de 10:30', icon:'😴', time:'22:30', days:['lun','mar','mie','jue','vie','sab','dom'], reminder:true, goal:'Dormir a las 10:30 PM', xp:10, completedDates:[] },
    { id:'hab-09', name:'Sin procrastinar', icon:'⚡', time:'19:00', days:['lun','mar','mie','jue','vie','sab'], reminder:false, goal:'Cumplir el horario al pie de la letra', xp:15, completedDates:[] },
    { id:'hab-10', name:'Aprendí algo nuevo', icon:'🧠', time:'20:30', days:['lun','mar','mie','jue','vie','sab'], reminder:false, goal:'Aprender una habilidad o concepto', xp:10, completedDates:[] }
  ];

  function getDefaults() {
    return {
      profile: JSON.parse(JSON.stringify(DEFAULT_PROFILE)),
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      missions: {},
      routines: [JSON.parse(JSON.stringify(DEFAULT_ROUTINE))],
      habits: JSON.parse(JSON.stringify(DEFAULT_HABITS)),
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
      var result = {};
      for (var key in defaults) {
        if (parsed.hasOwnProperty(key)) {
          result[key] = parsed[key];
        } else {
          result[key] = defaults[key];
        }
      }
      if (!result.routines || result.routines.length === 0) {
        result.routines = defaults.routines;
      }
      if (!result.habits || result.habits.length === 0) {
        result.habits = defaults.habits;
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
    },

    getTrainingForDay: getTrainingForDay
  };
})();
