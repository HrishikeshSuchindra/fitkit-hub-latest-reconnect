// Email Templates for Fitkits
// These are HTML email templates for various notifications

export interface BookingEmailData {
  userName: string;
  venueName: string;
  venueAddress: string;
  sport: string;
  slotDate: string;
  slotTime: string;
  duration: number;
  price: number;
  bookingId: string;
}

export interface EventEmailData {
  userName: string;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  location: string;
  eventType: string;
  entryFee: number;
  eventId: string;
}

export interface ReminderEmailData {
  userName: string;
  venueName: string;
  sport: string;
  slotDate: string;
  slotTime: string;
  hoursUntil: number;
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { text-align: center; margin-bottom: 24px; }
  .logo { font-size: 28px; font-weight: bold; color: #10b981; }
  .title { font-size: 24px; font-weight: 600; color: #1f2937; margin: 16px 0 8px; }
  .subtitle { font-size: 16px; color: #6b7280; }
  .details { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
  .detail-row:last-child { border-bottom: none; }
  .label { color: #6b7280; font-size: 14px; }
  .value { color: #1f2937; font-weight: 500; font-size: 14px; }
  .cta { display: block; width: 100%; padding: 14px; background: #10b981; color: white; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
  .footer { text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px; }
  .highlight { color: #10b981; font-weight: 600; }
`;

export function getBookingConfirmationEmail(data: BookingEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed - Fitkits</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🏸 Fitkits</div>
        <h1 class="title">Booking Confirmed!</h1>
        <p class="subtitle">Hi ${data.userName}, your ${data.sport} booking is confirmed</p>
      </div>
      
      <div class="details">
        <div class="detail-row">
          <span class="label">Venue</span>
          <span class="value">${data.venueName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Address</span>
          <span class="value">${data.venueAddress}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date</span>
          <span class="value">${data.slotDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time</span>
          <span class="value">${data.slotTime}</span>
        </div>
        <div class="detail-row">
          <span class="label">Duration</span>
          <span class="value">${data.duration} minutes</span>
        </div>
        <div class="detail-row">
          <span class="label">Amount Paid</span>
          <span class="value highlight">₹${data.price}</span>
        </div>
        <div class="detail-row">
          <span class="label">Booking ID</span>
          <span class="value">${data.bookingId.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>
      
      <a href="https://fitkits.app/bookings/${data.bookingId}" class="cta">View Booking Details</a>
      
      <div class="footer">
        <p>Need help? Contact us at support@fitkits.app</p>
        <p>© ${new Date().getFullYear()} Fitkits. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function getBookingReminderEmail(data: ReminderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Reminder - Fitkits</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🏸 Fitkits</div>
        <h1 class="title">Game Time Tomorrow!</h1>
        <p class="subtitle">Hi ${data.userName}, just a reminder about your upcoming booking</p>
      </div>
      
      <div class="details">
        <div class="detail-row">
          <span class="label">Sport</span>
          <span class="value">${data.sport}</span>
        </div>
        <div class="detail-row">
          <span class="label">Venue</span>
          <span class="value">${data.venueName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date</span>
          <span class="value">${data.slotDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time</span>
          <span class="value highlight">${data.slotTime}</span>
        </div>
      </div>
      
      <p style="text-align: center; color: #6b7280; margin-top: 20px;">
        Don't forget to bring your gear and arrive 10 minutes early!
      </p>
      
      <a href="https://fitkits.app" class="cta">Open Fitkits</a>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Fitkits. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function getEventRegistrationEmail(data: EventEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Registration - Fitkits</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🏸 Fitkits</div>
        <h1 class="title">You're Registered!</h1>
        <p class="subtitle">Hi ${data.userName}, you're all set for ${data.eventTitle}</p>
      </div>
      
      <div class="details">
        <div class="detail-row">
          <span class="label">Event</span>
          <span class="value">${data.eventTitle}</span>
        </div>
        <div class="detail-row">
          <span class="label">Type</span>
          <span class="value">${data.eventType}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date</span>
          <span class="value">${data.eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time</span>
          <span class="value">${data.startTime}</span>
        </div>
        <div class="detail-row">
          <span class="label">Location</span>
          <span class="value">${data.location}</span>
        </div>
        ${data.entryFee > 0 ? `
        <div class="detail-row">
          <span class="label">Entry Fee</span>
          <span class="value highlight">₹${data.entryFee}</span>
        </div>
        ` : ''}
      </div>
      
      <a href="https://fitkits.app/events/${data.eventId}" class="cta">View Event Details</a>
      
      <div class="footer">
        <p>Good luck! 🎯</p>
        <p>© ${new Date().getFullYear()} Fitkits. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function getEventReminderEmail(data: EventEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder - Fitkits</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🏸 Fitkits</div>
        <h1 class="title">Event Tomorrow!</h1>
        <p class="subtitle">Hi ${data.userName}, ${data.eventTitle} is happening tomorrow</p>
      </div>
      
      <div class="details">
        <div class="detail-row">
          <span class="label">Event</span>
          <span class="value">${data.eventTitle}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date</span>
          <span class="value">${data.eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time</span>
          <span class="value highlight">${data.startTime}</span>
        </div>
        <div class="detail-row">
          <span class="label">Location</span>
          <span class="value">${data.location}</span>
        </div>
      </div>
      
      <p style="text-align: center; color: #6b7280; margin-top: 20px;">
        Arrive early to warm up and meet other players!
      </p>
      
      <a href="https://fitkits.app/events/${data.eventId}" class="cta">View Event</a>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Fitkits. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function getWelcomeEmail(userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Fitkits</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🏸 Fitkits</div>
        <h1 class="title">Welcome to Fitkits!</h1>
        <p class="subtitle">Hi ${userName}, we're excited to have you on board</p>
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
        <p style="color: #4b5563; line-height: 1.6;">
          Fitkits is your one-stop platform for booking sports venues, 
          joining community games, and connecting with fellow players.
        </p>
      </div>
      
      <div class="details">
        <h3 style="margin: 0 0 16px; color: #1f2937;">Get Started:</h3>
        <p style="margin: 8px 0; color: #4b5563;">🏟️ Browse and book sports venues near you</p>
        <p style="margin: 8px 0; color: #4b5563;">🎮 Join or host community games</p>
        <p style="margin: 8px 0; color: #4b5563;">🏆 Participate in local tournaments</p>
        <p style="margin: 8px 0; color: #4b5563;">👥 Connect with players in your area</p>
      </div>
      
      <a href="https://fitkits.app" class="cta">Start Exploring</a>
      
      <div class="footer">
        <p>Need help? Contact us at support@fitkits.app</p>
        <p>© ${new Date().getFullYear()} Fitkits. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
