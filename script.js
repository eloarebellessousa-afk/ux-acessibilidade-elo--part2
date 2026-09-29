document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. ENGINE 3D - MULTI-TEMAS FUNCIONAIS
  // ==========================================
  let scene, camera, renderer, particles, particleMaterial;
  let mouseX = 0, mouseY = 0;
  let velRotacaoX = 0.001, velRotacaoY = 0.0015;

  const temas3D = {
    cosmos: { cor: 0x3b82f6, tamanho: 3.2, velX: 0.001, velY: 0.0015 },
    neon: { cor: 0xec4899, tamanho: 4.5, velX: 0.003, velY: 0.004 },
    aurora: { cor: 0x22c55e, tamanho: 2.8, velX: 0.0005, velY: 0.002 }
  };

  function init3D() {
    const canvas = document.getElementById('bg-canvas-3d');
    if (!canvas || typeof THREE === 'undefined') return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 400;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BufferGeometry();
    const count = 900;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 1000;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleMaterial = new THREE.PointsMaterial({
      size: temas3D.cosmos.tamanho,
      color: temas3D.cosmos.cor,
      transparent: true,
      opacity: 0.85
    });

    particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.1;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.1;
    });

    animate();
  }

  function animate() {
    requestAnimationFrame(animate);
    if (particles) {
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

  window.addEventListener('resize', () => {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });

  document.querySelectorAll('.btn-tema-3d').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-tema-3d').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');

      const nomeTema = btn.dataset.tema;
      const config = temas3D[nomeTema];

      if (config && particleMaterial) {
        particleMaterial.color.setHex(config.cor);
        particleMaterial.size = config.tamanho;
        velRotacaoX = config.velX;
        velRotacaoY = config.velY;
      }
    });
  });

  function dispararDMX() {
    const luzes = document.querySelectorAll('.luz-dmx');
    if (luzes.length === 0) return;
    const idx = Math.floor(Math.random() * luzes.length);
    luzes[idx].classList.add('ativa');
    setTimeout(() => luzes[idx].classList.remove('ativa'), 120);
  }

  // ==========================================
  // 2. SÍNTESE DE ÁUDIO (WEB AUDIO API)
  // ==========================================
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function obterAudioContext() {
    if (!audioCtx) {
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
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

  // BATERIA MANUAL MODELADA
  function tocarBateria(som) {
    const ctx = obterAudioContext();
    const now = ctx.currentTime;

    if (som === 'bumbo') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.08);

      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);

    } else if (som === 'caixa') {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);
      
      oscGain.gain.setValueAtTime(0.7, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      const noise = ctx.createBufferSource();
      noise.buffer = criarBufferRuido(ctx, 0.18);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.7, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.18);
      noise.stop(now + 0.18);

    } else if (som === 'prato') {
      const noise = ctx.createBufferSource();
      noise.buffer = criarBufferRuido(ctx, 0.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6500, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.1);

    } else if (som === 'tom') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

    } else if (som === 'palma') {
      const tempos = [0, 0.01, 0.02];
      tempos.forEach((delay) => {
        const noise = ctx.createBufferSource();
        noise.buffer = criarBufferRuido(ctx, 0.12);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now + delay);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now + delay);
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

  function tocarCordaViolao(freq, duracao = 1.2) {
    const ctx = obterAudioContext();
    const now = ctx.currentTime;
    const bufferSize = Math.round(ctx.sampleRate / freq);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + duracao);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duracao);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duracao);
    dispararDMX();
  }

  function tocarSom(freq, duracao = 0.8, tipo = null) {
    const ctx = obterAudioContext();
    const now = ctx.currentTime;
    const volMaster = parseFloat(document.getElementById('volume-estudio')?.value || 0.7);
    const tipoSelecionado = tipo || document.getElementById('seletor-timbre')?.value || 'sine';

    const osc1 = ctx.createOscillator();
    osc1.type = tipoSelecionado;
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 1.002, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volMaster, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(volMaster * 0.5, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duracao);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duracao);
    osc2.stop(now + duracao);
    dispararDMX();
  }

  function tocarBeatBateria() {
    const bpm = 110;
    const tempoNota = (60 / bpm) / 2;
    const sequencia = ['bumbo', 'prato', 'caixa', 'prato', 'bumbo', 'bumbo', 'caixa', 'prato'];

    sequencia.forEach((som, idx) => {
      setTimeout(() => tocarBateria(som), idx * tempoNota * 1000);
    });
  }

  // Gravador
  let gravando = false;
  let gravacao = [];
  let tempoInicio = 0;

  const btnRecord = document.getElementById('btn-record');
  const btnPlayLoop = document.getElementById('btn-play-loop');

  btnRecord?.addEventListener('click', () => {
    gravando = !gravando;
    if (gravando) {
      gravacao = [];
      tempoInicio = Date.now();
      btnRecord.textContent = '⏹️ Parar Gravação';
      btnRecord.classList.add('gravando');
      btnPlayLoop.disabled = true;
    } else {
      btnRecord.textContent = '🔴 Gravar';
      btnRecord.classList.remove('gravando');
      btnPlayLoop.disabled = gravacao.length === 0;
    }
  });

  btnPlayLoop?.addEventListener('click', () => {
    if (gravacao.length === 0) return;
    gravacao.forEach(item => {
      setTimeout(() => tocarSom(item.freq), item.tempo);
    });
  });

  function registrarNotaGravada(freq) {
    if (gravando) {
      gravacao.push({ freq: freq, tempo: Date.now() - tempoInicio });
    }
  }

  // Eventos do Teclado
  document.querySelectorAll('.tecla').forEach(tecla => {
    tecla.addEventListener('click', () => {
      const freq = parseFloat(tecla.dataset.nota);
      const nome = tecla.dataset.nome;
      tocarSom(freq);
      registrarNotaGravada(freq);
      tecla.classList.add('ativa');
      setTimeout(() => tecla.classList.remove('ativa'), 200);
      const display = document.getElementById('display-nota');
      if (display) display.innerHTML = `Nota: <strong>${nome} (${freq} Hz)</strong>`;
    });
  });

  window.addEventListener('keydown', (e) => {
    const btn = document.querySelector(`.tecla[data-key="${e.key.toLowerCase()}"]`);
    if (btn && !e.repeat) btn.click();
  });

  // Eventos da Bateria
  document.querySelectorAll('.pad-som').forEach(pad => {
    pad.addEventListener('click', () => {
      pad.classList.add('hit');
      setTimeout(() => pad.classList.remove('hit'), 150);
      tocarBateria(pad.dataset.som);
    });
  });

  // Demos
  document.querySelectorAll('.btn-tocar-demo').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.tipo;
      if (tipo === 'violao') {
        const arpejo = [164.81, 220.00, 293.66, 329.63, 392.00, 523.25];
        arpejo.forEach((freq, i) => setTimeout(() => tocarCordaViolao(freq), i * 220));
      } else if (tipo === 'teclado') {
        const prog = [261.63, 329.63, 392.00, 493.88, 523.25];
        prog.forEach((freq, i) => setTimeout(() => tocarSom(freq, 0.8, 'sine'), i * 250));
      } else {
        tocarBeatBateria();
      }
    });
  });

  // Metrônomo
  let timerMetronomo = null;
  const sliderBpm = document.getElementById('slider-bpm');
  const valBpm = document.getElementById('val-bpm');

  sliderBpm?.addEventListener('input', () => {
    if (valBpm) valBpm.innerText = sliderBpm.value;
  });

  document.getElementById('btn-iniciar-metronomo')?.addEventListener('click', () => {
    if (timerMetronomo) clearInterval(timerMetronomo);
    const bpm = parseInt(sliderBpm.value);
    const ms = (60 / bpm) * 1000;
    const pulso = document.getElementById('pulso-visual');

    timerMetronomo = setInterval(() => {
      tocarBateria('prato');
      pulso?.classList.add('piscar');
      setTimeout(() => pulso?.classList.remove('piscar'), 100);
    }, ms);
  });

  document.getElementById('btn-parar-metronomo')?.addEventListener('click', () => {
    if (timerMetronomo) clearInterval(timerMetronomo);
  });

  document.querySelectorAll('.btn-nota-ref').forEach(btn => {
    btn.addEventListener('click', () => {
      const freq = parseFloat(btn.dataset.freq);
      const nome = btn.dataset.nome;
      const pos = btn.dataset.pos;
      tocarSom(freq, 1.2, 'sine');
      const ponteiro = document.getElementById('ponteiro-afinador');
      const status = document.getElementById('status-afinador');
      if (ponteiro) ponteiro.style.left = pos + '%';
      if (status) status.innerHTML = `Tom de Referência: <strong>${nome}</strong>`;
    });
  });

  // Filtros
  const filtroCat = document.getElementById('filtro-categoria');
  const inputBusca = document.getElementById('input-busca');

  function filtrarCards() {
    const cat = filtroCat.value;
    const busca = inputBusca.value.toLowerCase();

    document.querySelectorAll('.card-instrumento').forEach(card => {
      const cardCat = card.dataset.categoria;
      const cardNome = card.dataset.nome;
      const atendeCat = (cat === 'todos' || cardCat === cat);
      const atendeBusca = cardNome.includes(busca);

      card.style.display = (atendeCat && atendeBusca) ? 'flex' : 'none';
    });
  }

  filtroCat?.addEventListener('change', filtrarCards);
  inputBusca?.addEventListener('keyup', filtrarCards);

  // Quiz
  document.getElementById('btn-calcular-quiz')?.addEventListener('click', () => {
    const respostas = ['qp1', 'qp2'];
    let pontos = { violao: 0, teclado: 0, bateria: 0 };

    respostas.forEach(q => {
      const el = document.querySelector(`input[name="${q}"]:checked`);
      if (el) pontos[el.value]++;
    });

    const total = 2;
    const pctViolao = Math.round((pontos.violao / total) * 100);
    const pctTeclado = Math.round((pontos.teclado / total) * 100);
    const pctBateria = Math.round((pontos.bateria / total) * 100);

    const res = document.getElementById('painel-resultado-quiz');
    if (res) res.style.display = 'block';

    let vencedor = 'violao';
    if (pontos.teclado > pontos.violao && pontos.teclado >= pontos.bateria) vencedor = 'teclado';
    if (pontos.bateria > pontos.violao && pontos.bateria > pontos.teclado) vencedor = 'bateria';

    if (vencedor === 'bateria') {
      document.getElementById('quiz-emoji').textContent = '🥁';
      document.getElementById('quiz-titulo-resultado').textContent = 'Recomendação: Bateria';
      document.getElementById('quiz-desc-resultado').textContent = 'O teu foco no ritmo indica forte afinidade com a bateria.';
    } else if (vencedor === 'teclado') {
      document.getElementById('quiz-emoji').textContent = '🎹';
      document.getElementById('quiz-titulo-resultado').textContent = 'Recomendação: Teclado ou Piano';
      document.getElementById('quiz-desc-resultado').textContent = 'A tua preferência por harmonia combina com o teclado.';
    } else {
      document.getElementById('quiz-emoji').textContent = '🎸';
      document.getElementById('quiz-titulo-resultado').textContent = 'Recomendação: Violão Acústico';
      document.getElementById('quiz-desc-resultado').textContent = 'A tua busca por praticidade sugere o violão.';
    }

    document.getElementById('barras-compatibilidade').innerHTML = `
      <div class="item-barra">
        <span>🎸 Violão: ${pctViolao}%</span>
        <div class="trilho-barra"><div class="preenchimento-barra" style="width: ${pctViolao}%;"></div></div>
      </div>
      <div class="item-barra">
        <span>🎹 Teclado: ${pctTeclado}%</span>
        <div class="trilho-barra"><div class="preenchimento-barra" style="width: ${pctTeclado}%;"></div></div>
      </div>
      <div class="item-barra">
        <span>🥁 Bateria: ${pctBateria}%</span>
        <div class="trilho-barra"><div class="preenchimento-barra" style="width: ${pctBateria}%;"></div></div>
      </div>
    `;
  });

  // Inicializa o fundo 3D
  init3D();
});
