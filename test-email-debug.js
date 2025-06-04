const nodemailer = require('nodemailer');

// Try different configurations
const configs = [
  {
    name: 'Original Config',
    config: {
      host: 'mail.upstreamcreatives.co.za',
      port: 587,
      secure: false,
      auth: {
        user: 'devops@upstreamcreatives.co.za',
        pass: 'ceTWgaQXrDTTCYuRJg4'
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'SSL Config (Port 465)',
    config: {
      host: 'mail.upstreamcreatives.co.za',
      port: 465,
      secure: true,
      auth: {
        user: 'devops@upstreamcreatives.co.za',
        pass: 'ceTWgaQXrDTTCYuRJg4'
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'Alternative STARTTLS',
    config: {
      host: 'mail.upstreamcreatives.co.za',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'devops@upstreamcreatives.co.za',
        pass: 'ceTWgaQXrDTTCYuRJg4'
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    }
  },
  {
    name: 'Port 25 Config',
    config: {
      host: 'mail.upstreamcreatives.co.za',
      port: 25,
      secure: false,
      auth: {
        user: 'devops@upstreamcreatives.co.za',
        pass: 'ceTWgaQXrDTTCYuRJg4'
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  }
];

async function testConfig(name, config) {
  console.log(`\n🔄 Testing ${name}...`);
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   User: ${config.auth.user}`);
  
  try {
    const transporter = nodemailer.createTransport(config);
    
    // Test connection
    await transporter.verify();
    console.log(`✅ ${name} - Connection successful!`);
    
    // Send test email
    const testEmail = {
      from: '"EODSA Test" <devops@upstreamcreatives.co.za>',
      to: 'solisangelo882@gmail.com',
      subject: `EODSA Email Test - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px;">
            <h1 style="color: white; margin: 0;">🎉 Email Test Successful!</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">EODSA Email System - ${name}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333;">Email Configuration Test</h2>
            <p>This email confirms that your EODSA email system is working with the <strong>${name}</strong> configuration.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="color: #667eea;">Configuration Details:</h3>
              <p><strong>SMTP Host:</strong> ${config.host}</p>
              <p><strong>Port:</strong> ${config.port}</p>
              <p><strong>Secure:</strong> ${config.secure}</p>
              <p><strong>From Address:</strong> ${config.auth.user}</p>
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
    console.log(`✅ ${name} - Email sent successfully!`);
    console.log(`   Message ID: ${result.messageId}`);
    return true;
    
  } catch (error) {
    console.log(`❌ ${name} - Failed:`, error.message);
    if (error.code) {
      console.log(`   Error Code: ${error.code}`);
    }
    if (error.response) {
      console.log(`   Server Response: ${error.response}`);
    }
    return false;
  }
}

async function testAllConfigurations() {
  console.log('🔄 Testing multiple SMTP configurations for mail.upstreamcreatives.co.za...\n');
  
  for (const { name, config } of configs) {
    const success = await testConfig(name, config);
    if (success) {
      console.log(`\n🎉 SUCCESS! Use the "${name}" configuration in your application.`);
      console.log('📬 Check solisangelo882@gmail.com for the test email.');
      break;
    }
    
    // Wait a bit between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 Test completed. Check the results above to see which configuration works.');
}

testAllConfigurations(); 