// PERCUSSÃO REALISTA (Modelagem Física & Síntese FM)
  function tocarBateria(som) {
    const ctx = obterAudioContext();
    const now = ctx.currentTime;

    if (som === 'bumbo') {
      // BUMBO: Ataque de pele + Sub-grave profundo
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Queda de frequência ultra-rápida (simula o impacto do batente)
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);

    } else if (som === 'caixa') {
      // CAIXA: Corpo do tambor + Esteira metálica vibrante
      
      // 1. Corpo da caixa (Tom fundamental)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      
      oscGain.gain.setValueAtTime(0.7, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      // 2. Ruído da esteira (Metal)
      const noise = ctx.createBufferSource();
      noise.buffer = criarBufferRuido(ctx, 0.2);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.18);
      noise.stop(now + 0.18);

    } else if (som === 'prato') {
      // PRATO (HI-HAT): Frequências inarmônicas metálicas (Simulação de bronze)
      const freqs = [2, 3, 4.16, 5.43, 6.79, 8.21]; // Razões inarmônicas metálicas
      const fundamental = 40, now = ctx.currentTime;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08); // Fechado bem seco

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, now);

      freqs.forEach(f => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = fundamental * f * 10;
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + 0.08);
      });

      filter.connect(gain);
      gain.connect(ctx.destination);

    } else if (som === 'tom') {
      // TOM-TOM: Tambor grave de madeira com afinação caindo
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);

    } else if (som === 'palma') {
      // PALMA (HANDCLAP): Micro-rajadas sobrepostas de ruído
      const tempos = [0, 0.01, 0.02, 0.03]; // 4 impactos quase simultâneos
      
      tempos.forEach((delay) => {
        const noise = ctx.createBufferSource();
        noise.buffer = criarBufferRuido(ctx, 0.15);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now + delay);
        filter.Q.setValueAtTime(1.2, now + delay);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now + delay);
        noise.stop(now + delay + 0.12);
      });
    }

    dispararDMX();
  }
