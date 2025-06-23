
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types';
import { sanitizeFilename } from './utils';

export const downloadInvoiceAsPDF = async (invoice: Invoice, elementId: string): Promise<void> => {
  const invoiceContentElement = document.getElementById(elementId);

  if (!invoiceContentElement) {
    console.error(`Element with id "${elementId}" not found.`);
    alert('Error generating PDF: Content element not found.');
    return;
  }
  
  // Temporarily make the element visible if it's styled to be off-screen for PDF generation
  // This is often done by giving it a specific class for PDF styling
  // For this example, we assume elementId is directly the content to be captured.
  
  try {
    const canvas = await html2canvas(invoiceContentElement, {
      scale: 2, // Improves quality
      useCORS: true, // If images are from other domains
      logging: false, 
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    
    let imgWidth = pdfWidth;
    let imgHeight = pdfWidth / ratio;

    // If image height is greater than PDF height, scale down further
    if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = imgHeight * ratio;
    }
    
    // Centering the image if it's smaller than the page
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;


    pdf.addImage(imgData, 'PNG', x > 0 ? x : 0, y > 0 ? y : 0, imgWidth, imgHeight);
    
    const clientNameSanitized = sanitizeFilename(invoice.clientDetails.name);
    const filename = `Invoice-${invoice.invoiceNumber}-${clientNameSanitized}.pdf`;
    
    pdf.save(filename);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('An error occurred while generating the PDF. Please try again.');
  }
};
