/**
 * SONORA — EXPERIÊNCIA DIGITAL MUSICAL COMPLETA & ACESSÍVEL
 * Script final refatorado e totalmente funcional.
 *
 * Recursos:
 * - Web Audio API com timbres individuais (Violão, Teclado, Violino e Bateria)
 * - Canvas 3D (Three.js) reativo ao cursor e aos sons
 * - AnalyserNode com Canvas Visualizador de Áudio em Tempo Real
 * - Teclado Musical interativo (Modo Livre, Aprender e Desafio)
 * - Bateria com 5 pads independentes e demonstração rítmica
 * - Gravador e Reprodução polifônica/multi-instrumento
 * - Metrônomo com ajuste dinâmico de BPM
 * - Catálogo de Instrumentos com Filtros e Modal Acessível
 * - Mapeamento Sensorial (Perfil Musical)
 * - Quiz de Afinidade Sonora (8 Perguntas)
 * - Gamificação / Conquistas
 * - Percurso Guiado (Onboarding Tour)
 * - Acessibilidade completa com gravação em localStorage e Síntese de Voz
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
    const scaleArray = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 80;
      posArray[i + 1] = (Math.random() - 0.5) * 80;
      posArray[i + 2] = (Math.random() - 0.5) * 80;
      scaleArray[i / 3] = Math.random();
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

  function setHighContrast(enable) {
    const enabled = Boolean(enable);
    body.setAttribute('data-high-contrast', String(enabled));
    if (enabled) body.setAttribute('data-soft-contrast', 'false');

    btnHighContrast?.setAttribute('aria-pressed', String(enabled));
    btnSoftContrast?.setAttribute('aria-pressed', 'false');

    safeStorageSet('sonora_high_contrast', String(enabled));
    if (enabled) safeStorageSet('sonora_soft_contrast', 'false');

    speakText(enabled ? 'Alto contraste ativado.' : 'Alto contraste desativado.');
    unlockAchievement('ach-acc');
  }

  function setSoftContrast(enable) {
    const enabled = Boolean(enable);
    body.setAttribute('data-soft-contrast', String(enabled));
    if (enabled) body.setAttribute('data-high-contrast', 'false');

    btnSoftContrast?.setAttribute('aria-pressed', String(enabled));
    btnHighContrast?.setAttribute('aria-pressed', 'false');

    safeStorageSet('sonora_soft_contrast', String(enabled));
    if (enabled) safeStorageSet('sonora_high_contrast', 'false');

    speakText(enabled ? 'Contraste suave ativado.' : 'Contraste suave desativado.');
    unlockAchievement('ach-acc');
  }

  function setReducedMotion(enable) {
    const enabled = Boolean(enable);
    body.setAttribute('data-motion-reduce', String(enabled));
    btnReduceMotion?.setAttribute('aria-pressed', String(enabled));

    safeStorageSet('sonora_motion_reduce', String(enabled));
    checkThreeState();

    speakText(enabled ? 'Animações reduzidas.' : 'Animações restauradas.');
    unlockAchievement('ach-acc');
  }

  function setLargeControls(enable) {
    const enabled = Boolean(enable);
    body.setAttribute('data-large-controls', String(enabled));
    btnLargeControls?.setAttribute('aria-pressed', String(enabled));

    safeStorageSet('sonora_large_controls', String(enabled));
    speakText(enabled ? 'Controles maiores ativados.' : 'Controles normais.');
    unlockAchievement('ach-acc');
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

  setSimpleMode(safeStorageGet('sonora_simple_mode') === 'true', false);
  setHighContrast(safeStorageGet('sonora_high_contrast') === 'true');
  setSoftContrast(safeStorageGet('sonora_soft_contrast') === 'true');
  setReducedMotion(safeStorageGet('sonora_motion_reduce') === 'true');
  setLargeControls(safeStorageGet('sonora_large_controls') === 'true');

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
    output.gain.linearRampToValueAtTime(0.23, now + 0.10);
    output.gain.setValueAtTime(0.20, now + Math.max(0.12, duration - 0.3));
    output.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    filter.connect(output);
    output.connect(masterGain);

    const partials = [[1, 0.75], [2, 0.25], [3, 0.12]];
    const oscs = [];
    partials.forEach(([ratio, level]) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq * ratio;
      g.gain.value = level;
      osc.connect(g);
      g.connect(filter);
      osc.start(now);
      osc.stop(now + duration + 0.1);
      oscs.push(osc);
    });

    const vibrato = audioCtx.createOscillator();
    const vibratoGain = audioCtx.createGain();
    vibrato.frequency.value = 5.2;
    vibratoGain.gain.value = 3.5;
    vibrato.connect(vibratoGain);
    oscs.forEach(osc => vibratoGain.connect(osc.detune));
    vibrato.start(now + 0.2);
    vibrato.stop(now + duration);

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function createNoiseBuffer(seconds = 0.3) {
    const length = Math.floor(audioCtx.sampleRate * seconds);
    const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function playKick() {
    if (!initAudio()) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.12);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.45);

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function playSnare() {
    if (!initAudio()) return;
    const now = audioCtx.currentTime;

    const bodyOsc = audioCtx.createOscillator();
    const bodyGain = audioCtx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.value = 190;
    bodyGain.gain.setValueAtTime(0.35, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(masterGain);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.18);

    const noise = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    noise.buffer = createNoiseBuffer(0.22);
    filter.type = 'highpass';
    filter.frequency.value = 1400;
    gain.gain.setValueAtTime(0.48, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(now);

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function playHiHat() {
    if (!initAudio()) return;
    const now = audioCtx.currentTime;
    const noise = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    noise.buffer = createNoiseBuffer(0.10);
    filter.type = 'highpass';
    filter.frequency.value = 6500;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(now);

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function playTom() {
    if (!initAudio()) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.14);
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.5);

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function playCrash() {
    if (!initAudio()) return;
    const now = audioCtx.currentTime;
    const noise = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    noise.buffer = createNoiseBuffer(1.2);
    filter.type = 'highpass';
    filter.frequency.value = 3500;
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(now);

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function playInstrumentSound(soundType, freq = 261.63) {
    unlockAchievement('ach-first-sound');
    recordAudioEvent(soundType, freq);

    switch (soundType) {
      case 'guitar': playGuitarNote(freq); break;
      case 'piano': playPianoNote(freq); break;
      case 'violin': playViolinNote(freq); break;
      case 'kick': playKick(); break;
      case 'snare': playSnare(); break;
      case 'hihat': playHiHat(); break;
      case 'tom': playTom(); break;
      case 'crash': playCrash(); break;
      case 'drums': playDrumDemo(); break;
      default: playPianoNote(freq); break;
    }
  }

  $('#hero-orb')?.addEventListener('click', () => {
    playPianoNote(440, 1.8);
    const caption = $('#hero-sound-caption');
    if (caption) caption.textContent = '🔊 Ressonância emitida! O espaço visual respondeu ao tom.';
  });

  /* ==========================================================================
     7. VISUALIZADOR DE ÁUDIO REAL (CANVAS & ANALYSERNODE)
     ========================================================================== */

  const visualizerCanvas = $('#audio-visualizer-canvas');
  let visualizerCtx = visualizerCanvas ? visualizerCanvas.getContext('2d') : null;
  let visualizerAnimId = null;

  function resizeVisualizerCanvas() {
    if (!visualizerCanvas) return;
    visualizerCanvas.width = visualizerCanvas.clientWidth || 600;
    visualizerCanvas.height = visualizerCanvas.clientHeight || 180;
  }
  window.addEventListener('resize', resizeVisualizerCanvas);
  resizeVisualizerCanvas();

  function startVisualizer() {
    if (!visualizerCtx || !analyser || visualizerAnimId) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      visualizerAnimId = requestAnimationFrame(draw);
      const isMotionReduced = body.getAttribute('data-motion-reduce') === 'true';

      visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

      if (isMotionReduced) {
        visualizerCtx.fillStyle = 'rgba(121, 82, 245, 0.2)';
        visualizerCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      const width = visualizerCanvas.width;
      const height = visualizerCanvas.height;
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        const gradient = visualizerCtx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#7952f5');
        gradient.addColorStop(1, '#00f2fe');

        visualizerCtx.fillStyle = gradient;
        visualizerCtx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 2;
      }
    }

    draw();
  }

  function triggerVisualizerFeedback() {
    const feedback = $('#visualizer-text-feedback');
    if (feedback) {
      feedback.textContent = '⚡ Frequências áudio-visuais em atividade';
      clearTimeout(triggerVisualizerFeedback.timer);
      triggerVisualizerFeedback.timer = setTimeout(() => {
        feedback.textContent = 'Visualizador Áudio-Visual em Espera...';
      }, 1500);
    }
  }

  /* ==========================================================================
     8. GRAVADOR & REPRODUÇÃO MULTI-TIMBRE
     ========================================================================== */

  let isRecording = false;
  let recordingStartTime = 0;
  let recordedEvents = [];

  const btnRecord = $('#btn-record');
  const btnPlayRecording = $('#btn-play-recording');
  const btnClearRecording = $('#btn-clear-recording');
  const recordingStatusText = $('#recording-status-text');

  function recordAudioEvent(type, value) {
    if (!isRecording) return;
    const time = Date.now() - recordingStartTime;
    recordedEvents.push({ time, type, value });
    updateRecordingStatusUI();
  }

  function updateRecordingStatusUI() {
    if (!recordingStatusText) return;

    if (isRecording) {
      recordingStatusText.textContent = `🔴 Gravando... (${recordedEvents.length} eventos registrados)`;
    } else if (recordedEvents.length > 0) {
      recordingStatusText.textContent = `✅ Gravação pronta: ${recordedEvents.length} notas/sons armazenados.`;
    } else {
      recordingStatusText.textContent = 'Nenhuma gravação armazenada.';
    }

    if (btnPlayRecording) btnPlayRecording.disabled = isRecording || recordedEvents.length === 0;
    if (btnClearRecording) btnClearRecording.disabled = isRecording || recordedEvents.length === 0;
  }

  btnRecord?.addEventListener('click', () => {
    if (!isRecording) {
      isRecording = true;
      recordedEvents = [];
      recordingStartTime = Date.now();
      btnRecord.classList.add('recording');
      btnRecord.setAttribute('aria-pressed', 'true');
      btnRecord.innerHTML = '<span class="dot" aria-hidden="true"></span> Parar Gravação';
      speakText('Gravação iniciada. Toque o teclado ou a bateria.');
    } else {
      isRecording = false;
      btnRecord.classList.remove('recording');
      btnRecord.setAttribute('aria-pressed', 'false');
      btnRecord.innerHTML = '<span class="dot" aria-hidden="true"></span> Gravar Sequência';
      speakText(`Gravação finalizada com ${recordedEvents.length} eventos.`);
      if (recordedEvents.length > 0) unlockAchievement('ach-creator');
    }
    updateRecordingStatusUI();
  });

  btnPlayRecording?.addEventListener('click', () => {
    if (recordedEvents.length === 0) return;
    speakText('Reproduzindo gravação...');

    recordedEvents.forEach(event => {
      setTimeout(() => {
        if (['kick', 'snare', 'hihat', 'tom', 'crash'].includes(event.type)) {
          playInstrumentSound(event.type);
          highlightDrumPad(event.type);
        } else {
          playPianoNote(event.value);
          highlightPianoKey(event.value);
        }
      }, event.time);
    });
  });

  btnClearRecording?.addEventListener('click', () => {
    recordedEvents = [];
    updateRecordingStatusUI();
    speakText('Gravação limpa.');
  });

  /* ==========================================================================
     9. METRÔNOMO
     ========================================================================== */

  let metronomeActive = false;
  let metronomeTimer = null;
  let bpm = 120;

  const btnMetronome = $('#btn-toggle-metronome');
  const metronomeStatus = $('#metronome-status');
  const bpmInput = $('#metronome-bpm');
  const bpmDisplay = $('#bpm-display');

  function tickMetronome() {
    if (!metronomeActive) return;
    if (initAudio()) {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  }

  function startMetronome() {
    stopMetronome();
    metronomeActive = true;
    if (metronomeStatus) metronomeStatus.textContent = 'Ligado';
    if (btnMetronome) btnMetronome.setAttribute('aria-pressed', 'true');

    const interval = (60 / bpm) * 1000;
    tickMetronome();
    metronomeTimer = setInterval(tickMetronome, interval);
  }

  function stopMetronome() {
    metronomeActive = false;
    if (metronomeTimer) {
      clearInterval(metronomeTimer);
      metronomeTimer = null;
    }
    if (metronomeStatus) metronomeStatus.textContent = 'Desligado';
    if (btnMetronome) btnMetronome.setAttribute('aria-pressed', 'false');
  }

  btnMetronome?.addEventListener('click', () => {
    if (metronomeActive) {
      stopMetronome();
      speakText('Metrônomo desligado.');
    } else {
      startMetronome();
      speakText(`Metrônomo ligado em ${bpm} BPM.`);
    }
  });

  bpmInput?.addEventListener('input', (e) => {
    bpm = Number(e.target.value);
    if (bpmDisplay) bpmDisplay.textContent = `${bpm} BPM`;
    if (metronomeActive) startMetronome();
  });

  /* ==========================================================================
     10. TECLADO MUSICAL ACESSÍVEL
     ========================================================================== */

  const pianoKeysData = [
    { note: 'C4', label: 'Dó', freq: 261.63, key: 'C', isBlack: false },
    { note: 'C#4', label: 'Dó#', freq: 277.18, key: 'V', isBlack: true },
    { note: 'D4', label: 'Ré', freq: 293.66, key: 'D', isBlack: false },
    { note: 'D#4', label: 'Ré#', freq: 311.13, key: 'G', isBlack: true },
    { note: 'E4', label: 'Mi', freq: 329.63, key: 'E', isBlack: false },
    { note: 'F4', label: 'Fá', freq: 349.23, key: 'F', isBlack: false },
    { note: 'F#4', label: 'Fá#', freq: 369.99, key: 'T', isBlack: true },
    { note: 'G4', label: 'Sol', freq: 392.00, key: 'G', isBlack: false },
    { note: 'G#4', label: 'Sol#', freq: 415.30, key: 'Y', isBlack: true },
    { note: 'A4', label: 'Lá', freq: 440.00, key: 'A', isBlack: false },
    { note: 'A#4', label: 'Lá#', freq: 466.16, key: 'U', isBlack: true },
    { note: 'B4', label: 'Si', freq: 493.88, key: 'B', isBlack: false },
    { note: 'C5', label: 'Dó Agudo', freq: 523.25, key: 'K', isBlack: false }
  ];

  let currentKeyboardMode = 'free'; // free, learn, challenge
  let learnIndex = 0;
  const learnSequence = ['C4', 'E4', 'G4', 'C5'];

  const keysWrapper = $('#piano-keys-wrapper');
  const notesDisplay = $('#keyboard-notes-display');
  const guideBanner = $('#keyboard-guide-banner');
  const guideText = $('#keyboard-guide-text');

  function renderPianoKeys() {
    if (!keysWrapper) return;
    keysWrapper.innerHTML = '';

    pianoKeysData.forEach(item => {
      const keyBtn = document.createElement('button');
      keyBtn.className = `piano-key ${item.isBlack ? 'black' : 'white'}`;
      keyBtn.dataset.freq = item.freq;
      keyBtn.dataset.note = item.note;
      keyBtn.setAttribute('aria-label', `Nota ${item.label} (${item.note}), tecla ${item.key}`);

      keyBtn.innerHTML = `
        <span class="key-note-label">${item.label}</span>
        <span class="key-shortcut">${item.key}</span>
      `;

      keyBtn.addEventListener('click', () => triggerPianoKey(item));
      keysWrapper.appendChild(keyBtn);
    });
  }

  function triggerPianoKey(item) {
    playPianoNote(item.freq);
    recordAudioEvent('piano', item.freq);

    if (notesDisplay) {
      notesDisplay.textContent = `Nota tocada: ${item.label} (${item.note})`;
    }

    highlightPianoKey(item.freq);

    // Lógica do Modo Aprender
    if (currentKeyboardMode === 'learn') {
      const targetNote = learnSequence[learnIndex];
      if (item.note === targetNote) {
        learnIndex++;
        if (learnIndex >= learnSequence.length) {
          learnIndex = 0;
          if (guideText) guideText.textContent = '🎉 Excelente! Você completou a sequência melódica!';
          speakText('Excelente! Você completou a sequência melódica!');
          unlockAchievement('ach-melody');
        } else {
          const nextNote = pianoKeysData.find(k => k.note === learnSequence[learnIndex]);
          if (guideText) guideText.textContent = `Muito bem! Próxima nota: ${nextNote.label} (${nextNote.note})`;
        }
      }
    }
  }

  function highlightPianoKey(freq) {
    const btn = $(`button[data-freq="${freq}"]`, keysWrapper);
    if (!btn) return;
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 200);
  }

  // Modos do Teclado
  $('#btn-keymode-free')?.addEventListener('click', (e) => setKeyboardMode('free', e.target));
  $('#btn-keymode-learn')?.addEventListener('click', (e) => setKeyboardMode('learn', e.target));
  $('#btn-keymode-challenge')?.addEventListener('click', (e) => setKeyboardMode('challenge', e.target));    function setKeyboardMode(mode, targetBtn) {     currentKeyboardMode = mode;     $$('.mode-tab').forEach(tab => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    });

    targetBtn.classList.add('active');
    targetBtn.setAttribute('aria-selected', 'true');

    if (guideBanner) {
      if (mode === 'learn') {
        guideBanner.hidden = false;
        learnIndex = 0;
        const note = pianoKeysData.find(k => k.note === learnSequence[0]);
        if (guideText) guideText.textContent = `Modo Aprender: Toque a nota ${note.label} (${note.note})`;
        speakText('Modo Aprender ativado.');
      } else if (mode === 'challenge') {
        guideBanner.hidden = false;
        if (guideText) guideText.textContent = 'Modo Desafio: Crie sua própria melodia usando a memória e intuição!';
        speakText('Modo Desafio ativado.');
      } else {
        guideBanner.hidden = true;
        speakText('Modo Livre ativado.');
      }
    }
  }

  renderPianoKeys();

  /* ==========================================================================
     11. BATERIA & PADS DE PERCUSSÃO
     ========================================================================== */

  const drumPads = $$('.drum-pad');
  let drumDemoInterval = null;

  function triggerDrumSound(soundType) {
    unlockAchievement('ach-rhythm');
    playInstrumentSound(soundType);
    highlightDrumPad(soundType);
  }

  function highlightDrumPad(soundType) {
    const pad = $(`.drum-pad[data-sound="${soundType}"]`);
    if (!pad) return;
    pad.classList.add('active');
    setTimeout(() => pad.classList.remove('active'), 150);
  }

  drumPads.forEach(pad => {
    pad.addEventListener('click', () => {
      const sound = pad.dataset.sound;
      triggerDrumSound(sound);
    });
  });

  // Demonstração Rítmica
  const btnPlayDemo = $('#btn-play-demo-rhythm');
  const btnStopDemo = $('#btn-stop-demo-rhythm');

  function playDrumDemo() {
    stopDrumDemo();
    let step = 0;
    if (btnPlayDemo) btnPlayDemo.hidden = true;
    if (btnStopDemo) btnStopDemo.hidden = false;

    drumDemoInterval = setInterval(() => {
      if (step % 2 === 0) triggerDrumSound('kick');
      if (step % 4 === 2) triggerDrumSound('snare');
      triggerDrumSound('hihat');
      step = (step + 1) % 8;
    }, 250);
  }

  function stopDrumDemo() {
    if (drumDemoInterval) {
      clearInterval(drumDemoInterval);
      drumDemoInterval = null;
    }
    if (btnPlayDemo) btnPlayDemo.hidden = false;
    if (btnStopDemo) btnStopDemo.hidden = true;
  }

  btnPlayDemo?.addEventListener('click', playDrumDemo);
  btnStopDemo?.addEventListener('click', stopDrumDemo);

  /* Mapeamento de Teclado Global (Sem Conflitos) */
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toUpperCase();

    // Bateria (A, S, D, F, G)
    const drumPad = $(`.drum-pad[data-key="${key}"]`);
    if (drumPad) {
      triggerDrumSound(drumPad.dataset.sound);
      return;
    }

    // Teclado Piano
    const pianoItem = pianoKeysData.find(k => k.key === key);
    if (pianoItem) {
      triggerPianoKey(pianoItem);
    }
  });

  /* ==========================================================================
     12. PERFIL MUSICAL & MAPEAMENTO SENSORIAL
     ========================================================================== */

  const moodBtns = $$('.mood-btn');
  const discoveryQuizStep = $('#discovery-quiz-step');
  const discoveryResultStep = $('#discovery-result-step');
  const discoveryProfileTitle = $('#discovery-profile-title');
  const discoveryProfileDesc = $('#discovery-profile-desc');
  const discoveryRecList = $('#discovery-recommendations-list');
  const btnRestartDiscovery = $('#btn-restart-discovery');

  const moodProfiles = {
    calm: {
      title: 'Perfil Orgânico & Tranquilo',
      desc: 'Sua sensibilidade busca paz, fluidez e sons quentes e acolhedores.',
      recs: ['🎸 Violão', '🎻 Violino']
    },
    energetic: {
      title: 'Perfil Pulsante & Rítmico',
      desc: 'Você se move através da energia, da presença marcante e da percussão vibrante.',
      recs: ['🥁 Bateria', '🎹 Teclado']
    },
    creative: {
      title: 'Perfil Melódico & Dinâmico',
      desc: 'Sua mente explora harmonias ricas, estruturas versáteis e combinações sonoras.',
      recs: ['🎹 Teclado', '🎸 Violão']
    },
    curious: {
      title: 'Perfil Expressivo & Nuanceado',
      desc: 'Você aprecia a profundidade clássica, a dinâmica do arco e a expressividade.',
      recs: ['🎻 Violino', '🎹 Teclado']
    }
  };

  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      const profile = moodProfiles[mood] || moodProfiles.calm;

      if (discoveryProfileTitle) discoveryProfileTitle.textContent = profile.title;
      if (discoveryProfileDesc) discoveryProfileDesc.textContent = profile.desc;

      if (discoveryRecList) {
        discoveryRecList.innerHTML = profile.recs
          .map(rec => `<div class="rec-item">${escapeHTML(rec)}</div>`)
          .join('');
      }

      if (discoveryQuizStep) discoveryQuizStep.hidden = true;
      if (discoveryResultStep) discoveryResultStep.hidden = false;

      unlockAchievement('ach-explorer');
      speakText(`Seu perfil: ${profile.title}. ${profile.desc}`);
    });
  });

  btnRestartDiscovery?.addEventListener('click', () => {
    if (discoveryQuizStep) discoveryQuizStep.hidden = false;
    if (discoveryResultStep) discoveryResultStep.hidden = true;
  });

  /* ==========================================================================
     13. CATÁLOGO DE INSTRUMENTOS & MODAL ACESSÍVEL
     ========================================================================== */

  const catalogGrid = $('#catalog-grid');   const filterBtns = $$('.filter-btn');
  const instrumentModal = $('#instrument-modal');
  const modalContentBody = $('#modal-content-body');
  let lastActiveElement = null;

  function renderCatalog(filter = 'all') {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = '';

    const filtered = filter === 'all'
      ? instrumentsData
      : instrumentsData.filter(i => i.category === filter);

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
          <button class="pill-btn highlight btn-listen-inst" data-id="${inst.id}">🔊 Ouvir Som</button>
          <button class="pill-btn outline btn-details-inst" data-id="${inst.id}">ℹ️ Detalhes</button>
        </div>
      `;
      catalogGrid.appendChild(card);
    });

    $$('.btn-listen-inst', catalogGrid).forEach(btn => {       btn.addEventListener('click', () => {         const inst = instrumentsData.find(i => i.id === btn.dataset.id);         if (inst) playInstrumentSound(inst.soundType, inst.freq);       });     });      $$
('.btn-details-inst', catalogGrid).forEach(btn => {
      btn.addEventListener('click', (e) => {
        lastActiveElement = e.target;
        const inst = instrumentsData.find(i => i.id === btn.dataset.id);
        if (inst) openInstrumentModal(inst);
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

  function openInstrumentModal(inst) {
    if (!instrumentModal || !modalContentBody) return;

    modalContentBody.innerHTML = `
      <div class="modal-header">
        <span class="badge">${escapeHTML(inst.categoryLabel)}</span>
        <h3 id="modal-title">${escapeHTML(inst.name)}</h3>
        <button class="close-modal-btn" id="btn-close-modal" aria-label="Fechar janela de detalhes">✕</button>
      </div>
      <div class="modal-body">
        <p><strong>Descrição:</strong> ${escapeHTML(inst.desc)}</p>
        <p><strong>História & Origem:</strong> ${escapeHTML(inst.history)}</p>
      </div>
      <div class="modal-actions" style="margin-top: 1.5rem; display: flex; gap: 1rem;">
        <button class="pill-btn highlight" id="btn-modal-listen">🔊 Ouvir Demonstração</button>
        <button class="pill-btn outline" id="btn-modal-close-action">Fechar</button>
      </div>
    `;

    instrumentModal.showModal();

    const btnClose = $('#btn-close-modal', modalContentBody);
    const btnCloseAction = $('#btn-modal-close-action', modalContentBody);
    const btnListen = $('#btn-modal-listen', modalContentBody);

    const closeModal = () => {
      instrumentModal.close();
      if (lastActiveElement) lastActiveElement.focus();
    };

    btnClose?.addEventListener('click', closeModal);
    btnCloseAction?.addEventListener('click', closeModal);
    btnListen?.addEventListener('click', () => playInstrumentSound(inst.soundType, inst.freq));

    instrumentModal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    }, { once: true });
  }

  renderCatalog();

  /* ==========================================================================
     14. QUIZ MUSICAL DE APRENDIZADO (8 PERGUNTAS)
     ========================================================================== */

  const quizQuestions = [
    {
      q: 'Qual família de instrumentos produz som através da vibração de cordas?',
      opts: [
        { text: '🎸 Cordas (Violão, Violino)', points: 'cordas' },
        { text: '🥁 Percussão (Bateria)', points: 'percussao' },
        { text: '🎹 Teclas (Teclado)', points: 'teclas' }
      ]
    },
    {
      q: 'Se você quer marcar o ritmo e a batida principal de uma música, qual escolhe?',
      opts: [
        { text: '🥁 Bateria', points: 'percussao' },
        { text: '🎻 Violino', points: 'cordas' },
        { text: '🎹 Teclado', points: 'teclas' }
      ]
    },
    {
      q: 'Qual destes instrumentos utiliza um arco com crina de cavalo para friccionar suas cordas?',
      opts: [
        { text: '🎻 Violino', points: 'cordas' },
        { text: '🎸 Violão', points: 'cordas' },
        { text: '🎹 Teclado', points: 'teclas' }
      ]
    },
    {
      q: 'O teclado musical permite tocar notas graves e agudas simultaneamente com facilidade?',
      opts: [
        { text: 'Sim, é ideal para harmonia e melodia', points: 'teclas' },
        { text: 'Não, só toca uma nota de cada vez', points: 'percussao' }
      ]
    },
    {
      q: 'Qual instrumento é símbolo tradicional da Bossa Nova e do MPB nas praias brasileiras?',
      opts: [
        { text: '🎸 Violão', points: 'cordas' },
        { text: '🥁 Bateria', points: 'percussao' },
        { text: '🎻 Violino', points: 'cordas' }
      ]
    },
    {
      q: 'Para criar um som de impacto explosivo no final de uma virada musical, usamos:',
      opts: [
        { text: '🥁 Prato de Ataque (Crash) da Bateria', points: 'percussao' },
        { text: '🎸 Uma corda solta do Violão', points: 'cordas' },
        { text: '🎹 Tecla central do teclado', points: 'teclas' }
      ]
    },
    {
      q: 'Qual instrumento é fundamental em uma orquestra sinfônica para conduzir temas dramáticos?',
      opts: [
        { text: '🎻 Violino', points: 'cordas' },
        { text: '🎸 Violão elétrico', points: 'cordas' },
        { text: '🥁 Caixas de marcha', points: 'percussao' }
      ]
    },
    {
      q: 'O que a Bateria, o Teclado, o Violão e o Violino têm em comum no Sonora?',
      opts: [
        { text: 'Todos são inclusivos, acessíveis e expressivos!', points: 'todos' },
        { text: 'São exatamente os mesmos sons', points: 'nenhum' }
      ]
    }
  ];

  let quizCurrentIndex = 0;
  let quizScores = { cordas: 0, teclas: 0, percussao: 0 };

  const quizCard = $('#quiz-question-card');
  const quizResultCard = $('#quiz-result-card');
  const quizText = $('#quiz-question-text');
  const quizOptionsContainer = $('#quiz-options-container');
  const quizCounter = $('#quiz-counter');
  const quizProgressFill = $('#quiz-progress-fill');
  const btnRestartQuiz = $('#btn-restart-quiz');

  function renderQuizQuestion() {
    if (quizCurrentIndex >= quizQuestions.length) {
      showQuizResults();
      return;
    }

    const qData = quizQuestions[quizCurrentIndex];
    if (quizText) quizText.textContent = qData.q;
    if (quizCounter) quizCounter.textContent = `Pergunta ${quizCurrentIndex + 1} de ${quizQuestions.length}`;

    const progressPct = Math.round(((quizCurrentIndex) / quizQuestions.length) * 100);
    if (quizProgressFill) quizProgressFill.style.width = `${progressPct}%`;

    if (quizOptionsContainer) {
      quizOptionsContainer.innerHTML = '';
      qData.opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          if (opt.points && quizScores[opt.points] !== undefined) {
            quizScores[opt.points]++;
          }
          quizCurrentIndex++;
          renderQuizQuestion();
        });
        quizOptionsContainer.appendChild(btn);
      });
    }
  }

  function showQuizResults() {
    if (quizCard) quizCard.hidden = true;
    if (quizResultCard) quizResultCard.hidden = false;
    if (quizProgressFill) quizProgressFill.style.width = '100%';

    let topCategory = 'cordas';
    if (quizScores.teclas > quizScores[topCategory]) topCategory = 'teclas';
    if (quizScores.percussao > quizScores[topCategory]) topCategory = 'percussao';

    const matchInst = instrumentsData.find(i => i.category === topCategory) || instrumentsData[0];

    const resultTitle = $('#quiz-result-title');
    const resultText = $('#quiz-result-text');
    const resultPreview = $('#quiz-result-instrument-preview');

    if (resultTitle) resultTitle.textContent = `Sua maior afinidade: ${matchInst.name}!`;
    if (resultText) resultText.textContent = `Com base nas suas respostas, você demonstra forte sintonia com a família de ${matchInst.categoryLabel}.`;

    if (resultPreview) {
      resultPreview.innerHTML = `
        <div class="rec-item" style="margin-top: 1rem;">
          <h4>${escapeHTML(matchInst.name)}</h4>
          <p>${escapeHTML(matchInst.desc)}</p>
          <button class="pill-btn highlight" id="btn-quiz-play-match" style="margin-top: 0.5rem;">🔊 Ouvir ${escapeHTML(matchInst.name)}</button>
        </div>
      `;

      $('#btn-quiz-play-match')?.addEventListener('click', () => {
        playInstrumentSound(matchInst.soundType, matchInst.freq);
      });
    }

    speakText(`Resultado do quiz: Sua maior afinidade é o ${matchInst.name}.`);
  }

  btnRestartQuiz?.addEventListener('click', () => {
    quizCurrentIndex = 0;
    quizScores = { cordas: 0, teclas: 0, percussao: 0 };
    if (quizCard) quizCard.hidden = false;
    if (quizResultCard) quizResultCard.hidden = true;
    renderQuizQuestion();
  });

  renderQuizQuestion();

  /* ==========================================================================
     15. PERCURSO GUIADO (ONBOARDING TOUR)
     ========================================================================== */

  const tourModal = $('#guided-tour-modal');
  const btnStartTour = $('#btn-start-tour');
  const btnSkipTour = $('#btn-skip-tour');

  const tourVisited = safeStorageGet('sonora_tour_visited');
  if (!tourVisited && tourModal) {
    setTimeout(() => {
      tourModal.showModal();
    }, 1000);
  }

  btnStartTour?.addEventListener('click', () => {
    safeStorageSet('sonora_tour_visited', 'true');
    tourModal.close();
    speakText('Iniciando o Sonora. Use a tecla TAB para navegar entre os controles de acessibilidade e os instrumentos.');
    $('#meu-jeito')?.scrollIntoView({ behavior: 'smooth' });
  });

  btnSkipTour?.addEventListener('click', () => {
    safeStorageSet('sonora_tour_visited', 'true');
    tourModal.close();
  });

});
