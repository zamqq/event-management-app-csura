export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'id')
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Get the base URL for the current request
    const headers = getHeaders(event)
    const protocol = headers['x-forwarded-proto'] || 'https'
    const host = headers.host
    const baseUrl = `${protocol}://${host}`
    
    // Fetch event data server-side
    const eventResponse = await fetch(`${baseUrl}/api/events/${eventId}`)
    const eventData = await eventResponse.json()
    
    if (!eventData.success) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    const currentEvent = eventData.event

    // Check if this is a print request
    const query = getQuery(event)
    const isPrintRequest = query.print === 'true'

    // Format date for document
    const formatDocumentDate = (dateString: string) => {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}.${month}.${year}`
    }

    // Format time for document
    const formatDocumentTime = (timeString: string) => {
      if (!timeString) return ''
      return timeString
    }

    // Get current date for document
    const getCurrentDate = () => {
      const today = new Date()
      const day = today.getDate().toString().padStart(2, '0')
      const month = (today.getMonth() + 1).toString().padStart(2, '0')
      const year = today.getFullYear()
      return `${day}.${month}.${year}`
    }

    // Generate resources list
    let resourcesList = ''
    if (currentEvent.resources && currentEvent.resources.length > 0) {
      resourcesList = currentEvent.resources.map((resourceItem: any) => 
        `<li class="text-base">${resourceItem.resource.name} x ${resourceItem.quantity}</li>`
      ).join('')
    } else if (currentEvent.legacyResources && currentEvent.legacyResources.length > 0) {
      resourcesList = currentEvent.legacyResources.map((resource: string) => 
        `<li class="text-base">${resource}</li>`
      ).join('')
    } else {
      resourcesList = '<li class="text-base">Echipamente necesare pentru eveniment</li>'
    }

    // Generate HTML document
    const htmlDocument = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Document Eveniment</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      .no-print {
        display: none !important;
      }
      .document-container {
        width: 210mm;
        min-height: 297mm;
        margin: 0;
        padding: 0;
        background: white;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    .document-container {
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      position: relative;
      width: 210mm;
      min-height: 297mm;
    }
    .content {
      position: relative;
      z-index: 1;
    }
  </style>
</head>
<body>
  ${isPrintRequest ? `
  <div class="no-print bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded mb-4 text-center">
    <p class="font-medium">PDF generarea nu este disponibilă momentan pe server.</p>
    <p>Vă rugăm să folosiți funcția de tipărire a browserului (Ctrl+P sau Cmd+P) pentru a salva documentul ca PDF.</p>
  </div>
  ` : ''}
  <div class="document-container bg-white min-h-screen" data-document-content data-document-ready>
    <div class="content w-full max-w-none mx-auto" style="width: 210mm; min-height: 297mm; padding: 20mm; position: relative;">
      
      <!-- University Header -->
      <div class="text-center mb-16">
        <div class="flex justify-center items-center mb-4">
          <!-- University Logo -->
          <img src="/images/ura-logo-oficial.png" alt="Universitatea Româno-Americană" class="h-20" style="width: auto; max-width: 300px;" />
        </div>
      </div>
      
      <!-- Document Title -->
      <div class="text-center mb-12">
        <h2 class="text-xl font-bold text-gray-900">Domnule Rector,</h2>
      </div>
      
      <!-- Document Body -->
      <div class="space-y-6 text-justify leading-relaxed">
        <p class="text-base">
          Clubul Studenților (CS-URA) organizează în data de 
          <strong>${formatDocumentDate(currentEvent.eventDate)}</strong> 
          evenimentul <strong>„${currentEvent.name}"</strong>.
        </p>
        
        <p class="text-base">
          ${currentEvent.description || `Evenimentul are ca scop organizarea unei proiecții de film, într-un cadru inedit și interesant, cu participarea 
          studenților universității noastre. Această propunere vizează să ofere oportunitatea experiențelor 
          cinematografice într-un mediu neconvențional, oferind participanților posibilitatea de a se relaxa și de a socializa 
          într-un cadru relaxant și stimulativ.`}
        </p>
        
        <p class="text-base">
          Pentru desfășurarea evenimentului, vă rugăm să aprobați următoarele:
        </p>
        
        <!-- Event Details List -->
        <ul class="list-disc list-inside space-y-2 ml-4">
          <li class="text-base">
            Accesul la ${currentEvent.room?.name} în data de ${formatDocumentDate(currentEvent.eventDate)}, 
            în intervalul orar ${formatDocumentTime(currentEvent.startTime)} – ${formatDocumentTime(currentEvent.endTime)};
          </li>
          ${resourcesList}
        </ul>
      </div>
      
      <!-- Signature Section -->
      <div class="mt-16 flex justify-between items-end">
        <div class="text-left">
          <p class="text-base mb-8">${getCurrentDate()}</p>
        </div>
        
        <div class="text-right">
          <p class="text-base mb-2">Vă mulțumesc,</p>
          <div class="mt-12">
            <p class="text-base font-medium mb-2">${currentEvent.organizer?.fullName || 'Organizator'}</p>
            <div class="border-b border-gray-400 w-48 mb-2"></div>
            <p class="text-base">Membru CS-URA</p>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="mt-12 pt-4 border-t border-gray-300">
        <div class="text-center text-xs text-gray-600 space-y-1">
          <p>Bd. Expoziției nr.1B, București 012101 sect. 1, Tel: +004-021-318.35.66</p>
          <p>rectorat@rau.ro | www.rau.ro</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`

    // Set content type to HTML
    setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    
    return htmlDocument
  } catch (error: any) {
    console.error('Document generation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to generate document: ${error?.message}`
    })
  }
}) 