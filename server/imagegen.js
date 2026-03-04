/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LeoGPT — Image Generation (Stable Diffusion, Fooocus)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Desteklenen backend'ler:
 * - AUTOMATIC1111 WebUI (Stable Diffusion) — localhost:7860
 * - Fooocus / Fooocus-API — localhost:7865 veya özel URL
 *
 * .env: IMAGE_GEN_URL=http://localhost:7860
 */

const IMAGE_GEN_URL = (process.env.IMAGE_GEN_URL || '').replace(/\/$/, '');
const IMAGE_GEN_TIMEOUT = parseInt(process.env.IMAGE_GEN_TIMEOUT || '120000', 10); // 2 dk

function isConfigured() {
  return !!IMAGE_GEN_URL;
}

/**
 * AUTOMATIC1111 WebUI API
 * POST /sdapi/v1/txt2img
 */
async function generateWithA1111(prompt, options = {}) {
  const url = `${IMAGE_GEN_URL}/sdapi/v1/txt2img`;
  const body = {
    prompt: prompt || 'beautiful landscape, high quality',
    negative_prompt: options.negative_prompt || 'ugly, blurry, low quality',
    steps: options.steps || 25,
    width: options.width || 512,
    height: options.height || 512,
    cfg_scale: options.cfg_scale || 7,
    sampler_name: options.sampler || 'DPM++ 2M Karras',
    seed: options.seed ?? -1
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_GEN_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`A1111 API: ${res.status}`);
    const data = await res.json();
    const b64 = data.images?.[0];
    if (!b64) throw new Error('A1111: No image in response');
    return { base64: b64, mimeType: 'image/png' };
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('Image generation timeout');
    throw e;
  }
}

/**
 * Fooocus-API (mrhan1993) veya benzeri
 * POST /v1/generation/text-to-image
 */
async function generateWithFooocus(prompt, options = {}) {
  const url = `${IMAGE_GEN_URL}/v1/generation/text-to-image`;
  const body = {
    prompt: prompt || 'beautiful landscape, high quality',
    negative_prompt: options.negative_prompt || 'ugly, blurry',
    width: options.width || 1024,
    height: options.height || 1024,
    ...options
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_GEN_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Fooocus API: ${res.status}`);
    const data = await res.json();
    const b64 = data.images?.[0] || data.base64 || data.image;
    if (!b64) throw new Error('Fooocus: No image in response');
    const img = typeof b64 === 'string' ? b64 : b64.base64 || b64;
    return { base64: img, mimeType: 'image/png' };
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('Image generation timeout');
    throw e;
  }
}

/**
 * Otomatik backend seçimi (A1111 önce dene)
 */
async function generateImage(prompt, options = {}) {
  if (!isConfigured()) {
    throw new Error('IMAGE_GEN_URL nuk është konfiguruar. Shtoni në .env: IMAGE_GEN_URL=http://localhost:7860');
  }

  const backend = (process.env.IMAGE_GEN_BACKEND || 'a1111').toLowerCase();
  if (backend === 'fooocus') {
    return generateWithFooocus(prompt, options);
  }
  return generateWithA1111(prompt, options);
}

module.exports = {
  isConfigured,
  generateImage,
  generateWithA1111,
  generateWithFooocus
};
