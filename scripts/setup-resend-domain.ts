/**
 * Setup Resend Domain
 * Creates the preventiq.com domain in Resend and displays DNS records to add
 */

const RESEND_API_KEY = 're_GpPQkJU5_MVpcSg4d1VZYTQ5sVUU4LxZ2';

async function setupResendDomain() {
  try {
    console.log('Creating preventiq.com domain in Resend...\n');

    const response = await fetch('https://api.resend.com/domains', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'preventiq.com',
        region: 'us-east-1',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error creating domain:', data);
      
      // If domain already exists, try to get its details
      if (data.message?.includes('already exists')) {
        console.log('\nDomain already exists. Fetching existing domain details...\n');
        await getDomainDetails();
      }
      return;
    }

    console.log('✅ Domain created successfully!\n');
    console.log('Domain ID:', data.id);
    console.log('Status:', data.status);
    console.log('\n📋 DNS Records to add to your domain registrar:\n');
    
    if (data.records) {
      data.records.forEach((record: any, index: number) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  Type: ${record.type}`);
        console.log(`  Name: ${record.name}`);
        console.log(`  Value: ${record.value}`);
        console.log(`  Priority: ${record.priority || 'N/A'}`);
        console.log('');
      });
    }

    console.log('\n📝 Next steps:');
    console.log('1. Go to your domain registrar (GoDaddy, Namecheap, etc.)');
    console.log('2. Add the DNS records shown above');
    console.log('3. Wait 5-30 minutes for DNS propagation');
    console.log('4. Run this script again to verify the domain\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

async function getDomainDetails() {
  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error fetching domains:', data);
      return;
    }

    const preventiqDomain = data.data?.find((d: any) => d.name === 'preventiq.com');

    if (preventiqDomain) {
      console.log('Domain Details:');
      console.log('  ID:', preventiqDomain.id);
      console.log('  Name:', preventiqDomain.name);
      console.log('  Status:', preventiqDomain.status);
      console.log('  Region:', preventiqDomain.region);
      console.log('  Created:', preventiqDomain.created_at);
      
      if (preventiqDomain.status === 'verified') {
        console.log('\n✅ Domain is already verified! You can now send emails from noreply@preventiq.com');
      } else {
        console.log('\n⚠️ Domain is not yet verified. Please add the DNS records.');
        
        // Get detailed domain info to show DNS records
        const detailResponse = await fetch(`https://api.resend.com/domains/${preventiqDomain.id}`, {
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
        });
        
        const detailData = await detailResponse.json();
        
        if (detailData.records) {
          console.log('\n📋 DNS Records needed:\n');
          detailData.records.forEach((record: any, index: number) => {
            console.log(`Record ${index + 1}:`);
            console.log(`  Type: ${record.type}`);
            console.log(`  Name: ${record.name}`);
            console.log(`  Value: ${record.value}`);
            console.log(`  Priority: ${record.priority || 'N/A'}`);
            console.log('');
          });
        }
      }
    } else {
      console.log('preventiq.com domain not found.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
setupResendDomain();
