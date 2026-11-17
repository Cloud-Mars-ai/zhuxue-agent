// 重新提取 01有理数 视频 1-22 音轨并 ASR 转写（stepaudio-2.5-asr）
// 用法: node scripts/asr-rational-videos.mjs
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);
const ROOT = 'D:/黑客松/经管Agent';
const SRC = 'D:/临时/七年级/01有理数';
const OUT = path.join(ROOT, 'tmp/tv-review');
const FFMPEG = 'C:/Users/24358/.workbuddy/binaries/python/envs/default/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
const stepKey = () => {
  if (process.env.STEPFUN_KEY) return process.env.STEPFUN_KEY;
  const cfg = JSON.parse(readFileSync(path.join(os.homedir(), '.workbuddy/models.json'), 'utf8'));
  return cfg.find((m) => m.id === 'step-5-preview').apiKey;
};
const ASR_KEY = stepKey();

const pick = (files) => files
  .filter((f) => f.endsWith('.mp4'))
  .map((f) => ({ n: parseInt(f.match(/^(\d+)\./)[1], 10), f }))
  .filter((x) => x.n >= 1 && x.n <= 22)
  .sort((a, b) => a.n - b.n);

async function extractAudio(mp4, wav) {
  await execFileAsync(FFMPEG, ['-y', '-i', mp4, '-vn', '-ac', '1', '-ar', '16000', wav], { maxBuffer: 64 * 1024 * 1024 });
}

async function transcribe(wav) {
  const buf = await readFile(wav);
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: 'audio/wav' }), path.basename(wav));
  fd.append('model', 'stepaudio-2.5-asr');
  fd.append('language', 'zh');
  const res = await fetch('https://api.stepfun.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ASR_KEY}` },
    body: fd,
  });
  if (!res.ok) throw new Error(`ASR ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.text || '';
}

const files = pick(await readdir(SRC));
console.log(`共 ${files.length} 个视频`);
for (const { n, f } of files) {
  const stem = String(n).padStart(2, '0');
  const mp4 = path.join(SRC, f);
  const wav = path.join(OUT, `${stem}.wav`);
  const txt = path.join(OUT, `${stem}.txt`);
  try {
    if (!existsSync(wav)) await extractAudio(mp4, wav);
    const text = await transcribe(wav);
    await writeFile(txt, text, 'utf8');
    console.log(`${stem} ${f} -> ${text.length} 字`);
  } catch (e) {
    console.error(`${stem} ${f} 失败: ${e.message}`);
  }
}
console.log('完成，输出目录:', OUT);
