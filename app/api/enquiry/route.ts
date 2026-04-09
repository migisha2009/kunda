import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { vendorEmail, vendorName, coupleName, coupleEmail, message } = await request.json()

    if (!vendorEmail || !vendorName || !coupleName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send email to vendor
    const emailResult = await resend.emails.send({
      from: 'noreply@kunda.com',
      to: vendorEmail,
      subject: `New Wedding Enquiry from ${coupleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #b08850 0%, #7a5c30 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Kunda</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">New Wedding Enquiry</p>
          </div>
          
          <div style="background: #fdf9f5; padding: 30px; border-radius: 8px;">
            <h2 style="color: #3a2a1a; margin-top: 0;">You have a new enquiry!</h2>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${coupleName}</p>
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${coupleEmail || 'Not provided'}</p>
              <p style="margin: 0;"><strong>Message:</strong></p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 10px;">
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Log in to your Kunda dashboard to respond to this enquiry.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>This email was sent from Kunda Wedding Planning Platform</p>
          </div>
        </div>
      `
    })

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, messageId: emailResult.data?.id })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
