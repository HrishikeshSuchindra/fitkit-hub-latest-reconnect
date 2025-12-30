import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createRateLimiter, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standard rate limit: 60 per minute
const rateLimiter = createRateLimiter(RATE_LIMITS.standard);

interface HostRequestData {
  title: string;
  category: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: string;
  price: string;
  imageUrl?: string;
  hostName: string;
  hostEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const limitResponse = rateLimiter(req);
  if (limitResponse) {
    console.log("Rate limit exceeded for host approval request");
    return new Response(limitResponse.body, {
      status: limitResponse.status,
      headers: { ...corsHeaders, ...Object.fromEntries(limitResponse.headers.entries()) },
    });
  }

  try {
    const data: HostRequestData = await req.json();
    console.log("Received host approval request:", JSON.stringify(data));

    if (!data.title || !data.hostEmail) {
      console.error("Missing required fields: title or hostEmail");
      return new Response(
        JSON.stringify({ error: "title and hostEmail are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const formatCategory = (cat: string) => {
      const categories: Record<string, string> = {
        fitdates: "FitDates",
        coffee: "Coffee Raves",
        wellness: "Wellness Retreats",
        social: "Social Sports",
        other: "Other",
      };
      return categories[cat] || cat;
    };

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Event Host Request - Fitkits</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: bold; color: #10b981; }
    .title { font-size: 24px; font-weight: 600; color: #1f2937; margin: 16px 0 8px; }
    .subtitle { font-size: 16px; color: #6b7280; }
    .section { margin: 24px 0; }
    .section-title { font-size: 14px; font-weight: 600; color: #10b981; text-transform: uppercase; margin-bottom: 12px; }
    .details { background: #f9fafb; border-radius: 8px; padding: 20px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 14px; font-weight: 500; }
    .value { color: #1f2937; font-weight: 600; font-size: 14px; text-align: right; max-width: 60%; }
    .description-box { background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 12px; }
    .description-text { color: #4b5563; font-size: 14px; line-height: 1.6; }
    .image-section { margin: 24px 0; text-align: center; }
    .event-image { max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .host-info { background: #ecfdf5; border-radius: 8px; padding: 16px; margin-top: 24px; }
    .host-title { font-size: 14px; font-weight: 600; color: #059669; margin-bottom: 8px; }
    .host-detail { color: #047857; font-size: 14px; }
    .cta-section { margin-top: 32px; text-align: center; }
    .cta { display: inline-block; padding: 14px 32px; background: #10b981; color: white; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 8px; }
    .cta-reject { background: #ef4444; }
    .footer { text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px; }
    .highlight { color: #10b981; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🏸 Fitkits</div>
        <h1 class="title">New Event Host Request</h1>
        <p class="subtitle">A user has submitted a request to host an event</p>
      </div>
      
      <div class="section">
        <div class="section-title">Event Details</div>
        <div class="details">
          <div class="detail-row">
            <span class="label">Event Title</span>
            <span class="value">${data.title}</span>
          </div>
          <div class="detail-row">
            <span class="label">Category</span>
            <span class="value">${formatCategory(data.category)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date</span>
            <span class="value">${data.date}</span>
          </div>
          <div class="detail-row">
            <span class="label">Time</span>
            <span class="value">${data.time}</span>
          </div>
          <div class="detail-row">
            <span class="label">Location</span>
            <span class="value">${data.location}</span>
          </div>
          <div class="detail-row">
            <span class="label">Max Participants</span>
            <span class="value">${data.maxParticipants || 'Not specified'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Price per Person</span>
            <span class="value highlight">${data.price || 'Free'}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Description</div>
        <div class="description-box">
          <p class="description-text">${data.description || 'No description provided'}</p>
        </div>
      </div>

      ${data.imageUrl ? `
      <div class="image-section">
        <div class="section-title">Event Image</div>
        <img src="${data.imageUrl}" alt="Event Image" class="event-image" />
      </div>
      ` : ''}

      <div class="host-info">
        <div class="host-title">👤 Host Information</div>
        <p class="host-detail"><strong>Name:</strong> ${data.hostName}</p>
        <p class="host-detail"><strong>Email:</strong> ${data.hostEmail}</p>
      </div>

      <div class="cta-section">
        <a href="mailto:${data.hostEmail}?subject=Your Event Has Been Approved - ${data.title}&body=Congratulations! Your event '${data.title}' has been approved." class="cta">✅ Approve Event</a>
        <a href="mailto:${data.hostEmail}?subject=Regarding Your Event Request - ${data.title}&body=We need to discuss your event request for '${data.title}'." class="cta cta-reject">❌ Request Changes</a>
      </div>
      
      <div class="footer">
        <p>This is an automated notification from Fitkits</p>
        <p>© ${new Date().getFullYear()} Fitkits. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    console.log("Sending host approval email...");

    const emailResponse = await resend.emails.send({
      from: "Fitkits Events <onboarding@resend.dev>",
      to: ["hrishikeshsuchindra@gmail.com"],
      subject: `🎉 New Event Host Request: ${data.title}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-host-approval-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);