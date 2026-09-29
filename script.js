/**
 * SONORA — EXPERIÊNCIA DIGITAL MUSICAL COMPLETA & ACESSÍVEL
 * Script final
 *
 * Recursos:
 * - Web Audio API com timbres individuais
 * - Three.js reativo ao cursor
 * - Visualizador de áudio
 * - Teclado musical
 * - Bateria
 * - Metrônomo
 * - Gravador e reprodução
 * - Catálogo interativo
 * - Descubra seu perfil
 * - Quiz
 * - Gamificação
 * - Acessibilidade persistente
 * - Leitor de tela / síntese de voz
 */

document.addEventListener('DOMContentLoaded', () => {

  'use strict';

  /* ==========================================================================
     0. UTILITÁRIOS
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
    if (!('speechSynthesis' in window)) {
      announceToSR(text);
      return;
    }

    if (!speechEnabled) {
      announceToSR(text);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
    announceToSR(text);
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

    announceToSR(
      speechEnabled
        ? 'Síntese de voz ativada.'
        : 'Síntese de voz desativada.'
    );

    unlockAchievement('ach-acc');
  });

  $('#btn-quick-speech')?.addEventListener('click', () => {
    const text =
      'Você está no Sonora, uma experiência digital musical focada em acessibilidade universal.';

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
      desc:
        'Instrumento de cordas dedilhadas com sonoridade quente, orgânica e acolhedora.',
      history:
        'O violão evoluiu de antigos instrumentos de cordas como o alaúde e a vihuela. É um dos instrumentos mais populares do mundo, essencial na Bossa Nova, MPB, Flamenco e Pop.',
      freq: 196,
      soundType: 'guitar'
    },

    {
      id: 'teclado',
      name: 'Teclado',
      category: 'teclas',
      categoryLabel: '🎹 Teclas',
      desc:
        'Versátil e expressivo, oferece controle melódico e harmônico completo.',
      history:
        'Baseado no layout clássico do piano, o teclado moderno utiliza síntese eletrônica e digital para reproduzir timbres de piano acústico, órgãos e sintetizadores.',
      freq: 261.63,
      soundType: 'piano'
    },

    {
      id: 'bateria',
      name: 'Bateria',
      category: 'percussao',
      categoryLabel: '🥁 Percussão',
      desc:
        'Conjunto de tambores e pratos que dão o pulso e o ritmo à música.',
      history:
        'Surgiu nos Estados Unidos no início do século XX com a junção de vários instrumentos de percussão para serem tocados por um único músico usando baquetas e pedais.',
      freq: 100,
      soundType: 'drums',
      isDrum: true
    },

    {
      id: 'violino',
      name: 'Violino',
      category: 'cordas',
      categoryLabel: '🎻 Cordas',
      desc:
        'O menor e mais agudo instrumento da família das cordas friccionadas por arco.',
      history:
        'Criado na Itália no século XVI, o violino tornou-se fundamental na música orquestral e em diversos gêneros musicais graças à sua grande expressividade.',
      freq: 440,
      soundType: 'violin'
    }
  ];

  /* ==========================================================================
     3. CONQUISTAS
     ========================================================================== */

  const achievements = [
    {
      id: 'ach-first-sound',
      title: 'Primeiro Som',
      desc: 'Tocou sua primeira nota no Sonora.',
      icon: '🎵'
    },
    {
      id: 'ach-melody',
      title: 'Melodista',
      desc: 'Completou uma sequência no Modo Aprender.',
      icon: '🎹'
    },
    {
      id: 'ach-rhythm',
      title: 'Ritmo Puro',
      desc: 'Experimentou os pads de percussão.',
      icon: '🥁'
    },
    {
      id: 'ach-explorer',
      title: 'Explorador Sonoro',
      desc: 'Descobriu seu perfil musical.',
      icon: '✨'
    },
    {
      id: 'ach-acc',
      title: 'Acessibilidade Total',
      desc: 'Personalizou suas preferências de uso.',
      icon: '♿'
    },
    {
      id: 'ach-creator',
      title: 'Criador Musical',
      desc: 'Gravou sua própria sequência no Estúdio.',
      icon: '🎼'
    }
  ];

  let unlockedIds = new Set();

  try {
    const savedAchievements = JSON.parse(
      safeStorageGet('sonora_achievements', '[]')
    );

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

      card.className =
        `achievement-card ${unlocked ? 'unlocked' : ''}`;

      card.innerHTML = `
        <div class="ach-icon" aria-hidden="true">
          ${achievement.icon}
        </div>

        <div class="ach-info">
          <span class="ach-title">
            ${escapeHTML(achievement.title)}
          </span>

          <span class="ach-desc">
            ${escapeHTML(achievement.desc)}
          </span>
        </div>
      `;

      grid.appendChild(card);
    });

    const percentage = Math.round(
      (unlockedIds.size / achievements.length) * 100
    );

    const barFill = $('#journey-bar-fill');
    const percentageText = $('#journey-percentage-text');
    const progress = $('.journey-progress');

    if (barFill) {
      barFill.style.width = `${percentage}%`;
    }

    if (percentageText) {
      percentageText.textContent = `${percentage}%`;
    }

    if (progress) {
      progress.setAttribute('aria-valuenow', percentage);
    }
  }

  function unlockAchievement(id) {
    if (unlockedIds.has(id)) return;

    unlockedIds.add(id);

    safeStorageSet(
      'sonora_achievements',
      JSON.stringify([...unlockedIds])
    );

    renderAchievements();

    const achievement = achievements.find(item => item.id === id);

    if (achievement) {
      showAchievementToast(achievement);
    }
  }

  function showAchievementToast(achievement) {
    const toast = $('#achievement-toast');
    const toastName = $('#toast-achievement-name');

    if (!toast || !toastName) return;

    toastName.textContent = achievement.title;
    toast.hidden = false;

    announceToSR(
      `Conquista desbloqueada: ${achievement.title}`
    );

    clearTimeout(showAchievementToast.timer);

    showAchievementToast.timer = setTimeout(() => {
      toast.hidden = true;
    }, 4000);
  }

  renderAchievements();

  /* ==========================================================================
     4. ACESSIBILIDADE E PREFERÊNCIAS
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

  let fontSizeOffset = Number(
    safeStorageGet('sonora_font_offset', '0')
  );

  if (!Number.isFinite(fontSizeOffset)) {
    fontSizeOffset = 0;
  }

  fontSizeOffset = clamp(fontSizeOffset, -2, 4);

  function applyFontSize() {
    root.style.fontSize = `${16 + fontSizeOffset}px`;
  }

  applyFontSize();

  function setSimpleMode(enable, announce = true) {
    const enabled = Boolean(enable);

    body.setAttribute(
      'data-simple-mode',
      String(enabled)
    );

    if (simpleBanner) {
      simpleBanner.hidden = !enabled;
    }

    [btnSimpleMode, btnQuickSimple]
      .filter(Boolean)
      .forEach(button => {
        button.setAttribute(
          'aria-pressed',
          String(enabled)
        );
      });

    safeStorageSet(
      'sonora_simple_mode',
      String(enabled)
    );

    if (enabled) {
      stopThreeAnimation();
    } else {
      startThreeAnimation();
    }

    if (announce) {
      announceToSR(
        enabled
          ? 'Modo Simples ativado. Layout limpo e direto.'
          : 'Modo Completo ativado.'
      );
    }
  }

  function setHighContrast(enable) {
    const enabled = Boolean(enable);

    body.setAttribute(
      'data-high-contrast',
      String(enabled)
    );

    if (enabled) {
      body.setAttribute(
        'data-soft-contrast',
        'false'
      );
    }

    btnHighContrast?.setAttribute(
      'aria-pressed',
      String(enabled)
    );

    btnSoftContrast?.setAttribute(
      'aria-pressed',
      'false'
    );

    safeStorageSet(
      'sonora_high_contrast',
      String(enabled)
    );

    if (enabled) {
      safeStorageSet('sonora_soft_contrast', 'false');
    }

    announceToSR(
      enabled
        ? 'Alto contraste ativado.'
        : 'Alto contraste desativado.'
    );

    unlockAchievement('ach-acc');
  }

  function setSoftContrast(enable) {
    const enabled = Boolean(enable);

    body.setAttribute(
      'data-soft-contrast',
      String(enabled)
    );

    if (enabled) {
      body.setAttribute(
        'data-high-contrast',
        'false'
      );
    }

    btnSoftContrast?.setAttribute(
      'aria-pressed',
      String(enabled)
    );

    btnHighContrast?.setAttribute(
      'aria-pressed',
      'false'
    );

    safeStorageSet(
      'sonora_soft_contrast',
      String(enabled)
    );

    if (enabled) {
      safeStorageSet('sonora_high_contrast', 'false');
    }

    announceToSR(
      enabled
        ? 'Contraste suave ativado.'
        : 'Contraste suave desativado.'
    );

    unlockAchievement('ach-acc');
  }

  function setReducedMotion(enable) {
    const enabled = Boolean(enable);

    body.setAttribute(
      'data-motion-reduce',
      String(enabled)
    );

    btnReduceMotion?.setAttribute(
      'aria-pressed',
      String(enabled)
    );

    safeStorageSet(
      'sonora_motion_reduce',
      String(enabled)
    );

    if (enabled) {
      stopThreeAnimation();
    } else {
      startThreeAnimation();
    }

    announceToSR(
      enabled
        ? 'Animações reduzidas.'
        : 'Animações restauradas.'
    );

    unlockAchievement('ach-acc');
  }

  function setLargeControls(enable) {
    const enabled = Boolean(enable);

    body.setAttribute(
      'data-large-controls',
      String(enabled)
    );

    btnLargeControls?.setAttribute(
      'aria-pressed',
      String(enabled)
    );

    safeStorageSet(
      'sonora_large_controls',
      String(enabled)
    );

    announceToSR(
      enabled
        ? 'Controles maiores ativados.'
        : 'Controles normais.'
    );

    unlockAchievement('ach-acc');
  }

  btnSimpleMode?.addEventListener('click', () => {
    const current =
      body.getAttribute('data-simple-mode') === 'true';

    setSimpleMode(!current);
    unlockAchievement('ach-acc');
  });

  btnQuickSimple?.addEventListener('click', () => {
    const current =
      body.getAttribute('data-simple-mode') === 'true';

    setSimpleMode(!current);
    unlockAchievement('ach-acc');
  });

  btnDisableSimple?.addEventListener(
    'click',
    () => setSimpleMode(false)
  );

  btnFontIncrease?.addEventListener('click', () => {
    fontSizeOffset = clamp(
      fontSizeOffset + 2,
      -2,
      4
    );

    applyFontSize();

    safeStorageSet(
      'sonora_font_offset',
      String(fontSizeOffset)
    );

    announceToSR('Tamanho da fonte aumentado.');
    unlockAchievement('ach-acc');
  });

  btnFontDecrease?.addEventListener('click', () => {
    fontSizeOffset = clamp(
      fontSizeOffset - 2,
      -2,
      4
    );

    applyFontSize();

    safeStorageSet(
      'sonora_font_offset',
      String(fontSizeOffset)
    );

    announceToSR('Tamanho da fonte diminuído.');
    unlockAchievement('ach-acc');
  });

  btnHighContrast?.addEventListener('click', () => {
    const current =
      body.getAttribute('data-high-contrast') === 'true';

    setHighContrast(!current);
  });

  btnSoftContrast?.addEventListener('click', () => {
    const current =
      body.getAttribute('data-soft-contrast') === 'true';

    setSoftContrast(!current);
  });

  btnReduceMotion?.addEventListener('click', () => {
    const current =
      body.getAttribute('data-motion-reduce') === 'true';

    setReducedMotion(!current);
  });

  btnLargeControls?.addEventListener('click', () => {
    const current =
      body.getAttribute('data-large-controls') === 'true';

    setLargeControls(!current);
  });

  /* Restaura preferências */

  setSimpleMode(
    safeStorageGet('sonora_simple_mode') === 'true',
    false
  );

  setHighContrast(
    safeStorageGet('sonora_high_contrast') === 'true'
  );

  setSoftContrast(
    safeStorageGet('sonora_soft_contrast') === 'true'
  );

  setReducedMotion(
    safeStorageGet('sonora_motion_reduce') === 'true'
  );

  setLargeControls(
    safeStorageGet('sonora_large_controls') === 'true'
  );

  /* ==========================================================================
     5. WEB AUDIO API
     ========================================================================== */

  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;

  let audioCtx = null;
  let masterGain = null;
  let analyser = null;

  function initAudio() {
    if (!AudioContextClass) {
      announceToSR(
        'Seu navegador não oferece suporte ao áudio interativo.'
      );
      return false;
    }

    if (!audioCtx) {
      audioCtx = new AudioContextClass();

      masterGain = audioCtx.createGain();

      analyser = audioCtx.createAnalyser();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;

      const volume = $('#master-volume');

      masterGain.gain.value = volume
        ? Number(volume.value)
        : 0.75;

      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);

      startVisualizer();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    return true;
  }

  $('#master-volume')?.addEventListener(
    'input',
    event => {
      const value = Number(event.target.value);

      if (masterGain && Number.isFinite(value)) {
        masterGain.gain.setTargetAtTime(
          value,
          audioCtx.currentTime,
          0.015
        );
      }
    }
  );

  function createEnvelope(
    gainNode,
    now,
    peak,
    attack,
    decay,
    release
  ) {
    gainNode.gain.cancelScheduledValues(now);

    gainNode.gain.setValueAtTime(
      0.0001,
      now
    );

    gainNode.gain.linearRampToValueAtTime(
      peak,
      now + attack
    );

    gainNode.gain.exponentialRampToValueAtTime(
      Math.max(peak * 0.35, 0.0001),
      now + attack + decay
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      now + attack + decay + release
    );
  }

  function connectVoice(oscillator, gain) {
    oscillator.connect(gain);
    gain.connect(masterGain);
  }

  /* --------------------------------------------------------------------------
     VIOLÃO — ataque de corda dedilhada
     -------------------------------------------------------------------------- */

  function playGuitarNote(freq, duration = 1.4) {
    if (!initAudio()) return;

    const now = audioCtx.currentTime;
    const output = audioCtx.createGain();

    const filter = audioCtx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(
      2800,
      now
    );
    filter.Q.value = 0.7;

    output.gain.setValueAtTime(
      0.0001,
      now
    );

    output.gain.exponentialRampToValueAtTime(
      0.32,
      now + 0.008
    );

    output.gain.exponentialRampToValueAtTime(
      0.08,
      now + Math.min(duration, 0.65)
    );

    output.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    filter.connect(output);
    output.connect(masterGain);

    const partials = [
      { ratio: 1, gain: 0.75 },
      { ratio: 2, gain: 0.20 },
      { ratio: 3, gain: 0.09 },
      { ratio: 4, gain: 0.04 }
    ];

    const oscillators = [];

    partials.forEach((partial, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type =
        index === 0
          ? 'triangle'
          : 'sine';

      osc.frequency.setValueAtTime(
        freq * partial.ratio,
        now
      );

      gain.gain.value = partial.gain;

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now);
      osc.stop(now + duration + 0.05);

      oscillators.push(osc);
    });

    /* Pequeno ataque de palheta/dedo */

    const bufferLength =
      Math.floor(audioCtx.sampleRate * 0.025);

    const buffer =
      audioCtx.createBuffer(
        1,
        bufferLength,
        audioCtx.sampleRate
      );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferLength; i++) {
      data[i] =
        (Math.random() * 2 - 1) *
        Math.pow(1 - i / bufferLength, 3);
    }

    const noise =
      audioCtx.createBufferSource();

    const noiseFilter =
      audioCtx.createBiquadFilter();

    const noiseGain =
      audioCtx.createGain();

    noise.buffer = buffer;

    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2200;
    noiseFilter.Q.value = 1.2;

    noiseGain.gain.setValueAtTime(
      0.18,
      now
    );

    noiseGain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.025
    );

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    noise.start(now);

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  /* --------------------------------------------------------------------------
     TECLADO — piano digital
     -------------------------------------------------------------------------- */

  function playPianoNote(freq, duration = 2.0) {
    if (!initAudio()) return;

    const now = audioCtx.currentTime;

    const output =
      audioCtx.createGain();

    const filter =
      audioCtx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 4200;
    filter.Q.value = 0.45;

    output.gain.setValueAtTime(
      0.0001,
      now
    );

    output.gain.linearRampToValueAtTime(
      0.34,
      now + 0.008
    );

    output.gain.exponentialRampToValueAtTime(
      0.11,
      now + 0.45
    );

    output.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    filter.connect(output);
    output.connect(masterGain);

    const harmonics = [
      [1, 0.72],
      [2, 0.24],
      [3, 0.12],
      [4, 0.055],
      [5, 0.025]
    ];

    harmonics.forEach(
      ([ratio, level], index) => {
        const osc =
          audioCtx.createOscillator();

        const gain =
          audioCtx.createGain();

        osc.type =
          index === 0
            ? 'triangle'
            : 'sine';

        osc.frequency.value =
          freq * ratio;

        gain.gain.value = level;

        osc.connect(gain);
        gain.connect(filter);

        osc.start(now);
        osc.stop(now + duration + 0.05);
      }
    );

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  /* --------------------------------------------------------------------------
     VIOLINO — arco + harmônicos + vibrato
     -------------------------------------------------------------------------- */

  function playViolinNote(freq, duration = 1.8) {
    if (!initAudio()) return;

    const now = audioCtx.currentTime;

    const output =
      audioCtx.createGain();

    const filter =
      audioCtx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 3200;
    filter.Q.value = 1.1;

    output.gain.setValueAtTime(
      0.0001,
      now
    );

    output.gain.linearRampToValueAtTime(
      0.23,
      now + 0.10
    );

    output.gain.setValueAtTime(
      0.20,
      now + Math.max(0.12, duration - 0.3)
    );

    output.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    filter.connect(output);
    output.connect(masterGain);

    const oscillators = [];

    const partials = [
      [1, 0.75],
      [2, 0.25],
      [3, 0.12],
      [4, 0.06]
    ];

    partials.forEach(
      ([ratio, level]) => {
        const osc =
          audioCtx.createOscillator();

        const gain =
          audioCtx.createGain();

        osc.type = 'sawtooth';

        osc.frequency.value =
          freq * ratio;

        gain.gain.value = level;

        osc.connect(gain);
        gain.connect(filter);

        osc.start(now);
        osc.stop(now + duration + 0.1);

        oscillators.push(osc);
      }
    );

    /* Vibrato suave */

    const vibrato =
      audioCtx.createOscillator();

    const vibratoGain =
      audioCtx.createGain();

    vibrato.frequency.value = 5.2;
    vibratoGain.gain.value = 3.5;

    vibrato.connect(vibratoGain);

    oscillators.forEach(
      osc => vibratoGain.connect(osc.detune)
    );

    vibrato.start(now + 0.35);
    vibrato.stop(now + duration);

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  /* --------------------------------------------------------------------------
     BATERIA
     -------------------------------------------------------------------------- */

  function createNoiseBuffer(seconds = 0.3) {
    const length =
      Math.floor(
        audioCtx.sampleRate * seconds
      );

    const buffer =
      audioCtx.createBuffer(
        1,
        length,
        audioCtx.sampleRate
      );

    const data =
      buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] =
        Math.random() * 2 - 1;
    }

    return buffer;
  }

  function playKick() {
    if (!initAudio()) return;

    const now = audioCtx.currentTime;

    const osc =
      audioCtx.createOscillator();

    const gain =
      audioCtx.createGain();

    osc.type = 'sine';

    osc.frequency.setValueAtTime(
      150,
      now
    );

    osc.frequency.exponentialRampToValueAtTime(
      48,
      now + 0.12
    );

    gain.gain.setValueAtTime(
      0.85,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.42
    );

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

    /* Corpo */

    const bodyOsc =
      audioCtx.createOscillator();

    const bodyGain =
      audioCtx.createGain();

    bodyOsc.type = 'triangle';
    bodyOsc.frequency.value = 190;

    bodyGain.gain.setValueAtTime(
      0.35,
      now
    );

    bodyGain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.15
    );

    bodyOsc.connect(bodyGain);
    bodyGain.connect(masterGain);

    bodyOsc.start(now);
    bodyOsc.stop(now + 0.18);

    /* Ruído */

    const noise =
      audioCtx.createBufferSource();

    const filter =
      audioCtx.createBiquadFilter();

    const gain =
      audioCtx.createGain();

    noise.buffer =
      createNoiseBuffer(0.22);

    filter.type = 'highpass';
    filter.frequency.value = 1400;

    gain.gain.setValueAtTime(
      0.48,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.20
    );

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

    const noise =
      audioCtx.createBufferSource();

    const filter =
      audioCtx.createBiquadFilter();

    const gain =
      audioCtx.createGain();

    noise.buffer =
      createNoiseBuffer(0.10);

    filter.type = 'highpass';
    filter.frequency.value = 6500;
    filter.Q.value = 0.6;

    gain.gain.setValueAtTime(
      0.25,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.075
    );

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

    const osc =
      audioCtx.createOscillator();

    const gain =
      audioCtx.createGain();

    osc.type = 'sine';

    osc.frequency.setValueAtTime(
      180,
      now
    );

    osc.frequency.exponentialRampToValueAtTime(
      90,
      now + 0.14
    );

    gain.gain.setValueAtTime(
      0.55,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.45
    );

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

    const noise =
      audioCtx.createBufferSource();

    const highpass =
      audioCtx.createBiquadFilter();

    const lowpass =
      audioCtx.createBiquadFilter();

    const gain =
      audioCtx.createGain();

    noise.buffer =
      createNoiseBuffer(1.4);

    highpass.type = 'highpass';
    highpass.frequency.value = 3500;

    lowpass.type = 'lowpass';
    lowpass.frequency.value = 12000;

    gain.gain.setValueAtTime(
      0.32,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 1.25
    );

    noise.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(masterGain);

    noise.start(now);

    pulse3DEnvironment();
    triggerVisualizerFeedback();
  }

  function playDrumSound(type) {
    switch (type) {
      case 'kick':
        playKick();
        break;

      case 'snare':
        playSnare();
        break;

      case 'hihat':
        playHiHat();
        break;

      case 'tom':
        playTom();
        break;

      case 'crash':
        playCrash();
        break;

      default:
        playKick();
    }
  }

  function playInstrumentNote(
    instrumentId,
    freq,
    duration = 1
  ) {
    switch (instrumentId) {
      case 'violao':
        playGuitarNote(freq, duration);
        break;

      case 'teclado':
        playPianoNote(freq, duration);
        break;

      case 'violino':
        playViolinNote(freq, duration);
        break;

      case 'bateria':
        playDrumSound('kick');
        break;

      default:
        playPianoNote(freq, duration);
    }
  }

  /* ==========================================================================
     6. VISUALIZADOR
     ========================================================================== */

  const visualizerCanvas =
    $('#audio-visualizer-canvas');

  const visualizerFeedback =
    $('#visualizer-text-feedback');

  let visualizerFrame = null;

  function drawVisualizer() {
    if (!visualizerCanvas || !analyser) {
      visualizerFrame =
        requestAnimationFrame(drawVisualizer);

      return;
    }

    const ctx =
      visualizerCanvas.getContext('2d');

    const width =
      visualizerCanvas.clientWidth;

    const height =
      visualizerCanvas.clientHeight;

    const dpr =
      window.devicePixelRatio || 1;

    if (
      visualizerCanvas.width !==
      Math.floor(width * dpr)
    ) {
      visualizerCanvas.width =
        Math.floor(width * dpr);

      visualizerCanvas.height =
        Math.floor(height * dpr);

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    }

    const bufferLength =
      analyser.frequencyBinCount;

    const data =
      new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(data);

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    const barWidth =
      width / bufferLength;

    for (let i = 0; i < bufferLength; i++) {
      const value =
        data[i] / 255;

      const barHeight =
        value * height * 0.85;

      const x =
        i * barWidth;

      const y =
        height - barHeight;

      const gradient =
        ctx.createLinearGradient(
          0,
          height,
          0,
          0
        );

      gradient.addColorStop(
        0,
        '#7952f5'
      );

      gradient.addColorStop(
        1,
        '#00f2fe'
      );

      ctx.fillStyle = gradient;

      ctx.fillRect(
        x,
        y,
        Math.max(1, barWidth - 1),
        barHeight
      );
    }

    visualizerFrame =
      requestAnimationFrame(drawVisualizer);
  }

  function startVisualizer() {
    if (visualizerFrame) return;

    visualizerFrame =
      requestAnimationFrame(drawVisualizer);
  }

  function triggerVisualizerFeedback() {
    if (!visualizerFeedback) return;

    visualizerFeedback.textContent =
      '🔊 Sinal sonoro emitido — frequência ativa no visualizador';

    clearTimeout(triggerVisualizerFeedback.timer);

    triggerVisualizerFeedback.timer =
      setTimeout(() => {
        visualizerFeedback.textContent =
          'Aguardando sinal sonoro...';
      }, 1800);
  }

  /* ==========================================================================
     7. THREE.JS
     ========================================================================== */

  let scene = null;
  let camera = null;
  let renderer = null;
  let particleSystem = null;
  let lightMesh = null;

  let mouseX = 0;
  let mouseY = 0;

  let animFrameId = null;

  function init3D() {
    const container =
      $('#canvas-container');

    if (
      !container ||
      typeof THREE === 'undefined'
    ) {
      return;
    }

    scene = new THREE.Scene();

    camera =
      new THREE.PerspectiveCamera(
        60,
        window.innerWidth /
          window.innerHeight,
        0.1,
        1000
      );

    camera.position.z = 400;

    renderer =
      new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
      });

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    container.appendChild(
      renderer.domElement
    );

    const particleCount = 280;

    const geometry =
      new THREE.BufferGeometry();

    const positions =
      new Float32Array(
        particleCount * 3
      );

    for (
      let i = 0;
      i < positions.length;
      i++
    ) {
      positions[i] =
        (Math.random() - 0.5) * 800;
    }

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        positions,
        3
      )
    );

    const material =
      new THREE.PointsMaterial({
        color: 0x7952f5,
        size: 4,
        transparent: true,
        opacity: 0.6
      });

    particleSystem =
      new THREE.Points(
        geometry,
        material
      );

    scene.add(particleSystem);

    const orbGeometry =
      new THREE.IcosahedronGeometry(
        45,
        2
      );

    const orbMaterial =
      new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });

    lightMesh =
      new THREE.Mesh(
        orbGeometry,
        orbMaterial
      );

    scene.add(lightMesh);

    document.addEventListener(
      'mousemove',
      event => {
        mouseX =
          (event.clientX -
            window.innerWidth / 2) *
          0.05;

        mouseY =
          (event.clientY -
            window.innerHeight / 2) *
          0.05;
      }
    );

    window.addEventListener(
      'resize',
      resize3D
    );

    startThreeAnimation();
  }

  function resize3D() {
    if (!camera || !renderer) return;

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }

  function startThreeAnimation() {
    if (
      !renderer ||
      !scene ||
      !camera
    ) {
      return;
    }

    if (
      body.getAttribute('data-motion-reduce') ===
        'true' ||
      body.getAttribute('data-simple-mode') ===
        'true'
    ) {
      stopThreeAnimation();
      return;
    }

    if (animFrameId) return;

    animate3D();
  }

  function stopThreeAnimation() {
    if (animFrameId) {
      cancelAnimationFrame(
        animFrameId
      );

      animFrameId = null;
    }
  }

  function animate3D() {
    if (
      body.getAttribute('data-motion-reduce') ===
        'true' ||
      body.getAttribute('data-simple-mode') ===
        'true'
    ) {
      stopThreeAnimation();
      return;
    }

    animFrameId =
      requestAnimationFrame(
        animate3D
      );

    if (particleSystem) {
      particleSystem.rotation.y += 0.001;
      particleSystem.rotation.x += 0.0005;
    }

    if (lightMesh) {
      lightMesh.rotation.x += 0.004;
      lightMesh.rotation.y += 0.004;
    }

    if (camera) {
      camera.position.x +=
        (mouseX -
          camera.position.x) *
        0.05;

      camera.position.y +=
        (-mouseY -
          camera.position.y) *
        0.05;

      camera.lookAt(
        scene.position
      );
    }

    renderer.render(
      scene,
      camera
    );
  }

  function pulse3DEnvironment() {
    if (
      !lightMesh ||
      body.getAttribute('data-motion-reduce') ===
        'true'
    ) {
      return;
    }

    lightMesh.scale.set(
      1.25,
      1.25,
      1.25
    );

    clearTimeout(
      pulse3DEnvironment.timer
    );

    pulse3DEnvironment.timer =
      setTimeout(() => {
        if (lightMesh) {
          lightMesh.scale.set(
            1,
            1,
            1
          );
        }
      }, 180);
  }

  init3D();

  /* ==========================================================================
     8. HERO
     ========================================================================== */

  const heroOrb =
    $('#hero-orb');

  const heroSoundCaption =
    $('#hero-sound-caption');

  heroOrb?.addEventListener(
    'click',
    () => {
      playPianoNote(440, 1.4);

      if (heroSoundCaption) {
        heroSoundCaption.textContent =
          'Nota Lá (440 Hz) executada com resposta no ambiente 3D.';
      }

      announceToSR(
        'Nota Lá, 440 hertz, tocada no orbe.'
      );

      unlockAchievement(
        'ach-first-sound'
      );
    }
  );

  /* ==========================================================================
     9. ESTÚDIO / METRÔNOMO
     ========================================================================== */

  let metronomeInterval = null;
  let isMetronomeActive = false;

  const btnMetronome =
    $('#btn-toggle-metronome');

  const metronomeStatus =
    $('#metronome-status');

  const bpmInput =
    $('#metronome-bpm');

  const bpmDisplay =
    $('#bpm-display');

  function getBPM() {
    return clamp(
      Number(bpmInput?.value || 120),
      40,
      240
    );
  }

  function metronomeBeat() {
    playPianoNote(
      isMetronomeActive ? 880 : 440,
      0.08
    );
  }

  function startMetronome() {
    if (metronomeInterval) {
      clearInterval(
        metronomeInterval
      );
    }

    const bpm = getBPM();

    isMetronomeActive = true;

    if (metronomeStatus) {
      metronomeStatus.textContent =
        'Ligado';
    }

    btnMetronome?.setAttribute(
      'aria-pressed',
      'true'
    );

    metronomeBeat();

    metronomeInterval =
      setInterval(
        metronomeBeat,
        (60 / bpm) * 1000
      );
  }

  function stopMetronome() {
    if (metronomeInterval) {
      clearInterval(
        metronomeInterval
      );

      metronomeInterval = null;
    }

    isMetronomeActive = false;

    if (metronomeStatus) {
      metronomeStatus.textContent =
        'Desligado';
    }

    btnMetronome?.setAttribute(
      'aria-pressed',
      'false'
    );
  }

  btnMetronome?.addEventListener(
    'click',
    () => {
      if (isMetronomeActive) {
        stopMetronome();

        announceToSR(
          'Metrônomo desligado.'
        );
      } else {
        startMetronome();

        announceToSR(
          `Metrônomo ligado a ${getBPM()} BPM.`
        );
      }
    }
  );

  bpmInput?.addEventListener(
    'input',
    event => {
      const bpm = clamp(
        Number(event.target.value),
        40,
        240
      );

      if (bpmDisplay) {
        bpmDisplay.textContent =
          `${bpm} BPM`;
      }

      if (isMetronomeActive) {
        startMetronome();
      }
    }
  );

  if (bpmInput && bpmDisplay) {
    bpmDisplay.textContent =
      `${getBPM()} BPM`;
  }

  /* ==========================================================================
     10. GRAVAÇÃO
     ========================================================================== */

  let isRecording = false;
  let recordStartTime = 0;
  let recordedNotes = [];

  const btnRecord =
    $('#btn-record');

  const btnPlayRecord =
    $('#btn-play-recording');

  const btnClearRecord =
    $('#btn-clear-recording');

  const recordStatusText =
    $('#recording-status-text');

  function updateRecordingButtons() {
    const hasRecording =
      recordedNotes.length > 0;

    if (btnPlayRecord) {
      btnPlayRecord.disabled =
        !hasRecording ||
        isRecording;
    }

    if (btnClearRecord) {
      btnClearRecord.disabled =
        !hasRecording ||
        isRecording;
    }
  }

  btnRecord?.addEventListener(
    'click',
    () => {
      if (!isRecording) {
        isRecording = true;

        recordStartTime =
          performance.now();

        recordedNotes = [];

        btnRecord.classList.add(
          'recording'
        );

        btnRecord.setAttribute(
          'aria-pressed',
          'true'
        );

        if (recordStatusText) {
          recordStatusText.textContent =
            '🔴 Gravando... Toque notas no teclado ou bateria!';
        }

        updateRecordingButtons();

        announceToSR(
          'Gravação iniciada.'
        );
      } else {
        isRecording = false;

        btnRecord.classList.remove(
          'recording'
        );

        btnRecord.setAttribute(
          'aria-pressed',
          'false'
        );

        const count =
          recordedNotes.length;

        if (recordStatusText) {
          recordStatusText.textContent =
            `Gravação concluída (${count} ${count === 1 ? 'evento' : 'eventos'} gravados).`;
        }

        updateRecordingButtons();

        announceToSR(
          `Gravação encerrada com ${count} eventos.`
        );

        if (count > 0) {
          unlockAchievement(
            'ach-creator'
          );
        }
      }
    }
  );

  function recordEvent(eventData) {
    if (!isRecording) return;

    recordedNotes.push({
      ...eventData,
      time:
        performance.now() -
        recordStartTime
    });
  }

  btnPlayRecord?.addEventListener(
    'click',
    () => {
      if (
        recordedNotes.length === 0 ||
        isRecording
      ) {
        return;
      }

      if (recordStatusText) {
        recordStatusText.textContent =
          '▶️ Reproduzindo gravação...';
      }

      announceToSR(
        'Reproduzindo gravação.'
      );

      const events =
        [...recordedNotes].sort(
          (a, b) => a.time - b.time
        );

      events.forEach(event => {
        setTimeout(() => {
          if (event.isDrum) {
            playDrumSound(
              event.sound
            );
          } else {
            playInstrumentNote(
              event.instrument || 'teclado',
              event.freq,
              0.9
            );
          }
        }, event.time);
      });

      const lastTime =
        events.length
          ? events[events.length - 1].time
          : 0;

      setTimeout(() => {
        if (recordStatusText) {
          recordStatusText.textContent =
            'Reprodução finalizada.';
        }
      }, lastTime + 1200);
    }
  );

  btnClearRecord?.addEventListener(
    'click',
    () => {
      recordedNotes = [];

      updateRecordingButtons();

      if (recordStatusText) {
        recordStatusText.textContent =
          'Nenhuma gravação armazenada.';
      }

      announceToSR(
        'Gravação apagada.'
      );
    }
  );

  updateRecordingButtons();

  /* ==========================================================================
     11. TECLADO MUSICAL
     ========================================================================== */

  const notesData = [
    {
      note: 'C4',
      key: 'C',
      freq: 261.63,
      type: 'white'
    },
    {
      note: 'C#4',
      key: 'D',
      freq: 277.18,
      type: 'black'
    },
    {
      note: 'D4',
      key: 'E',
      freq: 293.66,
      type: 'white'
    },
    {
      note: 'D#4',
      key: 'R',
      freq: 311.13,
      type: 'black'
    },
    {
      note: 'E4',
      key: 'F',
      freq: 329.63,
      type: 'white'
    },
    {
      note: 'F4',
      key: 'G',
      freq: 349.23,
      type: 'white'
    },
    {
      note: 'F#4',
      key: 'Y',
      freq: 369.99,
      type: 'black'
    },
    {
      note: 'G4',
      key: 'H',
      freq: 392,
      type: 'white'
    },
    {
      note: 'G#4',
      key: 'U',
      freq: 415.3,
      type: 'black'
    },
    {
      note: 'A4',
      key: 'J',
      freq: 440,
      type: 'white'
    },
    {
      note: 'A#4',
      key: 'I',
      freq: 466.16,
      type: 'black'
    },
    {
      note: 'B4',
      key: 'K',
      freq: 493.88,
      type: 'white'
    }
  ];

  let currentKeyMode = 'free';

  const learnSequence = [
    'C4',
    'E4',
    'G4',
    'C4'
  ];

  let learnStep = 0;

  const keysWrapper =
    $('#piano-keys-wrapper');

  const notesDisplay =
    $('#keyboard-notes-display');

  const guideBanner =
    $('#keyboard-guide-banner');

  const guideText =
    $('#keyboard-guide-text');

  function buildKeyboard() {
    if (!keysWrapper) return;

    keysWrapper.innerHTML = '';

    notesData.forEach(noteData => {
      const keyButton =
        document.createElement('button');

      keyButton.type = 'button';

      keyButton.className =
        `piano-key ${noteData.type}`;

      keyButton.dataset.note =
        noteData.note;

      keyButton.dataset.freq =
        noteData.freq;

      keyButton.setAttribute(
        'aria-label',
        `Nota ${noteData.note}, atalho tecla ${noteData.key}`
      );

      keyButton.innerHTML = `
        <span>${escapeHTML(noteData.note)}</span>
        <small aria-hidden="true">
          ${escapeHTML(noteData.key)}
        </small>
      `;

      keyButton.addEventListener(
        'click',
        () =>
          triggerNote(
            noteData,
            keyButton
          )
      );

      keysWrapper.appendChild(
        keyButton
      );
    });
  }

  function triggerNote(
    noteData,
    element = null
  ) {
    playPianoNote(
      noteData.freq,
      1.5
    );

    if (notesDisplay) {
      notesDisplay.innerHTML =
        `Nota Ativa: <strong>${escapeHTML(noteData.note)}</strong> (${Math.round(noteData.freq)} Hz)`;
    }

    announceToSR(
      `Nota ${noteData.note}`
    );

    if (element) {
      element.classList.add(
        'active'
      );

      setTimeout(() => {
        element.classList.remove(
          'active'
        );
      }, 180);
    }

    recordEvent({
      note: noteData.note,
      freq: noteData.freq,
      instrument: 'teclado'
    });

    if (
      currentKeyMode === 'learn' ||
      currentKeyMode === 'challenge'
    ) {
      if (
        noteData.note ===
        learnSequence[learnStep]
      ) {
        learnStep++;

        if (
          learnStep >=
          learnSequence.length
        ) {
          if (guideText) {
            guideText.textContent =
              '✨ Sequência perfeita! Parabéns!';
          }

          announceToSR(
            'Sequência concluída com sucesso!'
          );

          learnStep = 0;

          unlockAchievement(
            'ach-melody'
          );
        } else {
          if (guideText) {
            guideText.textContent =
              `Próxima nota: ${learnSequence[learnStep]}`;
          }
        }
      } else {
        if (guideText) {
          guideText.textContent =
            `Nota incorreta. Tente tocar: ${learnSequence[learnStep]}`;
        }
      }
    }

    unlockAchievement(
      'ach-first-sound'
    );
  }

  function updateKeyModeUI(activeButton) {
    $$('.mode-tab').forEach(button => {
      button.classList.remove(
        'active'
      );

      button.setAttribute(
        'aria-selected',
        'false'
      );
    });

    if (!activeButton) return;

    activeButton.classList.add(
      'active'
    );

    activeButton.setAttribute(
      'aria-selected',
      'true'
    );
  }

  $('#btn-keymode-free')?.addEventListener(
    'click',
    event => {
      currentKeyMode = 'free';
      learnStep = 0;

      updateKeyModeUI(
        event.currentTarget
      );

      if (guideBanner) {
        guideBanner.hidden = true;
      }

      announceToSR(
        'Modo Livre ativado.'
      );
    }
  );

  $('#btn-keymode-learn')?.addEventListener(
    'click',
    event => {
      currentKeyMode = 'learn';
      learnStep = 0;

      updateKeyModeUI(
        event.currentTarget
      );

      if (guideBanner) {
        guideBanner.hidden = false;
      }

      if (guideText) {
        guideText.textContent =
          `Modo Aprender: toque a nota ${learnSequence[0]}.`;
      }

      announceToSR(
        `Modo Aprender. Toque a nota ${learnSequence[0]}.`
      );
    }
  );

  $('#btn-keymode-challenge')?.addEventListener(
    'click',
    event => {
      currentKeyMode = 'challenge';
      learnStep = 0;

      updateKeyModeUI(
        event.currentTarget
      );

      if (guideBanner) {
        guideBanner.hidden = false;
      }

      if (guideText) {
        guideText.textContent =
          `Desafio de Memória: repita a sequência começando por ${learnSequence[0]}.`;
      }

      announceToSR(
        'Desafio de memória ativado.'
      );
    }
  );

  buildKeyboard();

  /* ==========================================================================
     12. BATERIA
     ========================================================================== */

  const drumPads =
    $$('.drum-pad');

  let demoRhythmInterval = null;

  drumPads.forEach(pad => {
    pad.addEventListener(
      'click',
      () => {
        const sound =
          pad.dataset.sound;

        playDrumSound(sound);

        pad.classList.add(
          'active'
        );

        setTimeout(() => {
          pad.classList.remove(
            'active'
          );
        }, 150);

        recordEvent({
          isDrum: true,
          sound
        });

        unlockAchievement(
          'ach-rhythm'
        );

        announceToSR(
          `Percussão: ${sound}.`
        );
      }
    );
  });

  window.addEventListener(
    'keydown',
    event => {
      if (
        event.repeat ||
        event.target.matches(
          'input, textarea, select, button'
        )
      ) {
        return;
      }

      const key =
        event.key.toUpperCase();

      const drumPad =
        $(`.drum-pad[data-key="${key}"]`);

      if (drumPad) {
        event.preventDefault();
        drumPad.click();
        return;
      }

      const foundNote =
        notesData.find(
          note => note.key === key
        );

      if (foundNote) {
        event.preventDefault();

        const button =
          keysWrapper?.querySelector(
            `button[data-note="${foundNote.note}"]`
          );

        triggerNote(
          foundNote,
          button
        );
      }
    }
  );

  const btnPlayDemoRhythm =
    $('#btn-play-demo-rhythm');

  const btnStopDemoRhythm =
    $('#btn-stop-demo-rhythm');

  btnPlayDemoRhythm?.addEventListener(
    'click',
    () => {
      if (demoRhythmInterval) {
        clearInterval(
          demoRhythmInterval
        );
      }

      btnPlayDemoRhythm.hidden = true;

      if (btnStopDemoRhythm) {
        btnStopDemoRhythm.hidden = false;
      }

      let step = 0;

      const pattern = [
        'kick',
        'hihat',
        'snare',
        'hihat'
      ];

      const playStep = () => {
        const sound =
          pattern[
            step % pattern.length
          ];

        playDrumSound(sound);

        const targetPad =
          $(
            `.drum-pad[data-sound="${sound}"]`
          );

        if (targetPad) {
          targetPad.classList.add(
            'active'
          );

          setTimeout(() => {
            targetPad.classList.remove(
              'active'
            );
          }, 110);
        }

        step++;
      };

      playStep();

      demoRhythmInterval =
        setInterval(
          playStep,
          300
        );

      announceToSR(
        'Demonstração de ritmo iniciada.'
      );
    }
  );

  btnStopDemoRhythm?.addEventListener(
    'click',
    () => {
      if (demoRhythmInterval) {
        clearInterval(
          demoRhythmInterval
        );

        demoRhythmInterval = null;
      }

      if (btnPlayDemoRhythm) {
        btnPlayDemoRhythm.hidden = false;
      }

      if (btnStopDemoRhythm) {
        btnStopDemoRhythm.hidden = true;
      }

      announceToSR(
        'Demonstração de ritmo parada.'
      );
    }
  );

  /* ==========================================================================
     13. DESCUBRA
     ========================================================================== */

  const moodButtons =
    $$('.mood-btn');

  const discoveryQuizStep =
    $('#discovery-quiz-step');

  const discoveryResultStep =
    $('#discovery-result-step');

  const profileTitle =
    $('#discovery-profile-title');

  const profileDesc =
    $('#discovery-profile-desc');

  const recommendationList =
    $('#discovery-recommendations-list');

  const btnRestartDiscovery =
    $('#btn-restart-discovery');

  const moodProfiles = {
    calm: {
      title:
        'Perfil Sereno & Contemplativo',

      desc:
        'Sua sensibilidade é voltada para melodias suaves, timbres acústicos e momentos de relaxamento.',

      recommendations: [
        'Violão',
        'Violino'
      ]
    },

    energetic: {
      title:
        'Perfil Vigoroso & Pulsante',

      desc:
        'Você se move através do ritmo, da energia percussiva e do impacto da batida.',

      recommendations: [
        'Bateria',
        'Teclado'
      ]
    },

    creative: {
      title:
        'Perfil Expressivo & Melódico',

      desc:
        'Sua marca é a criação de harmonias ricas, arranjos envolventes e possibilidades expressivas.',

      recommendations: [
        'Teclado',
        'Violão',
        'Violino'
      ]
    },

    curious: {
      title:
        'Perfil Clássico & Detalhista',

      desc:
        'Você aprecia nuances sonoras, dinâmicas de arco e timbres de grande riqueza harmônica.',

      recommendations: [
        'Violino',
        'Teclado',
        'Violão'
      ]
    }
  };

  moodButtons.forEach(button => {
    button.addEventListener(
      'click',
      () => {
        const mood =
          button.dataset.mood;

        const profile =
          moodProfiles[mood] ||
          moodProfiles.calm;

        if (discoveryQuizStep) {
          discoveryQuizStep.hidden = true;
        }

        if (discoveryResultStep) {
          discoveryResultStep.hidden = false;
        }

        if (profileTitle) {
          profileTitle.textContent =
            profile.title;
        }

        if (profileDesc) {
          profileDesc.textContent =
            profile.desc;
        }

        if (recommendationList) {
          recommendationList.innerHTML =
            profile.recommendations
              .map(
                instrument =>
                  `<div class="rec-item">🎵 ${escapeHTML(instrument)}</div>`
              )
              .join('');
        }

        announceToSR(
          `Perfil identificado: ${profile.title}`
        );

        unlockAchievement(
          'ach-explorer'
        );
      }
    );
  });

  btnRestartDiscovery?.addEventListener(
    'click',
    () => {
      if (discoveryQuizStep) {
        discoveryQuizStep.hidden = false;
      }

      if (discoveryResultStep) {
        discoveryResultStep.hidden = true;
      }

      announceToSR(
        'Descoberta reiniciada.'
      );
    }
  );

  /* ==========================================================================
     14. CATÁLOGO
     ========================================================================== */

  const catalogGrid =
    $('#catalog-grid');

  const filterButtons =
    $$('.catalog-filters .filter-btn');

  const modal =
    $('#instrument-modal');

  const modalContent =
    $('#modal-content-body');

  let lastFocusedElement = null;

  function renderCatalog(
    filter = 'all'
  ) {
    if (!catalogGrid) return;

    catalogGrid.innerHTML = '';

    const instruments =
      instrumentsData.filter(
        instrument =>
          filter === 'all' ||
          instrument.category === filter
      );

    instruments.forEach(
      instrument => {
        const card =
          document.createElement(
            'article'
          );

        card.className =
          'instrument-card';

        card.innerHTML = `
          <div>
            <span class="badge">
              ${escapeHTML(instrument.categoryLabel)}
            </span>

            <h3>
              ${escapeHTML(instrument.name)}
            </h3>

            <p>
              ${escapeHTML(instrument.desc)}
            </p>
          </div>

          <div class="instrument-card-actions">
            <button
              type="button"
              class="pill-btn highlight btn-listen-inst"
              data-id="${escapeHTML(instrument.id)}"
            >
              🔊 Ouvir Som
            </button>

            <button
              type="button"
              class="pill-btn outline btn-details-inst"
              data-id="${escapeHTML(instrument.id)}"
            >
              ℹ️ Detalhes
            </button>
          </div>
        `;

        catalogGrid.appendChild(card);
      }
    );

    $$('.btn-listen-inst', catalogGrid)
      .forEach(button => {
        button.addEventListener(
          'click',
          () => {
            const instrument =
              instrumentsData.find(
                item =>
                  item.id ===
                  button.dataset.id
              );

            if (!instrument) return;

            if (instrument.isDrum) {
              playDrumSound('kick');
            } else {
              playInstrumentNote(
                instrument.id,
                instrument.freq,
                1.5
              );
            }

            announceToSR(
              `Demonstração do timbre de ${instrument.name}.`
            );

            unlockAchievement(
              'ach-first-sound'
            );
          }
        );
      });

    $$('.btn-details-inst', catalogGrid)
      .forEach(button => {
        button.addEventListener(
          'click',
          event => {
            const instrument =
              instrumentsData.find(
                item =>
                  item.id ===
                  button.dataset.id
              );

            if (instrument) {
              openModal(
                instrument,
                event.currentTarget
              );
            }
          }
        );
      });
  }

  filterButtons.forEach(
    button => {
      button.addEventListener(
        'click',
        () => {
          filterButtons.forEach(
            item => {
              item.classList.remove(
                'active'
              );

              item.setAttribute(
                'aria-pressed',
                'false'
              );
            }
          );

          button.classList.add(
            'active'
          );

          button.setAttribute(
            'aria-pressed',
            'true'
          );

          renderCatalog(
            button.dataset.filter
          );
        }
      );
    }
  );

  function openModal(
    instrument,
    triggerElement
  ) {
    if (
      !modal ||
      !modalContent
    ) {
      return;
    }

    lastFocusedElement =
      triggerElement;

    modalContent.innerHTML = `
      <div class="modal-header">
        <h3 id="modal-title">
          ${escapeHTML(instrument.name)}
        </h3>

        <button
          type="button"
          id="btn-close-modal"
          class="close-modal-btn"
          aria-label="Fechar modal"
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        <p>
          <strong>Categoria:</strong>
          ${escapeHTML(instrument.categoryLabel)}
        </p>

        <p>
          ${escapeHTML(instrument.desc)}
        </p>

        <p>
          <strong>História e contexto:</strong>
          ${escapeHTML(instrument.history)}
        </p>

        <button
          type="button"
          id="btn-modal-listen"
          class="btn-primary"
          style="margin-top: 1rem;"
        >
          🔊 Ouvir Timbre
        </button>
      </div>
    `;

    modal.setAttribute(
      'aria-labelledby',
      'modal-title'
    );

    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute(
        'open',
        ''
      );
    }

    $('#btn-close-modal')?.addEventListener(
      'click',
      closeModal
    );

    $('#btn-modal-listen')?.addEventListener(
      'click',
      () => {
        if (instrument.isDrum) {
          playDrumSound('kick');
        } else {
          playInstrumentNote(
            instrument.id,
            instrument.freq,
            1.8
          );
        }

        announceToSR(
          `Timbre de ${instrument.name} reproduzido.`
        );
      }
    );

    setTimeout(() => {
      $('#btn-close-modal')?.focus();
    }, 50);

    announceToSR(
      `Detalhes de ${instrument.name} abertos.`
    );
  }

  function closeModal() {
    if (!modal) return;

    if (modal.open) {
      modal.close();
    } else {
      modal.removeAttribute(
        'open'
      );
    }

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  modal?.addEventListener(
    'cancel',
    event => {
      event.preventDefault();
      closeModal();
    }
  );

  modal?.addEventListener(
    'click',
    event => {
      if (
        event.target === modal
      ) {
        closeModal();
      }
    }
  );

  renderCatalog();

  /* ==========================================================================
     15. QUIZ
     ========================================================================== */

  const quizQuestions = [
    {
      q:
        '1. Qual destes instrumentos produz som através de cordas dedilhadas?',

      options: [
        {
          text: 'Violão',
          isCorrect: true,
          inst: 'violao'
        },
        {
          text: 'Bateria',
          isCorrect: false
        },
        {
          text: 'Teclado',
          isCorrect: false
        }
      ]
    },

    {
      q:
        '2. Qual instrumento é responsável por marcar o ritmo e a base percussiva da música?',

      options: [
        {
          text: 'Violino',
          isCorrect: false
        },
        {
          text: 'Bateria',
          isCorrect: true,
          inst: 'bateria'
        },
        {
          text: 'Teclado',
          isCorrect: false
        }
      ]
    },

    {
      q:
        '3. Qual instrumento fricciona cordas com um arco para produzir um som agudo e lírico?',

      options: [
        {
          text: 'Violino',
          isCorrect: true,
          inst: 'violino'
        },
        {
          text: 'Violão',
          isCorrect: false
        },
        {
          text: 'Bateria',
          isCorrect: false
        }
      ]
    },

    {
      q:
        '4. Qual instrumento possui teclas pretas e brancas dispostas em ordem musical?',

      options: [
        {
          text: 'Teclado',
          isCorrect: true,
          inst: 'teclado'
        },
        {
          text: 'Violão',
          isCorrect: false
        },
        {
          text: 'Bateria',
          isCorrect: false
        }
      ]
    },

    {
      q:
        '5. Qual instrumento possui uma tradição marcante na Bossa Nova e na MPB?',

      options: [
        {
          text: 'Bateria',
          isCorrect: false
        },
        {
          text: 'Violão',
          isCorrect: true,
          inst: 'violao'
        },
        {
          text: 'Violino',
          isCorrect: false
        }
      ]
    },

    {
      q:
        '6. Qual instrumento reúne bumbo, caixa, pratos e outros elementos de percussão?',

      options: [
        {
          text: 'Bateria',
          isCorrect: true,
          inst: 'bateria'
        },
        {
          text: 'Teclado',
          isCorrect: false
        },
        {
          text: 'Violino',
          isCorrect: false
        }
      ]
    },

    {
      q:
        '7. Em uma orquestra clássica, qual desses instrumentos integra a seção de cordas agudas?',

      options: [
        {
          text: 'Violino',
          isCorrect: true,
          inst: 'violino'
        },
        {
          text: 'Teclado',
          isCorrect: false
        },
        {
          text: 'Bateria',
          isCorrect: false
        }
      ]
    },

    {
      q:
        '8. Qual instrumento pode reproduzir sons de piano, sintetizadores e outros timbres digitais?',

      options: [
        {
          text: 'Teclado',
          isCorrect: true,
          inst: 'teclado'
        },
        {
          text: 'Violão',
          isCorrect: false
        },
        {
          text: 'Violino',
          isCorrect: false
        }
      ]
    }
  ];

  let currentQuizIndex = 0;

  const quizScores = {
    violao: 0,
    teclado: 0,
    bateria: 0,
    violino: 0
  };

  const quizQuestionCard =
    $('#quiz-question-card');

  const quizResultCard =
    $('#quiz-result-card');

  const quizQuestionText =
    $('#quiz-question-text');

  const quizOptions =
    $('#quiz-options-container');

  const quizCounter =
    $('#quiz-counter');

  const quizProgress =
    $('#quiz-progress-fill');

  const quizProgressBar =
    $('.quiz-progress');

  const btnRestartQuiz =
    $('#btn-restart-quiz');

  function updateQuizProgress() {
    const completed =
      currentQuizIndex;

    const percentage =
      Math.round(
        (completed /
          quizQuestions.length) *
          100
      );

    if (quizProgress) {
      quizProgress.style.width =
        `${percentage}%`;
    }

    if (quizProgressBar) {
      quizProgressBar.setAttribute(
        'aria-valuenow',
        String(percentage)
      );
    }
  }

  function renderQuizQuestion() {
    if (
      currentQuizIndex >=
      quizQuestions.length
    ) {
      showQuizResult();
      return;
    }

    const question =
      quizQuestions[
        currentQuizIndex
      ];

    if (quizQuestionText) {
      quizQuestionText.textContent =
        question.q;
    }

    if (quizCounter) {
      quizCounter.textContent =
        `Pergunta ${currentQuizIndex + 1} de ${quizQuestions.length}`;
    }

    updateQuizProgress();

    if (!quizOptions) return;

    quizOptions.innerHTML = '';

    question.options.forEach(
      option => {
        const button =
          document.createElement(
            'button'
          );

        button.type = 'button';
        button.className =
          'quiz-opt-btn';

        button.textContent =
          option.text;

        button.addEventListener(
          'click',
          () => {
            if (
              option.isCorrect &&
              option.inst
            ) {
              quizScores[
                option.inst
              ]++;
            }

            currentQuizIndex++;

            renderQuizQuestion();
          }
        );

        quizOptions.appendChild(
          button
        );
      }
    );

    announceToSR(
      question.q
    );
  }

  function showQuizResult() {
    if (quizQuestionCard) {
      quizQuestionCard.hidden = true;
    }

    if (quizResultCard) {
      quizResultCard.hidden = false;
    }

    if (quizProgress) {
      quizProgress.style.width =
        '100%';
    }

    if (quizProgressBar) {
      quizProgressBar.setAttribute(
        'aria-valuenow',
        '100'
      );
    }

    let topInstrument =
      instrumentsData[0];

    let highestScore =
      -1;

    Object.entries(
      quizScores
    ).forEach(
      ([id, score]) => {
        if (score > highestScore) {
          highestScore = score;

          const found =
            instrumentsData.find(
              instrument =>
                instrument.id === id
            );

          if (found) {
            topInstrument = found;
          }
        }
      }
    );

    const resultTitle =
      $('#quiz-result-title');

    const resultText =
      $('#quiz-result-text');

    const resultPreview =
      $('#quiz-result-instrument-preview');

    if (resultTitle) {
      resultTitle.textContent =
        `Sua maior afinidade é com: ${topInstrument.name}!`;
    }

    if (resultText) {
      resultText.textContent =
        topInstrument.desc;
    }

    if (resultPreview) {
      resultPreview.innerHTML = `
        <div
          style="
            background: rgba(255,255,255,0.05);
            padding: 1.5rem;
            border-radius: 16px;
            margin: 1.5rem 0;
            border: 1px solid var(--border-highlight);
          "
        >
          <span
            style="
              color: var(--secondary-accent);
              font-weight: 700;
            "
          >
            ${escapeHTML(topInstrument.categoryLabel)}
          </span>

          <h4
            style="
              font-size: 1.5rem;
              color: #fff;
              margin: 0.5rem 0;
            "
          >
            ${escapeHTML(topInstrument.name)}
          </h4>

          <p
            style="
              color: var(--text-muted);
            "
          >
            ${escapeHTML(topInstrument.history)}
          </p>
        </div>
      `;
    }

    announceToSR(
      `Quiz concluído. O resultado apontou maior afinidade com ${topInstrument.name}.`
    );
  }

  btnRestartQuiz?.addEventListener(
    'click',
    () => {
      currentQuizIndex = 0;

      Object.keys(
        quizScores
      ).forEach(
        key => {
          quizScores[key] = 0;
        }
      );

      if (quizQuestionCard) {
        quizQuestionCard.hidden = false;
      }

      if (quizResultCard) {
        quizResultCard.hidden = true;
      }

      renderQuizQuestion();
    }
  );

  renderQuizQuestion();

  /* ==========================================================================
     16. TOUR GUIADO
     ========================================================================== */

  const tourModal =
    $('#guided-tour-modal');

  const btnStartTour =
    $('#btn-start-tour');

  const btnSkipTour =
    $('#btn-skip-tour');

  const tourCompleted =
    safeStorageGet(
      'sonora_tour_completed'
    ) === 'true';

  if (!tourCompleted) {
    setTimeout(() => {
      if (
        tourModal &&
        typeof tourModal.showModal ===
          'function'
      ) {
        tourModal.showModal();
      }
    }, 900);
  }

  btnStartTour?.addEventListener(
    'click',
    () => {
      tourModal?.close();

      safeStorageSet(
        'sonora_tour_completed',
        'true'
      );

      const accessibilitySection =
        $('#meu-jeito');

      accessibilitySection?.scrollIntoView(
        {
          behavior:
            body.getAttribute(
              'data-motion-reduce'
            ) === 'true'
              ? 'auto'
              : 'smooth'
        }
      );

      announceToSR(
        'Redirecionado para a seção de acessibilidade.'
      );
    }
  );

  btnSkipTour?.addEventListener(
    'click',
    () => {
      tourModal?.close();

      safeStorageSet(
        'sonora_tour_completed',
        'true'
      );
    }
  );

  /* ==========================================================================
     17. FECHAMENTO / ESTADOS INICIAIS
     ========================================================================== */

  updateRecordingButtons();

  if (visualizerFeedback) {
    visualizerFeedback.textContent =
      'Aguardando sinal sonoro...';
  }

  window.addEventListener(
    'beforeunload',
    () => {
      stopMetronome();

      if (demoRhythmInterval) {
        clearInterval(
          demoRhythmInterval
        );
      }

      if (visualizerFrame) {
        cancelAnimationFrame(
          visualizerFrame
        );
      }

      stopThreeAnimation();
    }
  );

});
