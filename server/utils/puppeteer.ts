import puppeteer from 'puppeteer'

export const createPuppeteerBrowser = async () => {
  const isDev = process.env.NODE_ENV === 'development'
  
  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  }

  // Add additional args for production environments
  if (!isDev) {
    launchOptions.args.push(
      '--single-process',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    )
  }

  try {
    return await puppeteer.launch(launchOptions)
  } catch (error: any) {
    console.error('Failed to launch Puppeteer:', error?.message)
    throw new Error(`Puppeteer launch failed: ${error?.message}`)
  }
}

export const generateEventDocumentPDF = async (documentUrl: string) => {
  let browser = null
  
  try {
    browser = await createPuppeteerBrowser()
    
    const page = await browser.newPage()
    
    // Set viewport for A4 document rendering
    await page.setViewport({
      width: 794,  // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 1
    })

    // Navigate to the document page
    await page.goto(documentUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    // Wait a bit for Vue.js to render
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Try to wait for either the document content or check if there's an error
    let contentFound = false
    try {
      // Try multiple selectors
      await Promise.race([
        page.waitForSelector('[data-document-content]', { timeout: 5000 }),
        page.waitForSelector('[data-document-ready]', { timeout: 5000 }),
        page.waitForSelector('.document-container', { timeout: 5000 })
      ])
      contentFound = true
    } catch (selectorError) {
      // Check what's actually on the page
      const pageContent = await page.content()
      
      // Check if there's an error message or loading state
      const hasError = await page.$('.text-red-600')
      const hasLoading = await page.$('.animate-spin')
      
      if (hasError) {
        const errorText = await page.$eval('.text-red-600', el => el.textContent)
        throw new Error(`Document page shows error: ${errorText}`)
      }
      
      if (hasLoading) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // Try again after waiting
        try {
          await Promise.race([
            page.waitForSelector('[data-document-content]', { timeout: 5000 }),
            page.waitForSelector('[data-document-ready]', { timeout: 5000 }),
            page.waitForSelector('.document-container', { timeout: 5000 })
          ])
          contentFound = true
        } catch (finalError) {
          contentFound = false
        }
      } else {
        // If no loading indicator and no error, the page might be ready but missing the selector
        contentFound = false
      }
    }

    // Additional check: ensure we have some meaningful content
    if (!contentFound) {
      const bodyText = await page.$eval('body', el => el.textContent || '')
      if (bodyText.length < 100) {
        throw new Error('Document page appears to be empty or not properly loaded')
      }
    }

    // Add print-specific styles
    await page.addStyleTag({
      content: `
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .document-container { 
            width: 100%; 
            height: 100vh; 
            margin: 0; 
            padding: 0;
          }
        }
      `
    })

    // Generate PDF with exact A4 dimensions
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      },
      preferCSSPageSize: true
    })
    return pdfBuffer
  } catch (error: any) {
    console.error('PDF generation failed:', {
      message: error?.message,
      stack: error?.stack,
      url: documentUrl
    })
    throw new Error(`PDF generation failed: ${error?.message}`)
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch (closeError: any) {
        console.error('Error closing browser:', closeError?.message)
      }
    }
  }
} 