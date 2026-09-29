/**
 * SONORA — EXPERIÊNCIA DIGITAL MUSICAL COMPLETA & ACESSÍVEL
 * Arquitetura de Áudio Web Audio API + Engine 3D Three.js + Acessibilidade Integrada
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. SISTEMA DE ÁUDIO WEB AUDIO API (SINTETIZADOR & GERADOR DE SOM)
     ========================================================================== */
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  let masterGain = null;
  let analyser = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new AudioContext();
      masterGain = audioCtx.createGain();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      
      masterGain.gain.value = parseFloat(document.getElementById('master-volume').value || 0.8);
      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Tocar Notas Harmônicas (Teclado e Efeitos)
  function playSynthNote(freq, duration = 0.8, type = 'sine') {
    initAudio();
    const osc = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    noteGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);

    // Reação no ambiente 3D
    pulse3DEnvironment();
  }

  // Sons Sintetizados da Bateria (Sem dependência de arquivos externos)
  function playDrumSound(type) {
    initAudio();
    const now = audioCtx.currentTime;

    if (type === 'kick') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'snare') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, now);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'hihat') {
      // Ruído filtrado
      const bufferSize = audioCtx.sampleRate * 0.1;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      whiteNoise.start(now);
    } else {
      // Tom ou Crash genérico
      playSynthNote(type === 'crash' ? 800 : 200, 0.4, 'triangle');
    }

    pulse3DEnvironment();
  }

  /* ==========================================================================
     2. AMBIENTE 3D DINÂMICO MULTICAMADA (THREE.JS)
     ========================================================================== */
  let scene, camera, renderer, particleSystem, lightMesh;
  let mouseX = 0, mouseY = 0;

  function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container || typeof THREE === 'undefined') return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 400;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Sistema de Partículas (Estrelas / Timbres Flutuantes)
    const particleCount = 250;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 800;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x7952f5,
      size: 4,
      transparent: true,
      opacity: 0.6
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Orb Iluminado Central
    const orbGeo = new THREE.IcosahedronGeometry(40, 2);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    lightMesh = new THREE.Mesh(orbGeo, orbMat);
    scene.add(lightMesh);

    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    });

    animate3D();
  }

  function animate3D() {
    requestAnimationFrame(animate3D);

    if (document.body.getAttribute('data-motion-reduce') === 'true') return;

    if (particleSystem) {
      particleSystem.rotation.y += 0.001;
      particleSystem.rotation.x += 0.0005;
    }

    if (lightMesh) {
      lightMesh.rotation.x += 0.005;
      lightMesh.rotation.y += 0.005;
    }

    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  function pulse3DEnvironment() {
    if (lightMesh && document.body.getAttribute('data-motion-reduce') !== 'true') {
      lightMesh.scale.set(1.3, 1.3, 1.3);
      setTimeout(() => lightMesh.scale.set(1, 1, 1), 200);
    }
  }

  init3D();

  /* ==========================================================================
     3. GERENCIADOR DE ACESSIBILIDADE E MODO SIMPLES
     ========================================================================== */
  const srAnnouncer = document.getElementById('sr-announcer');

  function announceToSR(message) {
    if (srAnnouncer) {
      srAnnouncer.textContent = message;
    }
  }

  // Leitor de Conteúdo em Voz Alta (SpeechSynthesis)
  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  }

  // Toggle Modo Simples
  const btnSimpleMode = document.getElementById('btn-toggle-simple-mode');
  const btnQuickSimple = document.getElementById('btn-quick-simple-mode');
  const btnDisableSimple = document.getElementById('btn-disable-simple-mode');
  const simpleBanner = document.getElementById('simple-mode-banner');

  function setSimpleMode(enable) {
    const isEnabled = enable === 'true' || enable === true;
    document.body.setAttribute('data-simple-mode', isEnabled);
    simpleBanner.hidden = !isEnabled;
    btnQuickSimple.setAttribute('aria-pressed', isEnabled);
    if (btnSimpleMode) btnSimpleMode.classList.toggle('active', isEnabled);

    announceToSR(isEnabled ? "Modo simples ativado. Layout simplificado." : "Modo simples desativado.");
    unlockAchievement('ach-acc');
  }

  [btnSimpleMode, btnQuickSimple].forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      const current = document.body.getAttribute('data-simple-mode') === 'true';
      setSimpleMode(!current);
    });
  });

  if (btnDisableSimple) {
    btnDisableSimple.addEventListener('click', () => setSimpleMode(false));
  }

  // Ajustes de Fonte
  let fontSizeOffset = 0;
  document.getElementById('btn-font-increase')?.addEventListener('click', () => {
    if (fontSizeOffset < 4) {
      fontSizeOffset += 2;
      document.documentElement.style.fontSize = `${16 + fontSizeOffset}px`;
      announceToSR("Tamanho do texto aumentado.");
      unlockAchievement('ach-acc');
    }
  });

  document.getElementById('btn-font-decrease')?.addEventListener('click', () => {
    if (fontSizeOffset > -2) {
      fontSizeOffset -= 2;
      document.documentElement.style.fontSize = `${16 + fontSizeOffset}px`;
      announceToSR("Tamanho do texto diminuído.");
    }
  });

  // Toggles de Contraste e Movimento
  document.getElementById('btn-high-contrast')?.addEventListener('click', (e) => {
    const current = document.body.getAttribute('data-high-contrast') === 'true';
    document.body.setAttribute('data-high-contrast', !current);
    document.body.setAttribute('data-soft-contrast', 'false');
    e.target.classList.toggle('active', !current);
    document.getElementById('btn-soft-contrast')?.classList.remove('active');
    announceToSR(!current ? "Alto contraste ativado." : "Alto contraste desativado.");
  });

  document.getElementById('btn-soft-contrast')?.addEventListener('click', (e) => {
    const current = document.body.getAttribute('data-soft-contrast') === 'true';
    document.body.setAttribute('data-soft-contrast', !current);
    document.body.setAttribute('data-high-contrast', 'false');
    e.target.classList.toggle('active', !current);
    document.getElementById('btn-high-contrast')?.classList.remove('active');
  });

  document.getElementById('btn-reduce-motion')?.addEventListener('click', (e) => {
    const current = document.body.getAttribute('data-motion-reduce') === 'true';
    document.body.setAttribute('data-motion-reduce', !current);
    e.target.classList.toggle('active', !current);
    announceToSR(!current ? "Animações reduzidas." : "Animações normais.");
  });

  document.getElementById('master-volume')?.addEventListener('input', (e) => {
    if (masterGain) {
      masterGain.gain.value = parseFloat(e.target.value);
    }
  });

  document.getElementById('btn-quick-speech')?.addEventListener('click', () => {
    speakText("Você está no Sonora. Uma experiência musical inclusiva com suporte a modos visuais e sonoros adaptados.");
  });

  /* ==========================================================================
     4. HERO INTERATIVO
     ========================================================================== */
  const heroOrb = document.getElementById('hero-orb');
  const heroSoundCaption = document.getElementById('hero-sound-caption');

  if (heroOrb) {
    heroOrb.addEventListener('click', () => {
      playSynthNote(440, 1.2, 'sine');
      heroSoundCaption.textContent = "Nota Lá (440Hz) executada — Frequência harmoniosa e ressonante";
      unlockAchievement('ach-first-sound');
    });
  }

  /* ==========================================================================
     5. TECLADO MUSICAL COMPLETO
     ========================================================================== */
  const notesData = [
    { note: 'C4', key: 'C', freq: 261.63, type: 'white' },
    { note: 'C#4', key: 'D', freq: 277.18, type: 'black' },
    { note: 'D4', key: 'E', freq: 293.66, type: 'white' },
    { note: 'D#4', key: 'R', freq: 311.13, type: 'black' },
    { note: 'E4', key: 'F', freq: 329.63, type: 'white' },
    { note: 'F4', key: 'G', freq: 349.23, type: 'white' },
    { note: 'F#4', key: 'Y', freq: 369.99, type: 'black' },
    { note: 'G4', key: 'H', freq: 392.00, type: 'white' },
    { note: 'G#4', key: 'U', freq: 415.30, type: 'black' },
    { note: 'A4', key: 'J', freq: 440.00, type: 'white' },
    { note: 'A#4', key: 'I', freq: 466.16, type: 'black' },
    { note: 'B4', key: 'K', freq: 493.88, type: 'white' }
  ];

  const keysWrapper = document.getElementById('piano-keys-wrapper');
  const notesDisplay = document.getElementById('keyboard-notes-display');

  function buildKeyboard() {
    if (!keysWrapper) return;
    keysWrapper.innerHTML = '';

    notesData.forEach(item => {
      const keyBtn = document.createElement('button');
      keyBtn.className = `piano-key ${item.type}`;
      keyBtn.dataset.note = item.note;
      keyBtn.dataset.freq = item.freq;
      keyBtn.setAttribute('aria-label', `Nota ${item.note}, Tecla ${item.key}`);
      keyBtn.innerHTML = `<span>${item.note}</span><small style="opacity:0.6">${item.key}</small>`;

      keyBtn.addEventListener('click', () => triggerNote(item, keyBtn));
      keysWrapper.appendChild(keyBtn);
    });
  }

  function triggerNote(item, el) {
    playSynthNote(item.freq, 0.8);
    if (notesDisplay) {
      notesDisplay.innerHTML = `Nota Ativa: <strong>${item.note}</strong> (${Math.round(item.freq)} Hz)`;
    }
    announceToSR(`Nota ${item.note}`);
    
    if (el) {
      el.classList.add('active');
      setTimeout(() => el.classList.remove('active'), 200);
    }

    if (isRecording) {
      recordedNotes.push({ note: item.note, freq: item.freq, time: Date.now() - recordStartTime });
    }

    unlockAchievement('ach-first-sound');
    unlockAchievement('ach-melody');
  }

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const pressedKey = e.key.toUpperCase();
    const found = notesData.find(n => n.key === pressedKey);
    if (found) {
      const el = keysWrapper?.querySelector(`[data-note="${found.note}"]`);
      triggerNote(found, el);
    }
  });

  buildKeyboard();

  /* ==========================================================================
     6. BATERIA & PADS
     ========================================================================== */
  const drumPads = document.querySelectorAll('.drum-pad');

  drumPads.forEach(pad => {
    pad.addEventListener('click', () => {
      const soundType = pad.dataset.sound;
      playDrumSound(soundType);
      pad.classList.add('active');
      setTimeout(() => pad.classList.remove('active'), 150);
      announceToSR(`Percussão: ${pad.querySelector('.pad-name')?.textContent}`);
      unlockAchievement('ach-rhythm');
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const key = e.key.toUpperCase();
    const pad = document.querySelector(`.drum-pad[data-key="${key}"]`);
    if (pad) pad.click();
  });

  /* ==========================================================================
     7. ESTÚDIO, GRAVAÇÃO & VISUALIZADOR DE ÁUDIO
     ========================================================================== */
  let isRecording = false;
  let recordStartTime = 0;
  let recordedNotes = [];

  const btnRecord = document.getElementById('btn-record');
  const btnPlayRec = document.getElementById('btn-play-recording');
  const btnClearRec = document.getElementById('btn-clear-recording');
  const recStatus = document.getElementById('recording-status-text');

  btnRecord?.addEventListener('click', () => {
    if (!isRecording) {
      isRecording = true;
      recordStartTime = Date.now();
      recordedNotes = [];
      btnRecord.classList.add('recording');
      btnRecord.textContent = "⏹️ Parar Gravação";
      recStatus.textContent = "Gravando notas e ritmos...";
    } else {
      isRecording = false;
      btnRecord.classList.remove('recording');
      btnRecord.innerHTML = '<span class="dot"></span> Gravar Nova Sequência';
      recStatus.textContent = `Gravação concluída: ${recordedNotes.length} eventos capturados.`;
      if (recordedNotes.length > 0) {
        if (btnPlayRec) btnPlayRec.disabled = false;
        if (btnClearRec) btnClearRec.disabled = false;
        unlockAchievement('ach-creator');
      }
    }
  });

  btnPlayRec?.addEventListener('click', () => {
    if (recordedNotes.length === 0) return;
    recStatus.textContent = "Reproduzindo sua sequência...";
    recordedNotes.forEach(item => {
      setTimeout(() => {
        playSynthNote(item.freq, 0.6);
      }, item.time);
    });
  });

  btnClearRec?.addEventListener('click', () => {
    recordedNotes = [];
    if (btnPlayRec) btnPlayRec.disabled = true;
    if (btnClearRec) btnClearRec.disabled = true;
    recStatus.textContent = "Gravação limpa.";
  });

  // Renderizador do Canvas de Áudio Visualizador
  const canvas = document.getElementById('audio-visualizer-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    function drawVisualizer() {
      requestAnimationFrame(drawVisualizer);
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!analyser) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(0, canvas.height / 2, canvas.width, 2);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `hsl(${i * 12 + 220}, 80%, 60%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    }
    drawVisualizer();
  }

  /* ==========================================================================
     8. CATÁLOGO DE INSTRUMENTOS
     ========================================================================== */
  const instruments = [
    { id: '1', name: 'Piano de Cauda', category: 'teclas', desc: 'Símbolo da música erudita e popular.', detail: 'Possui mais de 12.000 peças individuais acionadas por martelos de feltro.' },
    { id: '2', name: 'Violino', category: 'cordas', desc: 'Expressividade aguda e rica em harmônicos.', detail: 'Instrumento friccionado por arco com 4 cordas afinadas em quintas.' },
    { id: '3', name: 'Bateria Acústica', category: 'percussao', desc: 'Conjunto rítmico dinâmico e pulsante.', detail: 'Combina bumbos, caixas, toms e pratos para ditar o tempo.' },
    { id: '4', name: 'Flauta Transversal', category: 'sopros', desc: 'Som aéreo, brilhante e veloz.', detail: 'Embora feita de metal, pertence à família das madeiras pelo modo de som.' },
    { id: '5', name: 'Koto Japonês', category: 'mundo', desc: 'Cítara tradicional asiática com trastes móveis.', detail: 'Instrumento nacional do Japão tocado com dedais de marfim ou madeira.' }
  ];

  const catalogGrid = document.getElementById('catalog-grid');

  function renderCatalog(filter = 'all') {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = '';

    const list = filter === 'all' ? instruments : instruments.filter(i => i.category === filter);

    list.forEach(item => {
      const card = document.createElement('article');
      card.className = 'instrument-card';
      card.innerHTML = `
        <div>
          <span class="badge">${item.category}</span>
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
        </div>
        <button class="pill-btn outline" onclick="openInstrumentModal('${item.id}')">Explorar Detalhes</button>
      `;
      catalogGrid.appendChild(card);
    });
  }

  window.openInstrumentModal = function(id) {
    const item = instruments.find(i => i.id === id);
    if (!item) return;
    const modal = document.getElementById('instrument-modal');
    const body = document.getElementById('modal-content-body');
    body.innerHTML = `
      <span class="badge">${item.category}</span>
      <h2 style="font-size:2rem; margin: 0.5rem 0;">${item.name}</h2>
      <p style="margin-bottom:1.5rem; color: var(--text-muted);">${item.detail}</p>
      <div style="display:flex; gap:1rem;">
        <button class="pill-btn highlight" onclick="playSynthNote(440); announceToSR('Demonstração executada');">🎧 Ouvir Timbres</button>
        <button class="pill-btn outline" onclick="document.getElementById('instrument-modal').close()">Fechar</button>
      </div>
    `;
    modal.showModal();
    unlockAchievement('ach-explorer');
  };

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderCatalog(e.target.dataset.filter);
    });
  });

  renderCatalog();

  /* ==========================================================================
     9. QUIZ INTERATIVO
     ========================================================================== */
  const quizQuestions = [
    { q: 'Qual tipo de sonoridade você mais aprecia?', opts: ['Acústica e suave', 'Intensa e rítmica', 'Eletrônica e moderna', 'Sinfônica e clássica'] },
    { q: 'Ao ouvir uma música, para onde seu foco vai primeiro?', opts: ['Para a melodia principal', 'Para a batida/ritmo', 'Para a harmonia de fundo', 'Para os detalhes de produção'] }
  ];

  let currentQuizStep = 0;
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsContainer = document.getElementById('quiz-options-container');

  function renderQuizStep() {
    if (!quizQuestionText) return;
    const item = quizQuestions[currentQuizStep];
    quizQuestionText.textContent = item.q;
    quizOptionsContainer.innerHTML = '';

    item.opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        currentQuizStep++;
        if (currentQuizStep < quizQuestions.length) {
          renderQuizStep();
        } else {
          showQuizResult();
        }
      });
      quizOptionsContainer.appendChild(btn);
    });
  }

  function showQuizResult() {
    document.getElementById('quiz-question-card').hidden = true;
    const resCard = document.getElementById('quiz-result-card');
    resCard.hidden = false;
    document.getElementById('quiz-result-text').textContent = "Seu perfil combina com instrumentos versáteis e expressivos como o Piano de Cauda e o Teclado Digital!";
    unlockAchievement('ach-learner');
  }

  renderQuizStep();

  /* ==========================================================================
     10. SISTEMA DE GAMIFICAÇÃO (JORNADA & CONQUISTAS)
     ========================================================================== */
  const achievements = [
    { id: 'ach-first-sound', name: 'Primeiro Som', desc: 'Emitiu sua primeira nota musical no Sonora.' },
    { id: 'ach-rhythm', name: 'Primeiro Ritmo', desc: 'Interagiu com os pads de percussão.' },
    { id: 'ach-melody', name: 'Primeira Melodia', desc: 'Tocou sequências no teclado musical.' },
    { id: 'ach-explorer', name: 'Explorador', desc: 'Abriu detalhes de instrumentos do catálogo.' },
    { id: 'ach-creator', name: 'Criador', desc: 'Gravou uma sequência no Estúdio.' },
    { id: 'ach-acc', name: 'Acessibilidade Personalizada', desc: 'Ajustou opções no Centro de Acessibilidade.' },
    { id: 'ach-learner', name: 'Aprendiz', desc: 'Completou o Quiz Musical.' }
  ];

  let unlockedIds = JSON.parse(localStorage.getItem('sonora_achievements') || '[]');

  function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    grid.innerHTML = '';

    achievements.forEach(ach => {
      const isUnlocked = unlockedIds.includes(ach.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="ach-icon">${isUnlocked ? '🏆' : '🔒'}</div>
        <div>
          <span class="ach-title">${ach.name}</span>
          <span class="ach-desc">${ach.desc}</span>
        </div>
      `;
      grid.appendChild(card);
    });

    const pct = Math.round((unlockedIds.length / achievements.length) * 100);
    document.getElementById('journey-percentage-text').textContent = `${pct}%`;
    document.getElementById('journey-bar-fill').style.width = `${pct}%`;
  }

  function unlockAchievement(id) {
    if (!unlockedIds.includes(id)) {
      unlockedIds.push(id);
      localStorage.setItem('sonora_achievements', JSON.stringify(unlockedIds));
      renderAchievements();

      const ach = achievements.find(a => a.id === id);
      if (ach) {
        const toast = document.getElementById('achievement-toast');
        document.getElementById('toast-achievement-name').textContent = ach.name;
        toast.hidden = false;
        setTimeout(() => toast.hidden = true, 4000);
      }
    }
  }

  renderAchievements();

  /* ==========================================================================
     11. PERCURSO GUIADO (ONBOARDING)
     ========================================================================== */
  const tourModal = document.getElementById('guided-tour-modal');
  if (tourModal && !localStorage.getItem('sonora_tour_completed')) {
    setTimeout(() => tourModal.showModal(), 1000);
  }

  document.getElementById('btn-start-tour')?.addEventListener('click', () => {
    localStorage.setItem('sonora_tour_completed', 'true');
    tourModal.close();
    setSimpleMode(true);
    announceToSR("Percurso guiado iniciado no Modo Simples.");
  });

  document.getElementById('btn-skip-tour')?.addEventListener('click', () => {
    localStorage.setItem('sonora_tour_completed', 'true');
    tourModal.close();
  });

});
