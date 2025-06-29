import { NextRequest, NextResponse } from 'next/server'

interface SMSRecipient {
  dest_addr: string
  recipient_id: number
}

interface SMSRequestBody {
  source_addr: string
  message: string
  recipients: SMSRecipient[]
  encoding?: number
  schedule_time?: string
}

interface BeemSMSResponse {
  request_id?: string
  code?: number
  message?: string
  valid?: number
  invalid?: number
  duplicates?: number
  data?: {
    code: number
    message: string
  }
}

export async function GET() {
  // Test endpoint to check SMS configuration
  const apiKey = process.env.BEEM_API_KEY
  const secretKey = process.env.BEEM_SECRET_KEY
  const sourceAddr = process.env.BEEM_SMS_SOURCE_ADDR

  return NextResponse.json({
    configured: !!(apiKey && secretKey && sourceAddr),
    hasApiKey: !!apiKey,
    hasSecretKey: !!secretKey,
    hasSourceAddr: !!sourceAddr,
    sourceAddr: sourceAddr || 'Not configured'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Received SMS request body:', JSON.stringify(body, null, 2))
    
    const { 
      recipients, 
      message
    } = body

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      console.error('Invalid recipients:', recipients)
      return NextResponse.json(
        { error: 'Recipients array is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (!message || message.trim().length === 0) {
      console.error('Invalid message:', message)
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Validate each recipient has required fields
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]
      if (!recipient.phone || typeof recipient.phone !== 'string') {
        console.error(`Invalid recipient at index ${i}:`, recipient)
        return NextResponse.json(
          { error: `Recipient at index ${i} must have a valid phone number` },
          { status: 400 }
        )
      }
      
      // Validate phone number format (should be a valid phone number)
      const phoneNumber = recipient.phone.replace(/^\+/, '')
      if (!/^\d{9,15}$/.test(phoneNumber)) {
        console.error(`Invalid phone number format at index ${i}:`, recipient.phone)
        return NextResponse.json(
          { error: `Recipient at index ${i} must have a valid phone number format` },
          { status: 400 }
        )
      }
    }

    // Validate environment variables
    const apiKey = process.env.BEEM_API_KEY
    const secretKey = process.env.BEEM_SECRET_KEY
    const sourceAddr = process.env.BEEM_SMS_SOURCE_ADDR

    if (!apiKey || !secretKey || !sourceAddr) {
      console.error('Missing Beem.africa credentials:', {
        hasApiKey: !!apiKey,
        hasSecretKey: !!secretKey,
        hasSourceAddr: !!sourceAddr
      })
      return NextResponse.json(
        { error: 'SMS service configuration error' },
        { status: 500 }
      )
    }

    // Format recipients for Beem API
    const formattedRecipients = recipients.map((recipient: any, index: number) => {
      const phoneNumber = recipient.phone.replace(/^\+/, '') // Remove leading + if present
      console.log(`Formatting recipient ${index + 1}:`, {
        original: recipient.phone,
        formatted: phoneNumber,
        recipient_id: index + 1
      })
      return {
        dest_addr: phoneNumber,
        recipient_id: index + 1 // Use numeric ID starting from 1
      }
    })

    console.log('Formatted recipients:', JSON.stringify(formattedRecipients, null, 2))

    // Prepare SMS request payload
    const smsPayload: SMSRequestBody = {
      source_addr: sourceAddr,
      message: message.trim(),
      recipients: formattedRecipients,
      encoding: 1, // Enable Unicode encoding for emoji support
      schedule_time: "" // Empty for immediate sending
    }

    console.log('Sending SMS with payload:', JSON.stringify(smsPayload, null, 2))

    // Send SMS via Beem.africa API with correct Basic Auth
    const beemResponse = await fetch('https://apisms.beem.africa/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`
      },
      body: JSON.stringify(smsPayload)
    })

    console.log('Beem API response status:', beemResponse.status)
    console.log('Beem API response headers:', Object.fromEntries(beemResponse.headers.entries()))

    let responseData: BeemSMSResponse
    try {
      responseData = await beemResponse.json()
      console.log('Beem API Response:', responseData)
    } catch (parseError) {
      console.error('Failed to parse Beem API response:', parseError)
      const responseText = await beemResponse.text()
      console.error('Raw response text:', responseText)
      return NextResponse.json(
        { 
          error: 'Failed to parse SMS provider response',
          details: 'Invalid JSON response from SMS provider',
          rawResponse: responseText
        },
        { status: 500 }
      )
    }

    if (!beemResponse.ok) {
      console.error('Beem API Error:', responseData)
      console.error('Beem API Status:', beemResponse.status)
      console.error('Beem API Status Text:', beemResponse.statusText)
      
      // Handle specific Beem API errors
      let errorMessage = 'Failed to send SMS'
      let errorDetails = responseData.message || 'Unknown error from SMS provider'
      
      if (responseData.data?.code === 111) {
        errorMessage = 'SMS configuration error'
        errorDetails = 'Invalid Sender ID. Please contact your SMS provider to register and approve the sender ID.'
      } else if (responseData.data?.code === 110) {
        errorMessage = 'SMS configuration error'
        errorDetails = 'Invalid API credentials. Please check your SMS provider configuration.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          code: responseData.data?.code,
          status: beemResponse.status,
          statusText: beemResponse.statusText,
          fullResponse: responseData
        },
        { status: beemResponse.status }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      request_id: responseData.request_id,
      sent_count: responseData.valid || 0,
      failed_count: (responseData.invalid || 0) + (responseData.duplicates || 0),
      message: 'SMS sent successfully'
    })

  } catch (error) {
    console.error('SMS API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error while sending SMS' },
      { status: 500 }
    )
  }
} 