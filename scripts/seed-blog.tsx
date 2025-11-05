import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://znslvmwmisjuwbdtvdpo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpuc2x2bXdtaXNqdXdiZHR2ZHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzNjU5MjgsImV4cCI6MjA0MDk0MTkyOH0.aREDTP_KhMq7sE0zc0hFukUj93aO5fYPeTPupmXi9Nk'
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'portal'
  }
});

async function main() {
  const uppcl = {
    title: 'Uttar Pradesh Power Corporation Limited (UPPCL) - Complete Guide',
    slug: 'uppcl-billing-guide',
    excerpt: 'The Uttar Pradesh Power Corporation Limited (UPPCL) is the primary electricity distribution company serving India\'s most populous state through five regional DISCOMs. Learn about their billing processes, payment methods, and more.',
    content: `<h2>Overview</h2>
<p>The Uttar Pradesh Power Corporation Limited (UPPCL) is the primary electricity distribution company serving India's most populous state through five regional DISCOMs. Operating a comprehensive online billing portal launched in 2023, UPPCL enables consumers to manage bills, register complaints, and monitor their power consumption.</p>

<p>The organization follows a monthly billing cycle and provides multiple payment options including digital and traditional methods to serve its vast consumer base of over 2.8 crore customers across domestic, commercial, industrial, and agricultural sectors.</p>

<p>UPPCL implements a slab-based tariff system. The corporation has modernized its operations by introducing smart metering in several cities to enhance billing accuracy and reduce losses while maintaining various channels for consumer grievance redressal including its website, mobile app, and toll-free helpline.</p>

<h2>The Five DISCOMs of Uttar Pradesh</h2>

<h3>Purvanchal Vidyut Vitran Nigam Limited (PuVVNL)</h3>
<ul>
  <li>Serves eastern UP</li>
  <li>Headquarters: Varanasi</li>
  <li>Covers districts like Varanasi, Gorakhpur, Prayagraj, Azamgarh</li>
  <li>Toll-free number: 1800-180-5025</li>
</ul>

<h3>Madhyanchal Vidyut Vitran Nigam Limited (MVVNL)</h3>
<ul>
  <li>Serves central UP</li>
  <li>Headquarters: Lucknow</li>
  <li>Covers districts like Lucknow, Hardoi, Unnao, Sitapur</li>
  <li>Toll-free number: 1800-1800-440</li>
</ul>

<h3>Paschimanchal Vidyut Vitran Nigam Limited (PVVNL)</h3>
<ul>
  <li>Serves western UP</li>
  <li>Headquarters: Meerut</li>
  <li>Covers districts like Meerut, Ghaziabad, Noida, Bulandshahr</li>
  <li>Toll-free number: 1800-180-3002</li>
</ul>

<h3>Dakshinanchal Vidyut Vitran Nigam Limited (DVVNL)</h3>
<ul>
  <li>Serves southern UP</li>
  <li>Headquarters: Agra</li>
  <li>Covers districts like Agra, Mathura, Aligarh, Etawah</li>
  <li>Toll-free number: 1800-180-3023</li>
</ul>

<h3>Kanpur Electricity Supply Company (KESCO)</h3>
<ul>
  <li>Serves Kanpur urban area only</li>
  <li>Headquarters: Kanpur</li>
  <li>Specifically focused on Kanpur city's power distribution</li>
  <li>Toll-free number: 1800-180-1912</li>
</ul>

<h2>How to Register a Complaint</h2>

<p>To register a complaint with UPPCL or any of its DISCOMs, follow these steps:</p>

<ol>
  <li>Go to the <a href="https://www.uppclonline.com" target="_blank">UPPCL website</a></li>
  <li>Navigate to the "COMPLAINT REGISTRATION" section</li>
  <li>Fill out the online form with your consumer number, address, contact information, and a description of the issue</li>
  <li>Select the appropriate category for your complaint</li>
  <li>Submit the form</li>
</ol>

<p>Alternatively, you can call the toll-free number for your specific DISCOM:</p>
<ul>
  <li>Purvanchal: 1800-180-5025</li>
  <li>Madhyanchal: 1800-1800-440</li>
  <li>Paschimanchal: 1800-180-3002</li>
  <li>Dakshinanchal: 1800-180-3023</li>
  <li>Kanpur: 1800-180-1912</li>
</ul>

<h2>Understanding Your UPPCL Bill</h2>

<p>A typical UPPCL bill (for example, PASC00000NATUL.pdf) has four main sections:</p>

<h3>1. Connection Details</h3>
<p>This section contains your consumer number, name, address, meter number, and connection type.</p>

<h3>2. Bill Summary</h3>
<p>This section includes important dates and amount information:</p>
<ul>
  <li>Bill date: When the bill was generated</li>
  <li>Due date: Last date to pay without penalty</li>
  <li>Disconnection date: Date after which supply may be disconnected</li>
  <li>Payable amount: Total amount due</li>
</ul>

<h3>3. Charges Component Details</h3>
<p>This section breaks down all charges, including:</p>
<ul>
  <li>Fixed charges based on your connection type</li>
  <li>Energy charges calculated on consumption</li>
  <li>Electricity duty</li>
  <li>Regulatory surcharge (if applicable)</li>
  <li>Any additional charges or adjustments</li>
</ul>

<h3>4. Meter Reading Details</h3>
<p>This section shows:</p>
<ul>
  <li>Previous reading date and value</li>
  <li>Current reading date and value</li>
  <li>Units consumed during the billing period</li>
  <li>Load factor (if applicable)</li>
</ul>

<h2>Payment Options</h2>

<p>UPPCL offers various payment methods for consumer convenience:</p>

<ul>
  <li>Online payment through the UPPCL portal</li>
  <li>Mobile app payment</li>
  <li>Payment at designated counters</li>
  <li>Payment through third-party apps like Paytm, PhonePe, Google Pay</li>
  <li>Bank payment (net banking, debit/credit cards)</li>
  <li>Common Service Centers (CSCs)</li>
</ul>

<p>After successful payment, you will receive a payment receipt (Payment_Receipt.pdf) which contains:</p>
<ul>
  <li>Reference No</li>
  <li>Collection Date</li>
  <li>Account No</li>
  <li>Consumer Name</li>
  <li>Address</li>
  <li>Paid amount</li>
  <li>Remaining Amount (if any)</li>
</ul>

<h2>Frequently Asked Questions</h2>

<p>For more information, please visit the <a href="https://www.uppclonline.com/dispatch/Portal/appmanager/uppcl/wss?_nfpb=true&_pageLabel=uppcl_static_html_content&pageID=ST_15" target="_blank">official UPPCL FAQ page</a>.</p>`,
    state: 'Uttar Pradesh',
    discom: 'UPPCL',
    published: true,
  };

  const purvanchal = {
    title: 'Purvanchal Vidyut Vitran Nigam Limited (PuVVNL) - Eastern UP Electricity',
    slug: 'purvvnl-eastern-up-electricity',
    excerpt: 'Purvanchal Vidyut Vitran Nigam Limited (PuVVNL) serves the eastern region of Uttar Pradesh including districts like Varanasi, Gorakhpur, Prayagraj, and Azamgarh.',
    content: `<h2>About Purvanchal Vidyut Vitran Nigam Limited (PuVVNL)</h2>
<p>Purvanchal Vidyut Vitran Nigam Limited (PuVVNL) is one of the five distribution companies (DISCOMs) under UPPCL that specifically serves the eastern region of Uttar Pradesh. With its headquarters in Varanasi, PuVVNL covers major districts including Varanasi, Gorakhpur, Prayagraj, Azamgarh, and other eastern UP districts.</p>

<h2>Coverage Area</h2>
<p>PuVVNL's service area includes the following major districts:</p>
<ul>
  <li>Varanasi</li>
  <li>Gorakhpur</li>
  <li>Prayagraj (Allahabad)</li>
  <li>Azamgarh</li>
  <li>Ballia</li>
  <li>Mau</li>
  <li>Ghazipur</li>
  <li>Jaunpur</li>
  <li>Chandauli</li>
  <li>Mirzapur</li>
  <li>Sonbhadra</li>
  <li>Basti</li>
  <li>Sant Kabir Nagar</li>
  <li>Siddharthnagar</li>
  <li>Kushinagar</li>
  <li>Deoria</li>
  <li>Maharajganj</li>
</ul>

<h2>Contact Information</h2>
<p><strong>Headquarters:</strong> Purvanchal Vidyut Vitran Nigam Limited, DLW, Bhikharipur, Varanasi, Uttar Pradesh - 221004</p>
<p><strong>Toll-free Helpline:</strong> 1800-180-5025</p>
<p><strong>Website:</strong> <a href="https://puvvnl.up.gov.in" target="_blank">https://puvvnl.up.gov.in</a></p>

<h2>Bill Payment Options</h2>
<p>Consumers under PuVVNL can pay their electricity bills through various methods:</p>
<ol>
  <li><strong>Online Payment:</strong> Through the UPPCL portal (uppclonline.com) or PuVVNL website</li>
  <li><strong>Mobile Apps:</strong> UPPCL mobile app or third-party payment apps like Paytm, PhonePe, Google Pay</li>
  <li><strong>Bill Payment Centers:</strong> Authorized collection centers across eastern UP</li>
  <li><strong>E-Mitra Kiosks:</strong> Government-authorized service centers</li>
  <li><strong>Banks:</strong> Selected banks that have tie-ups with PuVVNL</li>
</ol>

<h2>Complaint Registration</h2>
<p>To register complaints related to electricity supply, billing, or other issues in the PuVVNL area, consumers can:</p>
<ul>
  <li>Call the toll-free number: 1800-180-5025</li>
  <li>Register complaints online through the UPPCL portal</li>
  <li>Visit the nearest PuVVNL office</li>
  <li>Use the mobile app</li>
</ul>

<h2>New Connection Application</h2>
<p>For applying for a new electricity connection in the PuVVNL area:</p>
<ol>
  <li>Visit the UPPCL online portal or PuVVNL website</li>
  <li>Navigate to the "New Connection" section</li>
  <li>Fill out the online application form with all required details</li>
  <li>Upload necessary documents (ID proof, address proof, property ownership/rent agreement)</li>
  <li>Pay the application fee online</li>
  <li>Track your application status using the provided application number</li>
</ol>

<h2>Required Documents for New Connection</h2>
<ul>
  <li>Identity proof (Aadhaar card, PAN card, Voter ID)</li>
  <li>Address proof</li>
  <li>Property ownership document or rent agreement</li>
  <li>Passport-sized photographs</li>
  <li>Mobile number linked to Aadhaar (for verification)</li>
</ul>

<h2>Load Enhancement/Reduction</h2>
<p>To apply for load enhancement or reduction:</p>
<ol>
  <li>Log in to your account on the UPPCL portal</li>
  <li>Select the "Load Change Request" option</li>
  <li>Fill in the required details and specify the new load requirement</li>
  <li>Pay the applicable fees</li>
  <li>Submit the application</li>
</ol>

<h2>Tariff Structure</h2>
<p>PuVVNL follows the tariff structure approved by the Uttar Pradesh Electricity Regulatory Commission (UPERC). The tariff varies based on the category of connection:</p>
<ul>
  <li>Domestic (LMV-1)</li>
  <li>Commercial (LMV-2)</li>
  <li>Industrial (LMV-6 for small industries, HV-2 for larger ones)</li>
  <li>Agricultural (LMV-5)</li>
  <li>Public institutions and government departments</li>
</ul>

<p>The current tariff details can be checked on the official PuVVNL website or the UPERC website.</p>`,
    state: 'Uttar Pradesh',
    discom: 'PuVVNL',
    published: true,
  };

  const madhyanchal = {
    title: 'Madhyanchal Vidyut Vitran Nigam Limited (MVVNL) - Central UP Electricity Services',
    slug: 'mvvnl-central-up-electricity',
    excerpt: 'Madhyanchal Vidyut Vitran Nigam Limited (MVVNL) serves the central region of Uttar Pradesh including Lucknow, Hardoi, Unnao, and Sitapur districts.',
    content: `<h2>About Madhyanchal Vidyut Vitran Nigam Limited (MVVNL)</h2>
<p>Madhyanchal Vidyut Vitran Nigam Limited (MVVNL) is responsible for electricity distribution in central Uttar Pradesh. Headquartered in Lucknow, the state capital, MVVNL oversees power distribution, billing, and maintenance in key districts including Lucknow, Hardoi, Unnao, Sitapur, and several other central UP regions.</p>

<h2>Coverage Area</h2>
<p>MVVNL provides electricity distribution services to the following major districts:</p>
<ul>
  <li>Lucknow</li>
  <li>Hardoi</li>
  <li>Unnao</li>
  <li>Sitapur</li>
  <li>Lakhimpur Kheri</li>
  <li>Rae Bareli</li>
  <li>Barabanki</li>
  <li>Sultanpur</li>
  <li>Amethi</li>
  <li>Pratapgarh</li>
  <li>Gonda</li>
  <li>Bahraich</li>
  <li>Shravasti</li>
  <li>Balrampur</li>
</ul>

<h2>Contact Information</h2>
<p><strong>Headquarters:</strong> Madhyanchal Vidyut Vitran Nigam Limited, 4A, Gokhale Marg, Lucknow, Uttar Pradesh - 226001</p>
<p><strong>Toll-free Helpline:</strong> 1800-1800-440</p>
<p><strong>Website:</strong> <a href="https://mvvnl.in" target="_blank">https://mvvnl.in</a></p>

<h2>Bill Payment</h2>
<p>MVVNL offers various convenient options for bill payment:</p>
<ol>
  <li><strong>Online Payment:</strong> Through UPPCL portal or MVVNL website</li>
  <li><strong>Mobile Apps:</strong> UPPCL app or third-party payment apps (Paytm, PhonePe, Google Pay, etc.)</li>
  <li><strong>Bill Payment Centers:</strong> Authorized collection centers across central UP</li>
  <li><strong>E-Suvidha Centers:</strong> Government service centers</li>
  <li><strong>Banks:</strong> Net banking or over-the-counter at partner banks</li>
</ol>

<h2>Complaint Registration Process</h2>
<p>For issues related to power supply, billing discrepancies, or other concerns, MVVNL consumers can register complaints through:</p>
<ul>
  <li>Toll-free number: 1800-1800-440</li>
  <li>Online complaint registration on the UPPCL portal</li>
  <li>MVVNL website complaint section</li>
  <li>Visit to nearest electricity distribution office</li>
  <li>UPPCL mobile app</li>
</ul>

<h2>New Connection Process</h2>
<p>To apply for a new electricity connection in MVVNL service area:</p>
<ol>
  <li>Access the online application portal through UPPCL website</li>
  <li>Select "New Connection" option</li>
  <li>Fill the application form with personal details, connection type, and load requirement</li>
  <li>Upload required documents</li>
  <li>Pay application fee online</li>
  <li>Note down the application reference number for future tracking</li>
</ol>

<h2>Documents Required for New Connection</h2>
<ul>
  <li>Identity proof (Aadhaar, Voter ID, PAN card)</li>
  <li>Address proof (Aadhaar, passport, driving license)</li>
  <li>Property ownership document or rent agreement</li>
  <li>Recent passport-sized photograph</li>
  <li>Mobile number for OTP verification</li>
  <li>Email ID (optional)</li>
</ul>

<h2>Billing Cycle</h2>
<p>MVVNL follows a monthly billing cycle for most urban areas and bi-monthly for some rural areas. The billing is done zone-wise according to a pre-determined schedule. Consumers can check their billing cycle on their electricity bill or by logging into their account on the MVVNL website.</p>

<h2>Lucknow City Power Distribution</h2>
<p>As the state capital, Lucknow receives special attention under MVVNL's distribution network. The city is divided into multiple electricity distribution divisions for efficient management:</p>
<ul>
  <li>Lucknow Electric Supply Administration (LESA) - Central</li>
  <li>LESA - East</li>
  <li>LESA - West</li>
  <li>LESA - Trans-Gomti</li>
  <li>LESA - Alambagh</li>
</ul>

<h2>Smart Metering Initiative</h2>
<p>MVVNL is implementing smart metering in Lucknow and other major cities as part of the Smart Cities Mission. Smart meters provide benefits like:</p>
<ul>
  <li>Automatic meter reading</li>
  <li>Real-time consumption monitoring</li>
  <li>Prepaid options</li>
  <li>Improved billing accuracy</li>
  <li>Reduction in power theft</li>
</ul>

<h2>Tariff Categories</h2>
<p>MVVNL applies tariffs as per UPERC guidelines. Major categories include:</p>
<ul>
  <li><strong>LMV-1:</strong> Domestic/Residential connections</li>
  <li><strong>LMV-2:</strong> Commercial connections</li>
  <li><strong>LMV-4:</strong> Public lighting</li>
  <li><strong>LMV-5:</strong> Agricultural connections</li>
  <li><strong>LMV-6:</strong> Small and medium industries</li>
  <li><strong>HV-1/HV-2:</strong> Large industries and bulk supply</li>
</ul>`,
    state: 'Uttar Pradesh',
    discom: 'MVVNL',
    published: true,
  };

  // Add more blog posts for other states
  const maharashtra = {
    title: 'Maharashtra State Electricity Distribution Company Limited (MSEDCL) Overview',
    slug: 'msedcl-maharashtra-electricity',
    excerpt: 'MSEDCL, also known as Mahavitaran, is the largest electricity distribution utility in India, serving almost the entire state of Maharashtra except parts of Mumbai.',
    content: `<h2>About Maharashtra State Electricity Distribution Company Limited (MSEDCL)</h2>
<p>The Maharashtra State Electricity Distribution Company Limited (MSEDCL), also known as Mahavitaran, is one of the largest electricity distribution utilities in India. Formed after the restructuring of the Maharashtra State Electricity Board (MSEB) in June 2005, MSEDCL distributes electricity to almost the entire state of Maharashtra except parts of Mumbai, which are served by other distribution companies like Tata Power and Adani Electricity Mumbai Limited (AEML).</p>

<h2>Coverage Area</h2>
<p>MSEDCL serves a vast area including:</p>
<ul>
  <li>All rural areas of Maharashtra</li>
  <li>All urban areas except parts of Mumbai</li>
  <li>45,000+ villages and 457 towns</li>
  <li>Serves approximately 2.8 crore consumers</li>
</ul>

<h2>Contact Information</h2>
<p><strong>Headquarters:</strong> Prakashgad, Plot No.G-9, Anant Kanekar Marg, Bandra (East), Mumbai - 400051</p>
<p><strong>Toll-free Helpline:</strong> 1912 (24x7 for electricity complaints)</p>
<p><strong>Customer Care:</strong> 1800-212-3435, 1800-233-3435</p>
<p><strong>Website:</strong> <a href="https://www.mahadiscom.in" target="_blank">https://www.mahadiscom.in</a></p>

<h2>Bill Payment Options</h2>
<p>MSEDCL offers multiple payment channels:</p>
<ol>
  <li><strong>Online Payment:</strong> Through the MSEDCL website and mobile app</li>
  <li><strong>Mobile App:</strong> MSEDCL official mobile app available on Android and iOS</li>
  <li><strong>Third-party apps:</strong> Paytm, PhonePe, Google Pay, Amazon Pay, etc.</li>
  <li><strong>Collection Centers:</strong> Authorized collection centers across Maharashtra</li>
  <li><strong>ATMs:</strong> Selected bank ATMs that support bill payments</li>
  <li><strong>Net Banking:</strong> Direct payment through partner banks</li>
</ol>

<h2>Understanding Your MSEDCL Bill</h2>
<p>A typical MSEDCL bill contains the following sections:</p>
<ol>
  <li><strong>Customer Information:</strong> Consumer number, name, address, connection type</li>
  <li><strong>Bill Summary:</strong> Bill number, billing date, due date, bill amount</li>
  <li><strong>Consumption Details:</strong> Current meter reading, previous reading, units consumed</li>
  <li><strong>Charges Breakdown:</strong> Energy charges, fixed/demand charges, fuel adjustment charges, electricity duty, tax</li>
  <li><strong>Payment History:</strong> Previous bill details and payment status</li>
  <li><strong>Important Messages:</strong> Notices, announcements, and useful information</li>
</ol>

<h2>New Connection Process</h2>
<p>To apply for a new electricity connection with MSEDCL:</p>
<ol>
  <li>Visit the MSEDCL website or mobile app</li>
  <li>Select "New Connection" option</li>
  <li>Fill in the online application form</li>
  <li>Upload required documents</li>
  <li>Pay the application fee online</li>
  <li>Track application status using the provided application number</li>
</ol>

<h2>Documents Required for New Connection</h2>
<ul>
  <li>Identity proof (Aadhaar, PAN, Voter ID)</li>
  <li>Address proof</li>
  <li>Property ownership document or rent agreement with NOC from owner</li>
  <li>Recent passport-sized photograph</li>
  <li>Building plan approval (for commercial/industrial connections)</li>
</ul>

<h2>Tariff Categories</h2>
<p>MSEDCL categorizes consumers into different tariff categories:</p>
<ul>
  <li><strong>LT-I:</strong> Residential</li>
  <li><strong>LT-II:</strong> Non-Residential/Commercial</li>
  <li><strong>LT-III:</strong> Industry</li>
  <li><strong>LT-IV:</strong> Agricultural</li>
  <li><strong>LT-V:</strong> Public services (streetlights, water works, etc.)</li>
  <li><strong>HT-I:</strong> Industry</li>
  <li><strong>HT-II:</strong> Commercial</li>
  <li><strong>HT-III:</strong> Railways/Metro/Public services</li>
</ul>

<h2>Complaint Registration</h2>
<p>To register complaints related to power supply, billing, or other issues:</p>
<ul>
  <li>Call the 24x7 toll-free number: 1912</li>
  <li>Register complaint on the MSEDCL website or mobile app</li>
  <li>Send SMS to 9930399303</li>
  <li>Visit nearest MSEDCL office</li>
  <li>Email to consumergrievance@mahadiscom.in</li>
</ul>

<h2>Value-Added Services</h2>
<p>MSEDCL offers several value-added services to consumers:</p>
<ul>
  <li><strong>SMS Alerts:</strong> Bill generation, payment reminder, outage information</li>
  <li><strong>E-Billing:</strong> Receive bills via email</li>
  <li><strong>Auto-Pay:</strong> Automatic bill payment through standing instructions</li>
  <li><strong>Power Consumption Calculator:</strong> To estimate electricity usage</li>
  <li><strong>Scheduled Outage Information:</strong> Advance information about maintenance activities</li>
</ul>

<h2>Tips for Energy Conservation</h2>
<p>MSEDCL promotes energy conservation through these tips:</p>
<ul>
  <li>Use energy-efficient appliances with BEE star ratings</li>
  <li>Switch to LED bulbs instead of incandescent or CFL</li>
  <li>Set air conditioners at 24-26°C for optimal efficiency</li>
  <li>Turn off devices completely rather than leaving them on standby</li>
  <li>Regularly service appliances to maintain efficiency</li>
  <li>Use natural light during daytime</li>
</ul>`,
    state: 'Maharashtra',
    discom: 'MSEDCL',
    published: true,
  };

  // Insert blog posts
  try {

    // Clear existing blog posts
    const { error: clearError } = await supabase
      .from('blog_posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // A non-existent ID to clear all

    if (clearError) {
      console.error('Error clearing existing blog posts:', clearError);
      return;
    }

    // Insert new blog posts
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([uppcl, purvanchal, madhyanchal, maharashtra]);

    if (error) {
      console.error('Error inserting blog posts:', error);
      return;
    }

  } catch (err) {
    console.error('Error in seed process:', err);
  }
}

main(); 