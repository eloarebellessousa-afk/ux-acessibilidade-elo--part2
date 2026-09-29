/**
 * SONORA — EXPERIÊNCIA DIGITAL MUSICAL COMPLETA & ACESSÍVEL
 * Arquitetura de Áudio Web Audio API + Engine 3D Three.js + Acessibilidade Integrada
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     0. REGISTRADOR DE ANÚNCIOS PARA LEITORES DE TELA (SR)
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
     1. GAMIFICAÇÃO & CONQUISTAS (INICIALIZAÇÃO PRIORITÁRIA)
     ========================================================================== */
  const achievements = [
    { id: 'ach-first-sound', title: 'Primeiro Som', desc: 'Tocou sua primeira nota no Sonora.', icon: '🎵' },
    { id: 'ach-melody', title: 'Melodista', desc: 'Completou uma sequência no Modo Aprender.', icon: '🎹' },
    { id: 'ach-rhythm', title: 'Ritmo Puro', desc: 'Experimentou os pads de percussão.', icon: '🥁' },
    { id: 'ach-explorer', title: 'Explorador Sonoro', desc: 'Descobriu seu perfil musical.', icon: '✨' },
    { id: 'ach-acc', title: 'Acessibilidade Total', desc: 'Personalizou suas preferências de uso.', icon: '♿' },
    { id: 'ach-creator', title: 'Criador Musical', desc: 'Gravou sua própria sequência de notas.', icon: '🎼' }
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
      announceToSR(`Conquista desbloqueada: ${ach.title}`);
      setTimeout(() => {
        toast.hidden = true;
      }, 4000);
    }
  }

  // Renderizar o estado inicial das conquistas
  renderAchievements();

  /* ==========================================================================
     2. GERENCIADOR DE ACESSIBILIDADE & MODO SIMPLES (SEGURA PÓS-CONQUISTAS)
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
      console.warn("Não foi possível salvar preferencia.", e);
    }
    
    announceToSR(isEnabled ? "Modo Simples ativado. Layout limpo e direto." : "Modo Completo ativado.");
    unlockAchievement('ach-acc');
  }

  // Carregar preferência salva do Modo Simples com segurança
  try {
    if (localStorage.getItem('sonora_simple_mode') === 'true') {
      setSimpleMode(true);
    }
  } catch (e) {
    console.warn("Incapaz de acessar localStorage para preferência inicial.", e);
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

  // Alto Contraste & Contraste Suave
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
     3. SISTEMA DE ÁUDIO WEB AUDIO API
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
  }

  /* ==========================================================================
     4. AMBIENTE 3D DINÂMICO THREE.JS
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
    if (document.body.getAttribute('data-motion-reduce') === 'true') {
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

  init3D();

  /* ==========================================================================
     5. HERO INTERATIVO
     ========================================================================== */
  const heroOrb = document.getElementById('hero-orb');
  const heroSoundCaption = document.getElementById('hero-sound-caption');

  if (heroOrb) {
    heroOrb.addEventListener('click', () => {
      playSynthNote(440, 1.2, 'sine');
      if (heroSoundCaption) {
        heroSoundCaption.textContent = "Nota Lá (440Hz) executada com vibração visual no ambiente 3D.";
      }
      announceToSR("Nota Lá tocada no orbe.");
      unlockAchievement('ach-first-sound');
    });
  }

  /* ==========================================================================
     6. TECLADO MUSICAL
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
      keyBtn.setAttribute('aria-label', `Nota ${item.note}, tecla de atalho ${item.key}`);
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

  let isKeyHandled = false;
  window.addEventListener('keydown', (e) => {
    if (e.repeat || isKeyHandled) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const pressedKey = e.key.toUpperCase();
    const found = notesData.find(n => n.key === pressedKey);
    if (found) {
      isKeyHandled = true;
      const el = keysWrapper?.querySelector(`[data-note="${found.note}"]`);
      triggerNote(found, el);
    }
  });

  window.addEventListener('keyup', () => { isKeyHandled = false; });

  buildKeyboard();

  /* ==========================================================================
     7. BATERIA & PADS
     ========================================================================== */
  const drumPads = document.querySelectorAll('.drum-pad');
  let demoRhythmInterval = null;

  drumPads.forEach(pad => {
    pad.addEventListener('click', () => {
      const soundType = pad.dataset.sound;
      playDrumSound(soundType);
      pad.classList.add('active');
      setTimeout(() => pad.classList.remove('active'), 150);
      
      const padName = pad.querySelector('.pad-name')?.textContent || soundType;
      announceToSR(`Percussão: ${padName}`);
      unlockAchievement('ach-rhythm');
    });
  });

  const btnPlayDemo = document.getElementById('btn-play-demo-rhythm');
  const btnStopDemo = document.getElementById('btn-stop-demo-rhythm');

  btnPlayDemo?.addEventListener('click', () => {
    if (demoRhythmInterval) clearInterval(demoRhythmInterval);
    btnPlayDemo.hidden = true;
    if (btnStopDemo) btnStopDemo.hidden = false;

    let step = 0;
    demoRhythmInterval = setInterval(() => {
      if (step % 2 === 0) playDrumSound('kick');
      if (step % 4 === 2) playDrumSound('snare');
      playDrumSound('hihat');
      step++;
    }, 300);

    announceToSR("Demonstração de ritmo iniciada.");
  });

  btnStopDemo?.addEventListener('click', () => {
    if (demoRhythmInterval) clearInterval(demoRhythmInterval);
    btnPlayDemo.hidden = false;
    btnStopDemo.hidden = true;
    announceToSR("Demonstração de ritmo parada.");
  });

  /* ==========================================================================
     8. ESTÚDIO, GRAVAÇÃO & VISUALIZADOR OTIMIZADO
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
      btnRecord.setAttribute('aria-pressed', 'true');
      btnRecord.innerHTML = '<span class="dot"></span> Parar Gravação';
      if (recStatus) recStatus.textContent = "Gravando sua sequência de notas...";
      announceToSR("Gravação de notas iniciada.");
    } else {
      isRecording = false;
      btnRecord.classList.remove('recording');
      btnRecord.setAttribute('aria-pressed', 'false');
      btnRecord.innerHTML = '<span class="dot"></span> Gravar Sequência';
      
      if (recStatus) {
        recStatus.textContent = `Gravação concluída: ${recordedNotes.length} notas gravadas.`;
      }
      if (recordedNotes.length > 0) {
        if (btnPlayRec) btnPlayRec.disabled = false;
        if (btnClearRec) btnClearRec.disabled = false;
        unlockAchievement('ach-creator');
      }
      announceToSR("Gravação finalizada.");
    }
  });

  btnPlayRec?.addEventListener('click', () => {
    if (recordedNotes.length === 0) return;
    if (recStatus) recStatus.textContent = "Reproduzindo sequência armazenada...";
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
    if (recStatus) recStatus.textContent = "Gravação limpa.";
    announceToSR("Gravação descartada.");
  });

  // Metrônomo
  let metronomeInterval = null;
  const btnMetronome = document.getElementById('btn-toggle-metronome');
  const bpmInput = document.getElementById('metronome-bpm');
  const bpmDisplay = document.getElementById('bpm-display');

  btnMetronome?.addEventListener('click', () => {
    const active = btnMetronome.getAttribute('aria-pressed') === 'true';
    btnMetronome.setAttribute('aria-pressed', !active);

    if (!active) {
      const bpm = bpmInput ? parseInt(bpmInput.value) : 120;
      const intervalMs = (60 / bpm) * 1000;
      metronomeInterval = setInterval(() => {
        playSynthNote(800, 0.05, 'square');
      }, intervalMs);
      document.getElementById('metronome-status').textContent = "Ligado";
      announceToSR("Metrônomo ligado.");
    } else {
      if (metronomeInterval) clearInterval(metronomeInterval);
      document.getElementById('metronome-status').textContent = "Desligado";
      announceToSR("Metrônomo desligado.");
    }
  });

  bpmInput?.addEventListener('input', (e) => {
    if (bpmDisplay) bpmDisplay.textContent = `${e.target.value} BPM`;
  });

  // Renderizador Otimizado do Canvas Visualizador
  const canvas = document.getElementById('audio-visualizer-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let freqDataBuffer = null;

    function resizeCanvasIfNeeded() {
      if (canvas.width !== canvas.parentElement.clientWidth || canvas.height !== canvas.parentElement.clientHeight) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    }

    function drawVisualizer() {
      requestAnimationFrame(drawVisualizer);

      if (document.body.getAttribute('data-motion-reduce') === 'true') {
        return;
      }

      resizeCanvasIfNeeded();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!analyser) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(0, canvas.height / 2, canvas.width, 2);
        return;
      }

      if (!freqDataBuffer) {
        freqDataBuffer = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(freqDataBuffer);

      const bufferLength = freqDataBuffer.length;
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (freqDataBuffer[i] / 255) * canvas.height;
        ctx.fillStyle = `hsl(${i * 12 + 220}, 80%, 60%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    }
    drawVisualizer();
  }

  /* ==========================================================================
     9. PERFIL MUSICAL SENSORIAL
     ========================================================================== */
  const moodBtns = document.querySelectorAll('.mood-btn');
  const discoveryQuiz = document.getElementById('discovery-quiz-step');
  const discoveryResult = document.getElementById('discovery-result-step');

  const profilesMap = {
    calm: { title: "Perfil Harmonioso & Sereno", desc: "Sua busca é pela paz, ressonâncias orgânicas e fluidez acústica.", insts: ["Piano de Cauda", "Flauta Transversal", "Koto Japonês"] },
    energetic: { title: "Perfil Pulsante & Rítmico", desc: "Você se movimenta pela energia da percussão e batidas marcantes.", insts: ["Bateria Acústica", "Sintetizador Modular", "Congas"] },
    creative: { title: "Perfil Melódico & Criativo", desc: "Sua mente explora harmonias complexas e arranjos expressivos.", insts: ["Violino", "Guitarra Elétrica", "Saxofone Alto"] },
    curious: { title: "Perfil Explorador do Mundo", desc: "Você se encanta por timbres exóticos, tradições e ricas texturas.", insts: ["Didgeridoo", "Theremin", "Koto Japonês"] }
  };

  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      const result = profilesMap[mood] || profilesMap.calm;

      if (discoveryQuiz) discoveryQuiz.hidden = true;
      if (discoveryResult) discoveryResult.hidden = false;

      document.getElementById('discovery-profile-title').textContent = result.title;
      document.getElementById('discovery-profile-desc').textContent = result.desc;

      const listContainer = document.getElementById('discovery-recommendations-list');
      if (listContainer) {
        listContainer.innerHTML = result.insts.map(i => `<div class="rec-item">🎵 ${i}</div>`).join('');
      }

      announceToSR(`Resultado do perfil: ${result.title}`);
      unlockAchievement('ach-explorer');
    });
  });

  document.getElementById('btn-restart-discovery')?.addEventListener('click', () => {
    if (discoveryResult) discoveryResult.hidden = true;
    if (discoveryQuiz) discoveryQuiz.hidden = false;
  });

  /* ==========================================================================
     10. CATÁLOGO DE INSTRUMENTOS (DADOS & EVENTOS DINÂMICOS)
     ========================================================================== */
  const instrumentsData = [
    { id: 1, name: "Piano de Cauda", cat: "teclas", badge: "Teclas", desc: "Instrumento harmônico de cordas percutidas.", history: "Criado em 1700 por Bartolomeo Cristofori na Itália.", freq: 261.63 },
    { id: 2, name: "Sintetizador Modular", cat: "eletronicos", badge: "Eletrônicos", desc: "Gerador analógico e digital de frequências e timbres.", history: "Popularizado por Robert Moog nos anos 1960.", freq: 440.00 },
    { id: 3, name: "Violino", cat: "cordas", badge: "Cordas", desc: "Instrumento friccionado por arco de alta expressividade.", history: "Aprimorado pelos luthiers de Cremona nos séculos XVI e XVII.", freq: 440.00 },
    { id: 4, name: "Bateria Acústica", cat: "percussao", badge: "Percussão", desc: "Conjunto de tambores e pratos rítmicos.", history: "Evoluiu no início do século XX para o jazz americano.", freq: 130.00 },
    { id: 5, name: "Flauta Transversal", cat: "sopros", badge: "Sopros", desc: "Instrumento de sopro de madeira/metal de som cristalino.", history: "Uma das famílias de instrumentos mais antigas do mundo.", freq: 523.25 },
    { id: 6, name: "Guitarra Elétrica", cat: "cordas", badge: "Cordas", desc: "Cordas amplificadas eletromagneticamente.", history: "Transformou a música popular no século XX.", freq: 329.63 },
    { id: 7, name: "Didgeridoo", cat: "mundo", badge: "Do Mundo", desc: "Sopro de ressonância grave de origem aborígene.", history: "Desenvolvido pelos povos nativos do norte da Austrália.", freq: 98.00 },
    { id: 8, name: "Koto Japonês", cat: "mundo", badge: "Do Mundo", desc: "Cítara de 13 cordas com pontes móveis.", history: "Instrumento tradicional do Japão desde o século VIII.", freq: 293.66 },
    { id: 9, name: "Saxofone Alto", cat: "sopros", badge: "Sopros", desc: "Sopro de palheta simples e corpo de latão.", history: "Inventado por Adolphe Sax na Bélgica em 1846.", freq: 392.00 },
    { id: 10, name: "Theremin", cat: "eletronicos", badge: "Eletrônicos", desc: "Tocado sem contato físico, apenas por aproximação das mãos.", history: "Inventado por Léon Theremin em 1920.", freq: 587.33 },
    { id: 11, name: "Congas", cat: "percussao", badge: "Percussão", desc: "Tambores afro-cubanos tocados diretamente com as mãos.", history: "Fundamentais para a salsa e rumba cubana.", freq: 180.00 },
    { id: 12, name: "Órgão de Tubos", cat: "teclas", badge: "Teclas", desc: "O rei dos instrumentos, acionado por pressão de ar em tubos.", history: "Suas origens remontam à Grécia Antiga.", freq: 130.81 }
  ];

  const catalogGrid = document.getElementById('catalog-grid');
  const filterBtns = document.querySelectorAll('.catalog-filters .filter-btn');
  const instModal = document.getElementById('instrument-modal');
  const modalBody = document.getElementById('modal-content-body');
  let lastFocusedElement = null;

  function renderCatalog(filter = 'all') {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = '';

    const filtered = filter === 'all' ? instrumentsData : instrumentsData.filter(i => i.cat === filter);

    filtered.forEach(inst => {
      const card = document.createElement('article');
      card.className = 'instrument-card';
      card.innerHTML = `
        <div>
          <span class="badge">${inst.badge}</span>
          <h3>${inst.name}</h3>
          <p>${inst.desc}</p>
        </div>
        <button class="pill-btn outline open-inst-btn" data-id="${inst.id}">Detalhes & Som</button>
      `;

      card.querySelector('.open-inst-btn').addEventListener('click', (e) => {
        lastFocusedElement = e.currentTarget;
        openInstrumentModal(inst);
      });

      catalogGrid.appendChild(card);
    });
  }

  // Filtros com Semântica aria-pressed
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      const filter = btn.dataset.filter;
      renderCatalog(filter);
      announceToSR(`Exibindo categoria: ${btn.textContent}`);
    });
  });

  function openInstrumentModal(inst) {
    if (!instModal || !modalBody) return;

    modalBody.innerHTML = `
      <span class="badge">${inst.badge}</span>
      <h2 id="modal-title">${inst.name}</h2>
      <p style="margin: 1rem 0; color: var(--text-muted);">${inst.desc}</p>
      <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem;">
        <strong>História & Origem:</strong>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">${inst.history}</p>
      </div>
      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button id="btn-modal-play" class="pill-btn highlight">🔊 Ouvir Som</button>
        <button id="btn-modal-close" class="pill-btn outline">Fechar</button>
      </div>
    `;

    instModal.showModal();

    const btnPlay = document.getElementById('btn-modal-play');
    const btnClose = document.getElementById('btn-modal-close');

    btnPlay?.addEventListener('click', () => {
      playSynthNote(inst.freq, 1.2, 'sine');
      announceToSR(`Tocando amostra de ${inst.name}`);
    });

    btnClose?.addEventListener('click', closeModal);

    instModal.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeModal();
    }, { once: true });

    btnClose?.focus();
  }

  function closeModal() {
    if (instModal && instModal.open) {
      instModal.close();
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    }
  }

  renderCatalog();

  /* ==========================================================================
     11. QUIZ MUSICAL DE APRENDIZADO (8 PERGUNTAS)
     ========================================================================== */
  const quizQuestions = [
    { q: "Qual instrumento produz som através de martelos que batem em cordas metálicas?", opts: ["Piano", "Violino", "Flauta", "Bateria"], correct: 0 },
    { q: "Qual família de instrumentos utiliza palhetas ou sopro de ar em tubos?", opts: ["Cordas", "Sopros", "Percussão", "Eletrônicos"], correct: 1 },
    { q: "O instrumento Theremin tem como característica única:", opts: ["Ser tocado sem contato físico", "Ter 88 teclas", "Usar arco de crina", "Ser feito de bambu"], correct: 0 },
    { q: "Qual elemento rítmico sustenta o pulso de uma música?", opts: ["Melodia", "Harmonia", "Percussão / Bateria", "Sintetizador"], correct: 2 },
    { q: "O que caracteriza um sintetizador?", opts: ["Criação analógica/digital de sons e timbres", "Uso exclusivo de cordas de nylon", "Dependência de vento natural", "Necessidade de afinação com chave física"], correct: 0 },
    { q: "O Koto é um instrumento tradicional de qual cultura?", opts: ["Indiana", "Japonesa", "Egípcia", "Celta"], correct: 1 },
    { q: "Como o som de um violino é produzido predominantemente?", opts: ["Percussão de baquetas", "Fricção de arco nas cordas", "Injeção de ar sob pressão", "Teclas de madeira"], correct: 1 },
    { q: "Qual o papel da acessibilidade universal em uma ferramenta digital musical?", opts: ["Limitar as escolhas do usuário", "Garantir que todas as pessoas possam criar e interagir", "Substituir músicos reais por IA", "Remover imagens da tela"], correct: 1 }
  ];

  let currentQuizIndex = 0;
  let quizScore = 0;

  const quizCard = document.getElementById('quiz-question-card');
  const quizResult = document.getElementById('quiz-result-card');
  const quizText = document.getElementById('quiz-question-text');
  const quizOptions = document.getElementById('quiz-options-container');
  const quizCounter = document.getElementById('quiz-counter');
  const quizProgress = document.getElementById('quiz-progress-fill');

  function renderQuizQuestion() {
    if (!quizText || !quizOptions) return;

    const qData = quizQuestions[currentQuizIndex];
    quizText.textContent = qData.q;
    quizOptions.innerHTML = '';

    if (quizCounter) quizCounter.textContent = `Pergunta ${currentQuizIndex + 1} de ${quizQuestions.length}`;
    if (quizProgress) quizProgress.style.width = `${((currentQuizIndex) / quizQuestions.length) * 100}%`;

    qData.opts.forEach((optText, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = optText;
      btn.addEventListener('click', () => handleQuizAnswer(i));
      quizOptions.appendChild(btn);
    });
  }

  function handleQuizAnswer(selectedIndex) {
    if (selectedIndex === quizQuestions[currentQuizIndex].correct) {
      quizScore++;
      announceToSR("Resposta correta!");
    } else {
      announceToSR("Resposta registrada.");
    }

    currentQuizIndex++;
    if (currentQuizIndex < quizQuestions.length) {
      renderQuizQuestion();
    } else {
      showQuizResults();
    }
  }

  function showQuizResults() {
    if (quizCard) quizCard.hidden = true;
    if (quizResult) quizResult.hidden = false;
    if (quizProgress) quizProgress.style.width = `100%`;

    const title = document.getElementById('quiz-result-title');
    const text = document.getElementById('quiz-result-text');

    if (title) title.textContent = `Você acertou ${quizScore} de ${quizQuestions.length} perguntas!`;
    if (text) {
      text.textContent = quizScore >= 6 
        ? "Sensacional! Você demonstra excelente percepção e afinidade com o universo musical inclusivo." 
        : "Ótima exploração! Continue navegando pelo Sonora para aprofundar seu conhecimento sobre os timbres e instrumentos.";
    }

    announceToSR(`Quiz finalizado. Pontuação: ${quizScore} de ${quizQuestions.length}.`);
  }

  document.getElementById('btn-restart-quiz')?.addEventListener('click', () => {
    currentQuizIndex = 0;
    quizScore = 0;
    if (quizResult) quizResult.hidden = true;
    if (quizCard) quizCard.hidden = false;
    renderQuizQuestion();
  });

  renderQuizQuestion();

  /* ==========================================================================
     12. PERCURSO GUIADO (ONBOARDING MODAL)
     ========================================================================== */
  const tourModal = document.getElementById('guided-tour-modal');
  const btnStartTour = document.getElementById('btn-start-tour');
  const btnSkipTour = document.getElementById('btn-skip-tour');

  try {
    const tourDone = localStorage.getItem('sonora_tour_done');
    if (!tourDone && tourModal) {
      setTimeout(() => tourModal.showModal(), 800);
    }
  } catch (e) {
    console.warn("Não foi possível ler status do tour.", e);
  }

  btnStartTour?.addEventListener('click', () => {
    try {
      localStorage.setItem('sonora_tour_done', 'true');
    } catch (e) {}
    if (tourModal) tourModal.close();
    window.location.hash = '#meu-jeito';
    announceToSR("Redirecionado para o centro de acessibilidade Meu Jeito de Usar.");
  });

  btnSkipTour?.addEventListener('click', () => {
    try {
      localStorage.setItem('sonora_tour_done', 'true');
    } catch (e) {}
    if (tourModal) tourModal.close();
    announceToSR("Percurso guiado encerrado.");
  });

});
