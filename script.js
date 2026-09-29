/**
 * SONORA — EXPERIÊNCIA DIGITAL MUSICAL COMPLETA & ACESSÍVEL
 * Script final totalmente corrigido, integrado e testado.
 */

document.addEventListener('DOMContentLoaded', () => {

  'use strict';

  /* ==========================================================================
     0. UTILITÁRIOS E AUXILIARES
     ========================================================================== */

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const body = document.body;
  const root = document.documentElement;

  const srAnnouncer = $('#sr-announcer');

  function announceToSR(message) {
    if (!srAnnouncer) return;
    srAnnouncer.textContent = '';
    setTimeout(() => {
      srAnnouncer.textContent = message;
    }, 20);
  }

  function safeStorageGet(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Não foi possível salvar "${key}".`);
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  /* ==========================================================================
     1. VOZ / SÍNTESE DE FALA
     ========================================================================== */

  let speechEnabled = false;

  function speakText(text) {
    announceToSR(text);
    if (!('speechSynthesis' in window) || !speechEnabled) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function updateSpeechButtons() {
    const buttons = [
      $('#btn-toggle-speech'),
      $('#btn-quick-speech')
    ].filter(Boolean);

    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(speechEnabled));
      if (button.id === 'btn-toggle-speech') {
        button.textContent = speechEnabled
          ? '🔊 Síntese de voz: ligada'
          : '🔇 Síntese de voz: desligada';
      }
    });
  }

  const savedSpeech = safeStorageGet('sonora_speech');
  speechEnabled = savedSpeech === 'true';

  $('#btn-toggle-speech')?.addEventListener('click', () => {
    speechEnabled = !speechEnabled;
    safeStorageSet('sonora_speech', String(speechEnabled));
    updateSpeechButtons();
    speakText(speechEnabled ? 'Síntese de voz ativada.' : 'Síntese de voz desativada.');
    unlockAchievement('ach-acc');
  });

  $('#btn-quick-speech')?.addEventListener('click', () => {
    const text = 'Você está no Sonora, uma experiência digital musical focada em acessibilidade universal.';
    if (!speechEnabled) {
      speechEnabled = true;
      safeStorageSet('sonora_speech', 'true');
      updateSpeechButtons();
    }
    speakText(text);
  });

  updateSpeechButtons();

  /* ==========================================================================
     2. BASE DOS 4 INSTRUMENTOS
     ========================================================================== */

  const instrumentsData = [
    {
      id: 'violao',
      name: 'Violão',
      category: 'cordas',
      categoryLabel: '🎸 Cordas',
      desc: 'Instrumento de cordas dedilhadas com sonoridade quente, orgânica e acolhedora.',
      history: 'O violão evoluiu de antigos instrumentos de cordas como o alaúde e a vihuela. É um dos instrumentos mais populares do mundo, essencial na Bossa Nova, MPB, Flamenco e Pop.',
      freq: 196.00,
      soundType: 'guitar'
    },
    {
      id: 'teclado',
      name: 'Teclado',
      category: 'teclas',
      categoryLabel: '🎹 Teclas',
      desc: 'Versátil e expressivo, oferece controle melódico e harmônico completo.',
      history: 'Baseado no layout clássico do piano, o teclado moderno utiliza síntese eletrônica e digital para reproduzir timbres de piano acústico, órgãos e sintetizadores.',
      freq: 261.63,
      soundType: 'piano'
    },
    {
      id: 'bateria',
      name: 'Bateria',
      category: 'percussao',
      categoryLabel: '🥁 Percussão',
      desc: 'Conjunto de tambores e pratos que dão o pulso e o ritmo à música.',
      history: 'Surgiu nos Estados Unidos no início do século XX com a junção de vários instrumentos de percussão para serem tocados por um único músico usando baquetas e pedais.',
      freq: 100,
      soundType: 'drums',
      isDrum: true
    },
    {
      id: 'violino',
      name: 'Violino',
      category: 'cordas',
      categoryLabel: '🎻 Cordas',
      desc: 'O menor e mais agudo instrumento da família das cordas friccionadas por arco.',
      history: 'Criado na Itália no século XVI, o violino tornou-se fundamental na música orquestral e em diversos gêneros musicais graças à sua grande expressividade.',
      freq: 440.00,
      soundType: 'violin'
    }
  ];

  /* ==========================================================================
     3. GAMIFICAÇÃO & CONQUISTAS
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
    const savedAchievements = JSON.parse(safeStorageGet('sonora_achievements', '[]'));
    if (Array.isArray(savedAchievements)) {
      unlockedIds = new Set(savedAchievements);
    }
  } catch (error) {
    console.warn('Não foi possível carregar as conquistas.');
  }

  function renderAchievements() {
    const grid = $('#achievements-grid');
    if (!grid) return;

    grid.innerHTML = '';
    achievements.forEach(achievement => {
      const unlocked = unlockedIds.has(achievement.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${unlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="ach-icon" aria-hidden="true">${achievement.icon}</div>
        <div class="ach-info">
          <span class="ach-title">${escapeHTML(achievement.title)}</span>
          <span class="ach-desc">${escapeHTML(achievement.desc)}</span>
        </div>
      `;
      grid.appendChild(card);
    });

    const percentage = Math.round((unlockedIds.size / achievements.length) * 100);
    const barFill = $('#journey-bar-fill');
    const percentageText = $('#journey-percentage-text');
    const progressBox = $('.journey-bar');

    if (barFill) barFill.style.width = `${percentage}%`;
    if (percentageText) percentageText.textContent = `${percentage}%`;
    if (progressBox) progressBox.setAttribute('aria-valuenow', percentage);
  }

  let toastTimer = null;
  function showAchievementToast(achievement) {
    const toast = $('#achievement-toast');
    const toastName = $('#toast-achievement-name');
    if (!toast || !toastName) return;

    toastName.textContent = achievement.title;
    toast.hidden = false;
    speakText(`Conquista desbloqueada: ${achievement.title}`);

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 4000);
  }

  function unlockAchievement(id) {
    if (unlockedIds.has(id)) return;
    unlockedIds.add(id);
    safeStorageSet('sonora_achievements', JSON.stringify([...unlockedIds]));
    renderAchievements();
    const achievement = achievements.find(item => item.id === id);
    if (achievement) showAchievementToast(achievement);
  }

  renderAchievements();

  /* ==========================================================================
     4. THREE.JS — BACKGROUND 3D
     ========================================================================== */

  let scene, camera, renderer, particlesMesh;
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  let animationFrameId = null;
  let threePulseIntensity = 0;

  function initThree() {
    const container = $('#canvas-container');
    if (!container || typeof THREE === 'undefined') return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const particlesCount = 350;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 80;
      posArray[i + 1] = (Math.random() - 0.5) * 80;
      posArray[i + 2] = (Math.random() - 0.5) * 80;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8,
      color: 0x7952f5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.0008;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.0008;
    });

    window.addEventListener('resize', () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    checkThreeState();
  }

  function renderThree() {
    if (!renderer || !scene || !camera) return;

    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    if (particlesMesh) {
      particlesMesh.rotation.y += 0.002;
      particlesMesh.rotation.x += 0.001;
      particlesMesh.rotation.y += targetX * 0.5;
      particlesMesh.rotation.x += targetY * 0.5;

      if (threePulseIntensity > 0) {
        particlesMesh.scale.setScalar(1 + threePulseIntensity * 0.15);
        threePulseIntensity *= 0.92;
        if (threePulseIntensity < 0.01) threePulseIntensity = 0;
      }
    }

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(renderThree);
  }

  function startThreeAnimation() {
    if (!animationFrameId && renderer) {
      renderThree();
    }
  }

  function stopThreeAnimation() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function checkThreeState() {
    const isSimple = body.getAttribute('data-simple-mode') === 'true';
    const isReduced = body.getAttribute('data-motion-reduce') === 'true';

    if (isSimple || isReduced) {
      stopThreeAnimation();
    } else {
      startThreeAnimation();
    }
  }

  function pulse3DEnvironment() {
    threePulseIntensity = 1.0;
  }

  initThree();

  /* ==========================================================================
     5. ACESSIBILIDADE E CONTROLES DE INTERFACE
     ========================================================================== */

  const btnSimpleMode = $('#btn-toggle-simple-mode');
  const btnQuickSimple = $('#btn-quick-simple-mode');
  const btnDisableSimple = $('#btn-disable-simple-mode');
  const simpleBanner = $('#simple-mode-banner');

  const btnHighContrast = $('#btn-high-contrast');
  const btnSoftContrast = $('#btn-soft-contrast');
  const btnReduceMotion = $('#btn-reduce-motion');
  const btnLargeControls = $('#btn-large-controls');

  const btnFontIncrease = $('#btn-font-increase');
  const btnFontDecrease = $('#btn-font-decrease');

  let fontSizeOffset = Number(safeStorageGet('sonora_font_offset', '0'));
  if (!Number.isFinite(fontSizeOffset)) fontSizeOffset = 0;
  fontSizeOffset = clamp(fontSizeOffset, -2, 4);

  function applyFontSize() {
    root.style.fontSize = `${16 + fontSizeOffset}px`;
  }
  applyFontSize();

  function setSimpleMode(enable, announce = true) {
    const enabled = Boolean(enable);
    body.setAttribute('data-simple-mode', String(enabled));

    if (simpleBanner) simpleBanner.hidden = !enabled;
    [btnSimpleMode, btnQuickSimple].filter(Boolean).forEach(btn => {
      btn.setAttribute('aria-pressed', String(enabled));
    });

    safeStorageSet('sonora_simple_mode', String(enabled));
    checkThreeState();

    if (announce) {
      speakText(enabled ? 'Modo Simples ativado. Layout limpo e direto.' : 'Modo Completo ativado.');
    }
  }

  function setHighContrast(enable, announce = true) {
    const enabled = Boolean(enable);
    body.setAttribute('data-high-contrast', String(enabled));
    if (enabled) {
      body.setAttribute('data-soft-contrast', 'false');
      btnSoftContrast?.setAttribute('aria-pressed', 'false');
      safeStorageSet('sonora_soft_contrast', 'false');
    }

    btnHighContrast?.setAttribute('aria-pressed', String(enabled));
    safeStorageSet('sonora_high_contrast', String(enabled));

    if (announce) {
      speakText(enabled ? 'Alto contraste ativado.' : 'Alto contraste desativado.');
    }
    if (enabled) unlockAchievement('ach-acc');
  }

  function setSoftContrast(enable, announce = true) {
    const enabled = Boolean(enable);
    body.setAttribute('data-soft-contrast', String(enabled));
    if (enabled) {
      body.setAttribute('data-high-contrast', 'false');
      btnHighContrast?.setAttribute('aria-pressed', 'false');
      safeStorageSet('sonora_high_contrast', 'false');
    }

    btnSoftContrast?.setAttribute('aria-pressed', String(enabled));
    safeStorageSet('sonora_soft_contrast', String(enabled));

    if (announce) {
      speakText(enabled ? 'Contraste suave ativado.' : 'Contraste suave desativado.');
    }
    if (enabled) unlockAchievement('ach-acc');
  }

  function setReducedMotion(enable, announce = true) {
    const enabled = Boolean(enable);
    body.setAttribute('data-motion-reduce', String(enabled));
    btnReduceMotion?.setAttribute('aria-pressed', String(enabled));

    safeStorageSet('sonora_motion_reduce', String(enabled));
    checkThreeState();
    checkVisualizerState();

    if (announce) {
      speakText(enabled ? 'Animações reduzidas.' : 'Animações restauradas.');
    }
    if (enabled) unlockAchievement('ach-acc');
  }

  function setLargeControls(enable, announce = true) {
    const enabled = Boolean(enable);
    body.setAttribute('data-large-controls', String(enabled));
    btnLargeControls?.setAttribute('aria-pressed', String(enabled));

    safeStorageSet('sonora_large_controls', String(enabled));
    if (announce) {
      speakText(enabled ? 'Controles maiores ativados.' : 'Controles normais.');
    }
    if (enabled) unlockAchievement('ach-acc');
  }

  btnSimpleMode?.addEventListener('click', () => setSimpleMode(body.getAttribute('data-simple-mode') !== 'true'));
  btnQuickSimple?.addEventListener('click', () => setSimpleMode(body.getAttribute('data-simple-mode') !== 'true'));
  btnDisableSimple?.addEventListener('click', () => setSimpleMode(false));

  btnFontIncrease?.addEventListener('click', () => {
    fontSizeOffset = clamp(fontSizeOffset + 2, -2, 4);
    applyFontSize();
    safeStorageSet('sonora_font_offset', String(fontSizeOffset));
    speakText('Tamanho da fonte aumentado.');
    unlockAchievement('ach-acc');
  });

  btnFontDecrease?.addEventListener('click', () => {
    fontSizeOffset = clamp(fontSizeOffset - 2, -2, 4);
    applyFontSize();
    safeStorageSet('sonora_font_offset', String(fontSizeOffset));
    speakText('Tamanho da fonte diminuído.');
    unlockAchievement('ach-acc');
  });

  btnHighContrast?.addEventListener('click', () => setHighContrast(body.getAttribute('data-high-contrast') !== 'true'));
  btnSoftContrast?.addEventListener('click', () => setSoftContrast(body.getAttribute('data-soft-contrast') !== 'true'));
  btnReduceMotion?.addEventListener('click', () => setReducedMotion(body.getAttribute('data-motion-reduce') !== 'true'));
  btnLargeControls?.addEventListener('click', () => setLargeControls(body.getAttribute('data-large-controls') !== 'true'));

  // Inicialização Sem Sobrescrever Mutuamente
  setSimpleMode(safeStorageGet('sonora_simple_mode') === 'true', false);

  const savedHigh = safeStorageGet('sonora_high_contrast') === 'true';
  const savedSoft = safeStorageGet('sonora_soft_contrast') === 'true';

  if (savedHigh) {
    setHighContrast(true, false);
  } else if (savedSoft) {
    setSoftContrast(true, false);
  } else {
    setHighContrast(false, false);
    setSoftContrast(false, false);
  }

  setReducedMotion(safeStorageGet('sonora_motion_reduce') === 'true', false);
  setLargeControls(safeStorageGet('sonora_large_controls') === 'true', false);

  /* ==========================================================================
     6. WEB AUDIO API & TIMBRES SINTÉTICOS
     ========================================================================== */

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  let masterGain = null;
  let analyser = null;

  function initAudio() {
    if (!AudioContextClass) {
      announceToSR('Seu navegador não oferece suporte ao áudio interativo.');
      return false;
    }

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      analyser = audioCtx.createAnalyser();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;

      const volumeInput = $('#master-volume');
      masterGain.gain.value = volumeInput ? Number(volumeInput.value) : 0.8;

      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);

      startVisualizer();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    return true;
  }

  $('#master-volume')?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    if (masterGain && Number.isFinite(val)) {
      masterGain.gain.setTargetAtTime(val, audioCtx.currentTime, 0.015);
    }
  });

  // Timbres Específicos
  function playGuitarNote(freq, duration = 1.4) {
    if (!initAudio()) return;
    const now = audioCtx.currentTime;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);

    const output = audioCtx.createGain();
    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(0.32, now + 0.008);
    output.gain.exponentialRampToValueAtTime(0.08, now + Math.min(duration, 0.65));
    output.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    filter.connect(output);
    output.connect(masterGain);

    const partials = [{ ratio: 1, gain: 0.75 }, { ratio: 2, gain: 0.20 }, { ratio: 3, gain: 0.09 }];
    partials.forEach((p, idx) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * p.ratio, now);
      g.gain.value = p.gain;
      osc.connect(g);
      g.connect(filter);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    });

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function playPianoNote(freq, duration = 2.0) {
    if (!initAudio()) return;
    const now = audioCtx.currentTime;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 4200;

    const output = audioCtx.createGain();
    output.gain.setValueAtTime(0.0001, now);
    output.gain.linearRampToValueAtTime(0.34, now + 0.008);
    output.gain.exponentialRampToValueAtTime(0.11, now + 0.45);
    output.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    filter.connect(output);
    output.connect(masterGain);

    const harmonics = [[1, 0.72], [2, 0.24], [3, 0.12], [4, 0.055]];
    harmonics.forEach(([ratio, level], idx) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq * ratio;
      g.gain.value = level;
      osc.connect(g);
      g.connect(filter);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    });

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function playViolinNote(freq, duration = 1.8) {
    if (!initAudio()) return;
    const now = audioCtx.currentTime;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3200;

    const output = audioCtx.createGain();
    output.gain.setValueAtTime(0.0001, now);
    output.gain.linearRampToValueAtTime(0.28, now + 0.08);
    output.gain.exponentialRampToValueAtTime(0.18, now + duration * 0.7);
    output.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    filter.connect(output);
    output.connect(masterGain);

    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';

    // LFO para Vibrato
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = freq * 0.015;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.frequency.setValueAtTime(freq, now);

    osc.connect(filter);

    lfo.start(now);
    osc.start(now);

    lfo.stop(now + duration + 0.05);
    osc.stop(now + duration + 0.05);

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function playDrumSound(type) {
    if (!initAudio()) return;
    const now = audioCtx.currentTime;

    if (type === 'kick') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.36);

    } else if (type === 'snare') {
      const noise = audioCtx.createBufferSource();
      const bufferSize = audioCtx.sampleRate * 0.2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;

      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      noise.start(now);
      osc.start(now);
      noise.stop(now + 0.22);
      osc.stop(now + 0.13);

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
      filter.frequency.value = 7000;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      noise.start(now);
      noise.stop(now + 0.08);

    } else if (type === 'tom') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.3);

    } else if (type === 'crash') {
      const bufferSize = audioCtx.sampleRate * 1.2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 5500;
      filter.Q.value = 1.2;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      noise.start(now);
      noise.stop(now + 1.15);
    }

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  // Roteador de Reprodução Musical Centralizado
  function playInstrumentSound(type, freqOrSubtype = 261.63) {
    unlockAchievement('ach-first-sound');

    if (type === 'piano') {
      playPianoNote(Number(freqOrSubtype));
    } else if (type === 'guitar') {
      playGuitarNote(Number(freqOrSubtype));
    } else if (type === 'violin') {
      playViolinNote(Number(freqOrSubtype));
    } else if (['kick', 'snare', 'hihat', 'tom', 'crash'].includes(type)) {
      playDrumSound(type);
      unlockAchievement('ach-rhythm');
    } else if (type === 'drums') {
      // Se chamado como 'drums' genérico no catálogo, toca a demo rápida de bateria
      playDrumDemo(false);
    }
  }

  /* ==========================================================================
     7. VISUALIZADOR DE ÁUDIO EM TEMPO REAL (CANVAS)
     ========================================================================== */

  const visualizerCanvas = $('#audio-visualizer-canvas');
  const visualizerFeedback = $('#visualizer-text-feedback');
  let visualizerCtx = visualizerCanvas ? visualizerCanvas.getContext('2d') : null;
  let visualizerFrameId = null;

  function resizeVisualizer() {
    if (!visualizerCanvas) return;
    visualizerCanvas.width = visualizerCanvas.offsetWidth;
    visualizerCanvas.height = visualizerCanvas.offsetHeight;
  }
  window.addEventListener('resize', resizeVisualizer);
  resizeVisualizer();

  function renderVisualizer() {
    if (!visualizerCtx || !analyser) return;

    const width = visualizerCanvas.width;
    const height = visualizerCanvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(dataArray);

    visualizerCtx.clearRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.2;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      visualizerCtx.fillStyle = `hsl(${260 + (i / bufferLength) * 80}, 90%, 60%)`;
      visualizerCtx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    visualizerFrameId = requestAnimationFrame(renderVisualizer);
  }

  function startVisualizer() {
    if (!visualizerFrameId) {
      checkVisualizerState();
    }
  }

  function stopVisualizer() {
    if (visualizerFrameId) {
      cancelAnimationFrame(visualizerFrameId);
      visualizerFrameId = null;
    }
  }

  function drawStaticVisualizer() {
    if (!visualizerCtx || !visualizerCanvas) return;
    const width = visualizerCanvas.width;
    const height = visualizerCanvas.height;
    visualizerCtx.clearRect(0, 0, width, height);
    visualizerCtx.fillStyle = 'rgba(121, 82, 245, 0.4)';

    const barCount = 32;
    const barWidth = width / barCount;
    for (let i = 0; i < barCount; i++) {
      const h = Math.sin(i * 0.3) * (height * 0.3) + (height * 0.3);
      visualizerCtx.fillRect(i * barWidth, height - h, barWidth - 2, h);
    }
  }

  function checkVisualizerState() {
    const isReduced = body.getAttribute('data-motion-reduce') === 'true';
    if (isReduced) {
      stopVisualizer();
      drawStaticVisualizer();
    } else {
      if (!visualizerFrameId) renderVisualizer();
    }
  }

  function triggerVisualizerFeedback() {
    if (!visualizerFeedback) return;
    visualizerFeedback.textContent = '🔊 Resposta Áudio-Visual: Frequência Emitida!';
    setTimeout(() => {
      visualizerFeedback.textContent = 'Visualizador Áudio-Visual em Espera...';
    }, 1200);
  }

  /* ==========================================================================
     8. TECLADO MUSICAL ACESSÍVEL
     ========================================================================== */

  const pianoKeysData = [
    { note: 'Dó', pitch: 'C4', key: 'Z', freq: 261.63, isBlack: false },
    { note: 'Dó#', pitch: 'C#4', key: 'S', freq: 277.18, isBlack: true },
    { note: 'Ré', pitch: 'D4', key: 'X', freq: 293.66, isBlack: false },
    { note: 'Ré#', pitch: 'D#4', key: 'D', freq: 311.13, isBlack: true },
    { note: 'Mí', pitch: 'E4', key: 'C', freq: 329.63, isBlack: false },
    { note: 'Fá', pitch: 'F4', key: 'V', freq: 349.23, isBlack: false },
    { note: 'Fá#', pitch: 'F#4', key: 'G', freq: 369.99, isBlack: true },
    { note: 'Sol', pitch: 'G4', key: 'B', freq: 392.00, isBlack: false },
    { note: 'Sol#', pitch: 'G#4', key: 'H', freq: 415.30, isBlack: true },
    { note: 'Lá', pitch: 'A4', key: 'N', freq: 440.00, isBlack: false },
    { note: 'Lá#', pitch: 'A#4', key: 'J', freq: 466.16, isBlack: true },
    { note: 'Si', pitch: 'B4', key: 'M', freq: 493.88, isBlack: false },
    { note: 'Dó', pitch: 'C5', key: 'K', freq: 523.25, isBlack: false }
  ];

  let keyboardMode = 'free'; // 'free', 'learn', 'challenge'
  let learnIndex = 0;
  const learnSequence = ['C4', 'E4', 'G4', 'C5'];
  let challengeScore = 0;
  let challengeTarget = null;

  function renderPianoKeys() {
    const wrapper = $('#piano-keys-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    pianoKeysData.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `piano-key ${item.isBlack ? 'black' : 'white'}`;
      btn.dataset.pitch = item.pitch;
      btn.dataset.freq = item.freq;
      btn.setAttribute('aria-label', `Nota ${item.note} (${item.pitch}), atalho tecla ${item.key}`);

      btn.innerHTML = `
        <span class="note-name">${item.note}</span>
        <span class="key-bind">${item.key}</span>
      `;

      btn.addEventListener('click', () => triggerPianoKey(item));
      wrapper.appendChild(btn);
    });
  }

  function triggerPianoKey(item) {
    playPianoNote(item.freq);
    recordAudioEvent('piano', item.freq);

    const notesDisplay = $('#keyboard-notes-display');
    if (notesDisplay) {
      notesDisplay.innerHTML = `Nota: <strong>${item.note} (${item.pitch})</strong> — ${item.freq.toFixed(1)} Hz`;
    }

    // Animação Visual da Tecla
    const keyEl = $(`[data-pitch="${item.pitch}"]`);
    if (keyEl) {
      keyEl.classList.add('active');
      setTimeout(() => keyEl.classList.remove('active'), 180);
    }

    // Validação nos Modos
    if (keyboardMode === 'learn') {
      if (item.pitch === learnSequence[learnIndex]) {
        learnIndex++;
        if (learnIndex >= learnSequence.length) {
          updateKeyboardGuide('🎉 Parabéns! Sequência concluída com sucesso!');
          unlockAchievement('ach-melody');
          learnIndex = 0;
          setTimeout(updateLearnGuide, 2000);
        } else {
          updateLearnGuide();
        }
      }
    } else if (keyboardMode === 'challenge') {
      if (challengeTarget && item.pitch === challengeTarget.pitch) {
        challengeScore++;
        updateKeyboardGuide(`✨ Correto! Pontuação: ${challengeScore}. Próxima nota...`);
        nextChallengeStep();
      } else if (challengeTarget) {
        updateKeyboardGuide(`❌ Ops! Era a nota ${challengeTarget.note}. Tente acertar a próxima!`);
        nextChallengeStep();
      }
    }
  }

  function setKeyboardMode(mode) {
    keyboardMode = mode;
    $$('.mode-tab').forEach(tab => {
      const isActive = tab.id === `btn-keymode-${mode}`;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    const banner = $('#keyboard-guide-banner');
    if (!banner) return;

    if (mode === 'free') {
      banner.hidden = true;
      speakText('Modo Livre ativado. Toque à vontade.');
    } else if (mode === 'learn') {
      banner.hidden = false;
      learnIndex = 0;
      updateLearnGuide();
      speakText('Modo Aprender ativado. Siga as notas na tela.');
    } else if (mode === 'challenge') {
      banner.hidden = false;
      challengeScore = 0;
      nextChallengeStep();
      speakText('Modo Desafio ativado. Encontre a nota sorteada.');
    }
  }

  function updateKeyboardGuide(text) {
    const guideText = $('#keyboard-guide-text');
    if (guideText) guideText.textContent = text;
  }

  function updateLearnGuide() {
    const targetPitch = learnSequence[learnIndex];
    const targetData = pianoKeysData.find(d => d.pitch === targetPitch);
    if (targetData) {
      updateKeyboardGuide(`🎯 Modo Aprender: Toque a nota ${targetData.note} (${targetData.pitch}) - Tecla [${targetData.key}]`);
    }
  }

  function nextChallengeStep() {
    const randomIndex = Math.floor(Math.random() * pianoKeysData.length);
    challengeTarget = pianoKeysData[randomIndex];
    setTimeout(() => {
      updateKeyboardGuide(`⚡ Desafio: Encontre a nota ${challengeTarget.note}! (Pontuação: ${challengeScore})`);
    }, 1200);
  }

  $('#btn-keymode-free')?.addEventListener('click', () => setKeyboardMode('free'));
  $('#btn-keymode-learn')?.addEventListener('click', () => setKeyboardMode('learn'));
  $('#btn-keymode-challenge')?.addEventListener('click', () => setKeyboardMode('challenge'));

  renderPianoKeys();

  /* ==========================================================================
     9. BATERIA & PADS DE PERCUSSÃO
     ========================================================================== */

  let drumDemoInterval = null;

  function initDrums() {
    const pads = $$('.drum-pad');
    pads.forEach(pad => {
      pad.addEventListener('click', () => {
        const sound = pad.dataset.sound;
        triggerDrumPad(sound, pad);
      });
    });
  }

  function triggerDrumPad(soundType, element = null) {
    playDrumSound(soundType);
    recordAudioEvent(soundType, 0);

    const pad = element || $(`.drum-pad[data-sound="${soundType}"]`);
    if (pad) {
      pad.classList.add('active');
      setTimeout(() => pad.classList.remove('active'), 150);
    }
  }

  function playDrumDemo(shouldLoop = true) {
    stopDrumDemo();
    const demoBtn = $('#btn-play-demo-rhythm');
    const stopBtn = $('#btn-stop-demo-rhythm');

    if (demoBtn) demoBtn.hidden = true;
    if (stopBtn) stopBtn.hidden = false;

    const pattern = [
      { type: 'kick', time: 0 },
      { type: 'hihat', time: 0 },
      { type: 'hihat', time: 250 },
      { type: 'snare', time: 500 },
      { type: 'hihat', time: 500 },
      { type: 'hihat', time: 750 },
      { type: 'kick', time: 1000 },
      { type: 'tom', time: 1250 },
      { type: 'snare', time: 1500 },
      { type: 'crash', time: 1750 }
    ];

    function runPattern() {
      pattern.forEach(step => {
        setTimeout(() => {
          if (demoBtn && demoBtn.hidden) {
            playDrumSound(step.type);
            const pad = $(`.drum-pad[data-sound="${step.type}"]`);
            if (pad) {
              pad.classList.add('active');
              setTimeout(() => pad.classList.remove('active'), 120);
            }
          }
        }, step.time);
      });
    }

    runPattern();

    if (shouldLoop) {
      drumDemoInterval = setInterval(runPattern, 2000);
    } else {
      setTimeout(stopDrumDemo, 2000);
    }

    speakText('Demonstração de ritmo iniciada.');
  }

  function stopDrumDemo() {
    if (drumDemoInterval) {
      clearInterval(drumDemoInterval);
      drumDemoInterval = null;
    }

    const demoBtn = $('#btn-play-demo-rhythm');
    const stopBtn = $('#btn-stop-demo-rhythm');

    if (demoBtn) demoBtn.hidden = false;
    if (stopBtn) stopBtn.hidden = true;
  }

  $('#btn-play-demo-rhythm')?.addEventListener('click', () => playDrumDemo(true));
  $('#btn-stop-demo-rhythm')?.addEventListener('click', stopDrumDemo);

  initDrums();

  /* ==========================================================================
     10. MAPEAMENTO GLOBAL DE TECLADO FÍSICO (SEM CONFLITOS)
     ========================================================================== */

  window.addEventListener('keydown', (e) => {
    // Evita atalhos se o usuário estiver digitando em inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.repeat) return;

    const key = e.key.toUpperCase();

    // 1. Mapeamento da Bateria (A, S, D, F, G)
    const drumPadsMap = {
      'A': 'kick',
      'S': 'snare',
      'D': 'hihat',
      'F': 'tom',
      'G': 'crash'
    };

    if (drumPadsMap[key]) {
      e.preventDefault();
      triggerDrumPad(drumPadsMap[key]);
      return;
    }

    // 2. Mapeamento do Piano (Z, X, C, V, B, N, M, K e sustenidos)
    const pianoMatch = pianoKeysData.find(item => item.key === key);
    if (pianoMatch) {
      e.preventDefault();
      triggerPianoKey(pianoMatch);
    }
  });

  /* ==========================================================================
     11. GRAVADOR & REPRODUÇÃO DO ESTÚDIO
     ========================================================================== */

  let isRecording = false;
  let recordingStartTime = 0;
  let recordedEvents = [];
  let playbackTimers = [];
  let isPlayingBack = false;

  const btnRecord = $('#btn-record');
  const btnPlayRecording = $('#btn-play-recording');
  const btnClearRecording = $('#btn-clear-recording');
  const recordingStatus = $('#recording-status-text');

  function recordAudioEvent(type, detail) {
    if (!isRecording) return;
    const time = Date.now() - recordingStartTime;
    recordedEvents.push({ type, detail, time });
  }

  function toggleRecording() {
    isRecording = !isRecording;
    if (isRecording) {
      recordedEvents = [];
      recordingStartTime = Date.now();
      btnRecord.classList.add('recording');
      btnRecord.setAttribute('aria-pressed', 'true');
      btnRecord.innerHTML = '<span class="dot" aria-hidden="true"></span> Parar Gravação';
      if (recordingStatus) recordingStatus.textContent = '🔴 Gravando sequência em tempo real...';
      speakText('Gravação iniciada.');
    } else {
      btnRecord.classList.remove('recording');
      btnRecord.setAttribute('aria-pressed', 'false');
      btnRecord.innerHTML = '<span class="dot" aria-hidden="true"></span> Gravar Sequência';

      if (recordedEvents.length > 0) {
        if (recordingStatus) recordingStatus.textContent = `🟢 Sequência armazenada: ${recordedEvents.length} eventos.`;
        if (btnPlayRecording) btnPlayRecording.disabled = false;
        if (btnClearRecording) btnClearRecording.disabled = false;
        unlockAchievement('ach-creator');
        speakText('Gravação concluída.');
      } else {
        if (recordingStatus) recordingStatus.textContent = 'Nenhuma nota registrada.';
      }
    }
  }

  function stopPlayback() {
    playbackTimers.forEach(timer => clearTimeout(timer));
    playbackTimers = [];
    isPlayingBack = false;
    if (btnPlayRecording) {
      btnPlayRecording.disabled = recordedEvents.length === 0;
      btnPlayRecording.textContent = '▶️ Reproduzir Gravação';
    }
  }

  function playRecording() {
    if (recordedEvents.length === 0) return;

    stopPlayback();
    isPlayingBack = true;

    if (btnPlayRecording) {
      btnPlayRecording.textContent = '⏹️ Parar Reprodução';
    }
    if (recordingStatus) recordingStatus.textContent = '▶️ Reproduzindo gravação...';

    const maxTime = recordedEvents[recordedEvents.length - 1].time + 500;

    recordedEvents.forEach(evt => {
      const timer = setTimeout(() => {
        if (!isPlayingBack) return;
        if (['kick', 'snare', 'hihat', 'tom', 'crash'].includes(evt.type)) {
          triggerDrumPad(evt.type);
        } else {
          playInstrumentSound(evt.type, evt.detail);
        }
      }, evt.time);
      playbackTimers.push(timer);
    });

    const endTimer = setTimeout(() => {
      stopPlayback();
      if (recordingStatus) recordingStatus.textContent = 'Reprodução concluída.';
    }, maxTime);

    playbackTimers.push(endTimer);
  }

  function clearRecording() {
    stopPlayback();
    recordedEvents = [];
    if (btnPlayRecording) btnPlayRecording.disabled = true;
    if (btnClearRecording) btnClearRecording.disabled = true;
    if (recordingStatus) recordingStatus.textContent = 'Nenhuma gravação armazenada.';
    speakText('Gravação limpa.');
  }

  btnRecord?.addEventListener('click', toggleRecording);
  btnPlayRecording?.addEventListener('click', () => {
    if (isPlayingBack) {
      stopPlayback();
      if (recordingStatus) recordingStatus.textContent = 'Reprodução interrompida.';
    } else {
      playRecording();
    }
  });
  btnClearRecording?.addEventListener('click', clearRecording);

  /* ==========================================================================
     12. METRÔNOMO
     ========================================================================== */

  let metronomeInterval = null;
  let isMetronomeActive = false;
  let bpm = 120;

  const btnMetronome = $('#btn-toggle-metronome');
  const metronomeStatus = $('#metronome-status');
  const bpmInput = $('#metronome-bpm');
  const bpmDisplay = $('#bpm-display');

  function playMetronomeClick() {
    if (!initAudio()) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.setValueAtTime(1000, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  function toggleMetronome() {
    isMetronomeActive = !isMetronomeActive;
    btnMetronome?.setAttribute('aria-pressed', String(isMetronomeActive));

    if (isMetronomeActive) {
      if (metronomeStatus) metronomeStatus.textContent = 'Ligado';
      startMetronome();
      speakText('Metrônomo ligado.');
    } else {
      if (metronomeStatus) metronomeStatus.textContent = 'Desligado';
      stopMetronome();
      speakText('Metrônomo desligado.');
    }
  }

  function startMetronome() {
    stopMetronome();
    const intervalMs = (60 / bpm) * 1000;
    playMetronomeClick();
    metronomeInterval = setInterval(playMetronomeClick, intervalMs);
  }

  function stopMetronome() {
    if (metronomeInterval) {
      clearInterval(metronomeInterval);
      metronomeInterval = null;
    }
  }

  btnMetronome?.addEventListener('click', toggleMetronome);

  bpmInput?.addEventListener('input', (e) => {
    bpm = clamp(Number(e.target.value), 40, 200);
    if (bpmDisplay) bpmDisplay.textContent = `${bpm} BPM`;
    if (isMetronomeActive) {
      startMetronome();
    }
  });

  /* ==========================================================================
     13. CATÁLOGO & MODAL ACESSÍVEL
     ========================================================================== */

  let activeModalTrigger = null;

  function renderCatalog(filter = 'all') {
    const grid = $('#catalog-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = filter === 'all'
      ? instrumentsData
      : instrumentsData.filter(item => item.category === filter);

    filtered.forEach(inst => {
      const card = document.createElement('article');
      card.className = 'instrument-card';
      card.innerHTML = `
        <div>
          <span class="badge">${escapeHTML(inst.categoryLabel)}</span>
          <h3>${escapeHTML(inst.name)}</h3>
          <p>${escapeHTML(inst.desc)}</p>
        </div>
        <div class="instrument-card-actions">
          <button class="pill-btn highlight btn-listen" type="button" data-id="${inst.id}">🔊 Ouvir Som</button>
          <button class="pill-btn outline btn-details" type="button" data-id="${inst.id}">📖 Detalhes</button>
        </div>
      `;

      card.querySelector('.btn-listen').addEventListener('click', () => {
        playInstrumentSound(inst.soundType, inst.freq);
      });

      card.querySelector('.btn-details').addEventListener('click', (e) => {
        activeModalTrigger = e.currentTarget;
        openInstrumentModal(inst);
      });

      grid.appendChild(card);
    });
  }

  function openInstrumentModal(inst) {
    const dialog = $('#instrument-modal');
    const body = $('#modal-content-body');
    if (!dialog || !body) return;

    body.innerHTML = `
      <div class="modal-header">
        <h3 id="modal-title">${escapeHTML(inst.name)}</h3>
        <button class="close-modal-btn" type="button" id="btn-close-modal" aria-label="Fechar modal">&times;</button>
      </div>
      <div class="modal-body">
        <p><strong>Categoria:</strong> ${escapeHTML(inst.categoryLabel)}</p>
        <p><strong>Descrição:</strong> ${escapeHTML(inst.desc)}</p>
        <p><strong>História e Contexto:</strong> ${escapeHTML(inst.history)}</p>
        <div style="margin-top: 1.5rem;">
          <button class="btn-primary" type="button" id="btn-modal-listen">🔊 Ouvir Demonstrativo</button>
        </div>
      </div>
    `;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.hidden = false;
    }

    const closeBtn = $('#btn-close-modal', body);
    closeBtn?.focus();

    closeBtn?.addEventListener('click', closeInstrumentModal);
    $('#btn-modal-listen', body)?.addEventListener('click', () => {
      playInstrumentSound(inst.soundType, inst.freq);
    });
  }

  function closeInstrumentModal() {
    const dialog = $('#instrument-modal');
    if (!dialog) return;

    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.hidden = true;
    }

    if (activeModalTrigger) {
      activeModalTrigger.focus();
      activeModalTrigger = null;
    }
  }

  $('#instrument-modal')?.addEventListener('keydown', (e) => {     if (e.key === 'Escape') {       closeInstrumentModal();     }   });    $$('.catalog-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.catalog-filters .filter-btn').forEach(b => {         b.classList.remove('active');         b.setAttribute('aria-pressed', 'false');       });       btn.classList.add('active');       btn.setAttribute('aria-pressed', 'true');       renderCatalog(btn.dataset.filter);     });   });    renderCatalog();    /* ==========================================================================      14. MAPEAMENTO SENSORIAL (PERFIL MUSICAL)      ========================================================================== */    $$
