import { supabase } from "@/integrations/supabase/client";

/**
 * Sends a welcome email to the user after signup.
 * @param {string} email - The recipient's email address.
 * @param {string} name - The recipient's name.
 */
export const sendWelcomeEmail = async (email: string, name: string) => {
  const subject = "Welcome to PreventIQ!";
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to PreventIQ</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f8f9fa; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #fff; border-radius: 8px; }
        .header { text-align: center; padding: 10px 0; }
        .content { margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to PreventIQ, ${name}!</h1>
        </div>
        <div class="content">
          <p>We are thrilled to have you on board. PreventIQ is here to revolutionize your healthcare marketing campaigns.</p>
          <p>Click the button below to access your dashboard and get started:</p>
          <p style="text-align: center;">
            <a href="https://your-dashboard-link.com" style="background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Access Dashboard</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2025 PreventIQ. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const { error } = await supabase.functions.invoke("send-welcome-email", {
    body: { to: email, subject, html: htmlContent },
  });

  if (error) {
    console.error("Failed to send welcome email:", error);
    throw new Error("Unable to send welcome email.");
  }
};