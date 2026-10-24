import * as pdfjsLib from 'pdfjs-dist'
import type { DocumentPage } from '../types/schema'

// Set worker source in browser environments
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    // In Vite, importing with ?url gives the hashed asset URL
    // Fallback gracefully to unpkg/cdnjs if asset bundling fails in certain test runners
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
  } catch {
    // Fallback for test runners or environments where import.meta.url resolution differs
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  }
}

export interface ExtractionProgress {
  stage: 'validating' | 'loading' | 'extracting_pages' | 'indexing' | 'completed' | 'failed'
  message: string
  currentPage?: number
  totalPages?: number
  percent?: number
}

export interface PdfExtractionResult {
  fileName: string
  fileSizeBytes: number
  pageCount: number
  pages: DocumentPage[]
  isLikelyScanned: boolean
  scannedPageCount: number
  hasWarnings: boolean
  warnings: string[]
}

export const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024 // 30 MB

/**
 * Validates a user-supplied file before processing.
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided.' }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 30 MB to prevent browser memory exhaustion.`
    }
  }

  const isPdfType = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdfType) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a standard PDF document (.pdf).'
    }
  }

  return { valid: true }
}

/**
 * Extracts text page-by-page from a PDF file or ArrayBuffer.
 */
export async function extractPdfDocument(
  source: File | ArrayBuffer,
  fileName = 'document.pdf',
  onProgress?: (p: ExtractionProgress) => void
): Promise<PdfExtractionResult> {
  let fileSizeBytes = 0
  let arrayBuffer: ArrayBuffer

  if (source instanceof File) {
    fileSizeBytes = source.size
    const validation = validatePdfFile(source)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    onProgress?.({ stage: 'loading', message: 'Reading document bytes into memory...', percent: 10 })
    arrayBuffer = await source.arrayBuffer()
  } else {
    arrayBuffer = source
    fileSizeBytes = source.byteLength
  }

  onProgress?.({ stage: 'loading', message: 'Parsing PDF document structure...', percent: 25 })

  let pdfDoc: pdfjsLib.PDFDocumentProxy
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true
    })
    pdfDoc = await loadingTask.promise
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    if (errorMsg.toLowerCase().includes('password') || (err as { name?: string }).name === 'PasswordException') {
      throw new Error('This PDF is password-protected or encrypted. Please remove password encryption before analyzing.')
    }
    throw new Error(`Unable to read PDF: ${errorMsg}`)
  }

  const totalPages = pdfDoc.numPages
  if (totalPages === 0) {
    throw new Error('The PDF document contains 0 pages.')
  }

  onProgress?.({
    stage: 'extracting_pages',
    message: `Extracting text from ${totalPages} page(s)...`,
    currentPage: 0,
    totalPages,
    percent: 30
  })

  const pages: DocumentPage[] = []
  let scannedPageCount = 0
  const warnings: string[] = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Reconstruct lines and text from items
    const textItems: string[] = []
    let lastY: number | null = null

    for (const item of textContent.items) {
      if ('str' in item) {
        // If Y-position changes significantly, insert a line break
        const currentY = item.transform ? item.transform[5] : null
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 8) {
          textItems.push('\n')
        }
        textItems.push(item.str)
        lastY = currentY
      }
    }

    const rawPageText = textItems.join(' ').replace(/\n +/g, '\n').replace(/ +/g, ' ').trim()
    const charCount = rawPageText.replace(/\s/g, '').length

    // Scanned / empty page detection heuristic:
    // A page with fewer than 25 alphanumeric characters is likely scanned or image-only
    const isLikelyScanned = charCount < 25
    let pageWarning: string | undefined

    if (isLikelyScanned) {
      scannedPageCount++
      pageWarning = charCount === 0
        ? 'No extractable text found on this page. May contain only images or scanned raster content.'
        : 'Very low character count. This page may be an image or scanned notice requiring OCR.'
    }

    pages.push({
      pageNumber: pageNum,
      text: rawPageText,
      characterCount: charCount,
      hasImages: isLikelyScanned,
      isLikelyScanned,
      warning: pageWarning
    })

    const progressPct = 30 + Math.round((pageNum / totalPages) * 55)
    onProgress?.({
      stage: 'extracting_pages',
      message: `Extracted page ${pageNum} of ${totalPages}...`,
      currentPage: pageNum,
      totalPages,
      percent: progressPct
    })
  }

  // Document-level scanned estimation: if over 60% of pages are empty/scanned
  const isDocumentLikelyScanned = totalPages > 0 && scannedPageCount / totalPages >= 0.6

  if (isDocumentLikelyScanned) {
    warnings.push(
      `Scanned document alert: ${scannedPageCount} of ${totalPages} page(s) lack extractable text. PaperCuts cannot analyze image-only pages without an OCR step.`
    )
  } else if (scannedPageCount > 0) {
    warnings.push(
      `Notice: ${scannedPageCount} page(s) have very little or no extractable text and may be images.`
    )
  }

  onProgress?.({
    stage: 'completed',
    message: 'PDF extraction complete.',
    currentPage: totalPages,
    totalPages,
    percent: 100
  })

  return {
    fileName,
    fileSizeBytes,
    pageCount: totalPages,
    pages,
    isLikelyScanned: isDocumentLikelyScanned,
    scannedPageCount,
    hasWarnings: warnings.length > 0,
    warnings
  }
}
