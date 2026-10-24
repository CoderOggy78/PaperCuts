import { describe, it, expect } from 'vitest'
import { validatePdfFile, MAX_FILE_SIZE_BYTES } from '../lib/pdfExtractor'

describe('PDF Extractor & Validation Rules', () => {
  it('validates genuine PDF files within allowed size', () => {
    const validFile = new File(['%PDF-1.4 sample content'], 'notice.pdf', {
      type: 'application/pdf'
    })
    const res = validatePdfFile(validFile)
    expect(res.valid).toBe(true)
  })

  it('rejects files larger than the safety limit (30MB)', () => {
    // Mock oversized file
    const oversizedFile = {
      name: 'large_document.pdf',
      size: MAX_FILE_SIZE_BYTES + 1024,
      type: 'application/pdf'
    } as File

    const res = validatePdfFile(oversizedFile)
    expect(res.valid).toBe(false)
    expect(res.error).toContain('too large')
  })

  it('rejects non-PDF files', () => {
    const textFile = new File(['hello'], 'document.txt', {
      type: 'text/plain'
    })
    const res = validatePdfFile(textFile)
    expect(res.valid).toBe(false)
    expect(res.error).toContain('Unsupported file type')
  })
})
