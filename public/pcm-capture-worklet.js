class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    if (input && input.length > 0) {
      const samples = input[0]
      this.port.postMessage(samples)
    }
    return true
  }
}

registerProcessor('pcm-capture-processor', PCMCaptureProcessor)
