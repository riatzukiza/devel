/**
 * PDF to Image Conversion Utility
 * 
 * Converts PDF documents to images using pdf-to-img package.
 * Each page becomes a separate image buffer.
 */

import { pdf } from 'pdf-to-img';

export interface PdfPageImage {
  pageNumber: number;
  imageBuffer: Buffer;
  format: string;
}

export interface PdfDocument {
  length: number;
  metadata: {
    Title?: string;
    Author?: string;
    Producer?: string;
    Creator?: string;
    CreationDate?: string;
    ModDate?: string;
  };
  getPage(pageNumber: number): Promise<Buffer>;
}

/**
 * Convert PDF buffer to array of images (one per page)
 */
export async function convertPdfToImages(
  pdfBuffer: Buffer,
  options?: {
    scale?: number;  // Scale factor for rendering (default: 1.0)
    format?: 'png' | 'jpeg' | 'webp';
  }
): Promise<PdfPageImage[]> {
  console.log(`[PDF] Converting PDF buffer (${pdfBuffer.length} bytes)`);
  
  const startTime = Date.now();
  const images: PdfPageImage[] = [];
  
  try {
    // Initialize PDF with the buffer
    const doc = await pdf(pdfBuffer, {
      scale: options?.scale ?? 1.0,
    });
    
    console.log(`[PDF] Document has ${doc.length} page(s)`);
    
    // Iterate through all pages
    for (let pageNumber = 1; pageNumber <= doc.length; pageNumber++) {
      const imageBuffer = await doc.getPage(pageNumber);
      
      console.log(`[PDF] Page ${pageNumber}: ${imageBuffer.length} bytes`);
      
      images.push({
        pageNumber,
        imageBuffer,
        format: options?.format ?? 'png'
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`[PDF] Conversion complete: ${images.length} pages in ${duration}ms`);
    
    return images;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[PDF] Conversion failed: ${errorMsg}`);
    throw new Error(`PDF to image conversion failed: ${errorMsg}`);
  }
}

/**
 * Convert PDF from URL to images
 * Fetches the PDF first, then converts
 */
export async function convertPdfUrlToImages(
  url: string,
  options?: {
    scale?: number;
    format?: 'png' | 'jpeg' | 'webp';
  }
): Promise<PdfPageImage[]> {
  console.log(`[PDF] Fetching PDF from URL: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return convertPdfToImages(buffer, options);
}

/**
 * Convert first page of PDF to a single image
 * Useful for thumbnails or previews
 */
export async function convertPdfToSingleImage(
  pdfBuffer: Buffer,
  options?: {
    scale?: number;
    format?: 'png' | 'jpeg' | 'webp';
  }
): Promise<PdfPageImage | null> {
  const images = await convertPdfToImages(pdfBuffer, options);
  
  if (images.length === 0) {
    console.log(`[PDF] No pages found in PDF`);
    return null;
  }
  
  // Return the first page
  return images[0];
}

/**
 * Get PDF page count without converting to images
 */
export async function getPdfPageCount(pdfBuffer: Buffer): Promise<number> {
  console.log(`[PDF] Counting pages in PDF (${pdfBuffer.length} bytes)`);
  
  try {
    const doc = await pdf(pdfBuffer);
    console.log(`[PDF] Page count: ${doc.length}`);
    return doc.length;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[PDF] Failed to count pages: ${errorMsg}`);
    throw error;
  }
}
