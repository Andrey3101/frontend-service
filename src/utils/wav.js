/**
 * Кодирование аудио в WAV PCM 16 бит моно и подготовка записи с микрофона
 * к отправке в ai-service (SaluteSpeech не принимает webm, поэтому браузерную
 * запись MediaRecorder перекодируем в WAV 16 кГц моно).
 */

/** Частота дискретизации для распознавания речи. */
export const STT_SAMPLE_RATE = 16000;

/**
 * @param {DataView} view
 * @param {number} offset
 * @param {string} text ASCII
 */
function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}

/**
 * Float32 PCM [-1; 1] (один канал) → WAV-файл PCM16 little-endian, моно.
 * @param {Float32Array} samples
 * @param {number} sampleRate например 16000
 * @returns {Blob} Blob с type 'audio/wav' (44 байта заголовка + 2 байта на отсчёт)
 */
export function encodeWavPcm16(samples, sampleRate) {
  const channels = 1;
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // размер файла минус 8 байт
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // размер блока fmt для PCM
  view.setUint16(20, 1, true); // формат: 1 = PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true); // byte rate
  view.setUint16(32, channels * bytesPerSample, true); // block align
  view.setUint16(34, bytesPerSample * 8, true); // бит на отсчёт
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, Number.isFinite(samples[i]) ? samples[i] : 0));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += bytesPerSample;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Запись любого формата, который умеет декодировать браузер (webm/opus, ogg, mp4…),
 * → WAV PCM16 моно `sampleRate` Гц. Ресемплинг и сведение в моно делает OfflineAudioContext.
 * @param {Blob} blob запись MediaRecorder
 * @param {number} [sampleRate]
 * @returns {Promise<Blob>} audio/wav
 */
export async function blobToWavPcm16(blob, sampleRate = STT_SAMPLE_RATE) {
  const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  const OfflineCtx = window.OfflineAudioContext || /** @type {any} */ (window).webkitOfflineAudioContext;
  if (!AudioCtx || !OfflineCtx) {
    throw new Error('Браузер не поддерживает обработку аудио (Web Audio API)');
  }
  const encoded = await blob.arrayBuffer();
  const ctx = new AudioCtx();
  /** @type {AudioBuffer} */
  let decoded;
  try {
    decoded = await ctx.decodeAudioData(encoded);
  } finally {
    // Контекст нужен только для декодирования — закрываем сразу, даже при ошибке.
    Promise.resolve()
      .then(() => ctx.close())
      .catch(() => {});
  }
  const length = Math.max(1, Math.ceil(decoded.duration * sampleRate));
  const offline = new OfflineCtx(1, length, sampleRate);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination); // многоканальный вход сводится в моно (speakers down-mix)
  source.start(0);
  const rendered = await offline.startRendering();
  return encodeWavPcm16(rendered.getChannelData(0), sampleRate);
}
