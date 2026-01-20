import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventRegistrationEmailData {
  userId: string;
  eventId: string;
  registrationId: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  location: string;
  entryFee: number;
  ticketsCount: number;
}

const formatEventDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const getEventRegistrationEmailHtml = (
  userName: string,
  data: EventRegistrationEmailData
): string => {
  const isTournament = data.eventType === "tournament";
  const eventTypeName = isTournament ? "Tournament" : "Social Event";
  const totalAmount = data.entryFee * data.ticketsCount;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Confirmed - Fitkits</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center; color: white; }
    .logo { font-size: 32px; margin-bottom: 8px; }
    .title { font-size: 24px; font-weight: 700; margin: 0; }
    .subtitle { font-size: 14px; opacity: 0.9; margin-top: 8px; }
    .content { padding: 32px; }
    .success-badge { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; font-size: 14px; margin-bottom: 24px; }
    .event-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .event-title { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 4px; }
    .event-type { font-size: 12px; color: #10b981; text-transform: uppercase; font-weight: 600; }
    .details-grid { display: grid; gap: 16px; margin-top: 20px; }
    .detail-item { display: flex; align-items: flex-start; gap: 12px; }
    .detail-icon { width: 40px; height: 40px; background: #ecfdf5; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .detail-content { flex: 1; }
    .detail-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .detail-value { font-size: 14px; font-weight: 600; color: #1f2937; }
    .booking-id { background: #fef3c7; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
    .booking-id-label { font-size: 12px; color: #92400e; margin-bottom: 4px; }
    .booking-id-value { font-size: 20px; font-weight: 700; color: #92400e; letter-spacing: 2px; }
    .payment-summary { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; }
    .payment-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .payment-total { font-weight: 700; font-size: 16px; color: #10b981; }
    .cta { display: block; background: #10b981; color: white; text-align: center; padding: 16px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 24px; }
    .footer { text-align: center; padding: 24px; color: #9ca3af; font-size: 12px; }
    .tips { background: #eff6ff; border-radius: 12px; padding: 20px; margin-top: 24px; }
    .tips-title { font-size: 14px; font-weight: 600; color: #1e40af; margin-bottom: 12px; }
    .tip-item { font-size: 13px; color: #3b82f6; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🎉</div>
        <h1 class="title">You're Registered!</h1>
        <p class="subtitle">Your spot is confirmed</p>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          <span class="success-badge">✓ Registration Successful</span>
        </div>
        
        <p style="color: #4b5563; text-align: center; margin-bottom: 24px;">
          Hi <strong>${userName}</strong>, you're all set for the ${eventTypeName.toLowerCase()}!
        </p>
        
        <div class="event-card">
          <span class="event-type">${eventTypeName}</span>
          <h2 class="event-title">${data.eventTitle}</h2>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-icon">📅</div>
              <div class="detail-content">
                <div class="detail-label">Date</div>
                <div class="detail-value">${formatEventDate(data.eventDate)}</div>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">⏰</div>
              <div class="detail-content">
                <div class="detail-label">Time</div>
                <div class="detail-value">${formatTime(data.startTime)}</div>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">📍</div>
              <div class="detail-content">
                <div class="detail-label">Location</div>
                <div class="detail-value">${data.location}</div>
              </div>
            </div>
            ${data.ticketsCount > 1 ? `
            <div class="detail-item">
              <div class="detail-icon">🎫</div>
              <div class="detail-content">
                <div class="detail-label">Tickets</div>
                <div class="detail-value">${data.ticketsCount} tickets</div>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="booking-id">
          <div class="booking-id-label">Your Registration ID</div>
          <div class="booking-id-value">${data.registrationId.slice(0, 8).toUpperCase()}</div>
        </div>
        
        ${totalAmount > 0 ? `
        <div class="payment-summary">
          <div class="payment-row">
            <span style="color: #6b7280;">Entry Fee × ${data.ticketsCount}</span>
            <span>₹${data.entryFee} × ${data.ticketsCount}</span>
          </div>
          <div class="payment-row payment-total">
            <span>Total Paid</span>
            <span>₹${totalAmount}</span>
          </div>
        </div>
        ` : `
        <div class="payment-summary">
          <div class="payment-row payment-total">
            <span>Entry Fee</span>
            <span style="color: #10b981;">Free</span>
          </div>
        </div>
        `}
        
        <a href="https://fitkits.app/social/event/${data.eventId}" class="cta">View Event Details</a>
        
        <div class="tips">
          <div class="tips-title">📝 Quick Tips</div>
          <div class="tip-item">✓ Arrive 15 minutes early for check-in</div>
          <div class="tip-item">✓ Bring this email or show your Registration ID</div>
          <div class="tip-item">✓ Join the event chat to connect with others</div>
          ${isTournament ? '<div class="tip-item">✓ Review the tournament rules before the event</div>' : ''}
        </div>
      </div>
      
      <div class="footer">
        <p>Need help? Contact us at support@fitkits.app</p>
        <p>© ${new Date().getFullYear()} Fitkits. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: EventRegistrationEmailData = await req.json();
    console.log("Processing event registration email for:", data.registrationId);

    // Validate required fields
    if (!data.userId || !data.eventId || !data.registrationId) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "userId, eventId, and registrationId are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email and profile
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.userId);
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "Could not fetch user email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userEmail = userData.user.email;

    // Get user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", data.userId)
      .single();

    const userName = profile?.display_name || profile?.username || userEmail.split("@")[0];

    // Generate email HTML
    const emailHtml = getEventRegistrationEmailHtml(userName, data);

    // Send email
    const emailResult = await resend.emails.send({
      from: "Fitkits <onboarding@resend.dev>",
      to: [userEmail],
      subject: `🎉 You're Registered! - ${data.eventTitle}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResult);

    // Also create in-app notification
    await supabase.from("notifications").insert({
      user_id: data.userId,
      type: "event_registered",
      title: "🎉 Registration Confirmed!",
      body: `You're registered for ${data.eventTitle} on ${formatEventDate(data.eventDate)}. Check your email for details.`,
      data: {
        eventId: data.eventId,
        registrationId: data.registrationId,
        eventTitle: data.eventTitle,
      },
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-event-registration-email:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);