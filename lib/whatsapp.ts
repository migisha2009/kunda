import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export const sendWhatsApp = async (
  to: string,
  message: string
) => {
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: message
    })
    console.log('WhatsApp sent to:', to)
  } catch (error) {
    console.error('WhatsApp error:', error)
  }
}

export const messages = {
  newEnquiry: (coupleName: string, message: string) =>
    `*New Enquiry on Kunda*\n\n` +
    `*From:* ${coupleName}\n` +
    `*Message:* ${message}\n\n` +
    `Reply on Kunda: https://kunda-kappa.vercel.app/dashboard/vendor/bookings`,

  bookingConfirmed: (vendorName: string, date: string) =>
    `*Booking Confirmed on Kunda*\n\n` +
    `*Vendor:* ${vendorName}\n` +
    `*Wedding Date:* ${date}\n\n` +
    `View booking: https://kunda-kappa.vercel.app/dashboard/couple/bookings`,

  bookingRequest: (coupleName: string, weddingDate: string, amount: string) =>
    `*New Booking Request on Kunda*\n\n` +
    `*Couple:* ${coupleName}\n` +
    `*Wedding Date:* ${weddingDate}\n` +
    `*Amount:* ${amount}\n\n` +
    `Confirm or decline: https://kunda-kappa.vercel.app/dashboard/vendor/bookings`,

  paymentReceived: (amount: string, currency: string) =>
    `*Payment Received on Kunda*\n\n` +
    `*Amount:* ${currency} ${amount}\n\n` +
    `View details: https://kunda-kappa.vercel.app/dashboard/vendor/bookings`,

  guestInvite: (coupleName: string, weddingDate: string, inviteLink: string) =>
    `*You are invited!*\n\n` +
    `*${coupleName}* invite you to their wedding\n` +
    `*Date:* ${weddingDate}\n\n` +
    `View your invitation: ${inviteLink}`,
}
