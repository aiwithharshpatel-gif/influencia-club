import crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

/**
 * Razorpay Payment Integration Service
 * Docs: https://razorpay.com/docs/payments/payment-gateway/server-integration/node/
 */

export const createOrder = async (amount, currency = 'INR') => {
  try {
    // Note: In production, use Razorpay SDK
    // const Razorpay = require('razorpay');
    // const instance = new Razorpay({ 
    //   key_id: RAZORPAY_KEY_ID, 
    //   key_secret: RAZORPAY_KEY_SECRET 
    // });
    
    // For now, return mock order structure
    const order = {
      id: `order_${crypto.randomBytes(16).toString('hex')}`,
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      created: Math.floor(Date.now() / 1000)
    };

    return {
      success: true,
      order
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const verifyPayment = async (orderId, paymentId, signature) => {
  try {
    const sign = orderId + '|' + paymentId;
    const expectedSign = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (signature !== expectedSign) {
      return {
        success: false,
        error: 'Invalid payment signature'
      };
    }

    return {
      success: true,
      message: 'Payment verified successfully'
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Cashfree Payouts Integration
 * Docs: https://docs.cashfree.com/docs/payouts/
 */
export const initiatePayout = async (beneficiaryDetails, amount) => {
  try {
    // Note: In production, use Cashfree SDK
    // const Cashfree = require('cashfree-pg');
    
    // Mock payout structure
    const payout = {
      payoutId: `payout_${crypto.randomBytes(16).toString('hex')}`,
      amount,
      status: 'processing',
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      payout
    };
  } catch (error) {
    console.error('Payout initiation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const checkPayoutStatus = async (payoutId) => {
  try {
    // Mock status check
    return {
      success: true,
      status: 'completed',
      payoutId
    };
  } catch (error) {
    console.error('Payout status check error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate GST Invoice
 */
export const generateInvoice = async (paymentData) => {
  try {
    const {
      brandName,
      brandGst,
      amount,
      platformFee,
      gstRate = 18 // 18% GST
    } = paymentData;

    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;

    // Generate invoice HTML
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: bold; color: #7B2FFF; }
          .invoice-details { margin-bottom: 30px; }
          .table { width: 100%; border-collapse: collapse; }
          .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .total { font-weight: bold; font-size: 18px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Influenzia Club</div>
          <p>Influence. Inspire. Ignite.</p>
          <p>Ahmedabad, Gujarat, India</p>
          <p>GST: 24AAAAA0000A1Z5</p>
        </div>
        
        <div class="invoice-details">
          <h2>TAX INVOICE</h2>
          <p><strong>Invoice No:</strong> INV-${Date.now()}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Bill To:</strong> ${brandName}</p>
          <p><strong>GSTIN:</strong> ${brandGst || 'N/A'}</p>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Campaign Management Services</td>
              <td>Rs. ${amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Platform Fee (${(platformFee / amount * 100).toFixed(0)}%)</td>
              <td>Rs. ${platformFee.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>GST (${gstRate}%)</td>
              <td>Rs. ${gstAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr class="total">
              <td>Total</td>
              <td>Rs. ${totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Powered by ZCAD Nexoraa Pvt. Ltd.</p>
        </div>
      </body>
      </html>
    `;

    return {
      success: true,
      invoiceHtml,
      invoiceData: {
        invoiceNumber: `INV-${Date.now()}`,
        amount,
        platformFee,
        gstAmount,
        totalAmount
      }
    };
  } catch (error) {
    console.error('Invoice generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate Digital Agreement
 */
export const generateAgreement = async (campaignData) => {
  try {
    const {
      brandName,
      creatorName,
      deliverables,
      timeline,
      paymentAmount,
      paymentTerms
    } = campaignData;

    const agreementHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .section { margin-bottom: 25px; }
          .section-title { font-weight: bold; margin-bottom: 10px; color: #7B2FFF; }
          .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-box { width: 45%; border-top: 2px solid #333; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">INFLUENCER COLLABORATION AGREEMENT</div>
          <p>Agreement ID: AGR-${Date.now()}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <div class="section-title">PARTIES</div>
          <p><strong>Brand:</strong> ${brandName}</p>
          <p><strong>Creator:</strong> ${creatorName}</p>
          <p>This agreement is made between the Brand and the Creator for influencer marketing services.</p>
        </div>
        
        <div class="section">
          <div class="section-title">DELIVERABLES</div>
          <p>${deliverables}</p>
        </div>
        
        <div class="section">
          <div class="section-title">TIMELINE</div>
          <p>${timeline}</p>
        </div>
        
        <div class="section">
          <div class="section-title">PAYMENT TERMS</div>
          <p>Total Amount: Rs. ${paymentAmount.toLocaleString('en-IN')}</p>
          <p>Terms: ${paymentTerms}</p>
          <p>Platform Fee (10%): Rs. ${(paymentAmount * 0.1).toLocaleString('en-IN')}</p>
          <p>Creator Earnings: Rs. ${(paymentAmount * 0.9).toLocaleString('en-IN')}</p>
        </div>
        
        <div class="section">
          <div class="section-title">TERMS & CONDITIONS</div>
          <ol>
            <li>The Creator agrees to deliver the content as specified in the deliverables.</li>
            <li>The Brand agrees to make payment within 7 days of content approval.</li>
            <li>Both parties agree to maintain professional conduct throughout the collaboration.</li>
            <li>Any disputes will be resolved through mutual discussion or platform mediation.</li>
            <li>This agreement is legally binding upon acceptance by both parties.</li>
          </ol>
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <p><strong>For Brand:</strong> ${brandName}</p>
            <p>Signature: ___________________</p>
            <p>Date: ___________________</p>
          </div>
          <div class="signature-box">
            <p><strong>For Creator:</strong> ${creatorName}</p>
            <p>Signature: ___________________</p>
            <p>Date: ___________________</p>
          </div>
        </div>
        
        <div class="footer" style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
          <p>This is a digitally generated agreement. No physical signature required.</p>
          <p>Powered by Influenzia Club</p>
        </div>
      </body>
      </html>
    `;

    return {
      success: true,
      agreementHtml,
      agreementId: `AGR-${Date.now()}`
    };
  } catch (error) {
    console.error('Agreement generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
