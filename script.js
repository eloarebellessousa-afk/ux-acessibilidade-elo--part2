/**
 * SONORA — EXPERIÊNCIA DIGITAL MUSICAL COMPLETA & ACESSÍVEL
 * Arquitetura de Áudio Web Audio API + Engine 3D Three.js + Acessibilidade Integrada
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     0. REGISTRADOR DE ANÚNCIOS PARA LEITORES DE TELA (SR) & VOZ
     ========================================================================== */
  const srAnnouncer = document.getElementById('sr-announcer');

  function announceToSR(message) {
    if (srAnnouncer) {
      srAnnouncer.textContent = message;
    }
  }

  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  }

  /* ==========================================================================
     1. BASE DE DADOS DOS 4 INSTRUMENTOS
     ========================================================================== */
  const instrumentsData = [
    {
      id: 'violao',
      name: 'Violão',
      category: 'cordas',
      categoryLabel: '🎸 Cordas',
      desc: 'Instrumento de cordas dedilhadas com sonoridade quente, orgânica e acolhedora.',
      history: 'O violão evoluiu de antigos instrumentos de cordas como o alaúde e a vihuela. É um dos instrumentos mais populares do mundo, essencial na Bossa Nova, MPB, Flamenco e Pop.',
      freq: 196.00, // Sol3
      soundType: 'sawtooth'
    },
    {
      id: 'teclado',
      name: 'Teclado',
      category: 'teclas',
      categoryLabel: '🎹 Teclas',
      desc: 'Versátil e expressivo, oferece controle melódico e harmônico completo.',
      history: 'Baseado no layout clássico do piano, o teclado moderno utiliza sintese eletrônica e digital para reproduzir timbres de piano acústico, órgãos e sintetizadores futuristas.',
      freq: 261.63, // Dó4
      soundType: 'sine'
    },
    {
      id: 'bateria',
      name: 'Bateria',
      category: 'percussao',
      categoryLabel: '🥁 Percussão',
      desc: 'Conjunto de tambores e pratos que dão o pulso e o ritmo à música.',
      history: 'Surgiu nos Estados Unidos no início do século XX com a junção de vários instrumentos de percussão para serem tocados por um único músico usando baquetas e pedais.',
      freq: 100, // Som percussivo especial
      isDrum: true
    },
    {
      id: 'violino',
      name: 'Violino',
      category: 'cordas',
      categoryLabel: '🎻 Cordas',
      desc: 'O menor e mais agudo instrumento da família das cordas friccionadas por arco.',
      history: 'Criado na Itália no século XVI por luthiers lendários como Stradivari e Amati. Possui expressividade única e som brilhante, sendo pilar fundamental da música orquestral e erudita.',
      freq: 440.00, // Lá4
      soundType: 'triangle'
    }
  ];

  /* ==========================================================================
     2. GAMIFICAÇÃO & CONQUISTAS
     ========================================================================== */
  const achievements = [
    { id: 'ach-first-sound', title: 'Primeiro Som', desc: 'Tocou sua primeira nota no Sonora.', icon: '🎵' },
    { id: 'ach-melody', title: 'Melodista', desc: 'Completou uma sequência no Modo Aprender.', icon: '🎹' },
    { id: 'ach-rhythm', title: 'Ritmo Puro', desc: 'Experimentou os pads de percussão.', icon: '🥁' },
    { id: 'ach-explorer', title: 'Explorador Sonoro', desc: 'Descobriu seu perfil musical.', icon: '✨' },
    { id: 'ach-acc', title: 'Acessibilidade Total', desc: 'Personalizou suas preferências de uso.', icon: '♿' },
    { id: 'ach-creator', title: 'Criador Musical', desc: 'Gravou sua própria sequência no Estúdio.', icon: '🎼' }
  ];

  let unlockedIds = new Set();
  try {
    const saved = localStorage.getItem('sonora_achievements');
    if (saved) {
      unlockedIds = new Set(JSON.parse(saved));
    }
  } catch (e) {
    console.warn("Não foi possível carregar conquistas do localStorage.", e);
  }

  function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    grid.innerHTML = '';

    achievements.forEach(ach => {
      const isUnlocked = unlockedIds.has(ach.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="ach-icon" aria-hidden="true">${ach.icon}</div>
        <div class="ach-info">
          <span class="ach-title">${ach.title}</span>
          <span class="ach-desc">${ach.desc}</span>
        </div>
      `;
      grid.appendChild(card);
    });

    const percentage = Math.round((unlockedIds.size / achievements.length) * 100);
    const barFill = document.getElementById('journey-bar-fill');
    const percentText = document.getElementById('journey-percentage-text');
    if (barFill) barFill.style.width = `${percentage}%`;
    if (percentText) percentText.textContent = `${percentage}%`;
  }

  function unlockAchievement(id) {
    if (!unlockedIds.has(id)) {
      unlockedIds.add(id);
      try {
        localStorage.setItem('sonora_achievements', JSON.stringify(Array.from(unlockedIds)));
      } catch (e) {
        console.warn("Não foi possível salvar conquista.", e);
      }
      renderAchievements();

      const ach = achievements.find(a => a.id === id);
      if (ach) {
        showAchievementToast(ach);
      }
    }
  }

  function showAchievementToast(ach) {
    const toast = document.getElementById('achievement-toast');
    const toastName = document.getElementById('toast-achievement-name');
    if (toast && toastName) {
      toastName.textContent = ach.title;
      toast.hidden = false;
      announceToSR(`Conquista unlocked: ${ach.title}`);
      setTimeout(() => {
        toast.hidden = true;
      }, 4000);
    }
  }

  renderAchievements();

  /* ==========================================================================
     3. GERENCIADOR DE ACESSIBILIDADE & PREFERÊNCIAS
     ========================================================================== */
  const btnSimpleMode = document.getElementById('btn-toggle-simple-mode');
  const btnQuickSimple = document.getElementById('btn-quick-simple-mode');
  const btnDisableSimple = document.getElementById('btn-disable-simple-mode');
  const simpleBanner = document.getElementById('simple-mode-banner');

  function setSimpleMode(enable) {
    const isEnabled = enable === 'true' || enable === true;
    document.body.setAttribute('data-simple-mode', isEnabled);
    if (simpleBanner) simpleBanner.hidden = !isEnabled;
    if (btnQuickSimple) btnQuickSimple.setAttribute('aria-pressed', isEnabled);
    if (btnSimpleMode) btnSimpleMode.setAttribute('aria-pressed', isEnabled);

    try {
      localStorage.setItem('sonora_simple_mode', isEnabled);
    } catch (e) {
      console.warn("localStorage inacessível.", e);
    }
    
    announceToSR(isEnabled ? "Modo Simples ativado. Layout limpo e direto." : "Modo Completo ativado.");
    unlockAchievement('ach-acc');
  }

  try {
    if (localStorage.getItem('sonora_simple_mode') === 'true') {
      setSimpleMode(true);
    }
  } catch (e) {
    console.warn("Não foi possível restaurar Modo Simples.", e);
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
      announceToSR("Tamanho da fonte aumentado.");
      unlockAchievement('ach-acc');
    }
  });

  document.getElementById('btn-font-decrease')?.addEventListener('click', () => {
    if (fontSizeOffset > -2) {
      fontSizeOffset -= 2;
      document.documentElement.style.fontSize = `${16 + fontSizeOffset}px`;
      announceToSR("Tamanho da fonte diminuído.");
    }
  });

  // Contraste
  const btnHighContrast = document.getElementById('btn-high-contrast');
  const btnSoftContrast = document.getElementById('btn-soft-contrast');

  btnHighContrast?.addEventListener('click', () => {
    const active = document.body.getAttribute('data-high-contrast') === 'true';
    document.body.setAttribute('data-high-contrast', !active);
    document.body.setAttribute('data-soft-contrast', 'false');
    btnHighContrast.setAttribute('aria-pressed', !active);
    if (btnSoftContrast) btnSoftContrast.setAttribute('aria-pressed', 'false');
    announceToSR(!active ? "Alto contraste ativado." : "Alto contraste desativado.");
    unlockAchievement('ach-acc');
  });

  btnSoftContrast?.addEventListener('click', () => {
    const active = document.body.getAttribute('data-soft-contrast') === 'true';
    document.body.setAttribute('data-soft-contrast', !active);
    document.body.setAttribute('data-high-contrast', 'false');
    btnSoftContrast.setAttribute('aria-pressed', !active);
    if (btnHighContrast) btnHighContrast.setAttribute('aria-pressed', 'false');
    announceToSR(!active ? "Contraste suave ativado." : "Contraste suave desativado.");
  });

  // Redução de Movimento
  const btnReduceMotion = document.getElementById('btn-reduce-motion');
  btnReduceMotion?.addEventListener('click', () => {
    const active = document.body.getAttribute('data-motion-reduce') === 'true';
    document.body.setAttribute('data-motion-reduce', !active);
    btnReduceMotion.setAttribute('aria-pressed', !active);
    if (!active) {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    } else {
      animate3D();
    }
    announceToSR(!active ? "Animações reduzidas." : "Animações restauradas.");
  });

  // Controles Maiores
  const btnLargeControls = document.getElementById('btn-large-controls');
  btnLargeControls?.addEventListener('click', () => {
    const active = document.body.getAttribute('data-large-controls') === 'true';
    document.body.setAttribute('data-large-controls', !active);
    btnLargeControls.setAttribute('aria-pressed', !active);
    announceToSR(!active ? "Controles maiores ativados." : "Controles normais.");
  });

  document.getElementById('btn-quick-speech')?.addEventListener('click', () => {
    speakText("Você está no Sonora, uma experiência digital musical focada em acessibilidade universal.");
  });

  /* ==========================================================================
     4. ARQUITETURA DE ÁUDIO WEB AUDIO API
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
      
      const volInput = document.getElementById('master-volume');
      masterGain.gain.value = volInput ? parseFloat(volInput.value) : 0.8;
      
      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  document.getElementById('master-volume')?.addEventListener('input', (e) => {
    if (masterGain) {
      masterGain.gain.value = parseFloat(e.target.value);
    }
  });

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

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function playDrumSound(type) {
    initAudio();
    const now = audioCtx.currentTime;

    if (type === 'kick') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.4);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'snare') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'hihat') {
      const bufferSize = audioCtx.sampleRate * 0.08;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(now);
    } else {
      playSynthNote(type === 'crash' ? 880 : 220, 0.4, 'triangle');
    }

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  /* ==========================================================================
     5. VISUALIZADOR DE ÁUDIO & AMBIENTE 3D THREE.JS
     ========================================================================== */
  let scene, camera, renderer, particleSystem, lightMesh;
  let mouseX = 0, mouseY = 0;
  let animFrameId = null;

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

    const particleCount = 280;
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

    const orbGeo = new THREE.IcosahedronGeometry(45, 2);
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

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate3D();
  }

  function animate3D() {
    if (document.body.getAttribute('data-motion-reduce') === 'true' || document.body.getAttribute('data-simple-mode') === 'true') {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      return;
    }

    animFrameId = requestAnimationFrame(animate3D);

    if (particleSystem) {
      particleSystem.rotation.y += 0.001;
      particleSystem.rotation.x += 0.0005;
    }

    if (lightMesh) {
      lightMesh.rotation.x += 0.004;
      lightMesh.rotation.y += 0.004;
    }

    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  function pulse3DEnvironment() {
    if (lightMesh && document.body.getAttribute('data-motion-reduce') !== 'true') {
      lightMesh.scale.set(1.25, 1.25, 1.25);
      setTimeout(() => lightMesh.scale.set(1, 1, 1), 200);
    }
  }

  function triggerVisualizerFeedback() {
    const feedbackText = document.getElementById('visualizer-text-feedback');
    if (feedbackText) {
      feedbackText.textContent = "🔊 Sinal sonoro emitido — Frequência ativa no visualizador";
    }
  }

  init3D();

  /* ==========================================================================
     6. HERO & HERO ORB
     ========================================================================== */
  const heroOrb = document.getElementById('hero-orb');
  const heroSoundCaption = document.getElementById('hero-sound-caption');

  if (heroOrb) {
    heroOrb.addEventListener('click', () => {
      playSynthNote(440, 1.2, 'sine');
      if (heroSoundCaption) {
        heroSoundCaption.textContent = "Nota Lá (440Hz) executada com resposta no ambiente 3D.";
      }
      announceToSR("Nota Lá tocada no orbe.");
      unlockAchievement('ach-first-sound');
    });
  }

  /* ==========================================================================
     7. ESTÚDIO, GRAVADOR E METRÔNOMO
     ========================================================================== */
  let metronomeInterval = null;
  let isMetronomeActive = false;
  const btnMetronome = document.getElementById('btn-toggle-metronome');
  const metronomeStatus = document.getElementById('metronome-status');
  const bpmInput = document.getElementById('metronome-bpm');
  const bpmDisplay = document.getElementById('bpm-display');

  function updateMetronomeSpeed() {
    if (isMetronomeActive) {
      stopMetronome();
      startMetronome();
    }
  }

  function startMetronome() {
    const bpm = bpmInput ? parseInt(bpmInput.value, 10) : 120;
    const intervalMs = (60 / bpm) * 1000;
    isMetronomeActive = true;
    if (metronomeStatus) metronomeStatus.textContent = "Ligado";
    if (btnMetronome) btnMetronome.setAttribute('aria-pressed', 'true');

    metronomeInterval = setInterval(() => {
      playSynthNote(880, 0.05, 'sine');
    }, intervalMs);
  }

  function stopMetronome() {
    if (metronomeInterval) clearInterval(metronomeInterval);
    isMetronomeActive = false;
    if (metronomeStatus) metronomeStatus.textContent = "Desligado";
    if (btnMetronome) btnMetronome.setAttribute('aria-pressed', 'false');
  }

  btnMetronome?.addEventListener('click', () => {
    if (isMetronomeActive) {
      stopMetronome();
      announceToSR("Metrônomo desligado.");
    } else {
      startMetronome();
      announceToSR(`Metrônomo ligado a ${bpmInput ? bpmInput.value : 120} BPM.`);
    }
  });

  bpmInput?.addEventListener('input', (e) => {
    if (bpmDisplay) bpmDisplay.textContent = `${e.target.value} BPM`;
    updateMetronomeSpeed();
  });

  // Sistema de Gravação
  let isRecording = false;
  let recordStartTime = 0;
  let recordedNotes = [];
  const btnRecord = document.getElementById('btn-record');
  const btnPlayRecord = document.getElementById('btn-play-recording');
  const btnClearRecord = document.getElementById('btn-clear-recording');
  const recordStatusText = document.getElementById('recording-status-text');

  btnRecord?.addEventListener('click', () => {
    if (!isRecording) {
      isRecording = true;
      recordStartTime = Date.now();
      recordedNotes = [];
      btnRecord.classList.add('recording');
      btnRecord.setAttribute('aria-pressed', 'true');
      if (recordStatusText) recordStatusText.textContent = "🔴 Gravando... Toque notas no teclado ou bateria!";
      announceToSR("Gravação iniciada.");
    } else {
      isRecording = false;
      btnRecord.classList.remove('recording');
      btnRecord.setAttribute('aria-pressed', 'false');
      const count = recordedNotes.length;
      if (recordStatusText) recordStatusText.textContent = `Gravação concluída (${count} notas gravadas).`;
      if (btnPlayRecord) btnPlayRecord.disabled = count === 0;
      if (btnClearRecord) btnClearRecord.disabled = count === 0;
      announceToSR(`Gravação encerrada com ${count} notas.`);
      if (count > 0) unlockAchievement('ach-creator');
    }
  });

  btnPlayRecord?.addEventListener('click', () => {
    if (recordedNotes.length === 0) return;
    if (recordStatusText) recordStatusText.textContent = "▶️ Reproduzindo gravação...";
    announceToSR("Reproduzindo gravação.");

    recordedNotes.forEach(item => {
      setTimeout(() => {
        if (item.isDrum) {
          playDrumSound(item.sound);
        } else {
          playSynthNote(item.freq, 0.5);
        }
      }, item.time);
    });

    const maxTime = Math.max(...recordedNotes.map(n => n.time)) + 800;
    setTimeout(() => {
      if (recordStatusText) recordStatusText.textContent = "Reprodução finalizada.";
    }, maxTime);
  });

  btnClearRecord?.addEventListener('click', () => {
    recordedNotes = [];
    if (btnPlayRecord) btnPlayRecord.disabled = true;
    if (btnClearRecord) btnClearRecord.disabled = true;
    if (recordStatusText) recordStatusText.textContent = "Nenhuma gravação armazenada.";
    announceToSR("Gravação apagada.");
  });

  /* ==========================================================================
     8. TECLADO MUSICAL
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

  let currentKeyMode = 'free';
  let learnSequence = ['C4', 'E4', 'G4', 'C4'];
  let learnStep = 0;

  const keysWrapper = document.getElementById('piano-keys-wrapper');
  const notesDisplay = document.getElementById('keyboard-notes-display');
  const guideBanner = document.getElementById('keyboard-guide-banner');
  const guideText = document.getElementById('keyboard-guide-text');

  function buildKeyboard() {
    if (!keysWrapper) return;
    keysWrapper.innerHTML = '';

    notesData.forEach(item => {
      const keyBtn = document.createElement('button');
      keyBtn.className = `piano-key ${item.type}`;
      keyBtn.dataset.note = item.note;
      keyBtn.dataset.freq = item.freq;
      keyBtn.setAttribute('aria-label', `Nota ${item.note}, atalho tecla ${item.key}`);
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

    if (currentKeyMode === 'learn' || currentKeyMode === 'challenge') {
      if (item.note === learnSequence[learnStep]) {
        learnStep++;
        if (learnStep >= learnSequence.length) {
          if (guideText) guideText.textContent = "✨ Sequência perfeita! Parabéns!";
          announceToSR("Sequência concluída com sucesso!");
          learnStep = 0;
          unlockAchievement('ach-melody');
        } else {
          if (guideText) guideText.textContent = `Próxima nota: ${learnSequence[learnStep]}`;
        }
      } else {
        if (guideText) guideText.textContent = `Nota incorreta. Tente tocar: ${learnSequence[learnStep]}`;
      }
    }

    unlockAchievement('ach-first-sound');
  }

  document.getElementById('btn-keymode-free')?.addEventListener('click', (e) => {
    currentKeyMode = 'free';
    updateKeyModeUI(e.target);
    if (guideBanner) guideBanner.hidden = true;
  });

  document.getElementById('btn-keymode-learn')?.addEventListener('click', (e) => {
    currentKeyMode = 'learn';
    learnStep = 0;
    updateKeyModeUI(e.target);
    if (guideBanner) {
      guideBanner.hidden = false;
      if (guideText) guideText.textContent = `Modo Aprender: Toque a nota ${learnSequence[0]}`;
    }
  });

  document.getElementById('btn-keymode-challenge')?.addEventListener('click', (e) => {
    currentKeyMode = 'challenge';
    learnStep = 0;
    updateKeyModeUI(e.target);
    if (guideBanner) {
      guideBanner.hidden = false;
      if (guideText) guideText.textContent = `Desafio de Memória: Repita a nota ${learnSequence[0]}`;
    }
  });

  function updateKeyModeUI(activeBtn) {
    document.querySelectorAll('.mode-tab').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
  }

  buildKeyboard();

  /* ==========================================================================
     9. BATERIA & PADS
     ========================================================================== */
  const drumPads = document.querySelectorAll('.drum-pad');
  let demoRhythmInterval = null;

  drumPads.forEach(pad => {
    pad.addEventListener('click', () => {
      const soundType = pad.dataset.sound;
      playDrumSound(soundType);
      pad.classList.add('active');
      setTimeout(() => pad.classList.remove('active'), 150);

      if (isRecording) {
        recordedNotes.push({ isDrum: true, sound: soundType, time: Date.now() - recordStartTime });
      }

      unlockAchievement('ach-rhythm');
    });
  });

  // Atalhos Globais de Teclado (Bateria + Teclado)
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toUpperCase();

    // Teclas da bateria: A, S, D, F, G
    const drumPad = document.querySelector(`.drum-pad[data-key="${key}"]`);
    if (drumPad) {
      drumPad.click();
      return;
    }

    // Teclas do teclado musical
    const foundNote = notesData.find(n => n.key === key);
    if (foundNote) {
      const btnEl = keysWrapper?.querySelector(`button[data-note="${foundNote.note}"]`);
      triggerNote(foundNote, btnEl);
    }
  });

  // Demonstração de Ritmo
  const btnPlayDemoRhythm = document.getElementById('btn-play-demo-rhythm');
  const btnStopDemoRhythm = document.getElementById('btn-stop-demo-rhythm');

  btnPlayDemoRhythm?.addEventListener('click', () => {
    if (demoRhythmInterval) clearInterval(demoRhythmInterval);
    
    if (btnPlayDemoRhythm) btnPlayDemoRhythm.hidden = true;
    if (btnStopDemoRhythm) btnStopDemoRhythm.hidden = false;

    let step = 0;
    const pattern = ['kick', 'hihat', 'snare', 'hihat'];

    demoRhythmInterval = setInterval(() => {
      const sound = pattern[step % pattern.length];
      playDrumSound(sound);
      
      const targetPad = document.querySelector(`.drum-pad[data-sound="${sound}"]`);
      if (targetPad) {
        targetPad.classList.add('active');
        setTimeout(() => targetPad.classList.remove('active'), 100);
      }
      step++;
    }, 300);

    announceToSR("Demonstração de ritmo iniciada.");
  });

  btnStopDemoRhythm?.addEventListener('click', () => {
    if (demoRhythmInterval) clearInterval(demoRhythmInterval);
    if (btnPlayDemoRhythm) btnPlayDemoRhythm.hidden = false;
    if (btnStopDemoRhythm) btnStopDemoRhythm.hidden = true;
    announceToSR("Demonstração de ritmo parada.");
  });

  /* ==========================================================================
     10. PERFIL MUSICAL / DESCUBRA
     ========================================================================== */
  const moodButtons = document.querySelectorAll('.mood-btn');
  const quizStep = document.getElementById('discovery-quiz-step');
  const resultStep = document.getElementById('discovery-result-step');
  const profileTitle = document.getElementById('discovery-profile-title');
  const profileDesc = document.getElementById('discovery-profile-desc');
  const recList = document.getElementById('discovery-recommendations-list');
  const btnRestartDiscovery = document.getElementById('btn-restart-discovery');

  const moodProfiles = {
    calm: {
      title: 'Perfil Sereno & Contemplativo',
      desc: 'Sua sensibilidade é voltada para melodias suaves, timbres acústicos e momentos de relaxamento.',
      recommendations: ['Violão', 'Violino']
    },
    energetic: {
      title: 'Perfil Vigoroso & Pulsante',
      desc: 'Você se move através do ritmo, da energia percussiva e do impacto da batida.',
      recommendations: ['Bateria', 'Teclado']
    },
    creative: {
      title: 'Perfil Expressivo & Melódico',
      desc: 'Sua marca é a criação de harmonias ricas, arranjos envolventes e arranjos expressivos.',
      recommendations: ['Teclado', 'Violão', 'Violino']
    },
    curious: {
      title: 'Perfil Clássico & Detalhista',
      desc: 'Você aprecia nuances sonoras, dinâmicas de arco e timbres de grande riqueza harmônica.',
      recommendations: ['Violino', 'Teclado', 'Violão']
    }
  };

  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      const profile = moodProfiles[mood] || moodProfiles.calm;

      if (quizStep) quizStep.hidden = true;
      if (resultStep) resultStep.hidden = false;

      if (profileTitle) profileTitle.textContent = profile.title;
      if (profileDesc) profileDesc.textContent = profile.desc;

      if (recList) {
        recList.innerHTML = profile.recommendations.map(inst => `
          <div class="rec-item">🎵 ${inst}</div>
        `).join('');
      }

      announceToSR(`Perfil identificado: ${profile.title}`);
      unlockAchievement('ach-explorer');
    });
  });

  btnRestartDiscovery?.addEventListener('click', () => {
    if (quizStep) quizStep.hidden = false;
    if (resultStep) resultStep.hidden = true;
  });

  /* ==========================================================================
     11. CATÁLOGO INTERATIVO & MODAL
     ========================================================================== */
  const catalogGrid = document.getElementById('catalog-grid');
  const filterBtns = document.querySelectorAll('.catalog-filters .filter-btn');
  const modal = document.getElementById('instrument-modal');
  const modalContent = document.getElementById('modal-content-body');

  function renderCatalog(filter = 'all') {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = '';

    const filtered = instrumentsData.filter(inst => filter === 'all' || inst.category === filter);

    filtered.forEach(inst => {
      const card = document.createElement('article');
      card.className = 'instrument-card';
      card.innerHTML = `
        <div>
          <span class="badge">${inst.categoryLabel}</span>
          <h3>${inst.name}</h3>
          <p>${inst.desc}</p>
        </div>
        <div class="instrument-card-actions">
          <button class="pill-btn highlight btn-listen-inst" data-id="${inst.id}">🔊 Ouvir Som</button>
          <button class="pill-btn outline btn-details-inst" data-id="${inst.id}">ℹ️ Detalhes</button>
        </div>
      `;
      catalogGrid.appendChild(card);
    });

    // Anexar ouvintes aos botões do catálogo de forma limpa
    catalogGrid.querySelectorAll('.btn-listen-inst').forEach(b => {
      b.addEventListener('click', () => {
        const inst = instrumentsData.find(i => i.id === b.dataset.id);
        if (inst) {
          if (inst.isDrum) {
            playDrumSound('snare');
          } else {
            playSynthNote(inst.freq, 1.0, inst.soundType);
          }
          announceToSR(`Tocando demonstração de ${inst.name}`);
        }
      });
    });

    catalogGrid.querySelectorAll('.btn-details-inst').forEach(b => {
      b.addEventListener('click', (e) => {
        const inst = instrumentsData.find(i => i.id === b.dataset.id);
        if (inst) openModal(inst, e.currentTarget);
      });
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      renderCatalog(btn.dataset.filter);
    });
  });

  let lastFocusedElement = null;

  function openModal(inst, triggerEl) {
    if (!modal || !modalContent) return;
    lastFocusedElement = triggerEl;

    modalContent.innerHTML = `
      <div class="modal-header">
        <h3 id="modal-title">${inst.name}</h3>
        <button id="btn-close-modal" class="close-modal-btn" aria-label="Fechar modal">✕</button>
      </div>
      <div class="modal-body">
        <p><strong>Categoria:</strong> ${inst.categoryLabel}</p>
        <p>${inst.desc}</p>
        <p><strong>História e Contexto:</strong> ${inst.history}</p>
        <button id="btn-modal-listen" class="btn-primary" style="margin-top: 1rem;">🔊 Ouvir Timbre</button>
      </div>
    `;

    modal.showModal();

    const btnClose = document.getElementById('btn-close-modal');
    btnClose?.addEventListener('click', closeModal);

    document.getElementById('btn-modal-listen')?.addEventListener('click', () => {
      if (inst.isDrum) {
        playDrumSound('kick');
      } else {
        playSynthNote(inst.freq, 1.2, inst.soundType);
      }
    });

    announceToSR(`Modal aberto: ${inst.name}`);
  }

  function closeModal() {
    if (modal && modal.open) {
      modal.close();
      if (lastFocusedElement) lastFocusedElement.focus();
    }
  }

  modal?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  renderCatalog();

  /* ==========================================================================
     12. QUIZ MUSICAL DE APRENDIZADO (8 PERGUNTAS)
     ========================================================================== */
  const quizQuestions = [
    {
      q: "1. Qual destes instrumentos produz som através de cordas dedilhadas?",
      options: [
        { text: "Violão", isCorrect: true, inst: "violao" },
        { text: "Bateria", isCorrect: false },
        { text: "Teclado", isCorrect: false }
      ]
    },
    {
      q: "2. Qual instrumento é responsável por marcar o ritmo e a base percussiva da música?",
      options: [
        { text: "Violino", isCorrect: false },
        { text: "Bateria", isCorrect: true, inst: "bateria" },
        { text: "Teclado", isCorrect: false }
      ]
    },
    {
      q: "3. Qual instrumento fricciona cordas com um arco de crina para produzir um som agudo e lírico?",
      options: [
        { text: "Violino", isCorrect: true, inst: "violino" },
        { text: "Violão", isCorrect: false },
        { text: "Bateria", isCorrect: false }
      ]
    },
    {
      q: "4. Qual instrumento possui teclas pretas e brancas dispostas em ordem harmônica?",
      options: [
        { text: "Teclado", isCorrect: true, inst: "teclado" },
        { text: "Violão", isCorrect: false },
        { text: "Bateria", isCorrect: false }
      ]
    },
    {
      q: "5. Se você quer tocar um instrumento versátil para Bossa Nova e MPB, qual é a escolha ideal?",
      options: [
        { text: "Bateria", isCorrect: false },
        { text: "Violão", isCorrect: true, inst: "violao" },
        { text: "Violino", isCorrect: false }
      ]
    },
    {
      q: "6. Qual instrumento da família das percussões utiliza pedal para o bumbo e baquetas?",
      options: [
        { text: "Bateria", isCorrect: true, inst: "bateria" },
        { text: "Teclado", isCorrect: false },
        { text: "Violino", isCorrect: false }
      ]
    },
    {
      q: "7. Em uma orquestra clássica, qual desses quatro instrumentos lidera a seção de cordas agudas?",
      options: [
        { text: "Violino", isCorrect: true, inst: "violino" },
        { text: "Teclado", isCorrect: false },
        { text: "Bateria", isCorrect: false }
      ]
    },
    {
      q: "8. Qual instrumento é capaz de simular sons de pianos, sintetizadores e timbres digitais variados?",
      options: [
        { text: "Teclado", isCorrect: true, inst: "teclado" },
        { text: "Violão", isCorrect: false },
        { text: "Bateria", isCorrect: false }
      ]
    }
  ];

  let currentQuizIndex = 0;
  const quizScores = { violao: 0, teclado: 0, bateria: 0, violino: 0 };

  const qCard = document.getElementById('quiz-question-card');
  const rCard = document.getElementById('quiz-result-card');
  const qText = document.getElementById('quiz-question-text');
  const qOptions = document.getElementById('quiz-options-container');
  const qCounter = document.getElementById('quiz-counter');
  const qProgress = document.getElementById('quiz-progress-fill');
  const btnRestartQuiz = document.getElementById('btn-restart-quiz');

  function renderQuizQuestion() {
    if (currentQuizIndex >= quizQuestions.length) {
      showQuizResult();
      return;
    }

    const qData = quizQuestions[currentQuizIndex];
    if (qText) qText.textContent = qData.q;
    if (qCounter) qCounter.textContent = `Pergunta ${currentQuizIndex + 1} de ${quizQuestions.length}`;
    if (qProgress) qProgress.style.width = `${((currentQuizIndex) / quizQuestions.length) * 100}%`;

    if (qOptions) {
      qOptions.innerHTML = '';
      qData.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          if (opt.inst) {
            quizScores[opt.inst] = (quizScores[opt.inst] || 0) + 1;
          }
          currentQuizIndex++;
          renderQuizQuestion();
        });
        qOptions.appendChild(btn);
      });
    }

    announceToSR(qData.q);
  }

  function showQuizResult() {
    if (qCard) qCard.hidden = true;
    if (rCard) rCard.hidden = false;
    if (qProgress) qProgress.style.width = '100%';

    // Determinar o instrumento com maior pontuação
    let topInstKey = 'teclado';
    let maxVal = -1;
    for (const key in quizScores) {
      if (quizScores[key] > maxVal) {
        maxVal = quizScores[key];
        topInstKey = key;
      }
    }

    const winner = instrumentsData.find(i => i.id === topInstKey) || instrumentsData[1];

    const rTitle = document.getElementById('quiz-result-title');
    const rText = document.getElementById('quiz-result-text');
    const rPreview = document.getElementById('quiz-result-instrument-preview');

    if (rTitle) rTitle.textContent = `Sua maior afinidade é com: ${winner.name}!`;
    if (rText) rText.textContent = winner.desc;
    if (rPreview) {
      rPreview.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 16px; margin: 1.5rem 0; border: 1px solid var(--border-highlight);">
          <span style="color: var(--secondary-accent); font-weight:700;">${winner.categoryLabel}</span>
          <h4 style="font-size: 1.5rem; color: #fff; margin: 0.5rem 0;">${winner.name}</h4>
          <p style="color: var(--text-muted);">${winner.history}</p>
        </div>
      `;
    }

    announceToSR(`Resultado do quiz: Seu instrumento ideal é ${winner.name}`);
  }

  btnRestartQuiz?.addEventListener('click', () => {
    currentQuizIndex = 0;
    for (const k in quizScores) quizScores[k] = 0;
    if (qCard) qCard.hidden = false;
    if (rCard) rCard.hidden = true;
    renderQuizQuestion();
  });

  renderQuizQuestion();

  /* ==========================================================================
     13. PERCURSO GUIADO DE BOAS-VINDAS (ONBOARDING)
     ========================================================================== */
  const tourModal = document.getElementById('guided-tour-modal');
  const btnStartTour = document.getElementById('btn-start-tour');
  const btnSkipTour = document.getElementById('btn-skip-tour');

  try {
    if (!localStorage.getItem('sonora_tour_completed')) {
      setTimeout(() => {
        tourModal?.showModal();
      }, 1000);
    }
  } catch (e) {
    console.warn("Incapaz de verificar estado do tour no localStorage.", e);
  }

  btnStartTour?.addEventListener('click', () => {
    tourModal?.close();
    try { localStorage.setItem('sonora_tour_completed', 'true'); } catch (e) {}
    const accSection = document.getElementById('meu-jeito');
    accSection?.scrollIntoView({ behavior: 'smooth' });
    announceToSR("Redirecionado para a seção de acessibilidade.");
  });

  btnSkipTour?.addEventListener('click', () => {
    tourModal?.close();
    try { localStorage.setItem('sonora_tour_completed', 'true'); } catch (e) {}
  });

});
