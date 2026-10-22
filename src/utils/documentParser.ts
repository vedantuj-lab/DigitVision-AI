import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker to use unpkg or disable worker for direct canvas rendering
if (typeof window !== 'undefined' && pdfjsLib) {
  // Use standard worker source or fallback
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface ExtractedMedia {
  id: string;
  name: string;
  type: 'image' | 'pdf_page' | 'docx_embedded' | 'pptx_slide' | 'sheet_media' | 'csv_matrix';
  dataUrl: string;
  sourceDocument: string;
  dimensions?: { width: number; height: number };
}

/**
 * Universal file parser supporting:
 * - All images: PNG, JPG, JPEG, WEBP, GIF, SVG, BMP, TIFF, ICO
 * - PDFs: .pdf (renders each page onto canvas)
 * - Microsoft Word: .docx, .doc (extracts embedded images from word/media/)
 * - Microsoft PowerPoint: .pptx, .ppt (extracts slide graphics from ppt/media/)
 * - Microsoft Excel: .xlsx, .xls, .csv (extracts embedded graphics from xl/media/ or parses CSV pixel arrays)
 */
export async function parseDocumentOrImage(file: File): Promise<ExtractedMedia[]> {
  const fileName = file.name.toLowerCase();
  const fileExt = fileName.substring(fileName.lastIndexOf('.'));

  // 1. All Image Formats
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.ico', '.tiff', '.tif', '.avif'];
  if (imageExtensions.includes(fileExt) || file.type.startsWith('image/')) {
    const dataUrl = await readFileAsDataUrl(file);
    return [
      {
        id: `img_${Date.now()}`,
        name: file.name,
        type: 'image',
        dataUrl,
        sourceDocument: file.name
      }
    ];
  }

  // 2. PDF Documents
  if (fileExt === '.pdf' || file.type === 'application/pdf') {
    return await parsePdfFile(file);
  }

  // 3. Word Documents (.docx)
  if (fileExt === '.docx' || fileName.endsWith('.docx')) {
    return await parseDocxFile(file);
  }

  // 4. PowerPoint (.pptx)
  if (fileExt === '.pptx' || fileName.endsWith('.pptx')) {
    return await parsePptxFile(file);
  }

  // 5. Excel (.xlsx, .csv)
  if (fileExt === '.xlsx' || fileExt === '.csv' || fileName.endsWith('.xlsx')) {
    return await parseExcelOrCsvFile(file);
  }

  // Fallback: try reading as image or zip
  try {
    const zip = await JSZip.loadAsync(file);
    const media = await extractImagesFromZip(zip, file.name);
    if (media.length > 0) return media;
  } catch (e) {
    // Not a zip
  }

  throw new Error(`Unsupported document format: ${file.name}. Please upload an image, PDF, Word, PowerPoint, or Excel document.`);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read binary data.'));
    reader.readAsArrayBuffer(file);
  });
}

async function parsePdfFile(file: File): Promise<ExtractedMedia[]> {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = Math.min(pdf.numPages, 10); // Extract up to first 10 pages for speed
    const pages: ExtractedMedia[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 }); // High resolution scale

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await (page.render as any)({
        canvasContext: ctx,
        viewport
      }).promise;

      pages.push({
        id: `pdf_page_${pageNum}_${Date.now()}`,
        name: `${file.name} — Page ${pageNum}`,
        type: 'pdf_page',
        dataUrl: canvas.toDataURL('image/png'),
        sourceDocument: file.name,
        dimensions: { width: viewport.width, height: viewport.height }
      });
    }

    if (pages.length === 0) {
      throw new Error('No renderable pages found in PDF.');
    }
    return pages;
  } catch (err: any) {
    console.warn('PDF.js render issue, falling back:', err);
    throw new Error(`Failed to render PDF: ${err.message || 'Corrupt or protected PDF'}`);
  }
}

async function parseDocxFile(file: File): Promise<ExtractedMedia[]> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const zip = await JSZip.loadAsync(arrayBuffer);
  const extracted = await extractImagesFromZip(zip, file.name, 'word/media/');

  if (extracted.length === 0) {
    // If no embedded images found in docx, generate a descriptive placeholder card
    const dataUrl = createDocumentPlaceholder(file.name, 'Word Document (.docx)', 'No embedded digit images found in Word media container.');
    return [{
      id: `docx_placeholder_${Date.now()}`,
      name: `${file.name} (Text Only)`,
      type: 'docx_embedded',
      dataUrl,
      sourceDocument: file.name
    }];
  }
  return extracted;
}

