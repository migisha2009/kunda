import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sendWhatsApp, messages } from '@/lib/whatsapp'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const {
      guestId,
      guestName,
      guestEmail,
      guestPhone,
      inviteToken,
      coupleName,
      weddingDate,
      weddingVenue
    } = await request.json()

    if (!guestId || !guestName || !guestEmail || !inviteToken || !coupleName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kunda-kappa.vercel.app'
    const inviteLink = `${baseUrl}/guest/${inviteToken}`

    const formattedDate = weddingDate 
      ? new Date(weddingDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Date to be announced'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited!</title>
        <style>
          body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #3a2a1a;
            background-color: #fdf9f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #7a5c30 0%, #b08850 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
            letter-spacing: 2px;
          }
          .content {
            padding: 40px 30px;
          }
          .couple-name {
            font-size: 1.8em;
            color: #7a5c30;
            margin-bottom: 20px;
            text-align: center;
            font-style: italic;
          }
          .invitation-text {
            font-size: 1.1em;
            margin-bottom: 30px;
            text-align: center;
          }
          .details {
            background-color: #fdf9f5;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #b08850;
          }
          .detail-item {
            margin-bottom: 15px;
          }
          .detail-label {
            font-weight: bold;
            color: #7a5c30;
            margin-bottom: 5px;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #7a5c30 0%, #b08850 100%);
            color: white;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 50px;
            font-size: 1.1em;
            text-align: center;
            margin: 30px auto;
            display: block;
            width: fit-content;
            transition: transform 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .footer {
            background-color: #fdf9f5;
            padding: 30px;
            text-align: center;
            color: #3a2a1a;
            opacity: 0.8;
            font-size: 0.9em;
          }
          .ornament {
            text-align: center;
            font-size: 2em;
            color: #b08850;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited!</h1>
          </div>
          
          <div class="content">
            <div class="ornament">✨</div>
            
            <div class="couple-name">
              ${coupleName}
            </div>
            
            <div class="invitation-text">
              Dear ${guestName},<br><br>
              We would be honored by your presence as we celebrate our special day. 
              Your friendship and love mean the world to us, and we can't wait to share 
              this joyous occasion with you.
            </div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">📅 Date</div>
                <div>${formattedDate}</div>
              </div>
              ${weddingVenue ? `
              <div class="detail-item">
                <div class="detail-label">📍 Venue</div>
                <div>${weddingVenue}</div>
              </div>
              ` : ''}
            </div>
            
            <a href="${inviteLink}" class="cta-button">
              View Your Personal Invitation
            </a>
            
            <div class="ornament">💍</div>
          </div>
          
          <div class="footer">
            <p>This invitation is personal and unique to you. Please do not share this link.</p>
            <p>For any questions, please don't hesitate to reach out to the couple.</p>
            <p>With love and anticipation,<br>${coupleName}</p>
          </div>
        </div>
      </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: 'Kunda Weddings <onboarding@resend.dev>',
      to: [guestEmail],
      subject: `You're Invited to ${coupleName}'s Wedding!`,
      html: htmlContent
    })

    if (error) {
      console.error('Resend error full object:', 
        JSON.stringify(error))
      return NextResponse.json(
        { error: error.message || 'Failed to send email',
          details: JSON.stringify(error) },
        { status: 500 }
      )
    }

    // Send WhatsApp notification if guest has phone number
    if (guestPhone) {
      try {
        await sendWhatsApp(
          guestPhone,
          messages.guestInvite(
            coupleName, 
            formattedDate === 'Date to be announced' ? 'Date to be announced' : weddingDate,
            inviteLink
          )
        )
      } catch (whatsappError) {
        console.error('WhatsApp notification failed:', whatsappError)
        // Don't fail the request if WhatsApp fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      inviteLink 
    })

  } catch (error: any) {
    console.error('Invite catch error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
