import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  otp: string;
  type: "recovery" | "verification";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, otp, type }: EmailRequest = await req.json();

    const subject = type === "recovery" 
      ? "Reset Your Fitkits Password" 
      : "Verify Your Fitkits Account";

    const title = type === "recovery" 
      ? "Reset Your Password" 
      : "Verify Your Email";

    const subtitle = type === "recovery"
      ? "Use this code to reset your Fitkits password"
      : "Use this code to verify your Fitkits account";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background-color: #FFF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0;">
          <div style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 32px;">
              <p style="font-size: 28px; font-weight: 700; color: #F09241; letter-spacing: 0.15em; margin: 0;">FITKITS</p>
            </div>
            
            <!-- Title -->
            <h1 style="color: #333; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 16px;">${title}</h1>
            
            <!-- Subtitle -->
            <p style="color: #666; font-size: 16px; line-height: 24px; text-align: center; margin: 0 0 32px;">${subtitle}</p>
            
            <!-- OTP Code Box -->
            <div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #FDCBC9; margin-bottom: 24px;">
              <p style="color: #666; font-size: 14px; margin: 0 0 12px;">Your verification code:</p>
              <p style="background-color: #FFC396; border-radius: 8px; color: #333; display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 0.3em; padding: 16px 24px; margin: 0;">${otp}</p>
            </div>
            
            <!-- Expiry -->
            <p style="color: #999; font-size: 14px; text-align: center; margin: 0 0 16px;">This code expires in 10 minutes.</p>
            
            <!-- Warning -->
            <p style="color: #999; font-size: 13px; text-align: center; margin: 0 0 32px;">If you didn't request this code, you can safely ignore this email.</p>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #FDCBC9; padding-top: 24px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} Fitkits. Play More. Live Fit.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Fitkits <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
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
