const nodemailer = require('nodemailer');

// Email configuration (same as in your lib/email.ts)
const EMAIL_CONFIG = {
  host: 'mail.upstreamcreatives.co.za',
  port: 587,
  secure: false,
  auth: {
    user: 'devops@upstreamcreatives.co.za',
    pass: 'ceTWgaQXrDTTCYQuRJg4'
  },
  tls: {
    rejectUnauthorized: false
  }
};

const transporter = nodemailer.createTransport(EMAIL_CONFIG);

async function testEmailConnection() {
  console.log('🔄 Testing SMTP connection...');
  
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    console.log('📧 Sending test email...');
    
    const testEmail = {
      from: '"EODSA Test" <devops@upstreamcreatives.co.za>',
      to: 'solisangelo882@gmail.com',
      subject: 'EODSA Email System Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px;">
            <h1 style="color: white; margin: 0;">🎉 Email Test Successful!</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">EODSA Email System is Working</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333;">Email Configuration Test</h2>
            <p>This email confirms that your EODSA email system is properly configured and working.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="color: #667eea;">Configuration Details:</h3>
              <p><strong>SMTP Host:</strong> mail.upstreamcreatives.co.za</p>
              <p><strong>Port:</strong> 587 (STARTTLS)</p>
              <p><strong>From Address:</strong> devops@upstreamcreatives.co.za</p>
              <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
              EODSA Competition Management System
            </p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Check your inbox at solisangelo882@gmail.com');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Full error:', error);
  }
}

testEmailConnection(); 