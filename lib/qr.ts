import QRCode from 'qrcode';

export async function createQrPng(content: string) {
  return QRCode.toBuffer(content, { type: 'png', margin: 1, scale: 6 });
}
