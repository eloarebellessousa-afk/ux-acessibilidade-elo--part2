document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. FUNDO 3D INTERATIVO (THREE.JS REATIVO)
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
    const count = 700;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 1000;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleMaterial = new THREE.PointsMaterial({ size: 3, color: 0x3b82f6, transparent: true, opacity: 0.8 });
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
      particles.rotation.y += 0.002;
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

  // Botões de tema de cor das partículas
  document.querySelectorAll('.btn-tema-3d').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-tema-3d').forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      const corHex = parseInt(btn.dataset.cor, 16);
      if (particleMaterial) particleMaterial.color.setHex(corHex);
    });
  });

  // ==========================================
  // 2. SINTETIZADOR DE ÁUDIO NATIVO (WEB AUDIO API)
  // ==========================================
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function obterAudioContext() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tocarSom(freq, duracao = 0.8, tipo = null) {
    const ctx = obterAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const tipoSelecionado = tipo || document.getElementById('seletor-timbre')?.value || 'sine';
    const vol = parseFloat(document.getElementById('volume-estudio')?.value || 0.7);

    osc.type = tipoSelecionado;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracao);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duracao);
  }

  function tocarArpejo(notas) {
    notas.forEach((nota, idx) => {
      setTimeout(() => tocarSom(nota, 0.6), idx * 180);
    });
  }

  // Interatividade das teclas do teclado visual
  document.querySelectorAll('.tecla').forEach(tecla => {
    tecla.addEventListener('click', () => {
      const freq = parseFloat(tecla.dataset.nota);
      const nome = tecla.dataset.nome;
      tocarSom(freq);
      tecla.classList.add('ativa');
      setTimeout(() => tecla.classList.remove('ativa'), 200);
      document.getElementById('display-nota').innerHTML = `Nota Ativa: <strong>${nome} (${freq} Hz)</strong>`;
    });
  });

  // Mapeamento do Teclado Físico
  window.addEventListener('keydown', (e) => {
    const btn = document.querySelector(`.tecla[data-key="${e.key.toLowerCase()}"]`);
    if (btn && !e.repeat) {
      btn.click();
    }
  });

  // Soundboard / Percussão
  document.querySelectorAll('.pad-som').forEach(pad => {
    pad.addEventListener('click', () => {
      pad.classList.add('hit');
      setTimeout(() => pad.classList.remove('hit'), 150);
      const tipo = pad.dataset.som;
      if (tipo === 'bumbo') tocarSom(60, 0.3, 'sine');
      else if (tipo === 'caixa') tocarSom(220, 0.2, 'triangle');
      else if (tipo === 'prato') tocarSom(800, 0.1, 'square');
      else tocarSom(400, 0.15, 'sine');
    });
  });

  // Demonstrações de áudio do catálogo
  document.querySelectorAll('.btn-tocar-demo').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.tipo;
      if (tipo === 'violao') tocarArpejo([261.63, 329.63, 392.00, 523.25]);
      else if (tipo === 'teclado') tocarArpejo([440.00, 554.37, 659.25, 880.00]);
      else {
        tocarSom(60, 0.3, 'sine');
        setTimeout(() => tocarSom(800, 0.1, 'square'), 150);
        setTimeout(() => tocarSom(220, 0.2, 'triangle'), 300);
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
      tocarSom(1000, 0.05, 'sine');
      pulso.classList.add('piscar');
      setTimeout(() => pulso.classList.remove('piscar'), 100);
    }, ms);
  });

  document.getElementById('btn-parar-metronomo')?.addEventListener('click', () => {
    if (timerMetronomo) clearInterval(timerMetronomo);
  });

  // Afinador
  document.querySelectorAll('.btn-nota-ref').forEach(btn => {
    btn.addEventListener('click', () => {
      const freq = parseFloat(btn.dataset.freq);
      const nome = btn.dataset.nome;
      const pos = btn.dataset.pos;
      tocarSom(freq, 1.2);
      document.getElementById('ponteiro-afinador').style.left = pos + '%';
      document.getElementById('status-afinador').innerHTML = `Frequência emitida: <strong>${nome}</strong>`;
    });
  });

  // ==========================================
  // 4. FILTRAGEM DO CATÁLOGOS & QUIZ
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

  // Quiz
  document.getElementById('btn-calcular-quiz')?.addEventListener('click', () => {
    const p1 = document.querySelector('input[name="p1"]:checked')?.value;
    const res = document.getElementById('painel-resultado-quiz');
    res.style.display = 'block';

    if (p1 === 'bateria') {
      document.getElementById('quiz-emoji').textContent = '🥁';
      document.getElementById('quiz-titulo-resultado').textContent = 'Bateria Eletrônica Pro';
      document.getElementById('quiz-desc-resultado').textContent = 'Perfil Rítmico: Desenvolva coordenação motoro-espacial e tempo absoluto.';
    } else if (p1 === 'teclado') {
      document.getElementById('quiz-emoji').textContent = '🎹';
      document.getElementById('quiz-titulo-resultado').textContent = 'Teclado Synthesizer Pro';
      document.getElementById('quiz-desc-resultado').textContent = 'Perfil Harmônico: Perfeito para visão ampla de arranjos e composição digital.';
    } else {
      document.getElementById('quiz-emoji').textContent = '🎸';
      document.getElementById('quiz-titulo-resultado').textContent = 'Violão Acústico';
      document.getElementById('quiz-desc-resultado').textContent = 'Perfil Versátil: Ótimo para voz e violão, acompanhamentos e transporte facilitado.';
    }
  });

  // Acessibilidade Aumento/Diminuição de Fonte
  let tamanhoFonte = 100;
  document.getElementById('btn-fonte-aumentar')?.addEventListener('click', () => {
    if (tamanhoFonte < 130) { tamanhoFonte += 5; document.body.style.fontSize = tamanhoFonte + '%'; }
  });
  document.getElementById('btn-fonte-diminuir')?.addEventListener('click', () => {
    if (tamanhoFonte > 85) { tamanhoFonte -= 5; document.body.style.fontSize = tamanhoFonte + '%'; }
  });

  // Inicializa o 3D
  init3D();
});
