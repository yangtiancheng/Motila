import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

type CaptchaScene = 'login' | 'register' | 'forgotPassword';

type CaptchaRecord = {
  code: string;
  scene: CaptchaScene;
  expiresAt: number;
};

@Injectable()
export class RiskCaptchaService {
  private readonly store = new Map<string, CaptchaRecord>();

  createCaptcha(scene: CaptchaScene) {
    const captchaId = randomUUID();
    const code = this.generateCode();
    const expiresInSec = 300;

    this.store.set(captchaId, {
      code,
      scene,
      expiresAt: Date.now() + expiresInSec * 1000,
    });

    this.cleanup();

    return {
      captchaId,
      imageData: this.buildImageDataUrl(code),
      expiresInSec,
      scene,
    };
  }

  verifyCaptcha(scene: CaptchaScene, captchaId?: string, captchaCode?: string) {
    this.cleanup();
    if (!captchaId || !captchaCode) return false;

    const record = this.store.get(captchaId);
    if (!record) return false;
    if (record.scene !== scene) return false;
    if (record.expiresAt <= Date.now()) {
      this.store.delete(captchaId);
      return false;
    }

    const ok = record.code.toLowerCase() === captchaCode.trim().toLowerCase();
    if (ok) {
      this.store.delete(captchaId);
    }
    return ok;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  private generateCode(length = 4) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let value = '';
    for (let i = 0; i < length; i += 1) {
      value += chars[Math.floor(Math.random() * chars.length)];
    }
    return value;
  }

  private buildImageDataUrl(code: string) {
    const chars = code.split('');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="132" height="44" viewBox="0 0 132 44">
        <rect width="132" height="44" rx="8" fill="#f5f7fa" />
        <path d="M6 32 C 18 10, 28 10, 40 28 S 64 40, 76 18 S 100 8, 126 26" stroke="#d9d9d9" stroke-width="2" fill="none" />
        ${chars
          .map((char, index) => {
            const x = 18 + index * 26;
            const y = 28 + (index % 2 === 0 ? -3 : 3);
            const rotate = index % 2 === 0 ? -8 : 8;
            const color = ['#1677ff', '#722ed1', '#13a8a8', '#d46b08'][index % 4];
            return `<text x="${x}" y="${y}" font-size="24" font-family="Arial" font-weight="700" fill="${color}" transform="rotate(${rotate} ${x} ${y})">${char}</text>`;
          })
          .join('')}
      </svg>
    `.trim();

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}
