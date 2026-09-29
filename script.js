document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // BASES DE DADOS E ESTADOS DO APLICATIVO
  // ==========================================
  
  // Catálogo Completo de Instrumentos Ampliado
  const catalogoInstrumentos = [
    {
      id: 'violao',
      nome: 'Violão Acústico',
      categoria: 'cordas',
      descricao: 'Instrumento de cordas de nylon ou aço, ideal para acompanhamento de voz e harmonias suaves.',
      curiosidade: 'Um dos instrumentos mais populares entre idosos devido à facilidade de transporte.',
      demoTipo: 'violao'
    },
    {
      id: 'teclado',
      nome: 'Teclado / Piano',
      categoria: 'teclas',
      descricao: 'Oferece arranjos completos, excelente para exercitar a coordenação motora das duas mãos.',
      curiosidade: 'Estudos mostram que tocar piano estimula a memória de curto e longo prazo.',
      demoTipo: 'teclado'
    },
    {
      id: 'bateria',
      nome: 'Bateria Rítmica',
      categoria: 'percussao',
      descricao: 'Base rítmica e pulsante. Excelente para descarregar energia e trabalhar o tempo musical.',
      curiosidade: 'Desenvolve a coordenação motora ampla de braços e pernas.',
      demoTipo: 'bateria'
    },
    {
      id: 'violino',
      nome: 'Violino Clássico',
      categoria: 'cordas',
      descricao: 'Instrumento de arco de som melodioso, expressivo e de grande profundidade emocional.',
      curiosidade: 'Exige escuta atenta, ajudando na discriminação de frequências sonoras.',
      demoTipo: 'violino'
    },
    {
      id: 'flauta',
      nome: 'Flauta Doce / Transversal',
      categoria: 'sopros',
      descricao: 'Instrumento de sopro leve que auxilia na capacidade pulmonar e controle respiratório.',
      curiosidade: 'Muito recomendada para exercícios respiratórios leves e prazerosos.',
      demoTipo: 'flauta'
    },
    {
      id: 'pandeiro',
      nome: 'Pandeiro Brasileiro',
      categoria: 'percussao',
      descricao: 'Instrumento versátil de percussão manual, presente no samba, choro e música popular.',
      curiosidade: 'Trabalha a agilidade dos pulsos e o ritmo com extrema leveza.',
      demoTipo: 'pandeiro'
    }
  ];

  // Estado das Preferências do Usuário (Persistência via localStorage)
  let estadoApp = {
    modoSimples: false,
    modoContraste: 'normal', // 'normal', 'alto', 'suave'
    espacamento: 'normal',
    tamanhoFonte: 100,
    reduzirMovimento: false,
    tema3D: 'cosmos',
    feedbackSonoro: true,
    volumeGeral: 0.7,
    conquistas: {
      primeiroSom: false,
      ritmista: false,
      maestro: false,
      explorador: false
    }
  };

  // ==========================================
  // 1. GERENCIAMENTO DE PERSISTÊNCIA & PREFERÊNCIAS
  // ==========================================
  function carregarPreferencias() {
    const salvo = localStorage.getItem('estudio_musical_prefs');
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo);
        estadoApp = { ...estadoApp, ...parsed };
      } catch (e) {
        console.error("Erro ao carregar configurações salvas:", e);
      }
    }
    aplicarPreferencias();
  }

  function salvarPreferencias() {
    localStorage.setItem('estudio_musical_prefs', JSON.stringify(estadoApp));
  }

  function aplicarPreferencias() {
    // Fonte
    document.documentElement.style.fontSize = `${estadoApp.tamanhoFonte}%`;

    // Modo Simples
    document.body.classList.toggle('modo-simples-idoso', estadoApp.modoSimples);
    const btnSimples = document.getElementById('btn-modo-simples');
    if (btnSimples) btnSimples.setAttribute('aria-pressed', estadoApp.modoSimples);

    // Contraste
    document.body.classList.remove('alto-contraste', 'contraste-suave');
    if (estadoApp.modoContraste === 'alto') document.body.classList.add('alto-contraste');
    if (estadoApp.modoContraste === 'suave') document.body.classList.add('contraste-suave');

    // Espaçamento
    document.body.classList.toggle('espacamento-largo', estadoApp.espacamento === 'largo');

    // Reduzir movimento
    const chkMov = document.getElementById('chk-reduzir-movimento');
    if (chkMov) chkMov.checked = estadoApp.reduzirMovimento;

    // Checkbox feedback sonoro
    const chkSonoro = document.getElementById('chk-feedback-sonoro');
    if (chkSonoro) chkSonoro.checked = estadoApp.feedbackSonoro;

    // Volume
    const sliderVolGeral = document.getElementById('vol-master-geral');
    if (sliderVolGeral) sliderVolGeral.value = estadoApp.volumeGeral;

    atualizarBadgesVisual();
  }

  // ==========================================
  // 2. SISTEMA DE TOASTS & NOTIFICAÇÕES
  // ==========================================
  function emitirToast(mensagem) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = mensagem;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function desbloquearConquista(chave, titulo) {
    if (!estadoApp.conquistas[chave]) {
      estadoApp.conquistas[chave] = true;
      salvarPreferencias();
      atualizarBadgesVisual();
      emitirToast(`🏆 Nova Conquista Desbloqueada: ${titulo}!`);
    }
  }

  function atualizarBadgesVisual() {
    if (estadoApp.conquistas.primeiroSom) {
      document.getElementById('badge-primeiro-som')?.classList.replace('bloqueada', 'desbloqueada');
    }
    if (estadoApp.conquistas.ritmista) {
      document.getElementById('badge-ritmo')?.classList.replace('bloqueada', 'desbloqueada');
    }
    if (estadoApp.conquistas.maestro) {
      document.getElementById('badge-maestro')?.classList.replace('bloqueada', 'desbloqueada');
    }
    if (estadoApp.conquistas.explorador) {
      document.getElementById('badge-explorador')?.classList.replace('bloqueada', 'desbloqueada');
    }
  }

  // ==========================================
  // 3. ENGINE 3D - THREE.JS
  // ==========================================
  let scene, camera, renderer, particles, particleMaterial;
  let mouseX = 0, mouseY = 0;
  let velRotacaoX = 0.001, velRotacaoY = 0.0015;

  const configTemas3D = {
    cosmos: { cor: 0x38bdf8, tamanho: 3.5, velX: 0.001, velY: 0.0015 },
    neon: { cor: 0xec4899, tamanho: 4.8, velX: 0.003, velY: 0.0035 },
    aurora: { cor: 0x22c55e, tamanho: 3.0, velX: 0.0006, velY: 0.0012 }
  };

  function init3D() {
    const canvas = document.getElementById('bg-canvas-3d');
    if (!canvas || typeof THREE === 'undefined') return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 400;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const geometry = new THREE.BufferGeometry();
    const count = 800;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 1000;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const cfg = configTemas3D[estadoApp.tema3D] || configTemas3D.cosmos;
    particleMaterial = new THREE.PointsMaterial({
      size: cfg.tamanho,
      color: cfg.cor,
      transparent: true,
      opacity: 0.8
    });

    particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    window.addEventListener('mousemove', (e) => {
      if (estadoApp.reduzirMovimento) return;
      mouseX = (e.clientX - window.innerWidth / 2) * 0.08;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.08;
    });

    // Suporte ao Toque em Dispositivos Móveis
    window.addEventListener('touchmove', (e) => {
      if (estadoApp.reduzirMovimento || e.touches.length === 0) return;
      mouseX = (e.touches[0].clientX - window.innerWidth / 2) * 0.08;
      mouseY = (e.touches[0].clientY - window.innerHeight / 2) * 0.08;
    });

    animate3D();
  }

  function animate3D() {
    requestAnimationFrame(animate3D);

    if (particles && !estadoApp.reduzirMovimento) {
      particles.rotation.x += velRotacaoX;
      particles.rotation.y += velRotacaoY;
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function alterarTema3D(nomeTema) {
    const cfg = configTemas3D[nomeTema];
    if (cfg && particleMaterial) {
      estadoApp.tema3D = nomeTema;
      particleMaterial.color.setHex(cfg.cor);
      particleMaterial.size = cfg.tamanho;
      velRotacaoX = cfg.velX;
      velRotacaoY = cfg.velY;
      salvarPreferencias();
    }
  }

  // ==========================================
  // 4. SÍNTESE DE ÁUDIO (WEB AUDIO API)
  // ==========================================
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function obterAudioContext() {
    if (!audioCtx) audioCtx = new AudioCtxClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function emitirFeedbackSonoroBotao() {
    if (!estadoApp.feedbackSonoro) return;
    const ctx = obterAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  function dispararDMX() {
    const luzes = document.querySelectorAll('.luz-dmx');
    if (luzes.length === 0 || estadoApp.reduzirMovimento) return;
    const idx = Math.floor(Math.random() * luzes.length);
    luzes[idx].classList.add('ativa');
    setTimeout(() => luzes[idx].classList.remove('ativa'), 140);
  }

  function criarBufferRuido(ctx, duracao) {
    const bufferSize = ctx.sampleRate * duracao;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // SONS DE BATERIA
  function tocarBateria(som) {
    desbloquearConquista('primeiroSom', 'Primeiro Som');
    desbloquearConquista('ritmista', 'Ritmista');

    const ctx = obterAudioContext();
    const now = ctx.currentTime;
    const volMaster = estadoApp.volumeGeral;

    if (som === 'bumbo') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
      gain.gain.setValueAtTime(1.0 * volMaster, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (som === 'caixa') {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      oscGain.gain.setValueAtTime(0.7 * volMaster, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      const noise = ctx.createBufferSource();
      noise.buffer = criarBufferRuido(ctx, 0.2);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6 * volMaster, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.2);
      noise.stop(now + 0.2);
    } else if (som === 'prato') {
      const noise = ctx.createBufferSource();
      noise.buffer = criarBufferRuido(ctx, 0.3);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6000, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5 * volMaster, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.25);
    } else if (som === 'tom') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.25);
      gain.gain.setValueAtTime(0.8 * volMaster, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (som === 'palma') {
      [0, 0.012, 0.024].forEach((delay) => {
        const noise = ctx.createBufferSource();
        noise.buffer = criarBufferRuido(ctx, 0.12);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now + delay);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4 * volMaster, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now + delay);
        noise.stop(now + delay + 0.1);
      });
    }

    dispararDMX();
  }

  // SONS DO TECLADO E ARPEJOS
  function tocarSomNota(freq, duracao = 0.8, tipo = null) {
    desbloquearConquista('primeiroSom', 'Primeiro Som');

    const ctx = obterAudioContext();
    const now = ctx.currentTime;
    const volMaster = estadoApp.volumeGeral;
    const tipoSelecionado = tipo || document.getElementById('seletor-timbre')?.value || 'sine';

    const osc1 = ctx.createOscillator();
    osc1.type = tipoSelecionado;
    osc1.frequency.setValueAtTime(freq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volMaster * 0.8, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(volMaster * 0.4, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duracao);

    osc1.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + duracao);

    dispararDMX();
  }

  // ==========================================
  // 5. MÓDULO DE GRAVAÇÃO
  // ==========================================
  let gravando = false;
  let gravacao = [];
  let tempoInicioGravacao = 0;

  const btnRecord = document.getElementById('btn-record');
  const btnPlayLoop = document.getElementById('btn-play-loop');
  const btnLimpar = document.getElementById('btn-limpar-gravacao');
  const txtStatusGravacao = document.getElementById('texto-status-gravacao');

  btnRecord?.addEventListener('click', () => {
    gravando = !gravando;
    if (gravando) {
      gravacao = [];
      tempoInicioGravacao = Date.now();
      btnRecord.textContent = '⏹️ Parar Gravação';
      btnRecord.classList.add('gravando');
      if (btnPlayLoop) btnPlayLoop.disabled = true;
      if (btnLimpar) btnLimpar.disabled = true;
      if (txtStatusGravacao) txtStatusGravacao.textContent = '● Gravando sons em tempo real...';
    } else {
      btnRecord.textContent = '🔴 Gravar';
      btnRecord.classList.remove('gravando');
      const temItens = gravacao.length > 0;
      if (btnPlayLoop) btnPlayLoop.disabled = !temItens;
      if (btnLimpar) btnLimpar.disabled = !temItens;
      if (txtStatusGravacao) {
        txtStatusGravacao.textContent = temItens 
          ? `✓ Gravação pronta (${gravacao.length} notas salvas).` 
          : 'Nenhuma nota gravada.';
      }
      if (temItens) desbloquearConquista('maestro', 'Maestro');
    }
  });

  btnPlayLoop?.addEventListener('click', () => {
    if (gravacao.length === 0) return;
    emitirToast('▶️ Reproduzindo gravação...');
    gravacao.forEach(item => {
      setTimeout(() => tocarSomNota(item.freq), item.tempo);
    });
  });

  btnLimpar?.addEventListener('click', () => {
    gravacao = [];
    if (btnPlayLoop) btnPlayLoop.disabled = true;
    if (btnLimpar) btnLimpar.disabled = true;
    if (txtStatusGravacao) txtStatusGravacao.textContent = 'Gravação limpa.';
    emitirToast('🗑️ Gravação apagada.');
  });

  function registrarNotaGravada(freq) {
    if (gravando) {
      gravacao.push({ freq: freq, tempo: Date.now() - tempoInicioGravacao });
    }
  }

  // ==========================================
  // 6. EVENTOS DE INTERAÇÃO (BATERIA E TECLADO)
  // ==========================================
  
  // Bateria - Cliques
  document.querySelectorAll('.pad-som').forEach(pad => {
    pad.addEventListener('click', () => {
      const som = pad.dataset.som;
      pad.classList.add('hit');
      setTimeout(() => pad.classList.remove('hit'), 150);
      tocarBateria(som);
    });
  });

  // Teclado - Cliques
  document.querySelectorAll('.tecla').forEach(tecla => {
    tecla.addEventListener('click', () => {
      const freq = parseFloat(tecla.dataset.nota);
      const nome = tecla.dataset.nome;
      tocarSomNota(freq);
      registrarNotaGravada(freq);

      tecla.classList.add('ativa');
      setTimeout(() => tecla.classList.remove('ativa'), 200);

      const display = document.getElementById('display-nota');
      if (display) display.innerHTML = `Nota atual: <strong>${nome} (${freq} Hz)</strong>`;
    });
  });

  // Teclado Físico (Atalhos A..K e 1..5)
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const key = e.key.toLowerCase();

    // Mapeamento Teclado Musical
    const btnTecla = document.querySelector(`.tecla[data-key="${key}"]`);
    if (btnTecla && !e.repeat) {
      btnTecla.click();
      return;
    }

    // Mapeamento Bateria (Teclas 1 a 5)
    const mapaBateria = { '1': 'bumbo', '2': 'caixa', '3': 'prato', '4': 'tom', '5': 'palma' };
    if (mapaBateria[key] && !e.repeat) {
      const pad = document.querySelector(`.pad-som[data-som="${mapaBateria[key]}"]`);
      if (pad) pad.click();
      return;
    }

    // Atalho Metrônomo (M)
    if (key === 'm' && !e.repeat) {
      document.getElementById('btn-iniciar-metronomo')?.click();
      return;
    }

    // Atalho Painel Acessibilidade (?)
    if (key === '?' && !e.repeat) {
      document.getElementById('btn-painel-acessibilidade')?.click();
      return;
    }
  });

  // ==========================================
  // 7. MODOS EDUCATIVOS & AULA
  // ==========================================
  
  // Bateria - Modo Prática
  let sequenciaPraticaBateria = ['bumbo', 'caixa', 'prato'];
  document.getElementById('btn-pratica-bateria')?.addEventListener('click', () => {
    const status = document.getElementById('status-pratica-bateria');
    if (status) status.textContent = 'Observe o ritmo: Bumbo ➔ Caixa ➔ Prato!';
    
    sequenciaPraticaBateria.forEach((som, i) => {
      setTimeout(() => {
        const pad = document.querySelector(`.pad-som[data-som="${som}"]`);
        if (pad) pad.click();
      }, i * 600);
    });
  });

  // Teclado - Modo Aula
  document.getElementById('btn-modo-aula-teclado')?.addEventListener('click', () => {
    const status = document.getElementById('status-modo-aula');
    if (status) status.textContent = '🎓 Siga a sequência das teclas destacadas: Dó ➔ Mi ➔ Sol ➔ Dó Agudo';

    const sequenciaAula = ['a', 'd', 'g', 'k'];
    sequenciaAula.forEach((key, idx) => {
      setTimeout(() => {
        const btn = document.querySelector(`.tecla[data-key="${key}"]`);
        if (btn) {
          btn.classList.add('destaque-aula');
          setTimeout(() => btn.classList.remove('destaque-aula'), 600);
        }
      }, idx * 700);
    });
  });

  // ==========================================
  // 8. FERRAMENTAS: METRÔNOMO & AFINADOR
  // ==========================================
  let timerMetronomo = null;
  const sliderBpm = document.getElementById('slider-bpm');
  const valBpm = document.getElementById('val-bpm');

  function atualizarBPM(novoBpm) {
    if (sliderBpm) sliderBpm.value = novoBpm;
    if (valBpm) valBpm.textContent = novoBpm;
    if (timerMetronomo) {
      iniciarMetronomo(); // Reinicia com nova velocidade
    }
  }

  function iniciarMetronomo() {
    if (timerMetronomo) clearInterval(timerMetronomo);
    const bpm = parseInt(sliderBpm.value);
    const ms = (60 / bpm) * 1000;
    const pulso = document.getElementById('pulso-visual');

    emitirToast(`⏱️ Metrônomo iniciado em ${bpm} BPM`);

    timerMetronomo = setInterval(() => {
      tocarBateria('prato');
      pulso?.classList.add('piscar');
      setTimeout(() => pulso?.classList.remove('piscar'), 100);
    }, ms);
  }

  document.getElementById('btn-iniciar-metronomo')?.addEventListener('click', iniciarMetronomo);
  document.getElementById('btn-parar-metronomo')?.addEventListener('click', () => {
    if (timerMetronomo) {
      clearInterval(timerMetronomo);
      timerMetronomo = null;
      emitirToast('⏱️ Metrônomo parado');
    }
  });

  document.getElementById('btn-bpm-mais')?.addEventListener('click', () => {
    const v = Math.min(208, parseInt(sliderBpm.value) + 5);
    atualizarBPM(v);
  });

  document.getElementById('btn-bpm-menos')?.addEventListener('click', () => {
    const v = Math.max(40, parseInt(sliderBpm.value) - 5);
    atualizarBPM(v);
  });

  sliderBpm?.addEventListener('input', () => atualizarBPM(sliderBpm.value));

  document.querySelectorAll('.btn-preset-bpm').forEach(btn => {
    btn.addEventListener('click', () => atualizarBPM(btn.dataset.bpm));
  });

  // Afinador
  document.querySelectorAll('.btn-nota-ref').forEach(btn => {
    btn.addEventListener('click', () => {
      const freq = parseFloat(btn.dataset.freq);
      const nome = btn.dataset.nome;
      const pos = btn.dataset.pos;

      tocarSomNota(freq, 1.2, 'sine');

      const ponteiro = document.getElementById('ponteiro-afinador');
      const status = document.getElementById('status-afinador');

      if (ponteiro) ponteiro.style.left = pos + '%';
      if (status) status.innerHTML = `Nota de Referência: <strong>${nome}</strong> — AFINADO ✓`;
    });
  });

  // ==========================================
  // 9. CATÁLOGO DINÂMICO & BUSCA
  // ==========================================
  function renderizarCatalogo() {
    const grid = document.getElementById('grid-cards-instrumentos');
    const estadoVazio = document.getElementById('estado-vazio-catalogo');
    if (!grid) return;

    grid.innerHTML = '';
    const termoBusca = (document.getElementById('input-busca')?.value || '').toLowerCase();
    const filtroCat = document.getElementById('filtro-categoria')?.value || 'todos';

    let visiveis = 0;

    catalogoInstrumentos.forEach(item => {
      const atendeCat = filtroCat === 'todos' || item.categoria === filtroCat;
      const atendeBusca = item.nome.toLowerCase().includes(termoBusca) || item.descricao.toLowerCase().includes(termoBusca);

      if (atendeCat && atendeBusca) {
        visiveis++;
        const card = document.createElement('div');
        card.className = 'card-instrumento';
        card.innerHTML = `
          <div>
            <h3>${item.nome}</h3>
            <p>${item.descricao}</p>
          </div>
          <div class="curiosidade-card">💡 ${item.curiosidade}</div>
          <button class="btn-tocar-demo" data-tipo="${item.demoTipo}">🔊 Ouvir Demonstração</button>
        `;
        grid.appendChild(card);
      }
    });

    if (estadoVazio) {
      estadoVazio.style.display = visiveis === 0 ? 'block' : 'none';
    }

    // Listener para botões de demo no catálogo
    grid.querySelectorAll('.btn-tocar-demo').forEach(btn => {
      btn.addEventListener('click', () => {
        const tipo = btn.dataset.tipo;
        if (tipo === 'violao' || tipo === 'violino') {
          [220, 293.66, 392, 440].forEach((f, i) => setTimeout(() => tocarSomNota(f, 0.6, 'sine'), i * 180));
        } else if (tipo === 'teclado') {
          [261.63, 329.63, 392.00, 523.25].forEach((f, i) => setTimeout(() => tocarSomNota(f, 0.8, 'triangle'), i * 200));
        } else if (tipo === 'flauta') {
          [523.25, 587.33, 659.25, 698.46].forEach((f, i) => setTimeout(() => tocarSomNota(f, 0.7, 'sine'), i * 220));
        } else {
          tocarBateria('caixa');
          setTimeout(() => tocarBateria('prato'), 200);
        }
      });
    });
  }

  document.getElementById('input-busca')?.addEventListener('input', renderizarCatalogo);
  document.getElementById('filtro-categoria')?.addEventListener('change', renderizarCatalogo);

  // ==========================================
  // 10. QUIZ DE RECOMENDAÇÃO
  // ==========================================
  document.getElementById('btn-calcular-quiz')?.addEventListener('click', () => {
    const q1 = document.querySelector('input[name="qp1"]:checked')?.value || 'cordas';
    const q2 = document.querySelector('input[name="qp2"]:checked')?.value || 'cordas';
    const q3 = document.querySelector('input[name="qp3"]:checked')?.value || 'cordas';

    let pontos = { cordas: 0, teclas: 0, percussao: 0, sopros: 0 };
    pontos[q1]++;
    pontos[q2]++;
    pontos[q3]++;

    let recomendado = 'cordas';
    let maxPontos = -1;
    Object.keys(pontos).forEach(k => {
      if (pontos[k] > maxPontos) {
        maxPontos = pontos[k];
        recomendado = k;
      }
    });

    const painel = document.getElementById('painel-resultado-quiz');
    const emoji = document.getElementById('quiz-emoji');
    const titulo = document.getElementById('quiz-titulo-resultado');
    const desc = document.getElementById('quiz-desc-resultado');
    const barras = document.getElementById('barras-compatibilidade');

    if (painel) painel.style.display = 'block';

    const infoFinal = {
      cordas: { e: '🎸', t: 'Violão Acústico / Cordas', d: 'Sua busca por harmonia e praticidade indica excelente compatibilidade com instrumentos de corda.' },
      teclas: { e: '🎹', t: 'Teclado / Piano', d: 'Sua preferência por organização e riqueza melódica combina perfeitamente com o teclado.' },
      percussao: { e: '🥁', t: 'Bateria / Percussão', d: 'Sua energia e foco no ritmo indicam grande afinidade com instrumentos rítmicos.' },
      sopros: { e: '🎷', t: 'Flauta / Sopros', d: 'Sua busca por sons expressivos e leves indica ótima combinação com instrumentos de sopro.' }
    }[recomendado];

    if (emoji) emoji.textContent = infoFinal.e;
    if (titulo) titulo.textContent = infoFinal.t;
    if (desc) desc.textContent = infoFinal.d;

    if (barras) {
      barras.innerHTML = `
        <div>Cordas: ${Math.round((pontos.cordas/3)*100)}% <div class="trilho-barra"><div class="preenchimento-barra" style="width:${(pontos.cordas/3)*100}%"></div></div></div>
        <div>Teclas: ${Math.round((pontos.teclas/3)*100)}% <div class="trilho-barra"><div class="preenchimento-barra" style="width:${(pontos.teclas/3)*100}%"></div></div></div>
        <div>Percussão: ${Math.round((pontos.percussao/3)*100)}% <div class="trilho-barra"><div class="preenchimento-barra" style="width:${(pontos.percussao/3)*100}%"></div></div></div>
      `;
    }

    desbloquearConquista('explorador', 'Explorador');
  });

  document.getElementById('btn-reiniciar-quiz')?.addEventListener('click', () => {
    const painel = document.getElementById('painel-resultado-quiz');
    if (painel) painel.style.display = 'none';
  });

  // ==========================================
  // 11. CONTROLES DO PAINEL DE ACESSIBILIDADE
  // ==========================================
  const btnPainelAcess = document.getElementById('btn-painel-acessibilidade');
  const painelAcess = document.getElementById('painel-config-acessibilidade');

  btnPainelAcess?.addEventListener('click', () => {
    const exp = btnPainelAcess.getAttribute('aria-expanded') === 'true';
    btnPainelAcess.setAttribute('aria-expanded', !exp);
    if (painelAcess) painelAcess.style.display = exp ? 'none' : 'block';
  });

  document.getElementById('btn-modo-simples')?.addEventListener('click', () => {
    estadoApp.modoSimples = !estadoApp.modoSimples;
    salvarPreferencias();
    aplicarPreferencias();
    emitirToast(estadoApp.modoSimples ? '👴 Modo Simples Ativado' : 'Modo Simples Desativado');
  });

  document.getElementById('btn-fonte-aum')?.addEventListener('click', () => {
    if (estadoApp.tamanhoFonte < 140) {
      estadoApp.tamanhoFonte += 10;
      salvarPreferencias();
      aplicarPreferencias();
    }
  });

  document.getElementById('btn-fonte-dim')?.addEventListener('click', () => {
    if (estadoApp.tamanhoFonte > 80) {
      estadoApp.tamanhoFonte -= 10;
      salvarPreferencias();
      aplicarPreferencias();
    }
  });

  document.getElementById('btn-fonte-reset')?.addEventListener('click', () => {
    estadoApp.tamanhoFonte = 100;
    salvarPreferencias();
    aplicarPreferencias();
  });

  document.getElementById('btn-contraste-alto')?.addEventListener('click', () => {
    estadoApp.modoContraste = 'alto';
    salvarPreferencias();
    aplicarPreferencias();
  });

  document.getElementById('btn-contraste-suave')?.addEventListener('click', () => {
    estadoApp.modoContraste = 'suave';
    salvarPreferencias();
    aplicarPreferencias();
  });

  document.getElementById('btn-contraste-normal')?.addEventListener('click', () => {
    estadoApp.modoContraste = 'normal';
    salvarPreferencias();
    aplicarPreferencias();
  });

  document.getElementById('select-espacamento')?.addEventListener('change', (e) => {
    estadoApp.espacamento = e.target.value;
    salvarPreferencias();
    aplicarPreferencias();
  });

  document.getElementById('chk-reduzir-movimento')?.addEventListener('change', (e) => {
    estadoApp.reduzirMovimento = e.target.checked;
    salvarPreferencias();
    aplicarPreferencias();
  });

  document.getElementById('select-tema-3d')?.addEventListener('change', (e) => {
    alterarTema3D(e.target.value);
  });

  document.getElementById('vol-master-geral')?.addEventListener('input', (e) => {
    estadoApp.volumeGeral = parseFloat(e.target.value);
    salvarPreferencias();
  });

  document.getElementById('chk-feedback-sonoro')?.addEventListener('change', (e) => {
    estadoApp.feedbackSonoro = e.target.checked;
    salvarPreferencias();
  });

  document.getElementById('btn-restaurar-tudo')?.addEventListener('click', () => {
    localStorage.removeItem('estudio_musical_prefs');
    location.reload();
  });

  // Leitor de Voz Web Speech API
  document.getElementById('btn-ler-resumo')?.addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const texto = "Bem-vindo ao Estúdio Musical Interativo e Acessível. Este site permite tocar bateria, teclado, utilizar metrônomo, afinar instrumentos e realizar um quiz musical totalmente adaptado para idosos e com total acessibilidade.";
      const utt = new SpeechSynthesisUtterance(texto);
      utt.lang = 'pt-BR';
      window.speechSynthesis.speak(utt);
    } else {
      emitirToast('Seu navegador não suporta leitura de voz.');
    }
  });

  document.getElementById('btn-parar-fala')?.addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      emitirToast('Leitura de voz interrompida.');
    }
  });

  // Listener Global de Feedback Sonoro em Botões
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => emitirFeedbackSonoroBotao());
  });

  // ==========================================
  // 12. EXPERIÊNCIA GUIADA / TUTORIAL
  // ==========================================
  const modalBoasVindas = document.getElementById('modal-boas-vindas');
  const modalTutorial = document.getElementById('modal-tutorial');

  if (!localStorage.getItem('boas_vindas_vistas')) {
    if (modalBoasVindas) modalBoasVindas.style.display = 'flex';
  } else {
    if (modalBoasVindas) modalBoasVindas.style.display = 'none';
  }

  document.getElementById('btn-iniciar-experiencia')?.addEventListener('click', () => {
    localStorage.setItem('boas_vindas_vistas', 'true');
    if (modalBoasVindas) modalBoasVindas.style.display = 'none';
  });

  document.getElementById('btn-abrir-tutorial-inicial')?.addEventListener('click', () => {
    localStorage.setItem('boas_vindas_vistas', 'true');
    if (modalBoasVindas) modalBoasVindas.style.display = 'none';
    iniciarTutorialGuiado();
  });

  document.getElementById('btn-iniciar-guiado')?.addEventListener('click', iniciarTutorialGuiado);

  const passosTutorial = [
    { t: '1. Painel de Acessibilidade', d: 'Aqui você pode aumentar textos, alterar o contraste e ativar o modo simples para idosos.', id: 'secao-acessibilidade' },
    { t: '2. Bateria Acessível', d: 'Experimente os pads visuais grandes ou pressione as teclas 1 a 5 do seu teclado.', id: 'secao-bateria' },
    { t: '3. Teclado Musical', d: 'Toque notas nas teclas virtuais ou use as letras A até K no seu computador.', id: 'secao-teclado' },
    { t: '4. Ferramentas Musicais', d: 'Ajuste o ritmo no metrônomo e confira as notas de referência no afinador.', id: 'secao-ferramentas' },
    { t: '5. Catálogo Inclusivo', d: 'Pesquise e ouça demonstrações de diversos instrumentos musicais.', id: 'secao-catalogo' }
  ];

  let passoAtualIndex = 0;

  function iniciarTutorialGuiado() {
    passoAtualIndex = 0;
    exibirPassoTutorial();
    if (modalTutorial) modalTutorial.style.display = 'flex';
  }

  function exibirPassoTutorial() {
    const passo = passosTutorial[passoAtualIndex];
    document.getElementById('tut-passo-num').textContent = `Passo ${passoAtualIndex + 1} de ${passosTutorial.length}`;
    document.getElementById('tut-titulo').textContent = passo.t;
    document.getElementById('tut-descricao').textContent = passo.d;

    const btnAnt = document.getElementById('btn-tut-anterior');
    if (btnAnt) btnAnt.disabled = passoAtualIndex === 0;

    const btnProx = document.getElementById('btn-tut-proximo');
    if (btnProx) btnProx.textContent = (passoAtualIndex === passosTutorial.length - 1) ? 'Concluir' : 'Próximo';
  }

  document.getElementById('btn-tut-proximo')?.addEventListener('click', () => {
    if (passoAtualIndex < passosTutorial.length - 1) {
      passoAtualIndex++;
      exibirPassoTutorial();
    } else {
      if (modalTutorial) modalTutorial.style.display = 'none';
      emitirToast('🎉 Tutorial concluído! Divirta-se criando música.');
    }
  });

  document.getElementById('btn-tut-anterior')?.addEventListener('click', () => {
    if (passoAtualIndex > 0) {
      passoAtualIndex--;
      exibirPassoTutorial();
    }
  });

  document.getElementById('btn-fechar-tut')?.addEventListener('click', () => {
    if (modalTutorial) modalTutorial.style.display = 'none';
  });

  // Sensações da Seção "Descubra Seu Som"
  document.querySelectorAll('.btn-sensacao').forEach(btn => {
    btn.addEventListener('click', () => {
      const estilo = btn.dataset.estilo;
      const card = document.getElementById('feedback-sensacao');
      if (!card) return;

      card.style.display = 'block';

      if (estilo === 'calmo') {
        card.innerHTML = '<strong>🎵 Som Calmo & Relaxante:</strong> Arpejo de violão em Dó Maior executado.';
        [261.63, 329.63, 392.00, 523.25].forEach((f, i) => setTimeout(() => tocarSomNota(f, 1.0, 'sine'), i * 300));
      } else if (estilo === 'ritmico') {
        card.innerHTML = '<strong>🥁 Som Rítmico:</strong> Sequência pulsante de bateria e baixo executada.';
        tocarBateria('bumbo');
        setTimeout(() => tocarBateria('caixa'), 250);
        setTimeout(() => tocarBateria('bumbo'), 500);
        setTimeout(() => tocarBateria('prato'), 750);
      } else if (estilo === 'melodico') {
        card.innerHTML = '<strong>🎹 Som Melódico:</strong> Acorde rico de teclado executado.';
        [261.63, 329.63, 392.00].forEach(f => tocarSomNota(f, 1.2, 'triangle'));
      } else {
        card.innerHTML = '<strong>⚡ Som Energético:</strong> Ritmo acelerado e alegre!';
        [392, 440, 493.88, 523.25].forEach((f, i) => setTimeout(() => tocarSomNota(f, 0.4, 'sawtooth'), i * 150));
      }
    });
  });

  // INICIALIZAÇÃO GERAL
  carregarPreferencias();
  renderizarCatalogo();
  init3D();
});
