import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "invite_sent" | "invite_accepted" | "invite_declined";
  recipientEmail: string;
  recipientName?: string;
  dogName?: string;
  ownerName?: string;
  walkerName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientEmail, recipientName, dogName, ownerName, walkerName }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${recipientEmail}`);

    let subject = "";
    let html = "";
    const name = recipientName || "there";

    switch (type) {
      case "invite_sent":
        subject = `🐕 You're invited to walk ${dogName || "a dog"} on FloofMap!`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f59e0b;">🐾 New Dog Walking Invite!</h1>
            <p>Hi ${name},</p>
            <p><strong>${ownerName || "Someone"}</strong> has invited you to walk their dog <strong>${dogName || ""}</strong> on FloofMap!</p>
            <p>Log in to your FloofMap account to accept or decline this invitation.</p>
            <div style="margin: 30px 0;">
              <a href="https://floofmap.com/app/dogs" style="background: linear-gradient(to right, #f59e0b, #d97706); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Invitation</a>
            </div>
            <p style="color: #666; font-size: 14px;">Happy walking! 🐕</p>
          </div>
        `;
        break;

      case "invite_accepted":
        subject = `✅ ${walkerName || "Your walker"} accepted the invite for ${dogName || "your dog"}!`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #22c55e;">🎉 Invite Accepted!</h1>
            <p>Hi ${name},</p>
            <p>Great news! <strong>${walkerName || "Your invited walker"}</strong> has accepted the invitation to walk <strong>${dogName || "your dog"}</strong>.</p>
            <p>They can now record walks and track sniff stops for ${dogName || "your dog"}.</p>
            <div style="margin: 30px 0;">
              <a href="https://floofmap.com/app/dogs" style="background: linear-gradient(to right, #f59e0b, #d97706); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View in FloofMap</a>
            </div>
            <p style="color: #666; font-size: 14px;">Happy walking! 🐕</p>
          </div>
        `;
        break;

      case "invite_declined":
        subject = `${walkerName || "Your invited walker"} declined the invite for ${dogName || "your dog"}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6b7280;">Invite Declined</h1>
            <p>Hi ${name},</p>
            <p><strong>${walkerName || "Your invited walker"}</strong> has declined the invitation to walk <strong>${dogName || "your dog"}</strong>.</p>
            <p>You can invite someone else to help walk your furry friend.</p>
            <div style="margin: 30px 0;">
              <a href="https://floofmap.com/app/dogs" style="background: linear-gradient(to right, #f59e0b, #d97706); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Invite Another Walker</a>
            </div>
            <p style="color: #666; font-size: 14px;">Happy walking! 🐕</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FloofMap <notifications@floofmap.com>",
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invite-email function:", error);
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