async function parsePptxFile(file: File): Promise<ExtractedMedia[]> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const zip = await JSZip.loadAsync(arrayBuffer);
  const extracted = await extractImagesFromZip(zip, file.name, 'ppt/media/');

  if (extracted.length === 0) {
    const dataUrl = createDocumentPlaceholder(file.name, 'PowerPoint (.pptx)', 'No embedded digit images or slide media found in presentation.');
    return [{
      id: `pptx_placeholder_${Date.now()}`,
      name: `${file.name} (Slide Text)`,
      type: 'pptx_slide',
      dataUrl,
      sourceDocument: file.name
    }];
  }
  return extracted;
}

async function parseExcelOrCsvFile(file: File): Promise<ExtractedMedia[]> {
  const fileName = file.name.toLowerCase();

  // Handle CSV file with 784 pixel intensities or numeric tables
  if (fileName.endsWith('.csv')) {
    const text = await file.text();
    const rows = text.trim().split('\n');
    const firstRowValues = rows[0].split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));

    if (firstRowValues.length === 784 || firstRowValues.length === 785) {
      // It's a standard MNIST CSV row (28x28 pixels)!
      const pixelValues = firstRowValues.length === 785 ? firstRowValues.slice(1) : firstRowValues;
      const canvas = document.createElement('canvas');
      canvas.width = 28;
      canvas.height = 28;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imgData = ctx.createImageData(28, 28);
        for (let i = 0; i < 784; i++) {
          const val = Math.min(255, Math.max(0, Math.round(pixelValues[i])));
          imgData.data[i * 4] = val;
          imgData.data[i * 4 + 1] = val;
          imgData.data[i * 4 + 2] = val;
          imgData.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        return [{
          id: `csv_mnist_${Date.now()}`,
          name: `${file.name} (MNIST CSV Row 1)`,
          type: 'csv_matrix',
          dataUrl: canvas.toDataURL('image/png'),
          sourceDocument: file.name
        }];
      }
    }
  }

  // Handle XLSX Zip archive
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const zip = await JSZip.loadAsync(arrayBuffer);
    const extracted = await extractImagesFromZip(zip, file.name, 'xl/media/');
    if (extracted.length > 0) return extracted;
  } catch (e) {
    // Not a valid zip
  }

  const dataUrl = createDocumentPlaceholder(file.name, 'Spreadsheet (.xlsx)', 'Upload an Excel workbook with embedded handwritten scan images.');
  return [{
    id: `xlsx_placeholder_${Date.now()}`,
    name: `${file.name}`,
    type: 'sheet_media',
    dataUrl,
    sourceDocument: file.name
  }];
}

async function extractImagesFromZip(zip: JSZip, sourceDocName: string, pathPrefix?: string): Promise<ExtractedMedia[]> {
  const mediaList: ExtractedMedia[] = [];
  const imageRegex = /\.(png|jpe?g|webp|gif|bmp|tiff)$/i;

  const entries: Array<{ name: string; file: JSZip.JSZipObject }> = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && imageRegex.test(relativePath)) {
      if (!pathPrefix || relativePath.startsWith(pathPrefix)) {
        entries.push({ name: relativePath, file: zipEntry });
      }
    }
  });

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const blob = await entry.file.async('blob');
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    const shortName = entry.name.split('/').pop() || `Media ${i + 1}`;
    mediaList.push({
      id: `zip_media_${i}_${Date.now()}`,
      name: `${sourceDocName} → ${shortName}`,
      type: entry.name.includes('ppt') ? 'pptx_slide' : entry.name.includes('word') ? 'docx_embedded' : 'sheet_media',
      dataUrl,
      sourceDocument: sourceDocName
    });
  }

  return mediaList;
}

function createDocumentPlaceholder(title: string, format: string, note: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#0f111a';
  ctx.fillRect(0, 0, 300, 300);

  ctx.fillStyle = '#1e2235';
  ctx.roundRect(15, 15, 270, 270, 16);
  ctx.fill();

  ctx.fillStyle = '#a3e635';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(format, 30, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(title.length > 25 ? title.substring(0, 22) + '...' : title, 30, 95);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText(note, 30, 140, 240);

  return canvas.toDataURL('image/png');
}
