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
  request_id: string
  code: number
  message: string
  valid: number
  invalid: number
  duplicates: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { 
      recipients, 
      message
    } = body

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
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
    const formattedRecipients = recipients.map((recipient: any, index: number) => ({
      dest_addr: recipient.phone.replace(/^\+/, ''), // Remove leading + if present
      recipient_id: index + 1 // Use numeric ID starting from 1
    }))

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

    const responseData: BeemSMSResponse = await beemResponse.json()

    console.log('Beem API Response:', responseData)

    if (!beemResponse.ok) {
      console.error('Beem API Error:', responseData)
      return NextResponse.json(
        { 
          error: 'Failed to send SMS',
          details: responseData.message || 'Unknown error from SMS provider',
          code: responseData.code
        },
        { status: beemResponse.status }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      request_id: responseData.request_id,
      sent_count: responseData.valid,
      failed_count: responseData.invalid + responseData.duplicates,
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