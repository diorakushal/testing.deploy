/**
 * Email Notification Service using Resend
 * Handles all email notifications for Blockbook
 */

const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY || '');

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'Blockbook <onboarding@resend.dev>';
const BASE_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''); // Remove trailing slash

/**
 * Send email helper function
 */
async function sendEmail({ to, subject, html }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY not configured. Skipping email to:', to);
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Error sending email:', error);
      return { success: false, error };
    }

    console.log('[Email] Email sent successfully to:', to, 'ID:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Exception sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Email Template: Payment Request Created
 */
function getPaymentRequestCreatedTemplate({ amount, tokenSymbol, chainName, caption, requestId }) {
  const requestUrl = `${BASE_URL}/payment-request/${requestId}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Request Created</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
        <h1 style="color: #000; margin-top: 0; font-size: 24px;">Payment Request Created</h1>
        <p style="font-size: 16px;">Your payment request has been successfully created!</p>
        
        <div style="background: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">Amount:</strong>
            <span style="font-size: 20px; font-weight: bold; color: #000;">${amount} ${tokenSymbol}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">Chain:</strong> ${chainName}
          </div>
          ${caption ? `<div style="margin-bottom: 10px;"><strong style="color: #666;">Note:</strong> ${caption}</div>` : ''}
        </div>
        
        <p style="font-size: 14px; color: #666;">Your request is now live and visible to others. They can pay it directly from their wallet.</p>
        
        <a href="${requestUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 24px; margin-top: 20px; font-weight: 500;">View Request</a>
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">This is an automated notification from Blockbook.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Email Template: Payment Request Fulfilled
 */
function getRequestFulfilledTemplate({ amount, tokenSymbol, payerName, payerAddress, txHash, chainName }) {
  const explorerUrl = getExplorerUrl(chainName, txHash);
  const shortAddress = payerAddress ? `${payerAddress.slice(0, 6)}...${payerAddress.slice(-4)}` : 'Unknown';
  const payerDisplay = payerName || shortAddress;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Received</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
        <h1 style="color: #22c55e; margin-top: 0; font-size: 24px;">💰 Payment Received!</h1>
        <p style="font-size: 18px; font-weight: 600;">You received ${amount} ${tokenSymbol}</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">From:</strong> ${payerDisplay}
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">Amount:</strong>
            <span style="font-size: 20px; font-weight: bold; color: #000;">${amount} ${tokenSymbol}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">Chain:</strong> ${chainName}
          </div>
          ${txHash ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;">
              <strong style="color: #666;">Transaction:</strong>
              <br>
              <a href="${explorerUrl}" style="color: #000; text-decoration: underline; font-family: monospace; font-size: 12px;">${txHash.slice(0, 10)}...${txHash.slice(-8)}</a>
            </div>
          ` : ''}
        </div>
        
        <p style="font-size: 14px; color: #666;">The payment has been sent directly to your wallet.</p>
        
        ${txHash ? `<a href="${explorerUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 24px; margin-top: 20px; font-weight: 500;">View Transaction</a>` : ''}
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">This is an automated notification from Blockbook.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Email Template: Payment Sent
 */
function getPaymentSentTemplate({ amount, tokenSymbol, recipientName, recipientAddress, txHash, chainName, caption }) {
  const explorerUrl = getExplorerUrl(chainName, txHash);
  const shortAddress = recipientAddress ? `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}` : 'Unknown';
  const recipientDisplay = recipientName || shortAddress;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Sent</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
        <h1 style="color: #000; margin-top: 0; font-size: 24px;">Payment Sent</h1>
        <p style="font-size: 18px; font-weight: 600;">You sent ${amount} ${tokenSymbol}</p>
        
        <div style="background: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">To:</strong> ${recipientDisplay}
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">Amount:</strong>
            <span style="font-size: 20px; font-weight: bold; color: #000;">${amount} ${tokenSymbol}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">Chain:</strong> ${chainName}
          </div>
          ${caption ? `<div style="margin-bottom: 10px;"><strong style="color: #666;">Note:</strong> ${caption}</div>` : ''}
          ${txHash ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;">
              <strong style="color: #666;">Transaction:</strong>
              <br>
              <a href="${explorerUrl}" style="color: #000; text-decoration: underline; font-family: monospace; font-size: 12px;">${txHash.slice(0, 10)}...${txHash.slice(-8)}</a>
            </div>
          ` : ''}
        </div>
        
        <p style="font-size: 14px; color: #666;">The payment has been sent directly to their wallet.</p>
        
        ${txHash ? `<a href="${explorerUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 24px; margin-top: 20px; font-weight: 500;">View Transaction</a>` : ''}
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">This is an automated notification from Blockbook.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Email Template: Payment Received
 */
function getPaymentReceivedTemplate({ amount, tokenSymbol, senderName, senderAddress, txHash, chainName, caption }) {
  const explorerUrl = getExplorerUrl(chainName, txHash);
  const shortAddress = senderAddress ? `${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}` : 'Unknown';
  const senderDisplay = senderName || shortAddress;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Received</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
        <h1 style="color: #22c55e; margin-top: 0; font-size: 24px;">💰 Payment Received!</h1>
        <p style="font-size: 18px; font-weight: 600;">You received ${amount} ${tokenSymbol}</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">From:</strong> ${senderDisplay}
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">Amount:</strong>
            <span style="font-size: 20px; font-weight: bold; color: #000;">${amount} ${tokenSymbol}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #666;">Chain:</strong> ${chainName}
          </div>
          ${caption ? `<div style="margin-bottom: 10px;"><strong style="color: #666;">Note:</strong> ${caption}</div>` : ''}
          ${txHash ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;">
              <strong style="color: #666;">Transaction:</strong>
              <br>
              <a href="${explorerUrl}" style="color: #000; text-decoration: underline; font-family: monospace; font-size: 12px;">${txHash.slice(0, 10)}...${txHash.slice(-8)}</a>
            </div>
          ` : ''}
        </div>
        
        <p style="font-size: 14px; color: #666;">The payment has been sent directly to your wallet.</p>
        
        ${txHash ? `<a href="${explorerUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 24px; margin-top: 20px; font-weight: 500;">View Transaction</a>` : ''}
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">This is an automated notification from Blockbook.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get blockchain explorer URL for transaction
 */
function getExplorerUrl(chainName, txHash) {
  if (!txHash) return '#';
  
  const explorerMap = {
    'Base': `https://basescan.org/tx/${txHash}`,
    'Ethereum': `https://etherscan.io/tx/${txHash}`,
    'BNB Chain': `https://bscscan.com/tx/${txHash}`,
    'Polygon': `https://polygonscan.com/tx/${txHash}`,
    'Arbitrum': `https://arbiscan.io/tx/${txHash}`,
    'Optimism': `https://optimistic.etherscan.io/tx/${txHash}`,
    'Avalanche': `https://snowtrace.io/tx/${txHash}`,
  };
  
  return explorerMap[chainName] || `#`;
}

/**
 * Send payment request created email
 */
async function sendPaymentRequestCreatedEmail({ email, amount, tokenSymbol, chainName, caption, requestId }) {
  const html = getPaymentRequestCreatedTemplate({ amount, tokenSymbol, chainName, caption, requestId });
  return await sendEmail({
    to: email,
    subject: `Your payment request for ${amount} ${tokenSymbol} has been created`,
    html,
  });
}

/**
 * Send request fulfilled email
 */
async function sendRequestFulfilledEmail({ email, amount, tokenSymbol, payerName, payerAddress, txHash, chainName }) {
  const html = getRequestFulfilledTemplate({ amount, tokenSymbol, payerName, payerAddress, txHash, chainName });
  return await sendEmail({
    to: email,
    subject: `💰 You received ${amount} ${tokenSymbol}!`,
    html,
  });
}

/**
 * Send payment sent email
 */
async function sendPaymentSentEmail({ email, amount, tokenSymbol, recipientName, recipientAddress, txHash, chainName, caption }) {
  const html = getPaymentSentTemplate({ amount, tokenSymbol, recipientName, recipientAddress, txHash, chainName, caption });
  return await sendEmail({
    to: email,
    subject: `You sent ${amount} ${tokenSymbol} to ${recipientName || recipientAddress?.slice(0, 6) + '...'}`,
    html,
  });
}

/**
 * Send payment received email
 */
async function sendPaymentReceivedEmail({ email, amount, tokenSymbol, senderName, senderAddress, txHash, chainName, caption }) {
  const html = getPaymentReceivedTemplate({ amount, tokenSymbol, senderName, senderAddress, txHash, chainName, caption });
  return await sendEmail({
    to: email,
    subject: `💰 You received ${amount} ${tokenSymbol} from ${senderName || senderAddress?.slice(0, 6) + '...'}`,
    html,
  });
}

module.exports = {
  sendEmail,
  sendPaymentRequestCreatedEmail,
  sendRequestFulfilledEmail,
  sendPaymentSentEmail,
  sendPaymentReceivedEmail,
};

