declare module 'html2pdf.js' {
  type Html2PdfOptions = {
    margin?: number | number[]
    filename?: string
    jsPDF?: { unit?: string; format?: string | string[]; orientation?: 'portrait' | 'landscape' }
    html2canvas?: { scale?: number; useCORS?: boolean }
  }

  type Html2PdfWorker = {
    set: (options: Html2PdfOptions) => Html2PdfWorker
    from: (source: HTMLElement | string) => Html2PdfWorker
    save: () => Promise<void>
  }

  export default function html2pdf(): Html2PdfWorker
}