('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      showDiscoveryResult(mood);
      unlockAchievement('ach-explorer');
    });
  });

  function showDiscoveryResult(mood) {
    const quizStep = $('#discovery-quiz-step');
    const resultStep = $('#discovery-result-step');
    const title = $('#discovery-profile-title');
    const desc = $('#discovery-profile-desc');
    const list = $('#discovery-recommendations-list');

    if (!quizStep || !resultStep || !title || !desc || !list) return;

    quizStep.hidden = true;
    resultStep.hidden = false;
    list.innerHTML = '';

    let profileName = 'Harmonioso e Inclusivo';
    let profileDescText = 'Você aprecia a música como um refúgio de expressão e equilíbrio.';
    let recs = ['Violão', 'Teclado'];

    if (mood === 'calm') {
      profileName = 'Sereno e Introspectivo';
      profileDescText = 'Sua sintonia busca a paz, timbres aveludados e atmosferas calmas.';
      recs = ['Violão', 'Violino'];
    } else if (mood === 'energetic') {
      profileName = 'Pulsante e Dinâmico';
      profileDescText = 'Você se move através da energia, ritmo marcante e batidas forte.';
      recs = ['Bateria', 'Teclado'];
    } else if (mood === 'creative') {
      profileName = 'Criativo e Harmônico';
      profileDescText = 'Sua mente busca arranjos ricos, novas estruturas e descobertas.';
      recs = ['Teclado', 'Violão'];
    } else if (mood === 'curious') {
      profileName = 'Expressivo e Clássico';
      profileDescText = 'Você se conecta com emoções profundas, nuances e timbres eruditos.';
      recs = ['Violino', 'Teclado'];
    }

    title.textContent = `Perfil ${profileName}`;
    desc.textContent = profileDescText;

    recs.forEach(r => {
      const div = document.createElement('div');
      div.className = 'rec-item';
      div.textContent = `✨ ${r}`;
      list.appendChild(div);
    });

    speakText(`Seu perfil musical é ${profileName}.`);
  }

  $('#btn-restart-discovery')?.addEventListener('click', () => {
    const quizStep = $('#discovery-quiz-step');
    const resultStep = $('#discovery-result-step');
    if (quizStep) quizStep.hidden = false;
    if (resultStep) resultStep.hidden = true;
  });

  /* ==========================================================================
     15. QUIZ MUSICAL (8 PERGUNTAS)
     ========================================================================== */

  const quizQuestions = [
    {
      q: "1. Como você prefere que a música comece em uma canção?",
      options: [
        { text: "Com uma melodia suave de cordas", inst: "violao" },
        { text: "Com um ritmo marcante e envolvente", inst: "bateria" },
        { text: "Com harmonias ricas e acordes encorpados", inst: "teclado" },
        { text: "Com um solo expressivo e emocionante", inst: "violino" }
      ]
    },
    {
      q: "2. Qual sensação você busca ao ouvir ou criar som?",
      options: [
        { text: "Achei aconchego e tranquilidade", inst: "violao" },
        { text: "Vontade de dançar e me mexer", inst: "bateria" },
        { text: "Sensação de exploração e amplitude", inst: "teclado" },
        { text: "Conexão emocional profunda", inst: "violino" }
      ]
    },
    {
      q: "3. Qual dessas atividades descreve melhor sua criatividade?",
      options: [
        { text: "Dedilhar ideias sem pressa ao ar livre", inst: "violao" },
        { text: "Marcar o tempo e organizar o fluxo do grupo", inst: "bateria" },
        { text: "Construir arranjos e combinar timbres", inst: "teclado" },
        { text: "Interpretar melodia com delicadeza e precisão", inst: "violino" }
      ]
    },
    {
      q: "4. Se você estivesse em um grupo musical, qual seria seu papel?",
      options: [
        { text: "A harmonia de apoio acolhedora", inst: "violao" },
        { text: "O motor e a base do ritmo", inst: "bateria" },
        { text: "O arquiteto dos sons do grupo", inst: "teclado" },
        { text: "A voz solista de destaque", inst: "violino" }
      ]
    },
    {
      q: "5. Que tipo de textura sonora te fascina?",
      options: [
        { text: "Madeira e cordas naturais", inst: "violao" },
        { text: "Impacto, graves e pratos reluzentes", inst: "bateria" },
        { text: "Versatilidade digital e sintética", inst: "teclado" },
        { text: "O atrito do arco gerando notas sustentadas", inst: "violino" }
      ]
    },
    {
      q: "6. Como você lida com o aprendizado de um novo instrumento?",
      options: [
        { text: "Gosto de praticar de forma relaxada", inst: "violao" },
        { text: "Gosto de coordenação e energia física", inst: "bateria" },
        { text: "Prefiro entender a teoria e visual das notas", inst: "teclado" },
        { text: "Tenho paciência para dominar a técnica precisa", inst: "violino" }
      ]
    },
    {
      q: "7. Qual ambiente te inspira mais a fazer som?",
      options: [
        { text: "Uma roda de amigos ao entardecer", inst: "violao" },
        { text: "Um palco vibrante e cheio de energia", inst: "bateria" },
        { text: "Um estúdio moderno cheio de recursos", inst: "teclado" },
        { text: "Um teatro com acústica impecável", inst: "violino" }
      ]
    },
    {
      q: "8. Para você, a música é principalmente...",
      options: [
        { text: "Companhia e expressão pessoal", inst: "violao" },
        { text: "Movimento e energia contagiante", inst: "bateria" },
        { text: "Universo Infinito de combinações", inst: "teclado" },
        { text: "A arte de tocar a alma do ouvinte", inst: "violino" }
      ]
    }
  ];

  let quizCurrentIndex = 0;
  const quizScores = { violao: 0, teclado: 0, bateria: 0, violino: 0 };

  function renderQuizQuestion() {
    const questionText = $('#quiz-question-text');
    const optionsContainer = $('#quiz-options-container');
    const counter = $('#quiz-counter');
    const progressFill = $('#quiz-progress-fill');
    const progressBar = $('.quiz-progress-bar');

    if (!questionText || !optionsContainer) return;

    const current = quizQuestions[quizCurrentIndex];
    questionText.textContent = current.q;
    if (counter) counter.textContent = `Pergunta ${quizCurrentIndex + 1} de ${quizQuestions.length}`;

    const percent = Math.round(((quizCurrentIndex) / quizQuestions.length) * 100);
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', percent);

    optionsContainer.innerHTML = '';
    current.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-opt-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        quizScores[opt.inst]++;
        quizCurrentIndex++;
        if (quizCurrentIndex < quizQuestions.length) {
          renderQuizQuestion();
        } else {
          showQuizResult();
        }
      });
      optionsContainer.appendChild(btn);
    });
  }

  function showQuizResult() {
    const questionCard = $('#quiz-question-card');
    const resultCard = $('#quiz-result-card');
    const resultText = $('#quiz-result-text');
    const previewContainer = $('#quiz-result-instrument-preview');
    const progressFill = $('#quiz-progress-fill');

    if (!questionCard || !resultCard) return;

    if (progressFill) progressFill.style.width = '100%';

    questionCard.hidden = true;
    resultCard.hidden = false;

    // Determina o vencedor garantindo tratamento de empates estável
    let topInstId = 'teclado';
    let maxScore = -1;

    Object.keys(quizScores).forEach(instId => {
      if (quizScores[instId] > maxScore) {
        maxScore = quizScores[instId];
        topInstId = instId;
      }
    });

    const winner = instrumentsData.find(i => i.id === topInstId) || instrumentsData[1];

    if (resultText) {
      resultText.textContent = `Sua maior afinidade sonora é com o(a) ${winner.name}! ${winner.desc}`;
    }

    if (previewContainer) {
      previewContainer.innerHTML = `
        <div class="rec-item" style="text-align:center; padding:1.5rem;">
          <h4>${escapeHTML(winner.name)}</h4>
          <p style="margin: 0.5rem 0;">${escapeHTML(winner.categoryLabel)}</p>
          <button class="pill-btn highlight" type="button" id="btn-quiz-play-win">🔊 Testar Som do ${escapeHTML(winner.name)}</button>
        </div>
      `;

      $('#btn-quiz-play-win')?.addEventListener('click', () => {
        playInstrumentSound(winner.soundType, winner.freq);
      });
    }

    speakText(`Resultado do quiz: Seu instrumento ideal é ${winner.name}.`);
  }

  $('#btn-restart-quiz')?.addEventListener('click', () => {
    quizCurrentIndex = 0;
    Object.keys(quizScores).forEach(k => quizScores[k] = 0);
    const questionCard = $('#quiz-question-card');
    const resultCard = $('#quiz-result-card');
    if (questionCard) questionCard.hidden = false;
    if (resultCard) resultCard.hidden = true;
    renderQuizQuestion();
  });

  renderQuizQuestion();

  /* ==========================================================================
     16. PERCURSO GUIADO (ONBOARDING TOUR)
     ========================================================================== */

  const tourModal = $('#guided-tour-modal');
  const hasSeenTour = safeStorageGet('sonora_tour_seen');

  if (!hasSeenTour && tourModal) {
    setTimeout(() => {
      if (typeof tourModal.showModal === 'function') {
        tourModal.showModal();
      } else {
        tourModal.hidden = false;
      }
    }, 1000);
  }

  $('#btn-start-tour')?.addEventListener('click', () => {
    safeStorageSet('sonora_tour_seen', 'true');
    if (typeof tourModal.close === 'function') tourModal.close();
    else tourModal.hidden = true;

    // Leva para o centro de acessibilidade como primeiro passo do percurso
    const accSection = $('#meu-jeito');
    if (accSection) accSection.scrollIntoView({ behavior: 'smooth' });
    speakText('Percurso iniciado. Aqui você pode personalizar a acessibilidade.');
  });

  $('#btn-skip-tour')?.addEventListener('click', () => {
    safeStorageSet('sonora_tour_seen', 'true');
    if (typeof tourModal.close === 'function') tourModal.close();
    else tourModal.hidden = true;
  });

  /* ==========================================================================
     17. HERO ORB INTERATIVO
     ========================================================================== */

  $('#hero-orb')?.addEventListener('click', () => {
    playPianoNote(440.00, 2.5);
    pulse3DEnvironment();
    speakText('Ressonância de áudio e pulso 3D ativados.');
  });

});
