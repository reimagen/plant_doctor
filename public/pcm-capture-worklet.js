class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.totalSamples = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input[0] && input[0].length) {
      // Log every 100th packet to avoid spamming the console
      if (this.totalSamples % 100 === 0) {
        console.log(`[AudioWorklet] Processing audio packet, length: ${input[0].length}`);
      }
      this.totalSamples++;
      this.port.postMessage(input[0].slice(0));
    }
    return true;
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
