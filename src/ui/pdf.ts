import jsPDF from 'jspdf'
export function exportPdf({ answers: _answers, result }: { answers: any; result: any }) {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('EUCertify – Results', 14, 16)
  doc.setFontSize(11)
  doc.text('Tags: ' + result.tags.join(', '), 14, 26)
  doc.text('Directives: ' + result.applies.filter((x:any)=>x.type==='Directive').map((x:any)=>x.id).join(', '), 14, 36)
  doc.text('Regulations: ' + result.applies.filter((x:any)=>x.type==='Regulation').map((x:any)=>x.id).join(', '), 14, 46)
  doc.text('Horizontal: ' + result.applies.filter((x:any)=>x.type==='Horizontal').map((x:any)=>x.id).join(', '), 14, 56)
  doc.text('EPR: ' + result.applies.filter((x:any)=>x.type==='EPR').map((x:any)=>x.id).join(', '), 14, 66)
  doc.addPage()
  doc.text('Risk Assessment Scaffold', 14, 16)
  ;['Mechanical','Electrical','Thermal','Chemical','EMC','Foreseeable Misuse'].forEach((h,i)=>doc.text(`□ ${h}:`,14,28+i*10))
  doc.save('EUCertify.pdf')
}
