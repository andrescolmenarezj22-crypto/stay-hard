/**
 * DisciplinaPro - Main Application
 * Professional training/discipline/habits PWA
 */
(function() {
  'use strict';

  window.App = {
    currentView: 'home',
    previousView: null,
    selectedDate: new Date(),
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
    timerInterval: null,
    workoutData: null,
    currentRoutine: null,
    installed: false,
    deferredPrompt: null,
    audioContext: null
  };

  App.utils = {
    formatTime: function(s) { var m=Math.floor(s/60),sc=s%60; return m.toString().padStart(2,'0')+':'+sc.toString().padStart(2,'0'); },
    formatMinutes: function(min) { var h=Math.floor(min/60),m=min%60; if(h>0&&m>0) return h+'h '+m+'m'; if(h>0) return h+'h'; return m+'m'; },
    dateString: function(d) { var dt=new Date(d); return dt.getFullYear()+'-'+(dt.getMonth()+1).toString().padStart(2,'0')+'-'+dt.getDate().toString().padStart(2,'0'); },
    today: function() { return this.dateString(new Date()); },
    generateId: function() { return 'id_'+Date.now()+'_'+Math.random().toString(36).substr(2,9); },
    randomQuote: function() {
      if(!window.MOTIVATIONAL_QUOTES||!window.MOTIVATIONAL_QUOTES.length) return {text:'La disciplina es el puente entre tus metas y tus logros.',author:'DisciplinaPro'};
      var t=this.today(),h=0; for(var i=0;i<t.length;i++){h=((h<<5)-h)+t.charCodeAt(i);h=h&h;}
      var q=window.MOTIVATIONAL_QUOTES[Math.abs(h)%window.MOTIVATIONAL_QUOTES.length];
      return typeof q==='string'?{text:q,author:'DisciplinaPro'}:q;
    },
    randomQuoteFresh: function() {
      if(!window.MOTIVATIONAL_QUOTES||!window.MOTIVATIONAL_QUOTES.length) return {text:'La disciplina es el puente entre tus metas y tus logros.',author:'DisciplinaPro'};
      var q=window.MOTIVATIONAL_QUOTES[Math.floor(Math.random()*window.MOTIVATIONAL_QUOTES.length)];
      return typeof q==='string'?{text:q,author:'DisciplinaPro'}:q;
    },
    getLevelTitle: function(l) {
      if(l<=5)return'Principiante'; if(l<=10)return'Constante'; if(l<=20)return'Disciplinado'; if(l<=35)return'Avanzado'; return'E\u00e9lite';
    },
    getDiffColor: function(d) {
      if(d==='F\u00e1cil')return'var(--success)'; if(d==='Medio')return'var(--warning)'; if(d==='Dif\u00edcil')return'var(--danger)'; return'var(--text-secondary)';
    },
    getDaysInMonth: function(y,m) { return new Date(y,m+1,0).getDate(); },
    getFirstDayOfMonth: function(y,m) { return new Date(y,m,1).getDay(); }
  };

  App.sounds = {
    init: function() { try { App.audioContext = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} },
    ensureCtx: function() { if(App.audioContext&&App.audioContext.state==='suspended') App.audioContext.resume(); },
    play: function(type) {
      var st=window.Store?window.Store.get('settings'):{}; if(st.sounds===false) return;
      this.ensureCtx(); if(!App.audioContext) return;
      switch(type){
        case 'exercise_start': this.tone(440,0.2,0.3); break;
        case 'rest_start': this.tone(523,0.15,0.3); var self=this; setTimeout(function(){self.tone(523,0.15,0.3);},200); break;
        case 'session_complete': this.tone(523,0.15,0.3); setTimeout(function(){App.sounds.tone(659,0.15,0.3);},200); setTimeout(function(){App.sounds.tone(784,0.2,0.3);},400); break;
        case 'level_up': this.tone(523,0.15,0.3); setTimeout(function(){App.sounds.tone(587,0.15,0.3);},150); setTimeout(function(){App.sounds.tone(659,0.15,0.3);},300); setTimeout(function(){App.sounds.tone(698,0.15,0.3);},450); setTimeout(function(){App.sounds.tone(784,0.25,0.3);},600); break;
        case 'mission_complete': this.tone(659,0.1,0.2); setTimeout(function(){App.sounds.tone(784,0.15,0.2);},150); break;
        case 'tick': this.tone(880,0.05,0.1); break;
      }
    },
    tone: function(freq,dur,vol) {
      if(!App.audioContext) return;
      try {
        var o=App.audioContext.createOscillator(),g=App.audioContext.createGain();
        o.connect(g);g.connect(App.audioContext.destination);
        o.frequency.value=freq;o.type='sine';
        g.gain.setValueAtTime(vol,App.audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,App.audioContext.currentTime+dur);
        o.start(App.audioContext.currentTime);o.stop(App.audioContext.currentTime+dur);
      } catch(e){}
    }
  };

  App.showModal = function(content) {
    var m=document.getElementById('app-modal');
    if(!m){ m=document.createElement('div');m.id='app-modal';m.className='modal-overlay';m.innerHTML='<div class="modal-content"></div>';document.body.appendChild(m);m.addEventListener('click',function(e){if(e.target===m)App.hideModal();}); }
    m.querySelector('.modal-content').innerHTML=content; m.classList.add('active');
  };
  App.hideModal = function() { var m=document.getElementById('app-modal'); if(m)m.classList.remove('active'); };
  App.showConfirm = function(msg,cb) {
    App.showModal('<div class="confirm-dialog"><h3>Confirmar</h3><p>'+msg+'</p><div class="confirm-actions"><button class="btn btn-secondary" onclick="App.hideModal()">Cancelar</button><button class="btn btn-primary" id="confirm-ok">Confirmar</button></div></div>');
    document.getElementById('confirm-ok').addEventListener('click',function(){App.hideModal();if(cb)cb();});
  };

  App.showToast = function(msg,type) {
    type=type||'info'; var t=document.createElement('div'); t.className='toast toast-'+type; t.innerHTML=msg; document.body.appendChild(t);
    setTimeout(function(){t.classList.add('show');},10);
    setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},3000);
  };

  App.navigate = function(viewId) {
    var views=document.querySelectorAll('.view'), navs=document.querySelectorAll('.nav-item');
    App.previousView=App.currentView; App.currentView=viewId;
    views.forEach(function(v){v.classList.remove('active');});
    navs.forEach(function(n){n.classList.remove('active');if(n.dataset.view===viewId)n.classList.add('active');});
    var target=document.getElementById('view-'+viewId); if(target) target.classList.add('active');
    switch(viewId){
      case 'home':App.renderHome();break;case 'train':App.renderTrain();break;case 'missions':App.renderMissions();break;
      case 'progress':App.renderProgress();break;case 'settings':App.renderSettings();break;case 'profile':App.renderProfile();break;
      case 'calendar':App.renderCalendar();break;case 'achievements':App.renderAchievements();break;case 'habits':App.renderHabits();break;
      case 'quotes':App.renderQuotes();break;case 'routine-editor':App.renderRoutineEditor(App.currentRoutine);break;
    }
  };

  var DEFAULT_WORKOUTS = [{"id":"fuerza-total","name":"Fuerza Total","category":"Fuerza","icon":"💪","duration":30,"difficulty":"Difícil","xp":30,"exercises":[{"id":"ex1","name":"Sentadillas","duration":45,"sets":3,"reps":15,"rest":15,"description":"Sentadillas con peso corporal, manteniendo la espalda recta"},{"id":"ex2","name":"Flexiones","duration":40,"sets":3,"reps":12,"rest":15,"description":"Flexiones de pecho con buena forma"},{"id":"ex3","name":"Dominadas","duration":45,"sets":3,"reps":8,"rest":20,"description":"Dominadas con agarre prono"},{"id":"ex4","name":"Press de Pecho","duration":40,"sets":3,"reps":12,"rest":15,"description":"Press con mancuernas o barra"},{"id":"ex5","name":"Peso Muerto","duration":50,"sets":3,"reps":10,"rest":20,"description":"Peso muerto con buena técnica"}]},{"id":"tren-superior","name":"Tren Superior","category":"Fuerza","icon":"🏋️","duration":25,"difficulty":"Medio","xp":25,"exercises":[{"id":"ex1","name":"Flexiones Diamante","duration":40,"sets":3,"reps":10,"rest":15,"description":"Flexiones con manos juntas formando diamante"},{"id":"ex2","name":"Press Militar","duration":40,"sets":3,"reps":12,"rest":15,"description":"Press de hombros con mancuernas"},{"id":"ex3","name":"Curl de Bíceps","duration":35,"sets":3,"reps":12,"rest":10,"description":"Curl con mancuernas"},{"id":"ex4","name":"Fondos","duration":40,"sets":3,"reps":10,"rest":15,"description":"Fondos en paralelas"},{"id":"ex5","name":"Remo con Mancuerna","duration":40,"sets":3,"reps":12,"rest":15,"description":"Remo a una mano con mancuerna"}]},{"id":"tren-inferior","name":"Tren Inferior","category":"Fuerza","icon":"🦵","duration":25,"difficulty":"Medio","xp":25,"exercises":[{"id":"ex1","name":"Sentadillas con Peso","duration":45,"sets":3,"reps":12,"rest":20,"description":"Sentadillas con barra o mancuernas"},{"id":"ex2","name":"Zancadas","duration":40,"sets":3,"reps":10,"rest":15,"description":"Zancadas alternas caminando"},{"id":"ex3","name":"Peso Muerto Rumano","duration":45,"sets":3,"reps":12,"rest":15,"description":"Peso muerto rumano con piernas rígidas"},{"id":"ex4","name":"Elevaciones de Gemelos","duration":30,"sets":3,"reps":15,"rest":10,"description":"Elevaciones de gemelos de pie"},{"id":"ex5","name":"Hip Thrust","duration":40,"sets":3,"reps":12,"rest":15,"description":"Hip thrust con banco"}]},{"id":"cardio-intenso","name":"Cardio Intenso","category":"Resistencia","icon":"🏃","duration":20,"difficulty":"Difícil","xp":25,"exercises":[{"id":"ex1","name":"Jumping Jacks","duration":45,"sets":2,"reps":1,"rest":15,"description":"Saltos abriendo y cerrando piernas"},{"id":"ex2","name":"Mountain Climbers","duration":40,"sets":2,"reps":1,"rest":15,"description":"Escaladores a máxima velocidad"},{"id":"ex3","name":"Burpees","duration":45,"sets":2,"reps":1,"rest":20,"description":"Burpees completos con salto"},{"id":"ex4","name":"High Knees","duration":30,"sets":2,"reps":1,"rest":10,"description":"Rodillas altas corriendo"},{"id":"ex5","name":"Saltos de Cuerda","duration":60,"sets":2,"reps":1,"rest":15,"description":"Saltos de cuerda imaginaria"}]},{"id":"resistencia-activa","name":"Resistencia Activa","category":"Resistencia","icon":"🔥","duration":30,"difficulty":"Medio","xp":25,"exercises":[{"id":"ex1","name":"Caminata Rápida","duration":300,"sets":1,"reps":1,"rest":0,"description":"Caminata a paso rápido"},{"id":"ex2","name":"Trote Ligero","duration":240,"sets":1,"reps":1,"rest":0,"description":"Trote suave constante"},{"id":"ex3","name":"Saltos en el Sitio","duration":120,"sets":1,"reps":1,"rest":0,"description":"Saltos continuos en el sitio"},{"id":"ex4","name":"Subir Escaleras","duration":180,"sets":1,"reps":1,"rest":0,"description":"Subir escaleras a buen ritmo"}]},{"id":"movilidad-completa","name":"Movilidad Completa","category":"Movilidad","icon":"🧘","duration":20,"difficulty":"Fácil","xp":20,"exercises":[{"id":"ex1","name":"Rotaciones de Cuello","duration":60,"sets":1,"reps":1,"rest":10,"description":"Rotaciones suaves del cuello"},{"id":"ex2","name":"Rotaciones de Hombros","duration":60,"sets":1,"reps":1,"rest":10,"description":"Círculos con los hombros"},{"id":"ex3","name":"Estiramiento de Cuádriceps","duration":60,"sets":2,"reps":1,"rest":10,"description":"Estiramiento de cuádriceps de pie"},{"id":"ex4","name":"Estiramiento de Isquiotibiales","duration":60,"sets":2,"reps":1,"rest":10,"description":"Estiramiento de isquiotibiales sentado"},{"id":"ex5","name":"Perro Boca Abajo","duration":60,"sets":1,"reps":1,"rest":10,"description":"Postura del perro boca abajo yoga"},{"id":"ex6","name":"Estiramiento de Espalda","duration":60,"sets":1,"reps":1,"rest":10,"description":"Gato-vaca para movilidad espinal"}]},{"id":"yoga-matutino","name":"Yoga Matutino","category":"Movilidad","icon":"🌅","duration":15,"difficulty":"Fácil","xp":20,"exercises":[{"id":"ex1","name":"Saludo al Sol","duration":120,"sets":2,"reps":1,"rest":15,"description":"Secuencia completa de saludo al sol"},{"id":"ex2","name":"Postura del Guerrero","duration":60,"sets":2,"reps":1,"rest":15,"description":"Guerrero I y II alternando lados"},{"id":"ex3","name":"Postura del Árbol","duration":45,"sets":2,"reps":1,"rest":15,"description":"Balance en una pierna"},{"id":"ex4","name":"Postura del Niño","duration":60,"sets":1,"reps":1,"rest":15,"description":"Relajación en postura del niño"},{"id":"ex5","name":"Savasana","duration":120,"sets":1,"reps":1,"rest":0,"description":"Relajación final completa"}]},{"id":"velocidad-agilidad","name":"Velocidad y Agilidad","category":"Velocidad","icon":"⚡","duration":15,"difficulty":"Medio","xp":25,"exercises":[{"id":"ex1","name":"Sprints Cortos","duration":30,"sets":4,"reps":1,"rest":30,"description":"Sprints de 20 metros con máxima velocidad"},{"id":"ex2","name":"Escalera de Agilidad","duration":45,"sets":3,"reps":1,"rest":20,"description":"Ejercicios de pies rápidos"},{"id":"ex3","name":"Cambios de Dirección","duration":40,"sets":3,"reps":1,"rest":20,"description":"Cambios de dirección explosivos"},{"id":"ex4","name":"Saltos Laterales","duration":30,"sets":3,"reps":1,"rest":15,"description":"Saltos laterales sobre línea"}]},{"id":"calentamiento-dinamico","name":"Calentamiento Dinámico","category":"Calentamiento","icon":"🔥","duration":10,"difficulty":"Fácil","xp":15,"exercises":[{"id":"ex1","name":"Marcha en el Sitio","duration":60,"sets":1,"reps":1,"rest":10,"description":"Marcha levantando rodillas"},{"id":"ex2","name":"Círculos de Brazos","duration":45,"sets":1,"reps":1,"rest":10,"description":"Círculos grandes con los brazos"},{"id":"ex3","name":"Rotaciones de Cadera","duration":60,"sets":1,"reps":1,"rest":10,"description":"Rotaciones amplias de cadera"},{"id":"ex4","name":"Talones a Glúteos","duration":60,"sets":1,"reps":1,"rest":10,"description":"Tocar glúteos con talones"},{"id":"ex5","name":"Rodillas al Pecho","duration":60,"sets":1,"reps":1,"rest":0,"description":"Elevar rodillas al pecho alternadamente"}]},{"id":"enfriamiento-activo","name":"Enfriamiento Activo","category":"Enfriamiento","icon":"❄️","duration":10,"difficulty":"Fácil","xp":15,"exercises":[{"id":"ex1","name":"Caminata Suave","duration":120,"sets":1,"reps":1,"rest":10,"description":"Caminata muy lenta para bajar pulsaciones"},{"id":"ex2","name":"Estiramiento de Pecho","duration":60,"sets":1,"reps":1,"rest":10,"description":"Estiramiento de pectorales en puerta"},{"id":"ex3","name":"Estiramiento de Espalda","duration":60,"sets":1,"reps":1,"rest":10,"description":"Estiramiento de espalda baja"},{"id":"ex4","name":"Estiramiento de Piernas","duration":60,"sets":1,"reps":1,"rest":10,"description":"Estiramiento completo de piernas"},{"id":"ex5","name":"Respiración Profunda","duration":90,"sets":1,"reps":1,"rest":0,"description":"Ejercicios de respiración profunda"}]},{"id":"rutina-matutina","name":"Rutina Matutina Energética","category":"Mañana","icon":"☀️","duration":15,"difficulty":"Fácil","xp":20,"exercises":[{"id":"ex1","name":"Saludos al Sol","duration":120,"sets":2,"reps":1,"rest":15,"description":"Secuencia de saludo al sol"},{"id":"ex2","name":"Estiramientos de Espalda","duration":60,"sets":1,"reps":1,"rest":10,"description":"Estiramientos para espalda"},{"id":"ex3","name":"Sentadillas Suaves","duration":60,"sets":2,"reps":10,"rest":15,"description":"Sentadillas para activar piernas"},{"id":"ex4","name":"Plancha","duration":45,"sets":2,"reps":1,"rest":15,"description":"Plancha frontal"},{"id":"ex5","name":"Respiración","duration":60,"sets":1,"reps":1,"rest":0,"description":"Respiración consciente"}]},{"id":"rutina-nocturna","name":"Rutina Nocturna Relajante","category":"Noche","icon":"🌙","duration":15,"difficulty":"Fácil","xp":20,"exercises":[{"id":"ex1","name":"Estiramiento de Cuello","duration":60,"sets":1,"reps":1,"rest":10,"description":"Estiramientos suaves de cuello"},{"id":"ex2","name":"Estiramiento de Espalda Baja","duration":60,"sets":1,"reps":1,"rest":10,"description":"Estiramientos de zona lumbar"},{"id":"ex3","name":"Postura del Niño","duration":90,"sets":1,"reps":1,"rest":10,"description":"Postura relajante yoga"},{"id":"ex4","name":"Estiramiento de Cadera","duration":60,"sets":1,"reps":1,"rest":10,"description":"Estiramiento de cadera profundo"},{"id":"ex5","name":"Respiración Relajante","duration":120,"sets":1,"reps":1,"rest":0,"description":"Respiración lenta y profunda"}]},{"id":"entrenamiento-express","name":"Entrenamiento Express","category":"General","icon":"⚡","duration":10,"difficulty":"Medio","xp":20,"exercises":[{"id":"ex1","name":"Burpees","duration":40,"sets":2,"reps":8,"rest":15,"description":"Burpees completos"},{"id":"ex2","name":"Sentadillas","duration":40,"sets":2,"reps":15,"rest":15,"description":"Sentadillas rápidas"},{"id":"ex3","name":"Flexiones","duration":40,"sets":2,"reps":10,"rest":15,"description":"Flexiones de pecho"},{"id":"ex4","name":"Plancha","duration":45,"sets":2,"reps":1,"rest":15,"description":"Plancha abdominal"}]},{"id":"circuito-completo","name":"Circuito Completo","category":"General","icon":"🔄","duration":25,"difficulty":"Difícil","xp":30,"exercises":[{"id":"ex1","name":"Sentadillas con Salto","duration":40,"sets":3,"reps":12,"rest":15,"description":"Sentadillas explosivas con salto"},{"id":"ex2","name":"Flexiones con Palmas","duration":35,"sets":3,"reps":10,"rest":15,"description":"Flexiones con aplauso"},{"id":"ex3","name":"Mountain Climbers","duration":45,"sets":3,"reps":1,"rest":15,"description":"Escaladores rápidos"},{"id":"ex4","name":"Zancadas con Salto","duration":40,"sets":3,"reps":10,"rest":15,"description":"Zancadas alternas con salto"},{"id":"ex5","name":"Plancha Lateral","duration":40,"sets":3,"reps":1,"rest":15,"description":"Plancha lateral cada lado"}]},{"id":"hiit-quemador","name":"HIIT Quemador","category":"General","icon":"🔥","duration":20,"difficulty":"Difícil","xp":30,"exercises":[{"id":"ex1","name":"Sprints en el Sitio","duration":30,"sets":4,"reps":1,"rest":30,"description":"Sprint máximo en el sitio"},{"id":"ex2","name":"Burpees","duration":30,"sets":4,"reps":8,"rest":30,"description":"Burpees a máxima velocidad"},{"id":"ex3","name":"Jumping Jacks","duration":30,"sets":4,"reps":1,"rest":30,"description":"Jumping jacks rápidos"},{"id":"ex4","name":"Mountain Climbers","duration":30,"sets":4,"reps":1,"rest":30,"description":"Escaladores máximos"}]}];

  var DEFAULT_ACHIEVEMENTS = [{"id":"primer-paso","name":"Primer Paso","desc":"Completar tu primer entrenamiento","icon":"🎯","target":1,"type":"workouts"},{"id":"constancia-hierro","name":"Constancia de Hierro","desc":"Racha de 3 días","icon":"🔥","target":3,"type":"streak"},{"id":"semana-completa","name":"Semana Completa","desc":"Racha de 7 días","icon":"📅","target":7,"type":"streak"},{"id":"quince-dias","name":"Quince Días","desc":"Racha de 14 días","icon":"⭐","target":14,"type":"streak"},{"id":"mes-hierro","name":"Un Mes de Hierro","desc":"Racha de 30 días","icon":"💪","target":30,"type":"streak"},{"id":"50-misiones","name":"50 Misiones","desc":"Completar 50 misiones","icon":"📋","target":50,"type":"missions"},{"id":"100-misiones","name":"100 Misiones","desc":"Completar 100 misiones","icon":"🏆","target":100,"type":"missions"},{"id":"250-misiones","name":"250 Misiones","desc":"Completar 250 misiones","icon":"🌟","target":250,"type":"missions"},{"id":"1000-xp","name":"1000 XP","desc":"Ganar 1000 XP total","icon":"✨","target":1000,"type":"xp"},{"id":"5000-xp","name":"5000 XP","desc":"Ganar 5000 XP total","icon":"💫","target":5000,"type":"xp"},{"id":"10000-xp","name":"10000 XP","desc":"Ganar 10000 XP total","icon":"🌟","target":10000,"type":"xp"},{"id":"25000-xp","name":"25000 XP","desc":"Ganar 25000 XP total","icon":"👑","target":25000,"type":"xp"},{"id":"10-entrenamientos","name":"10 Entrenamientos","desc":"Completar 10 entrenamientos","icon":"🏅","target":10,"type":"workouts"},{"id":"50-entrenamientos","name":"50 Entrenamientos","desc":"Completar 50 entrenamientos","icon":"🎖️","target":50,"type":"workouts"},{"id":"100-entrenamientos","name":"100 Entrenamientos","desc":"Completar 100 entrenamientos","icon":"🥇","target":100,"type":"workouts"},{"id":"alumno-dedicado","name":"Alumno Dedicado","desc":"Alcanzar nivel 5","icon":"📚","target":5,"type":"level"},{"id":"disciplinado","name":"Disciplinado","desc":"Alcanzar nivel 10","icon":"🎯","target":10,"type":"level"},{"id":"elite","name":"Élite","desc":"Alcanzar nivel 20","icon":"⚡","target":20,"type":"level"},{"id":"leyenda","name":"Leyenda","desc":"Alcanzar nivel 36","icon":"👑","target":36,"type":"level"},{"id":"madrugador","name":"Madrugador","desc":"Completar rutina matutina","icon":"🌅","target":1,"type":"morning"},{"id":"nocturno","name":"Nocturno","desc":"Completar rutina nocturna","icon":"🌙","target":1,"type":"night"},{"id":"todas-misiones","name":"Todas las Misiones","desc":"Completar todas las misiones diarias","icon":"✅","target":1,"type":"allMissions"},{"id":"habitos-perfectos","name":"Hábitos Perfectos","desc":"Completar todos los hábitos en un día","icon":"💎","target":1,"type":"allHabits"},{"id":"50-dias-activos","name":"50 Días Activos","desc":"Estar activo 50 días","icon":"📅","target":50,"type":"activeDays"},{"id":"100-horas","name":"100 Horas","desc":"Entrenar 100 horas totales","icon":"⏰","target":6000,"type":"minutes"}];

  App.init = function() {
    if(window.Store) window.Store.init();
    App.sounds.init();
    App.applyTheme((window.Store.get('settings')||{}).theme||'dark');
    App.setupNavigationListeners();
    App.generateDailyMissions();
    App.updateStreak();
    App.initAchievements();
    App.checkAchievements();
    App.setupPWA();
    App.setupKeyboardShortcuts();
    App.setupOnlineOffline();
    App.showSplash();
    setTimeout(function(){ App.navigate('home'); }, 100);
  };

  App.showSplash = function() {
    var splash=document.getElementById('splash-screen');
    if(splash){ splash.classList.add('active'); setTimeout(function(){ splash.classList.add('fade-out'); setTimeout(function(){ splash.classList.remove('active'); splash.style.display='none'; },500); },1500); }
  };

  App.setupNavigationListeners = function() {
    document.querySelectorAll('.nav-item').forEach(function(item){
      item.addEventListener('click',function(){ App.navigate(this.dataset.view); });
    });
  };

  App.setupKeyboardShortcuts = function() {
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape'){
        if(document.getElementById('app-modal')&&document.getElementById('app-modal').classList.contains('active')){ App.hideModal(); return; }
        if(App.currentView==='timer'){ App.navigate('home'); return; }
        if(App.previousView){ App.navigate(App.previousView); }
      }
    });
  };

  App.setupOnlineOffline = function() {
    window.addEventListener('online',function(){ App.showToast('Conectado a internet','success'); });
    window.addEventListener('offline',function(){ App.showToast('Sin conexión','error'); });
  };

  App.renderHome = function() {
    var profile=window.Store?window.Store.get('profile'):{};
    var missions=window.Store?window.Store.get('missions'):{};
    var today=App.utils.today();
    var todayMissions=missions[today]||[];
    var quote=App.utils.randomQuote();
    var level=App.calculateLevel(profile.totalXP||0);
    var xpCur=App.xpForLevel(level);
    var xpNext=App.xpForLevel(level+1);
    var curXP=(profile.totalXP||0)-xpCur;
    var needXP=xpNext-xpCur;
    var pct=needXP>0?Math.min(100,(curXP/needXP)*100):100;
    var circumference=2*Math.PI*45;
    var dashoffset=circumference-(circumference*pct/100);

    var c=document.getElementById('view-home');
    if(!c) return;
    c.innerHTML='<div class="home-view">'+
      '<div class="greeting-section"><h1 class="greeting">¡Hola, '+(profile.name||'Atleta')+'! 👋</h1><p class="greeting-subtitle">'+App.utils.getLevelTitle(level)+'</p></div>'+
      '<div class="level-card"><div class="level-header"><div class="level-ring"><svg viewBox="0 0 100 100"><circle class="level-ring-bg" cx="50" cy="50" r="45"/><circle class="level-ring-progress" cx="50" cy="50" r="45" style="stroke-dasharray:'+circumference+';stroke-dashoffset:'+dashoffset+'"/></svg><div class="level-number">'+level+'</div></div>'+
      '<div class="level-info"><h3>Nivel '+level+'</h3><p class="level-title">'+App.utils.getLevelTitle(level)+'</p><div class="xp-bar-container"><div class="xp-bar" style="width:'+pct+'%"></div></div><p class="xp-text">'+curXP+' / '+needXP+' XP ('+Math.round(pct)+'%)</p></div></div></div>'+
      '<div class="stats-grid"><div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-value">'+(profile.currentStreak||0)+'</div><div class="stat-label">Racha</div></div>'+
      '<div class="stat-card"><div class="stat-icon">🏆</div><div class="stat-value">'+(profile.bestStreak||0)+'</div><div class="stat-label">Mejor Racha</div></div>'+
      '<div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-value">'+(profile.totalXP||0)+'</div><div class="stat-label">XP Total</div></div>'+
      '<div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">'+(profile.totalMissions||0)+'</div><div class="stat-label">Misiones</div></div></div>'+
      '<div class="quote-card"><div class="quote-icon">💬</div><p class="quote-text">"'+quote.text+'"</p><p class="quote-author">- '+quote.author+'</p></div>'+
      '<div class="missions-section"><h2 class="section-title">Misiones de Hoy</h2><div class="missions-list">'+
      (todayMissions.length===0?'<p class="no-missions">No hay misiones para hoy</p>':
      todayMissions.map(function(m){
        return '<div class="mission-item '+m.status+'"><div class="mission-icon">'+(m.icon||'📋')+'</div><div class="mission-info"><h4 class="mission-name">'+m.name+'</h4><p class="mission-desc">'+(m.desc||'')+'</p><div class="mission-meta"><span class="mission-duration">'+App.utils.formatTime((m.duration||15)*60)+'</span><span class="mission-xp">+'+(m.xp||15)+' XP</span></div></div><button class="mission-toggle" data-id="'+m.id+'">'+(m.status==='completed'?'✅':'⬜')+'</button></div>';
      }).join(''))+
      '</div>'+
      (todayMissions.some(function(m){return m.status!=='completed';})?'<button class="btn btn-primary btn-block start-mission-btn" id="start-first-mission">COMENZAR MISIÓN</button>':'')+
      '</div>'+
      '<div class="quick-stats-section"><h2 class="section-title">Estadísticas</h2><div class="quick-stats-grid"><div class="quick-stat"><div class="quick-stat-value">'+(profile.totalMissions||0)+'</div><div class="quick-stat-label">Misiones</div></div><div class="quick-stat"><div class="quick-stat-value">'+(profile.totalWorkouts||0)+'</div><div class="quick-stat-label">Entrenamientos</div></div><div class="quick-stat"><div class="quick-stat-value">'+App.utils.formatMinutes(profile.totalMinutes||0)+'</div><div class="quick-stat-label">Tiempo</div></div><div class="quick-stat"><div class="quick-stat-value">'+(profile.activeDays?profile.activeDays.length:0)+'</div><div class="quick-stat-label">Días</div></div></div></div></div>';

    c.querySelectorAll('.mission-toggle').forEach(function(btn){
      btn.addEventListener('click',function(){ App.toggleMission(this.dataset.id); });
    });
    var sb=document.getElementById('start-first-mission');
    if(sb) sb.addEventListener('click',function(){ var im=todayMissions.find(function(m){return m.status!=='completed';}); if(im){App.showToast('Iniciando: '+im.name,'info');App.navigate('train');} });
  };

  App.renderTrain = function() {
    var c=document.getElementById('view-train');
    if(!c) return;
    c.innerHTML='<div class="train-view"><h1 class="view-title">Entrenamiento</h1>'+
      '<div class="category-tabs" id="category-tabs">'+
      '<button class="category-tab active" data-category="Todos">Todos</button>'+
      '<button class="category-tab" data-category="Fuerza">Fuerza</button>'+
      '<button class="category-tab" data-category="Resistencia">Resistencia</button>'+
      '<button class="category-tab" data-category="Movilidad">Movilidad</button>'+
      '<button class="category-tab" data-category="Velocidad">Velocidad</button>'+
      '<button class="category-tab" data-category="General">General</button>'+
      '<button class="category-tab" data-category="Calentamiento">Calentamiento</button>'+
      '<button class="category-tab" data-category="Enfriamiento">Enfriamiento</button>'+
      '<button class="category-tab" data-category="Mañana">Mañana</button>'+
      '<button class="category-tab" data-category="Noche">Noche</button></div>'+
      '<div class="workout-grid" id="workout-grid">'+App.renderWorkoutCards('Todos')+'</div>'+
      '<button class="btn btn-secondary btn-block create-routine-btn" id="create-routine-btn">+ Crear Rutina Personalizada</button></div>';

    c.querySelectorAll('.category-tab').forEach(function(tab){
      tab.addEventListener('click',function(){
        c.querySelectorAll('.category-tab').forEach(function(t){t.classList.remove('active');});
        this.classList.add('active');
        document.getElementById('workout-grid').innerHTML=App.renderWorkoutCards(this.dataset.category);
        App.attachWorkoutListeners();
      });
    });
    var cr=document.getElementById('create-routine-btn');
    if(cr) cr.addEventListener('click',function(){App.currentRoutine=null;App.navigate('routine-editor');});
    App.attachWorkoutListeners();
  };

  App.renderWorkoutCards = function(cat) {
    var routines=(window.Store?window.Store.get('routines'):[])||[];
    var routineIds=routines.map(function(r){return r.id;});
    var workouts=DEFAULT_WORKOUTS.slice();
    routines.forEach(function(r){ if(r.active) workouts.push({id:r.id,name:r.name,category:r.category||'General',icon:r.icon||'🏋️',duration:Math.round(r.exercises.reduce(function(s,e){return s+(e.duration||30);},0)/60),difficulty:'Personalizado',xp:20,exercises:r.exercises}); });
    var dayNames=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    var dayKeys=[0,1,2,3,4,5,6];
    dayKeys.forEach(function(dk){
      var plan=window.Store.getTrainingForDay(dk);
      var dur=Math.round(plan.exercises.reduce(function(s,e){return s+e.duration;},0)/60);
      workouts.push({id:'training-'+dk,name:plan.name,category:'Fuerza',icon:'⚔️',duration:dur,difficulty:'Difícil',xp:30,exercises:plan.exercises});
    });
    if(cat!=='Todos') workouts=workouts.filter(function(w){return w.category===cat;});
    return workouts.map(function(w){
      var isCustom=routineIds.indexOf(w.id)>-1;
      return '<div class="workout-card'+(isCustom?' custom-routine':'')+'" data-id="'+w.id+'">'+(isCustom?'<button class="workout-edit-btn" data-id="'+w.id+'" title="Editar rutina">✏️</button>':'')+'<div class="workout-icon">'+(w.icon||'💪')+'</div><h3 class="workout-name">'+w.name+'</h3><div class="workout-meta"><span class="workout-duration">'+w.duration+' min</span><span class="workout-difficulty" style="color:'+App.utils.getDiffColor(w.difficulty)+'">'+w.difficulty+'</span><span class="workout-xp">+'+w.xp+' XP</span></div></div>';
    }).join('');
  };

  App.attachWorkoutListeners = function() {
    document.querySelectorAll('.workout-card').forEach(function(card){
      card.addEventListener('click',function(e){
        if(e.target.closest('.workout-edit-btn')) return;
        App.showWorkoutDetail(this.dataset.id);
      });
    });
    document.querySelectorAll('.workout-edit-btn').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        App.currentRoutine=this.dataset.id;
        App.navigate('routine-editor');
      });
    });
  };

  App.showWorkoutDetail = function(wid) {
    var workout=DEFAULT_WORKOUTS.find(function(w){return w.id===wid;});
    var isCustom=false;
    if(!workout){ var routines=(window.Store?window.Store.get('routines'):[])||[]; var r=routines.find(function(r){return r.id===wid;}); if(r){workout={id:r.id,name:r.name,category:r.category||'General',icon:'🏋️',duration:Math.round(r.exercises.reduce(function(s,e){return s+(e.duration||30);},0)/60),difficulty:'Personalizado',xp:20,exercises:r.exercises};isCustom=true;} }
    if(!workout){App.showToast('No encontrado','error');return;}
    App.workoutData=workout;
    var c=document.getElementById('view-train');
    c.innerHTML='<div class="workout-detail-view"><button class="btn btn-back" id="back-to-train">← Volver</button>'+
      '<div class="workout-detail-header"><div class="workout-detail-icon">'+(workout.icon||'💪')+'</div><h1 class="workout-detail-name">'+workout.name+'</h1><div class="workout-detail-meta"><span>'+workout.duration+' min</span><span style="color:'+App.utils.getDiffColor(workout.difficulty)+'">'+workout.difficulty+'</span><span>+'+workout.xp+' XP</span></div></div>'+
      '<div class="exercise-list"><h2>Ejercicios</h2>'+
      workout.exercises.map(function(ex,i){
        return '<div class="exercise-item"><div class="exercise-number">'+(i+1)+'</div><div class="exercise-info"><h3>'+ex.name+'</h3><p>'+(ex.description||'')+'</p><div class="exercise-meta">'+(ex.sets?'<span>Series: '+ex.sets+'</span>':'')+(ex.reps&&ex.reps>1?'<span>Reps: '+ex.reps+'</span>':'')+'<span>Tiempo: '+App.utils.formatTime(ex.duration)+'</span>'+(ex.rest?'<span>Descanso: '+ex.rest+'s</span>':'')+'</div></div></div>';
      }).join('')+'</div>'+
      (isCustom?'<button class="btn btn-secondary btn-block" id="edit-routine-btn" style="margin-bottom:var(--space-sm);">✏️ Editar Rutina</button>':'')+
      '<button class="btn btn-primary btn-block start-workout-btn" id="start-workout">INICIAR ENTRENAMIENTO</button></div>';

    document.getElementById('back-to-train').addEventListener('click',function(){App.renderTrain();});
    document.getElementById('start-workout').addEventListener('click',function(){App.startTimer(workout);});
    if(isCustom){
      document.getElementById('edit-routine-btn').addEventListener('click',function(){App.currentRoutine=wid;App.navigate('routine-editor');});
    }
  };

  App.timer = { state:'idle', currentExerciseIndex:0, currentTime:0, totalTime:0, restTime:0, isRest:false, currentRound:1, totalRounds:1, interval:null, workout:null, sessionStartTime:null };

  App.startTimer = function(workout) {
    var settings=window.Store?window.Store.get('settings'):{};
    App.timer.workout=workout;
    App.timer.state='running';
    App.timer.currentExerciseIndex=0;
    App.timer.isRest=false;
    App.timer.currentRound=1;
    App.timer.totalRounds=settings.rounds||1;
    App.timer.currentTime=workout.exercises[0].duration;
    App.timer.totalTime=workout.exercises[0].duration;
    App.timer.restTime=settings.restTime||15;
    App.timer.sessionStartTime=Date.now();
    App.navigate('timer');
    App.renderTimer();
    App.sounds.play('exercise_start');
    App.startTimerInterval();
  };

  App.renderTimer = function() {
    var w=App.timer.workout; if(!w) return;
    var ex=w.exercises[App.timer.currentExerciseIndex];
    var total=w.exercises.length*App.timer.totalRounds;
    var done=(App.timer.currentRound-1)*w.exercises.length+App.timer.currentExerciseIndex;
    var pct=(done/total)*100;
    var circ=2*Math.PI*80;
    var dash=circ-(App.timer.currentTime/App.timer.totalTime)*circ;

    var c=document.getElementById('view-timer');
    if(!c) return;
    c.innerHTML='<div class="timer-view">'+
      '<div class="timer-header"><div class="timer-progress-bar"><div class="timer-progress-fill" style="width:'+pct+'%"></div></div>'+
      '<div class="timer-info"><span class="timer-round">Ronda '+App.timer.currentRound+'/'+App.timer.totalRounds+'</span><span class="timer-exercise-count">'+(done+1)+'/'+total+'</span></div></div>'+
      '<div class="timer-display"><div class="timer-circle"><svg viewBox="0 0 180 180"><circle class="timer-circle-bg" cx="90" cy="90" r="80"/><circle class="timer-circle-progress" cx="90" cy="90" r="80" style="stroke-dasharray:'+circ+';stroke-dashoffset:'+dash+'"/></svg><div class="timer-time">'+App.utils.formatTime(App.timer.currentTime)+'</div></div>'+
      '<div class="timer-status '+App.timer.state+'">'+(App.timer.isRest?'DESCANSO':(App.timer.state==='paused'?'PAUSADO':'¡A TRABAJAR!'))+'</div></div>'+
      '<div class="timer-exercise-info"><h2 class="timer-exercise-name">'+(App.timer.isRest?'Descanso':ex.name)+'</h2><p class="timer-exercise-desc">'+(App.timer.isRest?'Prepárate para el siguiente':(ex.description||''))+'</p>'+
      (!App.timer.isRest?'<div class="timer-exercise-meta">'+(ex.sets?'<span>Series: '+ex.sets+'</span>':'')+(ex.reps&&ex.reps>1?'<span>Reps: '+ex.reps+'</span>':'')+'</div>':'')+'</div>'+
      '<div class="timer-controls"><button class="timer-control-btn" id="timer-restart" title="Reiniciar">⏮️</button>'+
      '<button class="timer-control-btn timer-main-btn" id="timer-pause">'+(App.timer.state==='paused'?'▶️':'⏸️')+'</button>'+
      '<button class="timer-control-btn" id="timer-skip" title="Siguiente">⏭️</button>'+
      '<button class="timer-control-btn timer-finish-btn" id="timer-finish">🛑</button></div></div>';

    document.getElementById('timer-restart').addEventListener('click',App.restartTimer);
    document.getElementById('timer-pause').addEventListener('click',function(){ if(App.timer.state==='paused')App.resumeTimer();else App.pauseTimer(); });
    document.getElementById('timer-skip').addEventListener('click',App.skipTimer);
    document.getElementById('timer-finish').addEventListener('click',function(){ App.showConfirm('¿Finalizar entrenamiento?',function(){App.completeSession();}); });
  };

  App.startTimerInterval = function() {
    App.timer.interval=setInterval(function(){
      if(App.timer.state==='running'){
        App.timer.currentTime--;
        if(App.timer.currentTime<=3&&App.timer.currentTime>0) App.sounds.play('tick');
        if(App.timer.currentTime<=0){ if(App.timer.isRest)App.nextExercise();else App.completeExercise(); }
        App.renderTimer();
      }
    },1000);
  };

  App.pauseTimer = function() { App.timer.state='paused'; App.renderTimer(); };
  App.resumeTimer = function() { App.timer.state='running'; App.renderTimer(); };
  App.skipTimer = function() { if(App.timer.isRest)App.nextExercise();else App.completeExercise(); };

  App.restartTimer = function() {
    var ex=App.timer.workout.exercises[App.timer.currentExerciseIndex];
    App.timer.currentTime=ex.duration;App.timer.totalTime=ex.duration;App.timer.isRest=false;App.timer.state='running';
    App.sounds.play('exercise_start');App.renderTimer();
  };

  App.completeExercise = function() {
    App.sounds.play('rest_start');App.timer.isRest=true;App.timer.currentTime=App.timer.restTime;App.timer.totalTime=App.timer.restTime;App.timer.state='running';
  };

  App.nextExercise = function() {
    App.timer.isRest=false;App.timer.currentExerciseIndex++;
    if(App.timer.currentExerciseIndex>=App.timer.workout.exercises.length){
      if(App.timer.currentRound<App.timer.totalRounds){App.timer.currentRound++;App.timer.currentExerciseIndex=0;}
      else{App.completeSession();return;}
    }
    var ex=App.timer.workout.exercises[App.timer.currentExerciseIndex];
    App.timer.currentTime=ex.duration;App.timer.totalTime=ex.duration;App.timer.state='running';
    App.sounds.play('exercise_start');
  };

  App.completeSession = function() {
    clearInterval(App.timer.interval);App.timer.state='complete';App.sounds.play('session_complete');
    var w=App.timer.workout;
    var dur=Math.round((Date.now()-App.timer.sessionStartTime)/60000);
    var profile=window.Store.get('profile');
    profile.totalWorkouts=(profile.totalWorkouts||0)+1;profile.totalMinutes=(profile.totalMinutes||0)+dur;
    window.Store.set('profile',profile);
    var today=App.utils.today();var cal=window.Store.get('calendar');
    if(!cal[today])cal[today]={missions:0,completed:0,xp:0,workouts:0,minutes:0};
    cal[today].workouts=(cal[today].workouts||0)+1;cal[today].minutes=(cal[today].minutes||0)+dur;
    window.Store.set('calendar',cal);
    App.addXP(w.xp);

    var c=document.getElementById('view-timer');
    c.innerHTML='<div class="timer-complete-view"><div class="completion-icon">🎉</div><h1>¡Entrenamiento Completado!</h1>'+
      '<div class="completion-stats"><div class="completion-stat"><div class="completion-stat-value">'+w.name+'</div><div class="completion-stat-label">Entrenamiento</div></div>'+
      '<div class="completion-stat"><div class="completion-stat-value">'+dur+' min</div><div class="completion-stat-label">Duración</div></div>'+
      '<div class="completion-stat"><div class="completion-stat-value">+'+w.xp+' XP</div><div class="completion-stat-label">Experiencia</div></div></div>'+
      '<button class="btn btn-primary btn-block" id="back-home">VOLVER AL INICIO</button></div>';
    document.getElementById('back-home').addEventListener('click',function(){App.navigate('home');});
    App.checkAchievements();
  };

  App.renderMissions = function() {
    var missions=window.Store?window.Store.get('missions'):{};
    var today=App.utils.today();
    var selStr=App.utils.dateString(App.selectedDate);
    var dayMissions=missions[selStr]||[];
    var c=document.getElementById('view-missions');
    if(!c) return;
    c.innerHTML='<div class="missions-view"><h1 class="view-title">Misiones</h1>'+
      '<div class="date-selector"><button class="date-nav" id="prev-day">◀</button><div class="date-display"><span class="date-current">'+App.formatDateDisplay(App.selectedDate)+'</span>'+(selStr!==today?'<button class="btn btn-small" id="go-today">Hoy</button>':'')+'</div><button class="date-nav" id="next-day">▶</button></div>'+
      '<div class="missions-list">'+
      (dayMissions.length===0?'<p class="no-missions">No hay misiones para este día</p>':
      dayMissions.map(function(m){
        return '<div class="mission-item '+m.status+'" data-id="'+m.id+'"><div class="mission-icon">'+(m.icon||'📋')+'</div><div class="mission-info"><h4 class="mission-name">'+m.name+'</h4><p class="mission-desc">'+(m.desc||'')+'</p><div class="mission-meta"><span class="mission-duration">'+App.utils.formatTime((m.duration||15)*60)+'</span><span class="mission-xp">+'+(m.xp||15)+' XP</span><span class="mission-difficulty" style="color:'+App.utils.getDiffColor(m.difficulty||'Medio')+'">'+(m.difficulty||'Medio')+'</span></div></div><button class="mission-toggle" data-id="'+m.id+'">'+(m.status==='completed'?'✅':'⬜')+'</button></div>';
      }).join(''))+'</div>'+
      '<button class="btn btn-secondary btn-block" id="add-mission-btn">+ Agregar Misión</button></div>';

    document.getElementById('prev-day').addEventListener('click',function(){App.selectedDate.setDate(App.selectedDate.getDate()-1);App.renderMissions();});
    document.getElementById('next-day').addEventListener('click',function(){App.selectedDate.setDate(App.selectedDate.getDate()+1);App.renderMissions();});
    var gt=document.getElementById('go-today');
    if(gt) gt.addEventListener('click',function(){App.selectedDate=new Date();App.renderMissions();});
    c.querySelectorAll('.mission-toggle').forEach(function(btn){btn.addEventListener('click',function(){App.toggleMission(this.dataset.id,selStr);});});
    document.getElementById('add-mission-btn').addEventListener('click',function(){App.showAddMissionModal();});
  };

  App.formatDateDisplay = function(d) {
    var opts={weekday:'long',year:'numeric',month:'long',day:'numeric'};
    return d.toLocaleDateString('es-ES',opts);
  };

  App.toggleMission = function(mid,dateStr) {
    dateStr=dateStr||App.utils.today();
    var missions=window.Store.get('missions');
    var dayMissions=missions[dateStr]||[];
    var mission=dayMissions.find(function(m){return m.id===mid;});
    if(!mission) return;
    if(mission.status==='completed'){
      mission.status='pending';App.showToast('Misión desmarcada','info');
    } else {
      mission.status='completed';App.addXP(mission.xp||15);
      App.showToast('¡Misión completada! +'+(mission.xp||15)+' XP','xp');App.sounds.play('mission_complete');
      var profile=window.Store.get('profile');profile.totalMissions=(profile.totalMissions||0)+1;window.Store.set('profile',profile);
      var cal=window.Store.get('calendar');
      if(!cal[dateStr])cal[dateStr]={missions:0,completed:0,xp:0,workouts:0,minutes:0};
      cal[dateStr].completed=(cal[dateStr].completed||0)+1;cal[dateStr].xp=(cal[dateStr].xp||0)+(mission.xp||15);
      window.Store.set('calendar',cal);
    }
    missions[dateStr]=dayMissions;window.Store.set('missions',missions);
    App.updateStreak();App.checkAchievements();
    if(App.currentView==='missions')App.renderMissions();
    else if(App.currentView==='home')App.renderHome();
  };

  App.showAddMissionModal = function() {
    var emojis=['📋','💪','🏃','🧘','📚','🎯','⭐','🏆','🔥','✅','💧','🥗','😴','🧹','📝'];
    var content='<div class="modal-form"><h2>Agregar Misión</h2>'+
      '<div class="form-group"><label>Nombre</label><input type="text" id="mission-name" placeholder="Nombre de la misión"></div>'+
      '<div class="form-group"><label>Descripción</label><textarea id="mission-desc" placeholder="Descripción (opcional)"></textarea></div>'+
      '<div class="form-group"><label>Ícono</label><div class="emoji-selector" id="mission-emoji-sel">'+
      emojis.map(function(e){return '<span class="emoji-option" data-emoji="'+e+'">'+e+'</span>';}).join('')+'</div>'+
      '<input type="hidden" id="mission-emoji" value="📋"></div>'+
      '<div class="form-group"><label>Duración (min)</label><input type="number" id="mission-duration" value="15" min="1" max="180"></div>'+
      '<div class="form-group"><label>XP</label><input type="number" id="mission-xp" value="15" min="5" max="100"></div>'+
      '<div class="form-group"><label>Dificultad</label><select id="mission-difficulty"><option value="Fácil">Fácil</option><option value="Medio" selected>Medio</option><option value="Difícil">Difícil</option></select></div>'+
      '<div class="form-group"><label>Tipo</label><select id="mission-type"><option value="general">General</option><option value="workout">Entrenamiento</option><option value="habit">Hábito</option><option value="routine">Rutina</option></select></div>'+
      '<div class="form-actions"><button class="btn btn-secondary" onclick="App.hideModal()">Cancelar</button><button class="btn btn-primary" id="save-mission-btn">Guardar</button></div></div>';
    App.showModal(content);
    document.querySelectorAll('#mission-emoji-sel .emoji-option').forEach(function(opt){
      opt.addEventListener('click',function(){document.querySelectorAll('#mission-emoji-sel .emoji-option').forEach(function(e){e.classList.remove('selected');});this.classList.add('selected');document.getElementById('mission-emoji').value=this.dataset.emoji;});
    });
    document.getElementById('save-mission-btn').addEventListener('click',function(){
      var name=document.getElementById('mission-name').value.trim();
      if(!name){App.showToast('Ingresa un nombre','error');return;}
      App.addMission({name:name,desc:document.getElementById('mission-desc').value.trim(),icon:document.getElementById('mission-emoji').value,duration:parseInt(document.getElementById('mission-duration').value)||15,xp:parseInt(document.getElementById('mission-xp').value)||15,difficulty:document.getElementById('mission-difficulty').value,type:document.getElementById('mission-type').value});
      App.hideModal();App.showToast('Misión agregada','success');
    });
  };

  App.addMission = function(data) {
    var missions=window.Store.get('missions');
    var dateStr=App.utils.dateString(App.selectedDate);
    if(!missions[dateStr]) missions[dateStr]=[];
    missions[dateStr].push({id:App.utils.generateId(),name:data.name,desc:data.desc||'',icon:data.icon||'📋',duration:data.duration||15,scheduledTime:data.scheduledTime||'',xp:data.xp||15,difficulty:data.difficulty||'Medio',type:data.type||'general',status:'pending'});
    window.Store.set('missions',missions);
    if(App.currentView==='missions')App.renderMissions();
  };

  App.generateDailyMissions = function() {
    var today=App.utils.today();var missions=window.Store?window.Store.get('missions'):{};
    if(missions[today]&&missions[today].length>0) return;
    var routines=(window.Store?window.Store.get('routines'):[])||[];
    var habits=(window.Store?window.Store.get('habits'):[])||[];
    var dayOfWeek=new Date().getDay();
    var dayNames=['dom','lun','mar','mie','jue','vie','sab'];
    var daily=[];
    daily.push({id:App.utils.generateId(),name:'Despertar — Tender la cama, tomar agua',desc:'7:00 AM. Nada de celular.',icon:'🪖',duration:2,xp:15,difficulty:'Fácil',type:'routine',status:'pending'});
    daily.push({id:App.utils.generateId(),name:'Activación — Estiramientos y respiración',desc:'7:10 AM. 10 min estiramientos + 5 min respiración.',icon:'🧘',duration:15,xp:15,difficulty:'Fácil',type:'routine',status:'pending'});
    daily.push({id:App.utils.generateId(),name:'Cardio — Caminar o trotar',desc:'7:25 AM. 15 minutos sin parar.',icon:'🏃',duration:15,xp:20,difficulty:'Medio',type:'workout',status:'pending'});
    var training=window.Store.getTrainingForDay(dayOfWeek);
    var trainingMin=Math.round(training.exercises.reduce(function(s,e){return s+e.duration;},0)/60);
    daily.push({id:App.utils.generateId(),name:training.name,desc:training.exercises.length+' ejercicios — '+trainingMin+' min',icon:'💪',duration:trainingMin,xp:30,difficulty:'Difícil',type:'workout',status:'pending'});
    daily.push({id:App.utils.generateId(),name:'Ducha',desc:'8:30 AM. Agua fría si es posible.',icon:'🚿',duration:10,xp:10,difficulty:'Fácil',type:'routine',status:'pending'});
    daily.push({id:App.utils.generateId(),name:'Desayuno saludable',desc:'8:45 AM. Proteína, frutas, agua.',icon:'🥗',duration:10,xp:10,difficulty:'Fácil',type:'routine',status:'pending'});
    habits.forEach(function(h){
      if(h.days&&h.days.length>0&&h.days.indexOf(dayNames[dayOfWeek])>-1){
        daily.push({id:App.utils.generateId(),name:h.name,desc:h.goal||'',icon:h.icon||'✅',duration:5,xp:h.xp||10,difficulty:'Fácil',type:'habit',status:'pending'});
      }
    });
    daily.push({id:App.utils.generateId(),name:'Segunda sesión — Estudiar / Leer',desc:'7:00–7:45 PM. Aprender algo nuevo.',icon:'📚',duration:45,xp:20,difficulty:'Medio',type:'routine',status:'pending'});
    daily.push({id:App.utils.generateId(),name:'Finanzas — Registrar gastos',desc:'8:30–9:00 PM. Ahorrar, revisar inversiones.',icon:'💰',duration:30,xp:15,difficulty:'Fácil',type:'routine',status:'pending'});
    daily.push({id:App.utils.generateId(),name:'Organización — Limpiar y preparar',desc:'9:00–9:30 PM. Habitación, escritorio, ropa, agenda.',icon:'🧹',duration:30,xp:15,difficulty:'Fácil',type:'routine',status:'pending'});
    daily.push({id:App.utils.generateId(),name:'Relajación — Sin pantallas',desc:'10:00–10:20 PM. Música, leer, estiramientos.',icon:'🌙',duration:20,xp:10,difficulty:'Fácil',type:'routine',status:'pending'});
    daily.push({id:App.utils.generateId(),name:'Prepararse para dormir',desc:'10:20–10:30 PM. Cepillarse, alarma, luces bajas.',icon:'😴',duration:10,xp:10,difficulty:'Fácil',type:'routine',status:'pending'});
    missions[today]=daily;
    if(window.Store) window.Store.set('missions',missions);
  };

  App.renderHabits = function() {
    var habits=(window.Store?window.Store.get('habits'):[])||[];
    var today=App.utils.today();
    var c=document.getElementById('view-habits');
    if(!c) return;
    c.innerHTML='<div class="habits-view"><h1 class="view-title">Hábitos</h1><div class="habits-list">'+
      (habits.length===0?'<p class="no-habits">No hay hábitos. ¡Crea uno!</p>':
      habits.map(function(h){
        var done=h.completedDates&&h.completedDates.indexOf(today)>-1;
        var streak=App.calculateHabitStreak(h);
        return '<div class="habit-item '+(done?'completed':'')+'"><div class="habit-icon">'+(h.icon||'✅')+'</div><div class="habit-info"><h3 class="habit-name">'+h.name+'</h3><div class="habit-meta"><span class="habit-streak">🔥 '+streak+' días</span>'+(h.goal?'<span class="habit-goal">'+h.goal+'</span>':'')+'<span class="habit-xp">+'+(h.xp||10)+' XP</span></div></div><button class="habit-toggle" data-id="'+h.id+'">'+(done?'✅':'⬜')+'</button></div>';
      }).join(''))+'</div><button class="btn btn-secondary btn-block" id="add-habit-btn">+ Agregar Hábito</button></div>';

    c.querySelectorAll('.habit-toggle').forEach(function(btn){btn.addEventListener('click',function(){App.toggleHabit(this.dataset.id);});});
    document.getElementById('add-habit-btn').addEventListener('click',function(){App.showAddHabitModal();});
  };

  App.toggleHabit = function(hid) {
    var habits=(window.Store?window.Store.get('habits'):[])||[];
    var habit=habits.find(function(h){return h.id===hid;});
    var today=App.utils.today();
    if(!habit) return;
    if(!habit.completedDates)habit.completedDates=[];
    var idx=habit.completedDates.indexOf(today);
    if(idx>-1){habit.completedDates.splice(idx,1);App.showToast('Hábito desmarcado','info');}
    else{habit.completedDates.push(today);App.addXP(habit.xp||10);App.showToast('¡Hábito completado! +'+(habit.xp||10)+' XP','xp');App.sounds.play('mission_complete');}
    window.Store.set('habits',habits);App.updateStreak();App.checkAchievements();
    if(App.currentView==='habits')App.renderHabits();
  };

  App.calculateHabitStreak = function(habit) {
    if(!habit.completedDates||!habit.completedDates.length) return 0;
    var sorted=habit.completedDates.slice().sort().reverse();
    var streak=0,cur=new Date();
    for(var i=0;i<365;i++){
      var ds=App.utils.dateString(cur);
      if(sorted.indexOf(ds)>-1){streak++;cur.setDate(cur.getDate()-1);}
      else if(i===0){cur.setDate(cur.getDate()-1);}
      else break;
    }
    return streak;
  };

  App.showAddHabitModal = function() {
    var emojis=['✅','💪','📚','💧','🥗','🏃','🧘','😴','🧹','📝','🎯','⭐'];
    var content='<div class="modal-form"><h2>Agregar Hábito</h2>'+
      '<div class="form-group"><label>Nombre</label><input type="text" id="habit-name" placeholder="Nombre del hábito"></div>'+
      '<div class="form-group"><label>Ícono</label><div class="emoji-selector" id="habit-emoji-sel">'+
      emojis.map(function(e){return '<span class="emoji-option" data-emoji="'+e+'">'+e+'</span>';}).join('')+'</div>'+
      '<input type="hidden" id="habit-emoji" value="✅"></div>'+
      '<div class="form-group"><label>Hora</label><input type="time" id="habit-time" value="08:00"></div>'+
      '<div class="form-group"><label>Días</label><div class="days-selector" id="habit-days">'+
      '<button class="day-btn" data-day="lun">L</button><button class="day-btn" data-day="mar">M</button><button class="day-btn" data-day="mie">Mi</button><button class="day-btn" data-day="jue">J</button><button class="day-btn" data-day="vie">V</button><button class="day-btn" data-day="sab">S</button><button class="day-btn" data-day="dom">D</button></div></div>'+
      '<div class="form-group"><label>Meta</label><input type="text" id="habit-goal" placeholder="Ej: Beber 2 litros de agua"></div>'+
      '<div class="form-group"><label>XP</label><input type="number" id="habit-xp" value="10" min="5" max="50"></div>'+
      '<div class="form-group"><label class="toggle-label"><input type="checkbox" id="habit-reminder"><span>Recordatorio</span></label></div>'+
      '<div class="form-actions"><button class="btn btn-secondary" onclick="App.hideModal()">Cancelar</button><button class="btn btn-primary" id="save-habit-btn">Guardar</button></div></div>';
    App.showModal(content);
    var selDays=[];
    document.querySelectorAll('#habit-emoji-sel .emoji-option').forEach(function(opt){opt.addEventListener('click',function(){document.querySelectorAll('#habit-emoji-sel .emoji-option').forEach(function(e){e.classList.remove('selected');});this.classList.add('selected');document.getElementById('habit-emoji').value=this.dataset.emoji;});});
    document.querySelectorAll('#habit-days .day-btn').forEach(function(btn){btn.addEventListener('click',function(){this.classList.toggle('active');var d=this.dataset.day;var i=selDays.indexOf(d);if(i>-1)selDays.splice(i,1);else selDays.push(d);});});
    document.getElementById('save-habit-btn').addEventListener('click',function(){
      var name=document.getElementById('habit-name').value.trim();
      if(!name){App.showToast('Ingresa un nombre','error');return;}
      var habits=(window.Store?window.Store.get('habits'):[])||[];
      habits.push({id:App.utils.generateId(),name:name,icon:document.getElementById('habit-emoji').value,time:document.getElementById('habit-time').value,days:selDays,reminder:document.getElementById('habit-reminder').checked,goal:document.getElementById('habit-goal').value.trim(),xp:parseInt(document.getElementById('habit-xp').value)||10,completedDates:[]});
      window.Store.set('habits',habits);App.hideModal();App.showToast('Hábito agregado','success');App.renderHabits();
    });
  };

  App.renderProgress = function() {
    var profile=window.Store?window.Store.get('profile'):{};
    var cal=window.Store?window.Store.get('calendar'):{};
    var level=App.calculateLevel(profile.totalXP||0);
    var c=document.getElementById('view-progress');
    if(!c) return;
    c.innerHTML='<div class="progress-view"><h1 class="view-title">Progreso</h1>'+
      '<div class="stats-overview"><div class="stat-card-large"><div class="stat-card-icon">⭐</div><div class="stat-card-value">'+(profile.totalXP||0)+'</div><div class="stat-card-label">XP Total</div></div>'+
      '<div class="stat-card-large"><div class="stat-card-icon">📊</div><div class="stat-card-value">Nivel '+level+'</div><div class="stat-card-label">'+App.utils.getLevelTitle(level)+'</div></div>'+
      '<div class="stat-card-large"><div class="stat-card-icon">🔥</div><div class="stat-card-value">'+(profile.currentStreak||0)+'</div><div class="stat-card-label">Racha Actual</div></div>'+
      '<div class="stat-card-large"><div class="stat-card-icon">🏆</div><div class="stat-card-value">'+(profile.bestStreak||0)+'</div><div class="stat-card-label">Mejor Racha</div></div>'+
      '<div class="stat-card-large"><div class="stat-card-icon">📋</div><div class="stat-card-value">'+(profile.totalMissions||0)+'</div><div class="stat-card-label">Misiones</div></div>'+
      '<div class="stat-card-large"><div class="stat-card-icon">💪</div><div class="stat-card-value">'+(profile.totalWorkouts||0)+'</div><div class="stat-card-label">Entrenamientos</div></div>'+
      '<div class="stat-card-large"><div class="stat-card-icon">⏱️</div><div class="stat-card-value">'+App.utils.formatMinutes(profile.totalMinutes||0)+'</div><div class="stat-card-label">Tiempo Total</div></div>'+
      '<div class="stat-card-large"><div class="stat-card-icon">📅</div><div class="stat-card-value">'+(profile.activeDays?profile.activeDays.length:0)+'</div><div class="stat-card-label">Días Activos</div></div></div>'+
      '<div class="chart-section"><h2>XP Semanal</h2><div class="bar-chart">'+App.renderWeeklyChart(cal,'xp')+'</div></div>'+
      '<div class="chart-section"><h2>Misiones Semanales</h2><div class="bar-chart">'+App.renderWeeklyChart(cal,'completed')+'</div></div>'+
      '<div class="chart-section"><h2>Resumen Mensual</h2><div class="monthly-overview">'+App.renderMonthlyOverview(cal)+'</div></div></div>';
  };

  App.renderWeeklyChart = function(cal,metric) {
    var labels=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var vals=[],names=[];
    for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var ds=App.utils.dateString(d);var dd=cal[ds]||{};names.push(labels[d.getDay()]);vals.push(dd[metric]||0);}
    var mx=Math.max.apply(null,vals)||1;
    return names.map(function(n,i){
      var h=(vals[i]/mx)*100;
      return '<div class="bar-container"><div class="bar" style="height:'+h+'%"><div class="bar-value">'+vals[i]+'</div></div><div class="bar-label">'+n+'</div></div>';
    }).join('');
  };

  App.renderMonthlyOverview = function(cal) {
    var now=new Date(),y=now.getFullYear(),m=now.getMonth();
    var dim=App.utils.getDaysInMonth(y,m),txp=0,tc=0,ad=0;
    for(var d=1;d<=dim;d++){
      var ds=y+'-'+(m+1).toString().padStart(2,'0')+'-'+d.toString().padStart(2,'0');
      var dd=cal[ds];if(dd){txp+=dd.xp||0;tc+=dd.completed||0;if((dd.completed||0)>0||(dd.workouts||0)>0)ad++;}
    }
    return '<div class="monthly-stats"><div class="monthly-stat"><div class="monthly-stat-value">'+txp+'</div><div class="monthly-stat-label">XP este mes</div></div><div class="monthly-stat"><div class="monthly-stat-value">'+tc+'</div><div class="monthly-stat-label">Misiones completadas</div></div><div class="monthly-stat"><div class="monthly-stat-value">'+ad+'/'+dim+'</div><div class="monthly-stat-label">Días activos</div></div></div>';
  };

  App.renderCalendar = function() {
    var cal=window.Store?window.Store.get('calendar'):{};
    var today=App.utils.today();
    var dim=App.utils.getDaysInMonth(App.calendarYear,App.calendarMonth);
    var fd=App.utils.getFirstDayOfMonth(App.calendarYear,App.calendarMonth);
    var monthNames=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var grid='';
    for(var i=0;i<fd;i++) grid+='<div class="calendar-day empty"></div>';
    for(var d=1;d<=dim;d++){
      var ds=App.calendarYear+'-'+(App.calendarMonth+1).toString().padStart(2,'0')+'-'+d.toString().padStart(2,'0');
      var dd=cal[ds]||{};var isToday=ds===today;var isActive=(dd.completed||0)>0||(dd.workouts||0)>0;var xp=dd.xp||0;
      grid+='<div class="calendar-day '+(isToday?'today':'')+' '+(isActive?'active':'')+'" data-date="'+ds+'"><div class="day-number">'+d+'</div>'+(xp>0?'<div class="day-xp">+'+xp+'</div>':'')+(isActive?'<div class="day-indicator"></div>':'')+'</div>';
    }
    var c=document.getElementById('view-calendar');
    if(!c) return;
    c.innerHTML='<div class="calendar-view"><h1 class="view-title">Calendario</h1>'+
      '<div class="calendar-header"><button class="btn btn-nav" id="prev-month">◀</button><h2 class="calendar-month">'+monthNames[App.calendarMonth]+' '+App.calendarYear+'</h2><button class="btn btn-nav" id="next-month">▶</button></div>'+
      '<div class="calendar-grid"><div class="calendar-day-header">Dom</div><div class="calendar-day-header">Lun</div><div class="calendar-day-header">Mar</div><div class="calendar-day-header">Mié</div><div class="calendar-day-header">Jue</div><div class="calendar-day-header">Vie</div><div class="calendar-day-header">Sáb</div>'+grid+'</div></div>';

    document.getElementById('prev-month').addEventListener('click',function(){App.calendarMonth--;if(App.calendarMonth<0){App.calendarMonth=11;App.calendarYear--;}App.renderCalendar();});
    document.getElementById('next-month').addEventListener('click',function(){App.calendarMonth++;if(App.calendarMonth>11){App.calendarMonth=0;App.calendarYear++;}App.renderCalendar();});
    c.querySelectorAll('.calendar-day:not(.empty)').forEach(function(el){el.addEventListener('click',function(){App.showDayDetails(this.dataset.date);});});
  };

  App.showDayDetails = function(dateStr) {
    var cal=window.Store?window.Store.get('calendar'):{};
    var missions=window.Store?window.Store.get('missions'):{};
    var dd=cal[dateStr]||{};var dm=missions[dateStr]||[];
    var content='<div class="day-details-modal"><h2>'+dateStr+'</h2>'+
      '<div class="day-details-stats"><div class="day-stat"><div class="day-stat-value">'+(dd.completed||0)+'</div><div class="day-stat-label">Misiones</div></div><div class="day-stat"><div class="day-stat-value">'+(dd.xp||0)+'</div><div class="day-stat-label">XP</div></div><div class="day-stat"><div class="day-stat-value">'+(dd.workouts||0)+'</div><div class="day-stat-label">Entrenamientos</div></div><div class="day-stat"><div class="day-stat-value">'+App.utils.formatMinutes(dd.minutes||0)+'</div><div class="day-stat-label">Tiempo</div></div></div>'+
      (dm.length>0?'<div class="day-missions-list"><h3>Misiones</h3>'+dm.map(function(m){return '<div class="day-mission-item '+m.status+'"><span class="day-mission-icon">'+(m.icon||'📋')+'</span><span class="day-mission-name">'+m.name+'</span><span class="day-mission-status">'+(m.status==='completed'?'✅':'⬜')+'</span></div>';}).join('')+'</div>':'<p class="no-data">Sin datos para este día</p>')+
      '<div class="form-actions"><button class="btn btn-primary" onclick="App.hideModal()">Cerrar</button></div></div>';
    App.showModal(content);
  };

  App.renderAchievements = function() {
    var achievements=(window.Store?window.Store.get('achievements'):[])||[];
    var c=document.getElementById('view-achievements');
    if(!c) return;
    c.innerHTML='<div class="achievements-view"><h1 class="view-title">Logros</h1><div class="achievements-grid">'+
      achievements.map(function(a){
        var pct=a.target>0?Math.min(100,(a.progress/a.target)*100):0;
        return '<div class="achievement-card '+(a.unlocked?'unlocked':'locked')+'"><div class="achievement-icon">'+a.icon+'</div><h3 class="achievement-name">'+a.name+'</h3><p class="achievement-desc">'+a.desc+'</p><div class="achievement-progress-container"><div class="achievement-progress-bar"><div class="achievement-progress-fill" style="width:'+pct+'%"></div></div><span class="achievement-progress-text">'+a.progress+' / '+a.target+'</span></div>'+(a.unlocked?'<div class="achievement-unlocked-badge">✅ Desbloqueado</div>':'')+'</div>';
      }).join('')+'</div></div>';
  };

  App.initAchievements = function() {
    var achievements=window.Store?window.Store.get('achievements'):null;
    if(!achievements||!achievements.length){
      window.Store.set('achievements',DEFAULT_ACHIEVEMENTS.map(function(a){return{id:a.id,name:a.name,desc:a.desc,icon:a.icon,unlocked:false,unlockedAt:null,progress:0,target:a.target,type:a.type};}));
    }
  };

  App.checkAchievements = function() {
    var profile=window.Store?window.Store.get('profile'):{};
    var achievements=(window.Store?window.Store.get('achievements'):[])||[];
    var habits=(window.Store?window.Store.get('habits'):[])||[];
    var today=App.utils.today();
    var newUnlocks=false;
    achievements.forEach(function(a){
      if(a.unlocked) return;
      var cv=0;
      switch(a.type){
        case 'workouts':cv=profile.totalWorkouts||0;break;
        case 'missions':cv=profile.totalMissions||0;break;
        case 'xp':cv=profile.totalXP||0;break;
        case 'level':cv=App.calculateLevel(profile.totalXP||0);break;
        case 'streak':cv=profile.currentStreak||0;break;
        case 'minutes':cv=profile.totalMinutes||0;break;
        case 'activeDays':cv=profile.activeDays?profile.activeDays.length:0;break;
        case 'morning':if(App.checkDayHasRoutineType(today,'matutina'))cv=1;break;
        case 'night':if(App.checkDayHasRoutineType(today,'nocturna'))cv=1;break;
        case 'allMissions':var ms=(window.Store?window.Store.get('missions'):{})[today]||[];if(ms.length>0&&ms.every(function(m){return m.status==='completed';}))cv=1;break;
        case 'allHabits':if(habits.length>0&&habits.every(function(h){return h.completedDates&&h.completedDates.indexOf(today)>-1;}))cv=1;break;
      }
      a.progress=cv;
      if(cv>=a.target&&!a.unlocked){a.unlocked=true;a.unlockedAt=new Date().toISOString();newUnlocks=true;App.showToast('🏆 ¡Logro: '+a.name+'!','success');}
    });
    window.Store.set('achievements',achievements);
    if(newUnlocks&&App.currentView==='achievements')App.renderAchievements();
  };

  App.checkDayHasRoutineType = function(dateStr,type) {
    var missions=(window.Store?window.Store.get('missions'):{})[dateStr]||[];
    return missions.some(function(m){return m.type==='routine'&&m.name.toLowerCase().indexOf(type)>-1&&m.status==='completed';});
  };

  App.renderProfile = function() {
    var profile=window.Store?window.Store.get('profile'):{};
    var level=App.calculateLevel(profile.totalXP||0);
    var achievements=(window.Store?window.Store.get('achievements'):[])||[];
    var recent=achievements.filter(function(a){return a.unlocked;}).slice(-5).reverse();
    var c=document.getElementById('view-profile');
    if(!c) return;
    c.innerHTML='<div class="profile-view"><div class="profile-header"><div class="profile-avatar-container"><div class="profile-avatar">'+(profile.avatar||'🏃')+'</div></div><h1 class="profile-name">'+(profile.name||'Atleta')+'</h1><p class="profile-title">'+App.utils.getLevelTitle(level)+'</p></div>'+
      '<div class="profile-stats"><div class="profile-stat"><div class="profile-stat-value">'+(profile.totalXP||0)+'</div><div class="profile-stat-label">XP Total</div></div><div class="profile-stat"><div class="profile-stat-value">'+(profile.currentStreak||0)+'</div><div class="profile-stat-label">Racha</div></div><div class="profile-stat"><div class="profile-stat-value">'+(profile.totalMissions||0)+'</div><div class="profile-stat-label">Misiones</div></div><div class="profile-stat"><div class="profile-stat-value">'+(profile.totalWorkouts||0)+'</div><div class="profile-stat-label">Entrenamientos</div></div><div class="profile-stat"><div class="profile-stat-value">'+App.utils.formatMinutes(profile.totalMinutes||0)+'</div><div class="profile-stat-label">Tiempo</div></div><div class="profile-stat"><div class="profile-stat-value">'+(profile.activeDays?profile.activeDays.length:0)+'</div><div class="profile-stat-label">Días</div></div></div>'+
      '<div class="profile-section"><h2>Logros Recientes</h2>'+(recent.length===0?'<p class="no-data">Sin logros aún</p>':'<div class="recent-achievements">'+recent.map(function(a){return '<div class="recent-achievement"><span class="recent-achievement-icon">'+a.icon+'</span><span class="recent-achievement-name">'+a.name+'</span></div>';}).join('')+'</div>')+'</div>'+
      '<button class="btn btn-secondary btn-block" id="edit-profile-btn">Editar Perfil</button></div>';
    document.getElementById('edit-profile-btn').addEventListener('click',function(){App.showEditProfileModal();});
  };

  App.showEditProfileModal = function() {
    var profile=window.Store?window.Store.get('profile'):{};
    var avatars=['🏃','💪','🧘','🎯','⭐','🔥','🏆','👑','🦁','🐺'];
    var content='<div class="modal-form"><h2>Editar Perfil</h2>'+
      '<div class="form-group"><label>Nombre</label><input type="text" id="profile-name" value="'+(profile.name||'')+'" placeholder="Tu nombre"></div>'+
      '<div class="form-group"><label>Avatar</label><div class="emoji-selector" id="profile-emoji-sel">'+
      avatars.map(function(e){return '<span class="emoji-option '+(profile.avatar===e?'selected':'')+'" data-emoji="'+e+'">'+e+'</span>';}).join('')+'</div>'+
      '<input type="hidden" id="profile-avatar" value="'+(profile.avatar||'🏃')+'"></div>'+
      '<div class="form-actions"><button class="btn btn-secondary" onclick="App.hideModal()">Cancelar</button><button class="btn btn-primary" id="save-profile-btn">Guardar</button></div></div>';
    App.showModal(content);
    document.querySelectorAll('#profile-emoji-sel .emoji-option').forEach(function(opt){opt.addEventListener('click',function(){document.querySelectorAll('#profile-emoji-sel .emoji-option').forEach(function(e){e.classList.remove('selected');});this.classList.add('selected');document.getElementById('profile-avatar').value=this.dataset.emoji;});});
    document.getElementById('save-profile-btn').addEventListener('click',function(){
      var name=document.getElementById('profile-name').value.trim();
      if(!name){App.showToast('Ingresa un nombre','error');return;}
      profile.name=name;profile.avatar=document.getElementById('profile-avatar').value;
      window.Store.set('profile',profile);App.hideModal();App.showToast('Perfil actualizado','success');App.renderProfile();
    });
  };

  App.renderSettings = function() {
    var profile=window.Store?window.Store.get('profile'):{};
    var settings=window.Store?window.Store.get('settings'):{};
    var c=document.getElementById('view-settings');
    if(!c) return;
    c.innerHTML='<div class="settings-view"><h1 class="view-title">Configuración</h1>'+
      '<div class="settings-section"><h2>Perfil</h2><div class="settings-item"><label>Nombre</label><input type="text" id="settings-name" value="'+(profile.name||'')+'"></div><div class="settings-item"><label>Avatar</label><span class="settings-avatar">'+(profile.avatar||'🏃')+'</span><button class="btn btn-small" id="change-avatar-btn">Cambiar</button></div></div>'+
      '<div class="settings-section"><h2>Apariencia</h2><div class="settings-item"><label>Tema</label><div class="theme-toggle"><button class="theme-btn '+(settings.theme==='light'?'active':'')+'" data-theme="light">☀️ Claro</button><button class="theme-btn '+(settings.theme==='dark'?'active':'')+'" data-theme="dark">🌙 Oscuro</button><button class="theme-btn '+(settings.theme==='auto'?'active':'')+'" data-theme="auto">🔄 Auto</button></div></div></div>'+
      '<div class="settings-section"><h2>Sonidos y Notificaciones</h2><div class="settings-item"><label>Sonidos</label><label class="toggle-switch"><input type="checkbox" id="settings-sounds" '+(settings.sounds!==false?'checked':'')+'><span class="toggle-slider"></span></label></div><div class="settings-item"><label>Notificaciones</label><label class="toggle-switch"><input type="checkbox" id="settings-notifications" '+(settings.notifications!==false?'checked':'')+'><span class="toggle-slider"></span></label></div></div>'+
      '<div class="settings-section"><h2>Temporizador</h2><div class="settings-item"><label>Tiempo ejercicio (seg)</label><input type="number" id="settings-exercise-time" value="'+(settings.exerciseTime||30)+'" min="10" max="300"></div><div class="settings-item"><label>Descanso (seg)</label><input type="number" id="settings-rest-time" value="'+(settings.restTime||15)+'" min="5" max="120"></div><div class="settings-item"><label>Rondas</label><input type="number" id="settings-rounds" value="'+(settings.rounds||3)+'" min="1" max="10"></div><div class="settings-item"><label>Descanso entre rondas (seg)</label><input type="number" id="settings-round-rest" value="'+(settings.roundRest||60)+'" min="10" max="300"></div></div>'+
      '<div class="settings-section"><h2>Datos</h2><div class="settings-item data-buttons"><button class="btn btn-secondary" id="export-data-btn">Exportar</button><button class="btn btn-secondary" id="import-data-btn">Importar</button><button class="btn btn-danger" id="reset-data-btn">Borrar Todo</button></div></div>'+
      '<div class="settings-section"><h2>Acerca de</h2><div class="settings-about"><p>DisciplinaPro v1.0.0</p><p>Tu compañero de entrenamiento y disciplina</p></div></div></div>';

    c.querySelectorAll('.theme-btn').forEach(function(btn){btn.addEventListener('click',function(){App.applyTheme(this.dataset.theme);c.querySelectorAll('.theme-btn').forEach(function(b){b.classList.remove('active');});this.classList.add('active');});});
    document.getElementById('settings-sounds').addEventListener('change',function(){settings.sounds=this.checked;window.Store.set('settings',settings);});
    document.getElementById('settings-notifications').addEventListener('change',function(){settings.notifications=this.checked;window.Store.set('settings',settings);});
    document.getElementById('settings-exercise-time').addEventListener('change',function(){settings.exerciseTime=parseInt(this.value)||30;window.Store.set('settings',settings);});
    document.getElementById('settings-rest-time').addEventListener('change',function(){settings.restTime=parseInt(this.value)||15;window.Store.set('settings',settings);});
    document.getElementById('settings-rounds').addEventListener('change',function(){settings.rounds=parseInt(this.value)||3;window.Store.set('settings',settings);});
    document.getElementById('settings-round-rest').addEventListener('change',function(){settings.roundRest=parseInt(this.value)||60;window.Store.set('settings',settings);});
    var cab=document.getElementById('change-avatar-btn');if(cab) cab.addEventListener('click',function(){App.showEditProfileModal();});
    document.getElementById('export-data-btn').addEventListener('click',App.exportData);
    document.getElementById('import-data-btn').addEventListener('click',App.importData);
    document.getElementById('reset-data-btn').addEventListener('click',function(){App.showConfirm('¿Borrar todos los datos? No se puede deshacer.',function(){if(window.Store)window.Store.reset();App.showToast('Datos borrados','success');App.applyTheme('dark');App.navigate('home');});});
  };

  App.applyTheme = function(theme) {
    var settings=window.Store?window.Store.get('settings'):{};
    settings.theme=theme;if(window.Store) window.Store.set('settings',settings);
    if(theme==='auto'){var pd=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',pd?'dark':'light');}
    else document.documentElement.setAttribute('data-theme',theme);
  };

  App.exportData = function() {
    var data={profile:window.Store.get('profile'),settings:window.Store.get('settings'),missions:window.Store.get('missions'),routines:window.Store.get('routines'),habits:window.Store.get('habits'),achievements:window.Store.get('achievements'),favoriteQuotes:window.Store.get('favoriteQuotes'),calendar:window.Store.get('calendar')};
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='disciplina-pro-'+App.utils.today()+'.json';a.click();URL.revokeObjectURL(url);
    App.showToast('Datos exportados','success');
  };

  App.importData = function() {
    var input=document.createElement('input');input.type='file';input.accept='.json';
    input.addEventListener('change',function(e){
      var file=e.target.files[0];if(!file) return;
      var reader=new FileReader();reader.onload=function(ev){
        try{var data=JSON.parse(ev.target.result);
          if(data.profile)window.Store.set('profile',data.profile);if(data.settings)window.Store.set('settings',data.settings);
          if(data.missions)window.Store.set('missions',data.missions);if(data.routines)window.Store.set('routines',data.routines);
          if(data.habits)window.Store.set('habits',data.habits);if(data.achievements)window.Store.set('achievements',data.achievements);
          if(data.favoriteQuotes)window.Store.set('favoriteQuotes',data.favoriteQuotes);if(data.calendar)window.Store.set('calendar',data.calendar);
          App.showToast('Datos importados','success');App.navigate('home');
        }catch(err){App.showToast('Error al importar','error');}
      };reader.readAsText(file);
    });input.click();
  };

  App.renderQuotes = function() {
    var favs=(window.Store?window.Store.get('favoriteQuotes'):[])||[];
    var quote=App.utils.randomQuoteFresh();
    var c=document.getElementById('view-quotes');
    if(!c) return;
    c.innerHTML='<div class="quotes-view"><h1 class="view-title">Frases</h1>'+
      '<div class="quotes-tabs"><button class="quote-tab active" data-tab="random">Aleatoria</button><button class="quote-tab" data-tab="favorites">Favoritas ('+favs.length+')</button></div>'+
      '<div class="quote-display" id="quote-display"><div class="quote-card-large"><div class="quote-text-large">"'+quote.text+'"</div><div class="quote-author-large">- '+quote.author+'</div>'+
      '<div class="quote-actions"><button class="btn btn-icon quote-fav-btn" id="quote-fav-btn">🤍</button><button class="btn btn-icon" id="quote-share-btn">📤</button></div></div>'+
      '<button class="btn btn-primary btn-block" id="next-quote-btn">Siguiente Frase</button></div>'+
      '<div class="quotes-favorites" id="quotes-favorites" style="display:none;">'+(favs.length===0?'<p class="no-data">No hay frases favoritas</p>':'<div class="favorites-list">'+favs.map(function(q,i){return '<div class="favorite-quote-item"><div class="favorite-quote-text">"'+q.text+'"</div><div class="favorite-quote-author">- '+q.author+'</div><button class="btn btn-small btn-danger remove-fav-btn" data-index="'+i+'">Eliminar</button></div>';}).join('')+'</div>')+'</div></div>';

    c.querySelectorAll('.quote-tab').forEach(function(tab){tab.addEventListener('click',function(){c.querySelectorAll('.quote-tab').forEach(function(t){t.classList.remove('active');});this.classList.add('active');var t=this.dataset.tab;document.getElementById('quote-display').style.display=t==='random'?'block':'none';document.getElementById('quotes-favorites').style.display=t==='favorites'?'block':'none';});});

    document.getElementById('next-quote-btn').addEventListener('click',function(){
      var nq=App.utils.randomQuoteFresh();document.querySelector('.quote-text-large').textContent='"'+nq.text+'"';document.querySelector('.quote-author-large').textContent='- '+nq.author;
      var favs2=(window.Store?window.Store.get('favoriteQuotes'):[])||[];
      var isFav=favs2.some(function(q){return q.text===nq.text;});
      document.getElementById('quote-fav-btn').textContent=isFav?'❤️':'🤍';
      App._currentQuote=nq;
    });
    App._currentQuote=quote;

    document.getElementById('quote-fav-btn').addEventListener('click',function(){
      var q=App._currentQuote;if(!q) return;
      var favs2=(window.Store?window.Store.get('favoriteQuotes'):[])||[];
      var exists=favs2.some(function(f){return f.text===q.text;});
      if(!exists){favs2.push({text:q.text,author:q.author});window.Store.set('favoriteQuotes',favs2);this.textContent='❤️';App.showToast('Agregada a favoritas','success');}
      else{App.showToast('Ya está en favoritas','info');}
    });
    document.getElementById('quote-share-btn').addEventListener('click',function(){
      var qt=document.querySelector('.quote-text-large').textContent;var qa=document.querySelector('.quote-author-large').textContent;
      if(navigator.share){navigator.share({text:qt+' '+qa});}else{navigator.clipboard.writeText(qt+' '+qa);App.showToast('Copiado','success');}
    });
    c.querySelectorAll('.remove-fav-btn').forEach(function(btn){btn.addEventListener('click',function(){var idx=parseInt(this.dataset.index);var favs2=(window.Store?window.Store.get('favoriteQuotes'):[])||[];favs2.splice(idx,1);window.Store.set('favoriteQuotes',favs2);App.showToast('Eliminada','info');App.renderQuotes();});});
  };

  App.renderRoutineEditor = function(routineId) {
    var routine=null;
    if(routineId){var routines=(window.Store?window.Store.get('routines'):[])||[];routine=routines.find(function(r){return r.id===routineId;});}
    var isNew=!routine;
    var exercises=routine?routine.exercises.slice():[];
    var days=routine?routine.days.slice():[];
    var categories=['General','Fuerza','Resistencia','Movilidad','Velocidad','Calentamiento','Enfriamiento','Mañana','Noche'];
    var c=document.getElementById('view-routine-editor');
    if(!c) return;
    c.innerHTML='<div class="routine-editor-view"><div class="routine-editor-header"><button class="btn btn-back" id="back-from-routine">← Volver</button><h1>'+(isNew?'Nueva Rutina':'Editar Rutina')+'</h1></div>'+
      '<div class="routine-form"><div class="form-group"><label>Nombre</label><input type="text" id="routine-name" value="'+(routine?routine.name:'')+'" placeholder="Nombre de la rutina"></div>'+
      '<div class="form-group"><label>Categoría</label><select id="routine-category">'+categories.map(function(cat){return '<option value="'+cat+'"'+(routine&&routine.category===cat?' selected':'')+'>'+cat+'</option>';}).join('')+'</select></div>'+
      '<div class="form-group"><label>Días</label><div class="days-selector" id="routine-days">'+['lun','mar','mie','jue','vie','sab','dom'].map(function(d,n){return '<button class="day-btn '+(days.indexOf(d)>-1?'active':'')+'" data-day="'+d+'">'+['L','M','Mi','J','V','S','D'][n]+'</button>';}).join('')+'</div></div>'+
      '<div class="form-group"><label>Hora</label><input type="time" id="routine-time" value="'+(routine?routine.time:'')+'"></div>'+
      '<div class="form-group"><label class="toggle-label"><input type="checkbox" id="routine-active" '+(!routine||routine.active?'checked':'')+'><span>Activa</span></label></div>'+
      '<div class="form-group"><label class="toggle-label"><input type="checkbox" id="routine-reminder" '+(routine&&routine.reminder?'checked':'')+'><span>Recordatorio</span></label></div></div>'+
      '<div class="exercises-section"><h2>Ejercicios</h2><div class="exercises-list" id="routine-exercises">'+exercises.map(function(ex,i){return App.renderExerciseForm(ex,i);}).join('')+'</div><button class="btn btn-secondary btn-block" id="add-exercise-btn">+ Agregar Ejercicio</button></div>'+
      '<div class="routine-actions">'+(!isNew?'<button class="btn btn-danger" id="delete-routine-btn">Eliminar</button>':'')+'<button class="btn btn-primary btn-block" id="save-routine-btn">Guardar Rutina</button></div></div>';

    document.getElementById('back-from-routine').addEventListener('click',function(){App.navigate('train');});
    c.querySelectorAll('#routine-days .day-btn').forEach(function(btn){btn.addEventListener('click',function(){this.classList.toggle('active');});});
    document.getElementById('add-exercise-btn').addEventListener('click',function(){
      var list=document.getElementById('routine-exercises');var idx=list.children.length;
      var div=document.createElement('div');div.innerHTML=App.renderExerciseForm({id:App.utils.generateId(),name:'',duration:30,sets:1,reps:1,rest:15,description:''},idx);
      list.appendChild(div.firstElementChild);
    });
    document.getElementById('save-routine-btn').addEventListener('click',function(){
      var name=document.getElementById('routine-name').value.trim();
      if(!name){App.showToast('Ingresa un nombre','error');return;}
      var selDays=[];c.querySelectorAll('#routine-days .day-btn.active').forEach(function(b){selDays.push(b.dataset.day);});
      var exEls=c.querySelectorAll('.exercise-form-item');var exData=[];
      exEls.forEach(function(el){
        var en=el.querySelector('.exercise-name-input').value.trim();
        if(en) exData.push({id:el.dataset.id||App.utils.generateId(),name:en,duration:parseInt(el.querySelector('.exercise-duration-input').value)||30,sets:parseInt(el.querySelector('.exercise-sets-input').value)||1,reps:parseInt(el.querySelector('.exercise-reps-input').value)||1,rest:parseInt(el.querySelector('.exercise-rest-input').value)||15,description:el.querySelector('.exercise-desc-input').value.trim()});
      });
      var routines=(window.Store?window.Store.get('routines'):[])||[];
      if(routine){routine.name=name;routine.category=document.getElementById('routine-category').value;routine.days=selDays;routine.time=document.getElementById('routine-time').value;routine.active=document.getElementById('routine-active').checked;routine.reminder=document.getElementById('routine-reminder').checked;routine.exercises=exData;}
      else routines.push({id:App.utils.generateId(),name:name,category:document.getElementById('routine-category').value,exercises:exData,days:selDays,time:document.getElementById('routine-time').value,active:document.getElementById('routine-active').checked,reminder:document.getElementById('routine-reminder').checked});
      window.Store.set('routines',routines);App.showToast('Rutina guardada','success');App.navigate('train');
    });
    var db=document.getElementById('delete-routine-btn');
    if(db) db.addEventListener('click',function(){App.showConfirm('¿Eliminar esta rutina?',function(){var routines=(window.Store?window.Store.get('routines'):[])||[];var idx=routines.findIndex(function(r){return r.id===routineId;});if(idx>-1){routines.splice(idx,1);window.Store.set('routines',routines);}App.showToast('Rutina eliminada','success');App.navigate('train');});});
  };

  App.renderExerciseForm = function(ex,idx) {
    return '<div class="exercise-form-item" data-id="'+(ex.id||'')+'"><div class="exercise-form-header"><span class="exercise-form-number">'+(idx+1)+'</span><button class="btn btn-small btn-danger remove-exercise-btn" onclick="this.closest(\'.exercise-form-item\').remove()">✕</button></div>'+
      '<div class="form-group"><label>Nombre</label><input type="text" class="exercise-name-input" value="'+(ex.name||'')+'" placeholder="Nombre del ejercicio"></div>'+
      '<div class="form-row"><div class="form-group"><label>Tiempo (seg)</label><input type="number" class="exercise-duration-input" value="'+(ex.duration||30)+'" min="5" max="600"></div><div class="form-group"><label>Series</label><input type="number" class="exercise-sets-input" value="'+(ex.sets||1)+'" min="1" max="20"></div><div class="form-group"><label>Reps</label><input type="number" class="exercise-reps-input" value="'+(ex.reps||1)+'" min="1" max="100"></div><div class="form-group"><label>Descanso (seg)</label><input type="number" class="exercise-rest-input" value="'+(ex.rest||15)+'" min="0" max="300"></div></div>'+
      '<div class="form-group"><label>Descripción</label><input type="text" class="exercise-desc-input" value="'+(ex.description||'')+'" placeholder="Descripción"></div></div>';
  };

  App.addXP = function(amount) {
    var profile=window.Store?window.Store.get('profile'):{};
    var oldLevel=App.calculateLevel(profile.totalXP||0);
    profile.totalXP=(profile.totalXP||0)+amount;profile.xp=(profile.xp||0)+amount;
    window.Store.set('profile',profile);
    var newLevel=App.calculateLevel(profile.totalXP||0);
    if(newLevel>oldLevel){profile.level=newLevel;window.Store.set('profile',profile);App.showLevelUpOverlay(newLevel);App.sounds.play('level_up');}
  };

  App.calculateLevel = function(xp) { return Math.floor(Math.sqrt((xp||0)/50))||1; };
  App.xpForLevel = function(level) { return Math.floor(level*level*50); };

  App.showLevelUpOverlay = function(level) {
    var overlay=document.createElement('div');overlay.className='level-up-overlay';
    overlay.innerHTML='<div class="level-up-content"><div class="level-up-icon">🎉</div><h1>¡NIVEL '+level+'!</h1><p class="level-up-title">'+App.utils.getLevelTitle(level)+'</p><p class="level-up-message">¡Cada vez más cerca de tu mejor versión!</p><button class="btn btn-primary" id="level-up-close">¡GRACIAS!</button></div>';
    document.body.appendChild(overlay);
    document.getElementById('level-up-close').addEventListener('click',function(){overlay.classList.add('fade-out');setTimeout(function(){overlay.remove();},500);});
    setTimeout(function(){if(overlay.parentNode){overlay.classList.add('fade-out');setTimeout(function(){overlay.remove();},500);}},5000);
  };

  App.updateStreak = function() {
    var profile=window.Store?window.Store.get('profile'):{};
    var today=App.utils.today();
    if(!profile.activeDays)profile.activeDays=[];
    if(profile.activeDays.indexOf(today)===-1){
      if(App.checkDayActive(today)){
        profile.activeDays.push(today);
        var yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);var ys=App.utils.dateString(yesterday);
        if(profile.activeDays.indexOf(ys)>-1)profile.currentStreak=(profile.currentStreak||0)+1;
        else profile.currentStreak=1;
        if(profile.currentStreak>(profile.bestStreak||0))profile.bestStreak=profile.currentStreak;
        window.Store.set('profile',profile);App.checkAchievements();
      }
    }
  };

  App.checkDayActive = function(dateStr) {
    var missions=window.Store?window.Store.get('missions'):{};
    var habits=(window.Store?window.Store.get('habits'):[])||[];
    var cal=window.Store?window.Store.get('calendar'):{};
    var dm=missions[dateStr]||[];
    if(dm.some(function(m){return m.status==='completed';}))return true;
    if(habits.some(function(h){return h.completedDates&&h.completedDates.indexOf(dateStr)>-1;}))return true;
    var dd=cal[dateStr];if(dd&&((dd.workouts||0)>0))return true;
    return false;
  };

  App.setupPWA = function() {
    window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();App.deferredPrompt=e;App.showInstallBanner();});
    window.addEventListener('appinstalled',function(){App.installed=true;App.hideInstallBanner();App.showToast('¡App instalada!','success');});
  };
  App.showInstallBanner = function(){if(App.installed)return;var b=document.getElementById('install-banner');if(b)b.style.display='flex';};
  App.hideInstallBanner = function(){var b=document.getElementById('install-banner');if(b)b.style.display='none';};
  App.installApp = function(){if(!App.deferredPrompt)return;App.deferredPrompt.prompt();App.deferredPrompt.userChoice.then(function(r){if(r.outcome==='accepted')App.showToast('¡Instalada!','success');App.deferredPrompt=null;});};

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',App.init);}else{App.init();}
})();