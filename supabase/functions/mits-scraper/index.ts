import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// MITS website URL mappings for different topics
const MITS_URLS: Record<string, string[]> = {
  admissions: [
    'https://mits.ac.in/admissions',
    'https://mits.ac.in/admissions/ug-admissions',
    'https://mits.ac.in/admissions/pg-admissions',
  ],
  courses: [
    'https://mits.ac.in/academics',
    'https://mits.ac.in/academics/programs',
    'https://mits.ac.in/academics/departments',
  ],
  campus: [
    'https://mits.ac.in/infrastructure',
    'https://mits.ac.in/infrastructure/library',
    'https://mits.ac.in/infrastructure/hostels',
  ],
  faculty: [
    'https://mits.ac.in/faculty',
    'https://mits.ac.in/academics/departments',
  ],
  events: [
    'https://mits.ac.in/events',
    'https://mits.ac.in/news',
  ],
  support: [
    'https://mits.ac.in/placements',
    'https://mits.ac.in/student-services',
    'https://mits.ac.in/scholarships',
  ],
};

// Comprehensive fallback information when scraping fails
const FALLBACK_INFO: Record<string, string> = {
  admissions: `MITS Admissions Information:

B.Tech Admissions:
- Eligibility: 10+2 with Physics, Chemistry, Mathematics (minimum 45% marks)
- Entrance Exams: AP EAMCET, TS EAMCET, JEE Main
- Quotas: Convener Quota (70%), Management Quota (30%)
- Application Period: May to July
- Fee Structure: Approximately ₹1,00,000 - ₹1,50,000 per year (varies by quota)

M.Tech Admissions:
- Eligibility: B.Tech/B.E. with minimum 50% marks
- Entrance: GATE, AP PGECET
- Programs: CSE, VLSI, Power Electronics, Structural Engineering

MBA/MCA Admissions:
- MBA: Any bachelor's degree with 50% marks, AP ICET
- MCA: Bachelor's degree with Mathematics at 10+2 or degree level

Scholarships Available:
• AP Government Fee Reimbursement Scheme
• SC/ST/BC Scholarships
• Merit-based Institutional Scholarships
• EBC (Economically Backward Classes) Scholarships
• Sports Quota Scholarships

Contact: admissions@mits.ac.in, 08571-280255
Website: mits.ac.in/admissions`,

  courses: `MITS Academic Programs:

Undergraduate Programs (B.Tech - 4 years):
• Computer Science & Engineering (CSE) - 300 seats
• CSE - AI & Machine Learning - 120 seats
• CSE - Data Science - 60 seats
• CSE - Cyber Security - 60 seats
• Information Technology (IT) - 120 seats
• Electronics & Communication Engineering (ECE) - 180 seats
• Electrical & Electronics Engineering (EEE) - 120 seats
• Mechanical Engineering - 120 seats
• Civil Engineering - 60 seats

Postgraduate Programs:
• M.Tech CSE, VLSI, Power Electronics, Structural Engineering (2 years)
• MBA - Finance, Marketing, HR, Systems (2 years) - 120 seats
• MCA - Master of Computer Applications (2 years) - 60 seats

Doctoral Programs:
• Ph.D. in Engineering (all departments)
• Ph.D. in Management Studies
• Ph.D. in Basic Sciences

Affiliation: JNTUA Anantapur
Accreditation: NAAC A+ Grade, NBA Accredited`,

  campus: `MITS Campus Facilities:

Central Library:
• Collection: 50,000+ books and volumes
• Journals: 100+ national and international journals
• Digital Resources: IEEE, Springer, NPTEL, DELNET
• Timings: 8:00 AM - 10:00 PM (Monday to Saturday)
• Features: Reading halls, Digital section, Book bank facility

Hostels:
• Boys Hostels: 4 blocks, 1500+ capacity
• Girls Hostels: 2 blocks, 800+ capacity
• Facilities: Wi-Fi, Mess, RO Water, Hot Water, Recreation Room, Gymnasium
• 24/7 Security for girls hostel

Sports Facilities:
• Outdoor: Cricket Ground, Football Field, Volleyball, Basketball, Tennis, Athletic Track
• Indoor: Table Tennis, Badminton, Chess, Carrom, Gymnasium

Other Amenities:
• Cafeteria: Multiple food courts, 300+ seating
• Auditorium: 1500+ capacity, AC, fully equipped
• Wi-Fi Campus: High-speed internet across campus
• Medical Center: 24/7 first aid and medical assistance
• Transport: Bus facility for Madanapalle and nearby areas
• ATM, Stationery Store, Xerox Centers

Location: NH-205, Angallu, Madanapalle - 517325, Andhra Pradesh`,

  faculty: `MITS Faculty Information:

Departments:
• Computer Science & Engineering (CSE) - HOD: Dr. K. Subba Reddy
• Information Technology (IT)
• Electronics & Communication Engineering (ECE)
• Electrical & Electronics Engineering (EEE)
• Mechanical Engineering
• Civil Engineering
• MBA Department
• MCA Department
• Humanities & Sciences (H&S)

Faculty Highlights:
• 200+ qualified faculty members
• Many hold Ph.D. from premier institutions (IITs, NITs)
• Industry-experienced professionals
• Active research publications

Labs & Infrastructure:
• CSE: Programming, Data Structures, AI/ML, Network Labs
• ECE: Electronics, Communication, VLSI, Embedded Systems Labs
• EEE: Electrical Machines, Power Electronics, Control Systems Labs
• Mechanical: Workshop, CAD/CAM, Thermal Engineering Labs

For department-specific queries, contact the respective HOD.`,

  events: `MITS Events & Activities:

Technical Fests:
• YUKTA - Annual National Level Technical Fest (March)
  - Paper presentations, coding competitions, robotics
  - Workshops, hackathons, project exhibitions
• Hackathons - Quarterly coding and innovation challenges

Cultural Events:
• AURA - Annual Cultural Night (February)
  - Music, dance, drama performances
  - Fashion show, talent hunt
• Freshers Day - Welcome for new students (August)
• Farewell - Send-off for graduating batch (April)

Academic Events:
• Guest Lectures - Monthly sessions by industry experts
• Workshops & Seminars - Regular technical training
• Project Exhibitions - End of each semester
• Industrial Visits - As per academic calendar

Sports:
• Annual Sports Meet - January
• Inter-departmental tournaments
• Inter-college competitions

Convocation: Annual Graduation Ceremony (April)`,

  support: `MITS Student Support Services:

Training & Placement Cell:
• Average Package: 4-6 LPA
• Highest Package: 18+ LPA
• Placement Rate: 80%+
• 150+ recruiting companies

Top Recruiters:
TCS, Infosys, Wipro, Cognizant, Tech Mahindra, HCL, Capgemini, 
Accenture, IBM, Amazon, Deloitte, Zoho, and many more

Training Programs:
• Aptitude Training, Soft Skills Development
• Technical Training, Mock Interviews
• Resume Building Workshops

Student Clubs:
• Coding Club, Robotics Club, Literary Club
• Music Club, Dance Club, Photography Club
• NSS (National Service Scheme)
• NCC (National Cadet Corps)

Support Services:
• Student Counseling Center: Academic, career, personal counseling
• Grievance Redressal Cell: Online complaint portal
• Anti-Ragging Committee: 24/7 helpline, zero-tolerance policy
• Examination Cell: Schedules, results, revaluation

Contact: placement@mits.ac.in`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    const normalizedTopic = topic?.toLowerCase() || 'general';
    
    console.log(`Fetching MITS info for topic: ${normalizedTopic}`);

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    // If Firecrawl is configured, try to scrape live data
    if (apiKey) {
      const urls = MITS_URLS[normalizedTopic] || ['https://mits.ac.in'];
      
      try {
        // Scrape the first relevant URL
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: urls[0],
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const content = scrapeData.data?.markdown || scrapeData.markdown;
          
          if (content && content.length > 100) {
            console.log(`Successfully scraped ${urls[0]}`);
            return new Response(
              JSON.stringify({ 
                success: true, 
                content,
                source: urls[0],
                topic: normalizedTopic,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (scrapeError) {
        console.error('Scraping error:', scrapeError);
      }
    }

    // Return fallback information
    const fallbackContent = FALLBACK_INFO[normalizedTopic] || FALLBACK_INFO.campus;
    console.log(`Using fallback info for: ${normalizedTopic}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        content: fallbackContent,
        source: 'local',
        topic: normalizedTopic,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        content: 'I apologize, but I could not retrieve the information. Please contact the college office at 08571-280255 or visit mits.ac.in for details.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
