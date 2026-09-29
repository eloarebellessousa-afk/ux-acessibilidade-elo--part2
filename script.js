/**
 * SONORA — EXPERIÊNCIA DIGITAL MUSICAL COMPLETA & ACESSÍVEL
 * Script final refatorado e totalmente funcional.
 */

document.addEventListener('DOMContentLoaded', () => {

  'use strict';

  /* ==========================================================================
     0. UTILITÁRIOS E AUXILIARES
     ========================================================================== */

  const $ = (selector, parent = document) => parent.querySelector(selector);   const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

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

    // Sensibilidade reduzida para deixar a reatividade ao cursor mais lenta e suave
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.00015;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.00015;
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

    // Movimento suavizado com amortecimento
    targetX += (mouseX - targetX) * 0.02;
    targetY += (mouseY - targetY) * 0.02;

    if (particlesMesh) {
      particlesMesh.rotation.y += 0.001;
      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += targetX * 0.1;
      particlesMesh.rotation.x += targetY * 0.1;

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

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  // Visualizador de Áudio
  let visualizerFrame = null;
  function startVisualizer() {
    const canvas = $('#audio-visualizer-canvas');
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      visualizerFrame = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        ctx.fillStyle = `rgb(${barHeight + 100}, 82, 245)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    }

    draw();
  }

  function triggerVisualizerFeedback() {
    const feedback = $('#visualizer-text-feedback');
    if (!feedback) return;
    feedback.textContent = 'Emissão Sonora Detectada!';
    setTimeout(() => {
      feedback.textContent = 'Visualizador Áudio-Visual em Espera...';
    }, 1200);
  }

  /* ==========================================================================
     7. HERO ORB INTERATIVO
     ========================================================================== */

  $('#hero-orb')?.addEventListener('click', () => {
    playPianoNote(440, 2.5);
    unlockAchievement('ach-first-sound');
  });

});
