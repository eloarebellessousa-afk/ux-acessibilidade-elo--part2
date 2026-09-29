window.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. SISTEMA WEB AUDIO API DE ALTA QUALIDADE
  ========================================================================== */
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function obterAudioContext() {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function tocarNotaSuave(freq, timbre = 'piano', duracao = 0.8) {
    try {
      const ctx = obterAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const volMaster = parseFloat(document.getElementById('volume-estudio')?.value || 0.6);

      if (timbre === 'piano') {
        osc.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
      } else if (timbre === 'synth') {
        osc.type = 'triangle';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
      } else if (timbre === 'orgao') {
        osc.type = 'square';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
      } else if (timbre === 'cordas') {
        osc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, ctx.currentTime);
      }

      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volMaster, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(volMaster * 0.7, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracao);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duracao);
    } catch(e) {
      console.warn("Aguardando interação do usuário.");
    }
  }

  // Teclado Interativo
  const seletorTimbre = document.getElementById('seletor-timbre');
  const seletorOitava = document.getElementById('seletor-oitava');
  const displayNota = document.getElementById('display-nota');
  const teclas = document.querySelectorAll('#teclado-estudio .tecla');

  teclas.forEach(tecla => {
    function acionarTecla() {
      const freqBase = parseFloat(tecla.getAttribute('data-nota'));
      const nome = tecla.getAttribute('data-nome');
      const multOitava = parseFloat(seletorOitava ? seletorOitava.value : 1);
      const freqFinal = freqBase * multOitava;
      const timbre = seletorTimbre ? seletorTimbre.value : 'piano';

      tocarNotaSuave(freqFinal, timbre, 1.0);

      if (displayNota) {
        displayNota.innerHTML = `Frequência Ativa: <strong>${nome} (${freqFinal.toFixed(1)} Hz)</strong>`;
      }

      tecla.classList.add('ativa');
      setTimeout(() => tecla.classList.remove('ativa'), 200);
    }

    tecla.addEventListener('mousedown', acionarTecla);
    tecla.addEventListener('touchstart', (e) => { e.preventDefault(); acionarTecla(); });
  });

  // Mapeamento de Teclado Físico
  const mapaTeclas = {};
  teclas.forEach(t => {
    const k = t.getAttribute('data-key');
    if (k) mapaTeclas[k.toLowerCase()] = t;
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.target.tagName === 'INPUT') return;
    const el = mapaTeclas[e.key.toLowerCase()];
    if (el) el.dispatchEvent(new Event('mousedown'));
  });

  /* ==========================================================================
     2. DEMONSTRAÇÕES SONORAS DE TRECHOS MUSICAIS
  ========================================================================== */
  function executarSequenciaMusa(notas, tempos, tipos, duracoes) {
    notas.forEach((f, idx) => {
      setTimeout(() => {
        if (f > 0) {
          tocarNotaSuave(f, tipos[idx] || 'synth', duracoes[idx] || 0.4);
        }
      }, tempos[idx]);
    });
  }

  document.querySelectorAll('.btn-tocar-demo').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipoDemo = btn.getAttribute('data-demo');

      if (tipoDemo === 'violao') {
        executarSequenciaMusa(
          [261.63, 329.63, 392.00, 523.25, 392.00, 329.63],
          [0, 180, 360, 540, 720, 900],
          ['piano', 'piano', 'piano', 'piano', 'piano', 'piano'],
          [0.8, 0.8, 0.8, 0.8, 0.8, 0.8]
        );
      } else if (tipoDemo === 'piano') {
        executarSequenciaMusa(
          [329.63, 392.00, 440.00, 523.25, 493.88, 440.00, 392.00],
          [0, 250, 500, 750, 1100, 1350, 1600],
          ['piano', 'piano', 'piano', 'piano', 'piano', 'piano', 'piano'],
          [0.9, 0.9, 0.9, 1.2, 0.8, 0.8, 1.0]
        );
      } else if (tipoDemo === 'violino') {
        executarSequenciaMusa(
          [440.00, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 440.00],
          [0, 350, 700, 1050, 1400, 1800, 2100, 2400],
          ['cordas', 'cordas', 'cordas', 'cordas', 'cordas', 'cordas', 'cordas', 'cordas'],
          [0.8, 0.8, 0.8, 0.8, 1.1, 0.7, 0.7, 1.2]
        );
      } else if (tipoDemo === 'sax') {
        executarSequenciaMusa(
          [311.13, 349.23, 369.99, 392.00, 466.16, 523.25, 466.16, 392.00],
          [0, 200, 400, 600, 850, 1100, 1400, 1650],
          ['orgao', 'orgao', 'orgao', 'orgao', 'orgao', 'orgao', 'orgao', 'orgao'],
          [0.5, 0.5, 0.5, 0.7, 0.6, 0.9, 0.5, 1.0]
        );
      } else if (tipoDemo === 'bateria') {
        const temposPerc = [0, 0, 250, 500, 500, 750, 1000, 1000, 1250, 1500, 1500];
        const sons = ['bumbo', 'prato', 'prato', 'caixa', 'prato', 'prato', 'bumbo', 'prato', 'prato', 'caixa', 'prato'];
        temposPerc.forEach((t, i) => {
          setTimeout(() => tocarSomPercussao(sons[i]), t);
        });
      } else if (tipoDemo === 'ukulele') {
        executarSequenciaMusa(
          [392.00, 523.25, 659.25, 880.00, 659.25, 523.25],
          [0, 120, 240, 360, 500, 620],
          ['synth', 'synth', 'synth', 'synth', 'synth', 'synth'],
          [0.5, 0.5, 0.5, 0.7, 0.5, 0.5]
        );
      }
    });
  });

  /* ==========================================================================
     3. SOUNDBOARD DE PERCUSSÃO
  ========================================================================== */
  function tocarSomPercussao(tipo) {
    try {
      const ctx = obterAudioContext();

      if (tipo === 'bumbo') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.9, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);

      } else if (tipo === 'caixa') {
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.7, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        whiteNoise.start();

      } else if (tipo === 'prato') {
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5000, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();

      } else if (tipo === 'prato-aberto') {
        const bufferSize = ctx.sampleRate * 0.35;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(4000, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();

      } else if (tipo === 'palma') {
        for (let k = 0; k < 3; k++) {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(450 + Math.random() * 100, ctx.currentTime);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
          }, k * 25);
        }

      } else if (tipo === 'vinil') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch(e) {
      console.warn("Erro ao emitir percussão.");
    }
  }

  document.querySelectorAll('.pad-som').forEach(pad => {
    pad.addEventListener('click', () => {
      const tipo = pad.getAttribute('data-tipo-som');
      pad.classList.add('hit');
      setTimeout(() => pad.classList.remove('hit'), 150);
      tocarSomPercussao(tipo);
    });
  });

  /* ==========================================================================
     4. METRÔNOMO
  ========================================================================== */
  let metronomoTimer = null;
  const sliderBpm = document.getElementById('slider-bpm');
  const valBpm = document.getElementById('val-bpm');
  const pulsoVisual = document.getElementById('pulso-visual');
  const btnIniciarMetr = document.getElementById('btn-iniciar-metronomo');
  const btnPararMetr = document.getElementById('btn-parar-metronomo');

  if (sliderBpm && valBpm) {
    sliderBpm.addEventListener('input', () => {
      valBpm.innerText = sliderBpm.value;
      if (metronomoTimer) iniciarMetronomo();
    });
  }

  function tickMetronomo() {
    tocarSomPercussao('prato');
    if (pulsoVisual) {
      pulsoVisual.classList.add('piscar');
      setTimeout(() => pulsoVisual.classList.remove('piscar'), 100);
    }
  }

  function iniciarMetronomo() {
    if (metronomoTimer) clearInterval(metronomoTimer);
    const bpm = parseInt(sliderBpm.value);
    const intervalo = (60 / bpm) * 1000;
    tickMetronomo();
    metronomoTimer = setInterval(tickMetronomo, intervalo);
  }

  if (btnIniciarMetr) btnIniciarMetr.addEventListener('click', iniciarMetronomo);
  if (btnPararMetr) btnPararMetr.addEventListener('click', () => {
    if (metronomoTimer) clearInterval(metronomoTimer);
    metronomoTimer = null;
  });

  /* ==========================================================================
     5. AFINADOR VISUAL INTERATIVO
  ========================================================================== */
  const ponteiro = document.getElementById('ponteiro-afinador');
  const statusAfinador = document.getElementById('status-afinador');

  document.querySelectorAll('.btn-nota-ref').forEach(btn => {
    btn.addEventListener('click', () => {
      const freq = parseFloat(btn.getAttribute('data-freq'));
      const nome = btn.getAttribute('data-nome');

      tocarNotaSuave(freq, 'piano', 1.5);

      if (ponteiro) {
        ponteiro.style.left = '50%';
      }
      if (statusAfinador) {
        statusAfinador.innerHTML = `Emitindo tom ideal de referência para <strong>${nome} (${freq} Hz)</strong>. Afinação perfeita!`;
      }
    });
  });

  /* ==========================================================================
     6. QUIZ COMPLETO E DIAGNÓSTICO
  ========================================================================== */
  const btnCalcularQuiz = document.getElementById('btn-calcular-quiz');
  const painelResultado = document.getElementById('painel-resultado-quiz');
  const quizEmoji = document.getElementById('quiz-emoji');
  const quizTitulo = document.getElementById('quiz-titulo-resultado');
  const quizDesc = document.getElementById('quiz-desc-resultado');
  const quizDetalhes = document.getElementById('quiz-detalhes-analise');

  if (btnCalcularQuiz) {
    btnCalcularQuiz.addEventListener('click', () => {
      const p1 = document.querySelector('input[name="p1"]:checked')?.value || 'violao';
      const p2 = document.querySelector('input[name="p2"]:checked')?.value || 'pop';

      let inst = 'Teclado Synthesizer';
      let emoji = '🎹';
      let desc = 'Perfeito para criar harmonias limpas, com aprendizado visual e flexibilidade!';
      let analise = 'Sua combinação de foco em harmonias mostra que o teclado oferecerá o progresso mais gratificante.';

      if (p1 === 'violao' || p2 === 'pop') {
        inst = 'Violão Acústico';
        emoji = '🎸';
        desc = 'O parceiro ideal para cantar, acompanhar amigos e levar a música para qualquer ambiente!';
        analise = 'Seu perfil valoriza a sociabilidade e a versatilidade.';
      } else if (p1 === 'bateria' || p2 === 'rock') {
        inst = 'Bateria Eletrônica';
        emoji = '🥁';
        desc = 'Excelente para canalizar energia, aperfeiçoar o ritmo e praticar com fones!';
        analise = 'Seu foco em ritmo se beneficia do treino dinâmico que a bateria oferece.';
      } else if (p1 === 'sax' || p2 === 'jazz') {
        inst = 'Saxofone Alto';
        emoji = '🎷';
        desc = 'Proporciona uma expressão melódica apaixonante com grande alcance emotivo!';
        analise = 'Sua busca por um som marcante combina perfeitamente com o saxofone.';
      } else if (p2 === 'classico') {
        inst = 'Violino Erudito';
        emoji = '🎻';
        desc = 'Um instrumento nobre que desenvolverá um ouvido afinado e sensibilidade artística!';
        analise = 'A sua afinidade com o repertório erudito fará do violino uma jornada recompensadora.';
      }

      if (quizEmoji) quizEmoji.innerText = emoji;
      if (quizTitulo) quizTitulo.innerHTML = `Instrumento Indicado: <strong>${inst}</strong>`;
      if (quizDesc) quizDesc.innerText = desc;
      if (quizDetalhes) quizDetalhes.innerHTML = `<hr class="divisor"><p><strong>🔍 Análise do seu Perfil:</strong> ${analise}</p>`;

      if (painelResultado) {
        painelResultado.style.display = 'block';
        painelResultado.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  /* ==========================================================================
     7. FILTROS E BUSCA
  ========================================================================== */
  const filtroCategoria = document.getElementById('filtro-categoria');
  const filtroDificuldade = document.getElementById('filtro-dificuldade');
  const inputBusca = document.getElementById('input-busca');
  const cards = document.querySelectorAll('.card-instrumento');

  function aplicarFiltros() {
    const cat = filtroCategoria ? filtroCategoria.value : 'todos';
    const dif = filtroDificuldade ? filtroDificuldade.value : 'todos';
    const busca = inputBusca ? inputBusca.value.toLowerCase().trim() : '';

    cards.forEach(card => {
      const cardCat = card.getAttribute('data-categoria');
      const cardDif = card.getAttribute('data-dificuldade');
      const texto = card.innerText.toLowerCase();

      const okCat = (cat === 'todos' || cardCat === cat);
      const okDif = (dif === 'todos' || cardDif === dif);
      const okBusca = (busca === '' || texto.includes(busca));

      if (okCat && okDif && okBusca) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros);
  if (filtroDificuldade) filtroDificuldade.addEventListener('change', aplicarFiltros);
  if (inputBusca) inputBusca.addEventListener('input', aplicarFiltros);

  /* ==========================================================================
     8. BARRA DE ACESSIBILIDADE E SINTETIZADOR DE VOZ
  ========================================================================== */
  let tamanhoFonte = 100;
  const btnAumentar = document.getElementById('btn-fonte-aumentar');
  const btnDiminuir = document.getElementById('btn-fonte-diminuir');
  const wrapper = document.getElementById('app-wrapper');

  if (btnAumentar && btnDiminuir && wrapper) {
    btnAumentar.addEventListener('click', () => {
      if (tamanhoFonte < 140) {
        tamanhoFonte += 10;
        wrapper.style.fontSize = `${tamanhoFonte}%`;
      }
    });
    btnDiminuir.addEventListener('click', () => {
      if (tamanhoFonte > 80) {
        tamanhoFonte -= 10;
        wrapper.style.fontSize = `${tamanhoFonte}%`;
      }
    });
  }

  const btnLeitorVoz = document.getElementById('btn-leitor-voz');
  if (btnLeitorVoz && 'speechSynthesis' in window) {
    btnLeitorVoz.addEventListener('click', () => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance("Bem-vindo ao Clube da Música Pro. Experimente nossas abas de estúdio, ritmo e o quiz completo.");
      utt.lang = 'pt-BR';
      window.speechSynthesis.speak(utt);
    });
  }

  /* ==========================================================================
     9. AMBIENTE 3D DINÂMICO (THREE.JS)
  ========================================================================== */
  const canvas = document.getElementById('bg-canvas-3d');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const light1 = new THREE.DirectionalLight(0x3b82f6, 1.5);
  light1.position.set(20, 20, 20);
  scene.add(light1);

  const geometries = [
    new THREE.IcosahedronGeometry(1.2, 0),
    new THREE.TorusGeometry(1, 0.35, 16, 32),
    new THREE.OctahedronGeometry(1.2, 0)
  ];

  const group = new THREE.Group();
  const objectsData = [];
  let paletaCores = [0x3b82f6, 0x8b5cf6, 0xec4899];

  function criarObjetos3D() {
    while(group.children.length > 0) group.remove(group.children[0]);
    objectsData.length = 0;

    for (let i = 0; i < 35; i++) {
      const geom = geometries[Math.floor(Math.random() * geometries.length)];
      const mat = new THREE.MeshPhongMaterial({
        color: paletaCores[Math.floor(Math.random() * paletaCores.length)],
        shininess: 90,
        transparent: true,
        opacity: 0.75
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.x = (Math.random() - 0.5) * 60;
      mesh.position.y = (Math.random() - 0.5) * 60;
      mesh.position.z = (Math.random() - 0.5) * 40;

      const scale = Math.random() * 0.8 + 0.4;
      mesh.scale.set(scale, scale, scale);
      group.add(mesh);

      objectsData.push({
        mesh: mesh,
        rotX: (Math.random() - 0.5) * 0.015,
        rotY: (Math.random() - 0.5) * 0.015,
        baseY: mesh.position.y,
        offset: Math.random() * Math.PI * 2
      });
    }
  }

  criarObjetos3D();
  scene.add(group);

  document.querySelectorAll('.btn-tema-3d').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-tema-3d').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      const tema = btn.getAttribute('data-tema');

      if (tema === 'cosmos') paletaCores = [0x3b82f6, 0x8b5cf6, 0xec4899];
      else if (tema === 'neon') paletaCores = [0x00ffcc, 0xff007f, 0x9d00ff];
      else if (tema === 'aurora') paletaCores = [0x10b981, 0x06b6d4, 0x3b82f6];

      criarObjetos3D();
    });
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    objectsData.forEach((item) => {
      item.mesh.rotation.x += item.rotX;
      item.mesh.rotation.y += item.rotY;
      item.mesh.position.y = item.baseY + Math.sin(elapsedTime * 1.5 + item.offset) * 1.5;
    });

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});