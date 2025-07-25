import { generateEventDocumentPDF } from '~/server/utils/puppeteer'

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'id')
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Fetch event data to get the event name for filename
    const eventResponse = await fetch(`http://localhost:3000/api/events/${eventId}`)
    const eventData = await eventResponse.json()
    
    if (!eventData.success) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    const currentEvent = eventData.event

    // Get the base URL for the current request
    const headers = getHeaders(event)
    const protocol = headers['x-forwarded-proto'] || 'http'
    const host = headers.host
    const baseUrl = `${protocol}://${host}`
    
    // Generate the document URL (using the API endpoint that returns HTML)
    const documentUrl = `${baseUrl}/api/events/${eventId}/document`
    

    
    // Generate PDF using the utility function
    const pdfBuffer = await generateEventDocumentPDF(documentUrl)



    // Clean event name for filename (remove special characters and spaces)
    const cleanEventName = currentEvent.name
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 50) // Limit length to 50 characters

    // Generate filename with event name
    const filename = `Cerere-Aprobare-${cleanEventName}.pdf`

    // Set response headers for PDF download
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    setHeader(event, 'Content-Length', pdfBuffer.length)

    return pdfBuffer
  } catch (error: any) {
    console.error('PDF generation error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      eventId: getRouterParam(event, 'id')
    })
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to generate PDF: ${error?.message || 'Unknown error'}`
    })
  }
}) 