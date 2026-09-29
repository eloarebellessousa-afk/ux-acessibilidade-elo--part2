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
      
      const volInput = document.getElementById('master-volume');
      masterGain.gain.value = volInput ? parseFloat(volInput.value) : 0.8;
      
      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Tocar Notas Harmônicas Sintetizadas
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

  // Sons Sintetizados da Bateria sem Dependência de Internet
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
     2. AMBIENTE 3D DINÂMICO MULTICAMADA (THREE.JS)
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

    // Partículas (Orbe de Timbres)
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

    // Mesh Geométrico Central
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
     3. GERENCIADOR DE ACESSIBILIDADE & MODO SIMPLES
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

  // Toggle Modo Simples Reorganizado
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

    localStorage.setItem('sonora_simple_mode', isEnabled);
    announceToSR(isEnabled ? "Modo Simples ativado. Layout limpo e direto." : "Modo Completo ativado.");
    unlockAchievement('ach-acc');
  }

  // Carregar preferência salva
  if (localStorage.getItem('sonora_simple_mode') === 'true') {
    setSimpleMode(true);
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

  document.getElementById('master-volume')?.addEventListener('input', (e) => {
    if (masterGain) {
      masterGain.gain.value = parseFloat(e.target.value);
    }
  });

  document.getElementById('btn-quick-speech')?.addEventListener('click', () => {
    speakText("Você está no Sonora, uma experiência digital musical focada em acessibilidade universal.");
  });

  /* ==========================================================================
     4. HERO INTERATIVO
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
     5. TECLADO MUSICAL COMPLETO (3 MODOS)
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

  let currentKeyMode = 'free'; // 'free', 'learn', 'challenge'
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

    // Lógica do Modo Aprender/Desafio
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

  // Modos do Teclado
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
     6. BATERIA & PADS
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

  // Demonstrador de Ritmo
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
     7. ESTÚDIO, GRAVAÇÃO & METRÔNOMO
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
      if (recStatus) recStatus.textContent = "Gravando notas e ritmos...";
      announceToSR("Gravação iniciada.");
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

  // Renderizador do Canvas Visualizador
  const canvas = document.getElementById('audio-visualizer-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    function drawVisualizer() {
      requestAnimationFrame(drawVisualizer);
      if (canvas.width !== canvas.parentElement.clientWidth) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!analyser) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
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
     8. PERFIL MUSICAL SENSORIAL
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
    if (discoveryQuiz) discoveryQuiz.hidden = false;
    if (discoveryResult) discoveryResult.hidden = true;
  });

  /* ==========================================================================
     9. CATÁLOGO DE INSTRUMENTOS (12 INSTRUMENTOS CURADOS)
     ========================================================================== */
  const instruments = [
    { id: '1', name: 'Piano de Cauda', category: 'teclas', desc: 'Clássico expressivo de ampla extensão dinâmica.', detail: 'Composto por mais de 12.000 peças que acionam martelos de feltro contra cordas de aço.' },
    { id: '2', name: 'Sintetizador Modular', category: 'eletronicos', desc: 'Escultura sonora através de ondas sintéticas.', detail: 'Gera timbres únicos modulando frequências e envelopes elétricos.' },
    { id: '3', name: 'Violino', category: 'cordas', desc: 'Voz aguda e expressiva das orquestras.', detail: 'Instrumento friccionado por arco com 4 cordas e ressonância em madeira nobre.' },
    { id: '4', name: 'Guitarra Elétrica', category: 'cordas', desc: 'Ícone da música moderna e solos marcantes.', detail: 'Converte a vibração de cordas de aço em sinais elétricos via captadores magnéticos.' },
    { id: '5', name: 'Bateria Acústica', category: 'percussao', desc: 'Base rítmica e pulsante para diversos estilos.', detail: 'Combina bumbos, caixas e pratos para ditar o tempo em conjunto.' },
    { id: '6', name: 'Congas Tradicionais', category: 'percussao', desc: 'Tambores caribenhos de som quente.', detail: 'Tocados diretamente com as mãos em peles tencionadas.' },
    { id: '7', name: 'Flauta Transversal', category: 'sopros', desc: 'Timbre aéreo, brilhante e veloz.', detail: 'Embora construída em metal, pertence à família das madeiras pelo sopro indireto.' },
    { id: '8', name: 'Saxofone Alto', category: 'sopros', desc: 'Expressividade marcante no Jazz e Blues.', detail: 'Utiliza palheta simples e chaves de metal para alterar o comprimento da coluna de ar.' },
    { id: '9', name: 'Koto Japonês', category: 'mundo', desc: 'Cítara tradicional asiática de 13 cordas.', detail: 'Instrumento nacional do Japão tocado com dedais especiais de madeira ou marfim.' },
    { id: '10', name: 'Didgeridoo', category: 'mundo', desc: 'Sopro ancestral dos povos aborígenes.', detail: 'Produz um zumbido grave característico através da técnica de respiração circular.' },
    { id: '11', name: 'Theremin', category: 'eletronicos', desc: 'Tocado sem qualquer contato físico.', detail: 'Controlado pela aproximação das mãos em duas antenas de rádio frequência.' },
    { id: '12', name: 'Clavinete Digital', category: 'teclas', desc: 'Timbre rítmico percussivo e encorpado.', detail: 'Pioneiro na música pop e funk dos anos 70, adaptado para reprodução digital.' }
  ];

  const catalogGrid = document.getElementById('catalog-grid');

  function renderCatalog(filter = 'all') {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = '';

    const filtered = filter === 'all' ? instruments : instruments.filter(i => i.category === filter);

    filtered.forEach(item => {
      const card = document.createElement('article');
      card.className = 'instrument-card';
      card.innerHTML = `
        <div>
          <span class="badge">${item.category}</span>
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
        </div>
        <button class="pill-btn outline" onclick="openInstrumentModal('${item.id}')" aria-label="Ver detalhes sobre ${item.name}">Detalhes & Timbres</button>
      `;
      catalogGrid.appendChild(card);
    });
  }

  let lastActiveModalTrigger = null;

  window.openInstrumentModal = function(id) {
    lastActiveModalTrigger = document.activeElement;
    const item = instruments.find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById('instrument-modal');
    const body = document.getElementById('modal-content-body');
    
    body.innerHTML = `
      <span class="badge">${item.category}</span>
      <h2 id="modal-title" style="font-size:2rem; margin:0.5rem 0; color:var(--text-bright);">${item.name}</h2>
      <p style="margin-bottom:1.5rem; color: var(--text-muted);">${item.detail}</p>
      <div style="display:flex; gap:1rem; flex-wrap:wrap;">
        <button class="pill-btn highlight" id="btn-modal-play">🎧 Ouvir Demonstração</button>
        <button class="pill-btn outline" id="btn-modal-close">Fechar (Esc)</button>
      </div>
    `;

    modal.showModal();

    document.getElementById('btn-modal-play')?.addEventListener('click', () => {
      playSynthNote(440, 1.2, 'sine');
      announceToSR(`Demonstração sonora do instrumento ${item.name} executada.`);
    });

    document.getElementById('btn-modal-close')?.addEventListener('click', closeModal);

    unlockAchievement('ach-explorer');
  };

  function closeModal() {
    const modal = document.getElementById('instrument-modal');
    if (modal) modal.close();
    if (lastActiveModalTrigger) lastActiveModalTrigger.focus();
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderCatalog(e.target.dataset.filter);
    });
  });

  renderCatalog();

  /* ==========================================================================
     10. QUIZ MUSICAL REAL (8 PERGUNTAS)
     ========================================================================== */
  const quizQuestions = [
    { q: '1. Que tipo de experiência sonora você prefere?', opts: [{ t: 'Acústica e Suave', score: 'teclas' }, { t: 'Forte e Rítmica', score: 'percussao' }, { t: 'Eletrônica e Futurista', score: 'eletronicos' }, { t: 'Expressiva e Melódica', score: 'cordas' }] },
    { q: '2. Qual ambiente de criação te inspira mais?', opts: [{ t: 'Sala Sinfônica', score: 'teclas' }, { t: 'Palco de Festival', score: 'percussao' }, { t: 'Estúdio de Produção', score: 'eletronicos' }, { t: 'Encontro Intimista', score: 'cordas' }] },
    { q: '3. Como você prefere interagir com a música?', opts: [{ t: 'Tocando teclas e acordes', score: 'teclas' }, { t: 'Marcando o tempo com baquetas/mãos', score: 'percussao' }, { t: 'Manipulando botões e frequências', score: 'eletronicos' }, { t: 'Dedilhando ou usando um arco', score: 'cordas' }] },
    { q: '4. Qual o seu objetivo principal ao ouvir música?', opts: [{ t: 'Relaxar e meditar', score: 'teclas' }, { t: 'Sentir energia e dançar', score: 'percussao' }, { t: 'Explorar novos sons', score: 'eletronicos' }, { t: 'Emocionar-se com melodias', score: 'cordas' }] },
    { q: '5. Se você fosse compor uma faixa, por onde começaria?', opts: [{ t: 'Pela harmonia de fundo', score: 'teclas' }, { t: 'Pelo ritmo da bateria', score: 'percussao' }, { t: 'Pela textura dos sintetizadores', score: 'eletronicos' }, { t: 'Pelo solo principal', score: 'cordas' }] },
    { q: '6. Que cor você associa à sua energia sonora?', opts: [{ t: 'Azul sereno', score: 'teclas' }, { t: 'Vermelho vibrante', score: 'percussao' }, { t: 'Neon lilás', score: 'eletronicos' }, { t: 'Dourado aquecido', score: 'cordas' }] },
    { q: '7. Como você lida com improvisação?', opts: [{ t: 'Prefiro estruturas conhecidas', score: 'teclas' }, { t: 'Adoro criar ritmos na hora', score: 'percussao' }, { t: 'Gosto de experimentar sem regras', score: 'eletronicos' }, { t: 'Sigo a intuição do momento', score: 'cordas' }] },
    { q: '8. Escolha a sensação final que deseja sentir:', opts: [{ t: 'Equilíbrio mental', score: 'teclas' }, { t: 'Euforia e vitalidade', score: 'percussao' }, { t: 'Curiosidade constante', score: 'eletronicos' }, { t: 'Conexão profunda', score: 'cordas' }] }
  ];

  let currentQuizStep = 0;
  let quizScores = { teclas: 0, percussao: 0, eletronicos: 0, cordas: 0 };

  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsContainer = document.getElementById('quiz-options-container');
  const quizCounter = document.getElementById('quiz-counter');
  const quizProgressFill = document.getElementById('quiz-progress-fill');

  function renderQuizStep() {
    if (!quizQuestionText) return;

    const currentItem = quizQuestions[currentQuizStep];
    quizQuestionText.textContent = currentItem.q;
    if (quizCounter) quizCounter.textContent = `Pergunta ${currentQuizStep + 1} de ${quizQuestions.length}`;
    if (quizProgressFill) quizProgressFill.style.width = `${((currentQuizStep) / quizQuestions.length) * 100}%`;

    quizOptionsContainer.innerHTML = '';

    currentItem.opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt.t;
      btn.addEventListener('click', () => {
        quizScores[opt.score]++;
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

    if (quizProgressFill) quizProgressFill.style.width = '100%';

    // Determinar categoria vencedora
    let winnerCategory = 'teclas';
    let maxVal = -1;
    for (const [cat, val] of Object.entries(quizScores)) {
      if (val > maxVal) {
        maxVal = val;
        winnerCategory = cat;
      }
    }

    const recommendations = {
      teclas: "Seu perfil combina perfeitamente com o Piano de Cauda e Teclados Digitais!",
      percussao: "Sua afinidade natural é com a Bateria Acústica e instrumentos de percussão!",
      eletronicos: "Seu universo é o dos Sintetizadores Modulares e Theremin!",
      cordas: "Sua alma ressoa com o Violino, Guitarra Elétrica e instrumentos de cordas!"
    };

    document.getElementById('quiz-result-text').textContent = recommendations[winnerCategory];
    announceToSR("Quiz concluído com sucesso!");
    unlockAchievement('ach-learner');
  }

  document.getElementById('btn-restart-quiz')?.addEventListener('click', () => {
    currentQuizStep = 0;
    quizScores = { teclas: 0, percussao: 0, eletronicos: 0, cordas: 0 };
    document.getElementById('quiz-question-card').hidden = false;
    document.getElementById('quiz-result-card').hidden = true;
    renderQuizStep();
  });

  renderQuizStep();

  /* ==========================================================================
     11. GAMIFICAÇÃO & PERSISTÊNCIA
     ========================================================================== */
  const achievements = [
    { id: 'ach-first-sound', name: 'Primeiro Som', desc: 'Emitiu uma nota no teclado ou no hero.' },
    { id: 'ach-rhythm', name: 'Primeiro Ritmo', desc: 'Interagiu com a estação de bateria.' },
    { id: 'ach-melody', name: 'Primeira Melodia', desc: 'Completou um desafio no teclado.' },
    { id: 'ach-explorer', name: 'Explorador', desc: 'Explorou detalhes no acervo de instrumentos.' },
    { id: 'ach-creator', name: 'Criador', desc: 'Gravou e salvou uma sequência no Estúdio.' },
    { id: 'ach-acc', name: 'Personalizador', desc: 'Ajustou preferências no Centro de Acessibilidade.' },
    { id: 'ach-learner', name: 'Aprendiz', desc: 'Concluiu o Quiz de Afinidade Sonora.' }
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
        <div class="ach-icon" aria-hidden="true">${isUnlocked ? '🏆' : '🔒'}</div>
        <div>
          <span class="ach-title">${ach.name}</span>
          <span class="ach-desc">${ach.desc}</span>
        </div>
      `;
      grid.appendChild(card);
    });

    const pct = Math.round((unlockedIds.length / achievements.length) * 100);
    const pctText = document.getElementById('journey-percentage-text');
    const pctBar = document.getElementById('journey-bar-fill');
    if (pctText) pctText.textContent = `${pct}%`;
    if (pctBar) pctBar.style.width = `${pct}%`;
  }

  function unlockAchievement(id) {
    if (!unlockedIds.includes(id)) {
      unlockedIds.push(id);
      localStorage.setItem('sonora_achievements', JSON.stringify(unlockedIds));
      renderAchievements();

      const ach = achievements.find(a => a.id === id);
      if (ach) {
        const toast = document.getElementById('achievement-toast');
        const toastName = document.getElementById('toast-achievement-name');
        if (toastName) toastName.textContent = ach.name;
        if (toast) {
          toast.hidden = false;
          setTimeout(() => toast.hidden = true, 4000);
        }
      }
    }
  }

  renderAchievements();

  /* ==========================================================================
     12. PERCURSO GUIADO (ONBOARDING)
     ========================================================================== */
  const tourModal = document.getElementById('guided-tour-modal');
  if (tourModal && !localStorage.getItem('sonora_tour_completed')) {
    setTimeout(() => tourModal.showModal(), 800);
  }

  document.getElementById('btn-start-tour')?.addEventListener('click', () => {
    localStorage.setItem('sonora_tour_completed', 'true');
    tourModal.close();
    setSimpleMode(true);
  });

  document.getElementById('btn-skip-tour')?.addEventListener('click', () => {
    localStorage.setItem('sonora_tour_completed', 'true');
    tourModal.close();
  });

});
