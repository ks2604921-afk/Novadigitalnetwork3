export type DialogueBoostLevel = 'low' | 'medium' | 'high';

export type DialogueBoostPreset = {
  label: string;
  description: string;
  highPassHz: number;
  presenceGainDb: number;
  compressorThresholdDb: number;
  compressorRatio: number;
  makeupGain: number;
};

export const DIALOGUE_BOOST_PRESETS: Record<DialogueBoostLevel, DialogueBoostPreset> = {
  low: {
    label: 'Low',
    description: 'Subtle vocal lift (+3.5 dB)',
    highPassHz: 110,
    presenceGainDb: 3.5,
    compressorThresholdDb: -18,
    compressorRatio: 3,
    makeupGain: 1.08,
  },
  medium: {
    label: 'Medium',
    description: 'Clear speech isolation (+6 dB)',
    highPassHz: 135,
    presenceGainDb: 6,
    compressorThresholdDb: -22,
    compressorRatio: 4.5,
    makeupGain: 1.18,
  },
  high: {
    label: 'High',
    description: 'Maximum vocal clarity (+9 dB)',
    highPassHz: 165,
    presenceGainDb: 9,
    compressorThresholdDb: -26,
    compressorRatio: 6,
    makeupGain: 1.3,
  },
};

export type DialogueBoostStatus = 'active' | 'idle' | 'unsupported';

export type DialogueBoostController = {
  apply: (enabled: boolean, level: DialogueBoostLevel) => DialogueBoostStatus;
  dispose: () => void;
};

type AudioGraph = {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  highPass: BiquadFilterNode;
  presencePeak: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  gain: GainNode;
};

const graphByElement = new WeakMap<HTMLMediaElement, AudioGraph>();

function getAudioContextConstructor(): (new () => AudioContext) | null {
  if (typeof window === 'undefined') return null;
  const win = window as Window & {
    webkitAudioContext?: new () => AudioContext;
  };
  return window.AudioContext ?? win.webkitAudioContext ?? null;
}

function getOrCreateGraph(video: HTMLMediaElement): AudioGraph | null {
  const cached = graphByElement.get(video);
  if (cached) return cached;

  const Ctor = getAudioContextConstructor();
  if (!Ctor) return null;

  try {
    const ctx = new Ctor();
    const source = ctx.createMediaElementSource(video);
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 20;
    highPass.Q.value = 0.7;

    const presencePeak = ctx.createBiquadFilter();
    presencePeak.type = 'peaking';
    presencePeak.frequency.value = 2600;
    presencePeak.Q.value = 1.1;
    presencePeak.gain.value = 0;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = 0;
    compressor.knee.value = 18;
    compressor.ratio.value = 1;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.22;

    const gain = ctx.createGain();
    gain.gain.value = 1;

    source
      .connect(highPass)
      .connect(presencePeak)
      .connect(compressor)
      .connect(gain)
      .connect(ctx.destination);

    const graph: AudioGraph = { ctx, source, highPass, presencePeak, compressor, gain };
    graphByElement.set(video, graph);
    return graph;
  } catch {
    return null;
  }
}

/**
 * Web Audio API Dialogue Boost controller using AudioContext, BiquadFilterNode,
 * and DynamicsCompressorNode to enhance speech frequencies while leveling explosions.
 */
export function createDialogueBoostController(video: HTMLMediaElement): DialogueBoostController {
  let graph: AudioGraph | null = null;

  const apply = (enabled: boolean, level: DialogueBoostLevel): DialogueBoostStatus => {
    if (!enabled) {
      if (!graph) {
        return getAudioContextConstructor() ? 'idle' : 'unsupported';
      }
      const now = graph.ctx.currentTime;
      graph.highPass.frequency.setTargetAtTime(20, now, 0.04);
      graph.presencePeak.gain.setTargetAtTime(0, now, 0.04);
      graph.compressor.threshold.setTargetAtTime(0, now, 0.04);
      graph.compressor.ratio.setTargetAtTime(1, now, 0.04);
      graph.gain.gain.setTargetAtTime(1, now, 0.04);
      return 'idle';
    }

    graph = graph ?? getOrCreateGraph(video);
    if (!graph) {
      return 'unsupported';
    }

    if (graph.ctx.state === 'suspended' && typeof graph.ctx.resume === 'function') {
      void graph.ctx.resume().catch(() => undefined);
    }

    const preset = DIALOGUE_BOOST_PRESETS[level];
    const now = graph.ctx.currentTime;
    graph.highPass.frequency.setTargetAtTime(preset.highPassHz, now, 0.04);
    graph.presencePeak.gain.setTargetAtTime(preset.presenceGainDb, now, 0.04);
    graph.compressor.threshold.setTargetAtTime(preset.compressorThresholdDb, now, 0.04);
    graph.compressor.ratio.setTargetAtTime(preset.compressorRatio, now, 0.04);
    graph.gain.gain.setTargetAtTime(preset.makeupGain, now, 0.04);
    return 'active';
  };

  const dispose = () => {
    if (!graph) return;
    try {
      const now = graph.ctx.currentTime;
      graph.highPass.frequency.setTargetAtTime(20, now, 0.02);
      graph.presencePeak.gain.setTargetAtTime(0, now, 0.02);
      graph.compressor.threshold.setTargetAtTime(0, now, 0.02);
      graph.compressor.ratio.setTargetAtTime(1, now, 0.02);
      graph.gain.gain.setTargetAtTime(1, now, 0.02);
    } catch {
      /* ignore teardown errors on unmounted media element */
    }
  };

  return { apply, dispose };
}
