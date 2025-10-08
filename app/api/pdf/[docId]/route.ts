import { NextRequest } from 'next/server';
import actsMeta from '@/rules/acts.v1.json';
import standardsMeta from '@/rules/standards.v1.json';
import { renderPdfHtml, htmlToPdf, PdfContext } from '@/lib/pdf';
import { demoProducts } from '@/lib/demo-data';
import { getMessages, defaultLocale, type Locale } from '@/lib/i18n';

export async function GET(request: NextRequest, { params }: { params: { docId: string } }) {
  const search = request.nextUrl.searchParams;
  const type = (search.get('type') as 'DOC' | 'CHECKLIST' | 'LABEL') ?? 'DOC';
  const locale = (search.get('lang') as Locale) ?? defaultLocale;
  const preview = search.get('preview') === '1';

  const product = demoProducts.find((item) => params.docId.startsWith(item.id)) ?? demoProducts[0];
  const messages = await getMessages(locale);

  const acts = product.acts
    .map((code) => (actsMeta as any[]).find((act) => act.code === code))
    .filter(Boolean)
    .map((act: any) => ({ code: act.code, title: act.title, eli_url: act.eli_url }));

  const standards = (standardsMeta as any).standards
    .filter((standard: any) => standard.acts.some((code: string) => product.acts.includes(code)))
    .slice(0, 6)
    .map((standard: any) => `${standard.code} — ${standard.title}`);

  const origin = request.nextUrl.origin;

  const statusLabels: Record<string, Record<string, string>> = {
    complete: { de: 'Abgeschlossen', en: 'Complete', 'zh-CN': '已完成' },
    review: { de: 'In Prüfung', en: 'In review', 'zh-CN': '审核中' },
    draft: { de: 'Entwurf', en: 'Draft', 'zh-CN': '草稿' },
    yes: { de: 'Ja', en: 'Yes', 'zh-CN': '是' },
    no: { de: 'Nein', en: 'No', 'zh-CN': '否' }
  };

  const context: PdfContext = {
    manufacturer: 'Acme GmbH\nStraße des 17. Juni 135\n10623 Berlin\nDeutschland',
    product: `${product.name} (${product.model})`,
    acts,
    standards,
    notified: 'Notified Body 1234 (Example NB) — Module B certificate NB-2024-001',
    signature: `Max Mustermann, Leiter Qualitätssicherung\nBerlin, ${new Date().toISOString().slice(0, 10)}`,
    footer: `Dokument-ID ${params.docId} · Version v1.0 · ${new Date().toISOString().slice(0, 10)}`,
    checklistSections: [
      {
        heading: messages.pdf.checklist.sectionDesign,
        items: [
          { name: 'Konstruktionszeichnungen', status: statusLabels.complete[locale], attached: statusLabels.yes[locale], notes: '' },
          { name: 'Gefahrenanalyse', status: statusLabels.review[locale], attached: statusLabels.no[locale], notes: 'Pending sign-off' }
        ]
      },
      {
        heading: messages.pdf.checklist.sectionTesting,
        items: [
          { name: 'EN 62368-1 Prüfbericht', status: statusLabels.complete[locale], attached: statusLabels.yes[locale], notes: 'Issued by TÜV Rheinland' },
          { name: 'EMV Prüfbericht EN 55032/35', status: statusLabels.complete[locale], attached: statusLabels.yes[locale], notes: '' }
        ]
      },
      {
        heading: messages.pdf.checklist.sectionLabelling,
        items: [
          { name: 'Kennzeichnungslayout', status: statusLabels.draft[locale], attached: statusLabels.no[locale], notes: 'Update with QR' },
          { name: 'Gebrauchsanweisung (DE/EN)', status: statusLabels.complete[locale], attached: statusLabels.yes[locale], notes: '' }
        ]
      },
      {
        heading: messages.pdf.checklist.sectionSupply,
        items: [
          { name: 'RoHS Lieferantenerklärungen', status: statusLabels.complete[locale], attached: statusLabels.yes[locale], notes: '' },
          { name: 'Battery Sorgfaltspflichtbericht', status: statusLabels.review[locale], attached: statusLabels.no[locale], notes: 'Due Q2' }
        ]
      }
    ],
    importer: 'EU Importer GmbH\nHafenstraße 20\n20457 Hamburg\nDeutschland',
    traceability: 'Los-Nr.: 2024-05-BTX · Seriennummernbereich: BTX24-0001–0500',
    qrUrl: `${origin}/api/qr/${params.docId}`
  };

  const html = await renderPdfHtml(type, locale, messages, context);

  if (preview) {
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const pdfBuffer = await htmlToPdf(html);
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${params.docId}-${type.toLowerCase()}.pdf"`
    }
  });
}
