// Server-side Resend Email service
// Sends 8-bit retro arcade styled HTML receipts to customers.

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface OrderEmailProps {
  to: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  guestToken: string;
  items: Array<{
    name: string;
    size: string;
    qty: number;
    price: string;
  }>;
  subtotal: string;
  discount?: string;
  shipping: string;
  total: string;
  trackingUrl: string;
}

export interface OrderShippedEmailProps {
  to: string;
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl: string;
}

export async function sendOrderShippedEmail(data: OrderShippedEmailProps): Promise<{ success: boolean; id?: string }> {
  if (!resend) {
    console.log(`[Email Service - Simulated] Order shipped notification dispatched to ${data.to} for order ${data.orderNumber}`);
    return { success: true, id: `sim_ship_email_${Date.now()}` };
  }

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Order Shipped - Franky's</title>
  </head>
  <body style="margin: 0; padding: 20px; background-color: #f3e5df; font-family: 'Courier New', monospace; color: #000000;">
    <div style="max-width: 500px; margin: 0 auto; background: #f3e5df; border: 2px solid #000000; padding: 24px; box-shadow: 4px 4px 0 #000000;">
      <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="font-size: 24px; letter-spacing: 2px; margin: 0;">★ FRANKY'S ARCADE ★</h1>
        <p style="margin: 6px 0 0 0; font-size: 12px; letter-spacing: 1px; color: #525252;">HANDMADE MERINO WOOL CAPS · PORTUGAL</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; margin: 0 0 8px 0; color: #128e44;">LEVEL UP! ORDER DISPATCHED: ${data.orderNumber}</h2>
        <p style="font-size: 14px; line-height: 1.4; margin: 0;">
          Player 1 <strong>${data.customerName}</strong>, your caps have departed the Portugal studio and are en route!
        </p>
      </div>

      <div style="border: 2px dashed #000000; background: #ffffff; padding: 16px; margin-bottom: 24px; text-align: center;">
        <div style="font-size: 11px; color: #737373; letter-spacing: 1px; margin-bottom: 4px;">CARRIER</div>
        <div style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">${data.carrier.toUpperCase()}</div>
        <div style="font-size: 11px; color: #737373; letter-spacing: 1px; margin-bottom: 4px;">TRACKING CODE</div>
        <div style="font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #faa21f; background: #000000; padding: 6px 12px; display: inline-block;">
          ${data.trackingNumber}
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${data.trackingUrl}" style="display: inline-block; background-color: #faa21f; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border: 2px solid #000000; box-shadow: 2px 2px 0 #000000; font-size: 13px; letter-spacing: 1px;">
          TRACK ORDER STATUS →
        </a>
      </div>

      <div style="margin-top: 28px; text-align: center; border-top: 1px dashed #000000; padding-top: 12px; font-size: 11px; color: #525252;">
        Questions? Reply to this email. INSERT COIN & KEEP PLAYING.
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const res = await resend.emails.send({
      from: "Franky's Arcade <orders@frankys.shop>",
      to: data.to,
      subject: `★ Order Shipped: ${data.orderNumber} - Franky's`,
      html: emailHtml,
    });
    return { success: true, id: res.data?.id };
  } catch (err) {
    console.error("[Resend Error]", err);
    return { success: false };
  }
}

export async function sendOrderConfirmationEmail(data: OrderEmailProps): Promise<{ success: boolean; id?: string }> {
  if (!resend) {
    console.log(`[Email Service - Simulated] Order confirmation dispatched to ${data.to} for order ${data.orderNumber}`);
    return { success: true, id: `sim_email_${Date.now()}` };
  }

  const itemsHtml = data.items
    .map(
      (it) => `
      <tr style="border-bottom: 1px dashed #000000;">
        <td style="padding: 8px 0; font-family: monospace; font-size: 14px;">${it.qty}x ${it.name} [${it.size}]</td>
        <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 14px; font-weight: bold;">${it.price}</td>
      </tr>
    `,
    )
    .join("");

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Order Confirmation - Franky's</title>
  </head>
  <body style="margin: 0; padding: 20px; background-color: #f3e5df; font-family: 'Courier New', monospace; color: #000000;">
    <div style="max-width: 500px; margin: 0 auto; background: #f3e5df; border: 2px solid #000000; padding: 24px; box-shadow: 4px 4px 0 #000000;">
      <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="font-size: 24px; letter-spacing: 2px; margin: 0;">★ FRANKY'S ARCADE ★</h1>
        <p style="margin: 6px 0 0 0; font-size: 12px; letter-spacing: 1px; color: #525252;">HANDMADE MERINO WOOL CAPS · PORTUGAL</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; margin: 0 0 8px 0;">ORDER CONFIRMED: ${data.orderNumber}</h2>
        <p style="font-size: 14px; line-height: 1.4; margin: 0;">
          Player 1 <strong>${data.customerName}</strong>, your caps have entered the production queue!
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="border-bottom: 2px solid #000000; text-align: left;">
            <th style="padding: 6px 0; font-size: 12px;">ITEM</th>
            <th style="padding: 6px 0; text-align: right; font-size: 12px;">PRICE</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="border-top: 2px solid #000000; padding-top: 12px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px;">
          <span>SUBTOTAL:</span>
          <span>${data.subtotal}</span>
        </div>
        ${
          data.discount
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; color: #128e44; font-weight: bold;">
          <span>CHEAT CODE (10% OFF):</span>
          <span>-${data.discount}</span>
        </div>`
            : ""
        }
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px;">
          <span>SHIPPING:</span>
          <span>${data.shipping}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 8px; border-top: 1px dashed #000000; padding-top: 8px;">
          <span>TOTAL:</span>
          <span>${data.total}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${data.trackingUrl}" style="display: inline-block; background-color: #128e44; color: #f3e5df; padding: 12px 24px; text-decoration: none; font-weight: bold; border: 2px solid #000000; box-shadow: 2px 2px 0 #000000; font-size: 13px; letter-spacing: 1px;">
          VIEW LIVE RECEIPT →
        </a>
      </div>

      <div style="margin-top: 28px; text-align: center; border-top: 1px dashed #000000; padding-top: 12px; font-size: 11px; color: #525252;">
        Questions? Reply to this email. INSERT COIN & KEEP PLAYING.
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const res = await resend.emails.send({
      from: "Franky's Arcade <orders@frankys.shop>",
      to: data.to,
      subject: `★ Order Confirmed: ${data.orderNumber} - Franky's`,
      html: emailHtml,
    });
    return { success: true, id: res.data?.id };
  } catch (err) {
    console.error("[Resend Error]", err);
    return { success: false };
  }
}
