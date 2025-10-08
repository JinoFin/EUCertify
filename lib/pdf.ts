import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';
import { Locale } from '@/lib/i18n';

const templateCache = new Map<string, string>();
const assetCache = new Map<string, string>();

async function loadFile(relativePath: string) {
  if (templateCache.has(relativePath)) {
    return templateCache.get(relativePath)!;
  }
  const filePath = path.join(process.cwd(), relativePath);
  const content = await fs.readFile(filePath, 'utf-8');
  templateCache.set(relativePath, content);
  return content;
}

async function loadAsset(relativePath: string) {
  if (assetCache.has(relativePath)) {
    return assetCache.get(relativePath)!;
  }
  const filePath = path.join(process.cwd(), relativePath);
  const content = await fs.readFile(filePath, 'utf-8');
  assetCache.set(relativePath, content);
  return content;
}

export interface PdfContext {
  manufacturer: string;
  product: string;
  acts: { code: string; title: string; eli_url: string }[];
  standards: string[];
  notified?: string;
  signature: string;
  footer: string;
  checklistSections: { heading: string; items: { name: string; status: string; attached: string; notes: string }[] }[];
  importer: string;
  traceability: string;
  qrUrl: string;
}

function injectDocTemplate(template: string, locale: Locale, strings: any, context: PdfContext, styles: string) {
  return template
    .replace(/{{LANG}}/g, locale)
    .replace(/{{TITLE}}/g, strings.title)
    .replace('{{STYLES}}', styles)
    .replace('{{RESPONSIBILITY}}', strings.responsibility)
    .replace('{{MANUFACTURER_HEADING}}', strings.manufacturerHeading ?? 'Manufacturer')
    .replace('{{MANUFACTURER_BLOCK}}', context.manufacturer)
    .replace('{{PRODUCT_HEADING}}', strings.productHeading ?? 'Product')
    .replace('{{PRODUCT_BLOCK}}', context.product)
    .replace('{{ACTS_HEADING}}', strings.acts)
    .replace('<!--ACTS-->', context.acts
      .map((act) => `<li><strong>${act.code}</strong> – ${act.title}<br/><small>${act.eli_url}</small></li>`)
      .join(''))
    .replace('{{STANDARDS_HEADING}}', strings.standards)
    .replace('<!--STANDARDS-->', context.standards.map((item) => `<li>${item}</li>`).join(''))
    .replace('{{NOTIFIED_HEADING}}', strings.notifiedBody)
    .replace('{{NOTIFIED_BLOCK}}', context.notified ?? '-')
    .replace('{{SIGNATURE_HEADING}}', strings.signature)
    .replace('{{SIGNATURE_BLOCK}}', context.signature)
    .replace('{{QR_HEADING}}', strings.qr)
    .replace('{{QR_BLOCK}}', `<img src="${context.qrUrl}" alt="QR" style="width:120px;height:120px;"/>`)
    .replace('{{FOOTER_BLOCK}}', context.footer)
    .replace('{{PRODUCT_HEADING}}', strings.productHeading ?? 'Product');
}

function injectChecklistTemplate(template: string, locale: Locale, strings: any, context: PdfContext, styles: string) {
  const rows = context.checklistSections
    .map((section) => {
      const headerRow = `<tr><td colspan="4"><strong>${section.heading}</strong></td></tr>`;
      const itemRows = section.items
        .map(
          (item) =>
            `<tr><td>${item.name}</td><td>${item.status}</td><td>${item.attached}</td><td>${item.notes}</td></tr>`
        )
        .join('');
      return headerRow + itemRows;
    })
    .join('');

  return template
    .replace(/{{LANG}}/g, locale)
    .replace('{{STYLES}}', styles)
    .replace(/{{TITLE}}/g, strings.title)
    .replace('{{PRODUCT_BLOCK}}', context.product)
    .replace('{{COLUMN_DOCUMENT}}', strings.columnDocument)
    .replace('{{COLUMN_STATUS}}', strings.columnStatus)
    .replace('{{COLUMN_ATTACHED}}', strings.columnAttached)
    .replace('{{COLUMN_NOTES}}', strings.columnNotes)
    .replace('<!--ROWS-->', rows)
    .replace('{{FOOTER_BLOCK}}', context.footer);
}

async function injectLabelTemplate(template: string, locale: Locale, strings: any, context: PdfContext, styles: string) {
  const ce = await loadAsset('public/svg/ce.svg');
  const weee = await loadAsset('public/svg/weee.svg');
  const battery = await loadAsset('public/svg/battery.svg');

  return template
    .replace(/{{LANG}}/g, locale)
    .replace('{{STYLES}}', styles)
    .replace(/{{TITLE}}/g, strings.title)
    .replace('{{PRODUCT_BLOCK}}', context.product)
    .replace('{{CE_HEADING}}', strings.ce)
    .replace('{{ICON_CE}}', ce)
    .replace('{{WEEE_HEADING}}', strings.weee)
    .replace('{{ICON_WEEE}}', weee)
    .replace('{{BATTERY_HEADING}}', strings.battery)
    .replace('{{ICON_BATTERY}}', battery)
    .replace('{{IMPORTER_HEADING}}', strings.importer)
    .replace('{{IMPORTER_BLOCK}}', context.importer)
    .replace('{{TRACEABILITY_HEADING}}', strings.traceability)
    .replace('{{TRACEABILITY_BLOCK}}', context.traceability)
    .replace('{{FOOTER_BLOCK}}', context.footer);
}

export async function renderPdfHtml(
  type: 'DOC' | 'CHECKLIST' | 'LABEL',
  locale: Locale,
  messages: any,
  context: PdfContext
) {
  const styles = await loadFile('templates/partials/styles.css');
  if (type === 'DOC') {
    const template = await loadFile('templates/doc/v1.html');
    return injectDocTemplate(template, locale, messages.pdf.doc, context, styles);
  }
  if (type === 'CHECKLIST') {
    const template = await loadFile('templates/checklist/v1.html');
    return injectChecklistTemplate(template, locale, messages.pdf.checklist, context, styles);
  }
  const template = await loadFile('templates/label/v1.html');
  return await injectLabelTemplate(template, locale, messages.pdf.label, context, styles);
}

export async function htmlToPdf(html: string) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '16mm', right: '16mm' } });
  await browser.close();
  return pdf;
}
