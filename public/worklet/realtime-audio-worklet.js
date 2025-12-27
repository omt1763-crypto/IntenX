/**
 * Simplified Audio Worklet for OpenAI Realtime API
 * Captures raw PCM audio and forwards to main thread
 * Server-side VAD handled by OpenAI
 */

class RealtimeAudioWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;
    this.frameCount = 0;
    this.sampleRate = sampleRate;
    this.targetSampleRate = 24000; // OpenAI Realtime API requires 24kHz
    
    this.port.onmessage = (event) => {
      const { type } = event.data;
      
      if (type === 'start') {
        this.isRecording = true;
        this.frameCount = 0;
        console.log(`[Realtime Worklet] Recording started at ${this.sampleRate}Hz, target: ${this.targetSampleRate}Hz`);
      } else if (type === 'stop') {
        this.isRecording = false;
        console.log('[Realtime Worklet] Recording stopped');
      }
    };
  }

  /**
   * Simple linear interpolation resampling
   * Converts from native audio context sample rate to 24kHz if needed
   */
  resample(inputData) {
    const ratio = this.sampleRate / this.targetSampleRate;

    // If already close to 24kHz, skip resampling
    if (Math.abs(ratio - 1.0) < 0.01) {
      return inputData;
    }

    const inputLength = inputData.length;
    const outputLength = Math.ceil(inputLength / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIdx = i * ratio;
      const srcIdxFloor = Math.floor(srcIdx);
      const srcIdxCeil = Math.min(srcIdxFloor + 1, inputLength - 1);
      const fraction = srcIdx - srcIdxFloor;

      // Linear interpolation between samples
      output[i] = inputData[srcIdxFloor] * (1 - fraction) + inputData[srcIdxCeil] * fraction;
    }

    return output;
  }

  process(inputs) {
    if (!this.isRecording) return true;

    const input = inputs[0];
    if (!input || !input[0]) return true;

    // Get audio data from current frame
    let audioData = input[0];
    
    // Resample to 24kHz if necessary
    if (this.sampleRate !== this.targetSampleRate) {
      audioData = this.resample(audioData);
    }
    
    // Send raw PCM audio to main thread at 24kHz
    this.port.postMessage(
      {
        type: 'audio',
        audio: audioData,
        timestamp: this.frameCount * 128 / this.sampleRate,
        sampleRate: this.targetSampleRate
      },
      // Transfer audio buffer for efficiency
      [audioData.buffer]
    );

    this.frameCount++;
    return true;
  }
}

registerProcessor('realtime-audio-worklet', RealtimeAudioWorklet);
