document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. ENGINE 3D & EFEITO DMX DE LUZES
  // ==========================================
  let scene, camera, renderer, particles, particleMaterial;
  let mouseX = 0, mouseY = 0;

  function init3D() {
    const canvas = document.getElementById('bg-canvas-3d');
    if (!canvas || typeof THREE === 'undefined') return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 400;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BufferGeometry();
    const count = 800;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 1000;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleMaterial = new THREE.PointsMaterial({ size: 3.2, color: 0x3b82f6, transparent: true, opacity: 0.8 });
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
      particles.rotation.x += 0.001;
      particles.rotation.y += 0.0015;
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
    }
    renderer.render(scene, camera);
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
      const corHex = parseInt(btn.dataset.cor, 16);
      if (particleMaterial) particleMaterial.color.setHex(corHex);
    });
  });

  function dispararDMX() {
    const luzes = document.querySelectorAll('.luz-dmx');
    const idx = Math.floor(Math.random() * luzes.length);
    luzes[idx].classList.add('ativa');
    setTimeout(() => luzes[idx].classList.remove('ativa'), 120);
  }

  // ==========================================
  // 2. ENGINE DE ÁUDIO HD (WEB AUDIO API PRO)
  // ==========================================
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function obterAudioContext() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // Emulação Karplus-Strong para som real de corda/violão
  function tocarCordaViolao(freq, duracao = 1.2) {
    const ctx = obterAudioContext();
    const bufferSize = Math.round(ctx.sampleRate / freq);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // Ruído inicial da palhetada
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq * 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracao);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseSource.start();
    noiseSource.stop(ctx.currentTime + duracao);
    dispararDMX();
  }

  // Sintetizador polifônico com ADSR
  function tocarSom(freq, duracao = 0.8, tipo = null) {
    const ctx = obterAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const tipoSelecionado = tipo || document.getElementById('seletor-timbre')?.value || 'sine';
    const volMaster = parseFloat(document.getElementById('volume-estudio')?.value || 0.7);

    osc.type = tipoSelecionado;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Envelope ADSR Limpo
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volMaster, ctx.currentTime + 0.03); // Ataque
    gain.gain.exponentialRampToValueAtTime(volMaster * 0.7, ctx.currentTime + 0.1); // Decaimento
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracao); // Relaxamento

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duracao);
    dispararDMX();
  }

  // Gerador de Bateria e Ritmos Reais
  function tocarBateria(som) {
    const ctx = obterAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (som === 'bumbo') {
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (som === 'caixa') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, now);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (som === 'prato') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (som === 'tom') {
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      tocarSom(450, 0.1, 'sine');
    }
    gain.connect(ctx.destination);
    dispararDMX();
  }

  // Demonstrador de Beats de Bateria Reais
  function tocarBeatBateria() {
    const bpm = 110;
    const tempoNota = (60 / bpm) / 2;
    const sequencia = ['bumbo', 'prato', 'caixa', 'prato', 'bumbo', 'bumbo', 'caixa', 'prato'];

    sequencia.forEach((som, idx) => {
      setTimeout(() => tocarBateria(som), idx * tempoNota * 1000);
    });
  }

  // GRAVADOR DE SEQUÊNCIA (LOOP STUDIO)
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
      btnRecord.textContent = '🔴 Gravar Loop';
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

  // Interação do Teclado Visual
  document.querySelectorAll('.tecla').forEach(tecla => {
    tecla.addEventListener('click', () => {
      const freq = parseFloat(tecla.dataset.nota);
      const nome = tecla.dataset.nome;
      tocarSom(freq);
      registrarNotaGravada(freq);
      tecla.classList.add('ativa');
      setTimeout(() => tecla.classList.remove('ativa'), 200);
      document.getElementById('display-nota').innerHTML = `Nota: <strong>${nome} (${freq} Hz)</strong>`;
    });
  });

  window.addEventListener('keydown', (e) => {
    const btn = document.querySelector(`.tecla[data-key="${e.key.toLowerCase()}"]`);
    if (btn && !e.repeat) btn.click();
  });

  document.querySelectorAll('.pad-som').forEach(pad => {
    pad.addEventListener('click', () => {
      pad.classList.add('hit');
      setTimeout(() => pad.classList.remove('hit'), 150);
      tocarBateria(pad.dataset.som);
    });
  });

  // Demonstradores do Catálogo
  document.querySelectorAll('.btn-tocar-demo').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.tipo;
      if (tipo === 'violao') {
        const arpejo = [164.81, 220.00, 293.66, 329.63, 392.00, 523.25];
        arpejo.forEach((freq, i) => setTimeout(() => tocarCordaViolao(freq), i * 220));
      } else if (tipo === 'teclado') {
        const prog = [261.63, 329.63, 392.00, 493.88, 523.25];
        prog.forEach((freq, i) => setTimeout(() => tocarSom(freq, 0.8, 'sawtooth'), i * 250));
      } else {
        tocarBeatBateria();
      }
    });
  });

  // ==========================================
  // 3. METRÔNOMO & AFINADOR
  // ==========================================
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
      tocarSom(1000, 0.04, 'sine');
      pulso.classList.add('piscar');
      setTimeout(() => pulso.classList.remove('piscar'), 100);
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
      document.getElementById('ponteiro-afinador').style.left = pos + '%';
      document.getElementById('status-afinador').innerHTML = `Tom de Referência: <strong>${nome}</strong>`;
    });
  });

  // ==========================================
  // 4. FILTRAGEM DE BUSCA & QUIZ PRO 360°
  // ==========================================
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

  // Lógica Avançada de Pontuação do Quiz 360°
  document.getElementById('btn-calcular-quiz')?.addEventListener('click', () => {
    const respostas = ['qp1', 'qp2', 'qp3', 'qp4', 'qp5'];
    let pontos = { violao: 0, teclado: 0, bateria: 0 };

    respostas.forEach(q => {
      const el = document.querySelector(`input[name="${q}"]:checked`);
      if (el) pontos[el.value]++;
    });

    const total = 5;
    const pctViolao = Math.round((pontos.violao / total) * 100);
    const pctTeclado = Math.round((pontos.teclado / total) * 100);
    const pctBateria = Math.round((pontos.bateria / total) * 100);

    const res = document.getElementById('painel-resultado-quiz');
    res.style.display = 'block';

    let vencedor = 'violao';
    if (pontos.teclado > pontos.violao && pontos.teclado >= pontos.bateria) vencedor = 'teclado';
    if (pontos.bateria > pontos.violao && pontos.bateria > pontos.teclado) vencedor = 'bateria';

    if (vencedor === 'bateria') {
      document.getElementById('quiz-emoji').textContent = '🥁';
      document.getElementById('quiz-titulo-resultado').textContent = 'Seu Match Ideal: Bateria Eletrônica Groovebox';
      document.getElementById('quiz-desc-resultado').textContent = 'Sua energia rítmica e foco na pulsação tornam você um baterista nato.';
    } else if (vencedor === 'teclado') {
      document.getElementById('quiz-emoji').textContent = '🎹';
      document.getElementById('quiz-titulo-resultado').textContent = 'Seu Match Ideal: Synthesizer PolyPro';
      document.getElementById('quiz-desc-resultado').textContent = 'Seu perfil analítico e apreço por harmonias combinam com o teclado.';
    } else {
      document.getElementById('quiz-emoji').textContent = '🎸';
      document.getElementById('quiz-titulo-resultado').textContent = 'Seu Match Ideal: Violão Acústico Pro';
      document.getElementById('quiz-desc-resultado').textContent = 'Sua busca por versatilidade e sonoridade orgânica pede um violão.';
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

  // Acessibilidade Aumento/Diminuição de Fonte
  let tamanhoFonte = 100;
  document.getElementById('btn-fonte-aumentar')?.addEventListener('click', () => {
    if (tamanhoFonte < 130) { tamanhoFonte += 5; document.body.style.fontSize = tamanhoFonte + '%'; }
  });
  document.getElementById('btn-fonte-diminuir')?.addEventListener('click', () => {
    if (tamanhoFonte > 85) { tamanhoFonte -= 5; document.body.style.fontSize = tamanhoFonte + '%'; }
  });

  init3D();
});
