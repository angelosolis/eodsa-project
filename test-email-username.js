const nodemailer = require('nodemailer');

// Test with different username formats
const configs = [
  {
    name: 'Username only',
    config: {
      host: 'mail.upstreamcreatives.co.za',
      port: 587,
      secure: false,
      auth: {
        user: 'devops',
        pass: 'ceTWgaQXrDTTCYuRJg4'
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'Username only SSL',
    config: {
      host: 'mail.upstreamcreatives.co.za',
      port: 465,
      secure: true,
      auth: {
        user: 'devops',
        pass: 'ceTWgaQXrDTTCYuRJg4'
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'No authentication (relay)',
    config: {
      host: 'mail.upstreamcreatives.co.za',
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
      // No auth section
    }
  }
];

async function testConfig(name, config) {
  console.log(`\n🔄 Testing ${name}...`);
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   User: ${config.auth?.user || 'No authentication'}`);
  
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
      text: `This is a test email from EODSA using ${name} configuration.`
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
  console.log('🔄 Testing alternative username formats and auth methods...\n');
  
  for (const { name, config } of configs) {
    const success = await testConfig(name, config);
    if (success) {
      console.log(`\n🎉 SUCCESS! Use the "${name}" configuration in your application.`);
      console.log('📬 Check solisangelo882@gmail.com for the test email.');
      return;
    }
    
    // Wait a bit between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n❌ All configurations failed. The email account may need to be verified or reconfigured.');
  console.log('\n💡 Suggestions:');
  console.log('   1. Verify the password is still correct');
  console.log('   2. Check if the email account is active');
  console.log('   3. Contact the hosting provider (Upstream Creatives) for SMTP settings');
  console.log('   4. Check if 2FA or app passwords are required');
}

testAllConfigurations(); 