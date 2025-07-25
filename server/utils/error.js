import { setResponseStatus, setResponseHeader } from 'h3'

export const createCustomError = ({ statusCode = 500, statusMessage = 'Internal Server Error' }) => {
  const error = new Error(statusMessage)
  error.statusCode = statusCode
  error.statusMessage = statusMessage
  return error
}

export const handleError = (event, error) => {
  console.error('API Error:', error)
  const statusCode = error.statusCode || 500
  const statusMessage = error.statusMessage || error.message || 'Internal Server Error'
  
  // Set HTTP status code using h3 utility
  setResponseStatus(event, statusCode, statusMessage)
  
  // Ensure we're sending JSON
  setResponseHeader(event, 'Content-Type', 'application/json')
  
  // Return a properly formatted error response
  return {
    success: false,
    statusCode,
    message: statusMessage
  }
} 