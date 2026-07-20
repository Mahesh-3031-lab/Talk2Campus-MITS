// Comprehensive offline information about MITS - Madanapalle Institute of Technology and Science

export const COLLEGE_INFO = {
  name: "Madanapalle Institute of Technology & Science (MITS)",
  established: 1998,
  location: "Madanapalle, Annamayya District, Andhra Pradesh, India",
  affiliation: "Jawaharlal Nehru Technological University Anantapur (JNTUA)",
  accreditation: "NAAC A+ Grade, NBA Accredited",
  website: "https://mits.ac.in",
  contact: {
    phone: "08571-280255",
    email: "info@mits.ac.in",
    admissions: "admissions@mits.ac.in",
    placements: "placement@mits.ac.in",
  },
  address: "NH-205, Angallu, Madanapalle - 517325, Andhra Pradesh, India",

  about: `Madanapalle Institute of Technology & Science (MITS) is a premier engineering institution established in 1998. 
Located in Madanapalle, Andhra Pradesh, MITS is affiliated to JNTUA and has earned NAAC A+ accreditation. 
The institute offers undergraduate, postgraduate, and doctoral programs in various engineering disciplines. 
With a sprawling green campus, state-of-the-art facilities, and dedicated faculty, MITS has established itself 
as a center of excellence in technical education in South India.`,

  vision: "To be a globally recognized institution of higher learning that nurtures innovation, research, and holistic development.",
  
  mission: [
    "Provide quality technical education with industry-relevant curriculum",
    "Foster research and innovation among students and faculty",
    "Develop ethical, socially responsible professionals",
    "Establish strong industry-academia partnerships",
  ],
};

export const PROGRAMS = {
  undergraduate: [
    { name: "B.Tech Computer Science & Engineering (CSE)", duration: "4 years", seats: 300 },
    { name: "B.Tech CSE - AI & Machine Learning", duration: "4 years", seats: 120 },
    { name: "B.Tech CSE - Data Science", duration: "4 years", seats: 60 },
    { name: "B.Tech CSE - Cyber Security", duration: "4 years", seats: 60 },
    { name: "B.Tech Information Technology (IT)", duration: "4 years", seats: 120 },
    { name: "B.Tech Electronics & Communication Engineering (ECE)", duration: "4 years", seats: 180 },
    { name: "B.Tech Electrical & Electronics Engineering (EEE)", duration: "4 years", seats: 120 },
    { name: "B.Tech Mechanical Engineering", duration: "4 years", seats: 120 },
    { name: "B.Tech Civil Engineering", duration: "4 years", seats: 60 },
  ],
  postgraduate: [
    { name: "M.Tech Computer Science & Engineering", duration: "2 years", seats: 24 },
    { name: "M.Tech VLSI & Embedded Systems", duration: "2 years", seats: 18 },
    { name: "M.Tech Power Electronics", duration: "2 years", seats: 18 },
    { name: "M.Tech Structural Engineering", duration: "2 years", seats: 18 },
    { name: "MBA - Master of Business Administration", duration: "2 years", seats: 120 },
    { name: "MCA - Master of Computer Applications", duration: "2 years", seats: 60 },
  ],
  doctoral: [
    { name: "Ph.D. in Engineering (All Departments)", duration: "3-5 years" },
    { name: "Ph.D. in Management Studies", duration: "3-5 years" },
    { name: "Ph.D. in Basic Sciences", duration: "3-5 years" },
  ],
};

export const ADMISSIONS = {
  ugProcess: {
    title: "B.Tech Admissions",
    eligibility: "10+2 with Physics, Chemistry, and Mathematics with minimum 45% marks",
    entranceExams: ["AP EAMCET", "TS EAMCET", "JEE Main"],
    quotas: ["Convener Quota (70%)", "Management Quota (30%)"],
    applicationPeriod: "May - July (approximately)",
  },
  pgProcess: {
    title: "M.Tech/MBA/MCA Admissions",
    eligibility: {
      mtech: "B.Tech/B.E. with minimum 50% marks",
      mba: "Bachelor's degree with minimum 50% marks",
      mca: "Bachelor's degree with Mathematics at 10+2 or degree level",
    },
    entranceExams: ["AP PGECET", "GATE (for M.Tech)", "AP ICET (for MBA/MCA)"],
    applicationPeriod: "June - August (approximately)",
  },
  feeStructure: {
    btech: "Approximately ₹1,00,000 - ₹1,50,000 per year (varies by quota)",
    mtech: "Approximately ₹50,000 - ₹75,000 per year",
    mba: "Approximately ₹60,000 - ₹80,000 per year",
    mca: "Approximately ₹50,000 - ₹70,000 per year",
    note: "Fee structure may vary. Please contact admissions office for current rates.",
  },
  scholarships: [
    "AP Government Fee Reimbursement Scheme",
    "SC/ST/BC Scholarships",
    "Merit-based Institutional Scholarships",
    "EBC (Economically Backward Classes) Scholarships",
    "Sports Quota Scholarships",
  ],
};

export const DEPARTMENTS = [
  {
    name: "Computer Science & Engineering",
    code: "CSE",
    hod: "Dr. K. Subba Reddy",
    programs: ["B.Tech CSE", "B.Tech AI&ML", "B.Tech Data Science", "B.Tech Cyber Security", "M.Tech CSE", "Ph.D."],
    labs: ["Programming Lab", "Data Structures Lab", "DBMS Lab", "AI/ML Lab", "Network Lab", "Project Lab"],
  },
  {
    name: "Information Technology",
    code: "IT",
    programs: ["B.Tech IT"],
    labs: ["IT Workshop", "Web Technologies Lab", "Software Engineering Lab"],
  },
  {
    name: "Electronics & Communication Engineering",
    code: "ECE",
    programs: ["B.Tech ECE", "M.Tech VLSI", "Ph.D."],
    labs: ["Electronics Lab", "Communication Lab", "VLSI Lab", "Microprocessor Lab", "Embedded Systems Lab"],
  },
  {
    name: "Electrical & Electronics Engineering",
    code: "EEE",
    programs: ["B.Tech EEE", "M.Tech Power Electronics", "Ph.D."],
    labs: ["Electrical Machines Lab", "Power Electronics Lab", "Control Systems Lab", "High Voltage Lab"],
  },
  {
    name: "Mechanical Engineering",
    code: "MECH",
    programs: ["B.Tech Mechanical", "Ph.D."],
    labs: ["Workshop", "Thermal Engineering Lab", "CAD/CAM Lab", "Fluid Mechanics Lab", "Metallurgy Lab"],
  },
  {
    name: "Civil Engineering",
    code: "CIVIL",
    programs: ["B.Tech Civil", "M.Tech Structural", "Ph.D."],
    labs: ["Surveying Lab", "Concrete Lab", "Soil Mechanics Lab", "Environmental Lab", "CAD Lab"],
  },
  {
    name: "MBA Department",
    code: "MBA",
    programs: ["MBA"],
    specializations: ["Finance", "Marketing", "Human Resources", "Systems"],
  },
  {
    name: "MCA Department",
    code: "MCA",
    programs: ["MCA"],
  },
  {
    name: "Humanities & Sciences",
    code: "H&S",
    subjects: ["Mathematics", "Physics", "Chemistry", "English", "Environmental Science"],
  },
];

export const CAMPUS_FACILITIES = {
  library: {
    name: "Central Library",
    books: "50,000+ volumes",
    journals: "100+ national and international journals",
    digitalResources: ["IEEE", "Springer", "NPTEL", "DELNET"],
    timings: "8:00 AM - 10:00 PM (Monday to Saturday)",
    features: ["Reading halls", "Digital section", "Reference section", "Book bank facility"],
  },
  hostels: {
    boys: {
      blocks: 4,
      capacity: "1500+ students",
      facilities: ["Wi-Fi", "Mess", "RO Water", "Hot Water", "Recreation Room", "Gymnasium"],
    },
    girls: {
      blocks: 2,
      capacity: "800+ students",
      facilities: ["Wi-Fi", "Mess", "RO Water", "Hot Water", "Recreation Room", "24/7 Security"],
    },
    messMenu: "Vegetarian and Non-vegetarian options available",
  },
  sports: {
    outdoor: ["Cricket Ground", "Football Field", "Volleyball Court", "Basketball Court", "Tennis Court", "Athletic Track"],
    indoor: ["Table Tennis", "Chess", "Carrom", "Badminton Court", "Gymnasium"],
    events: ["Annual Sports Meet", "Inter-departmental tournaments", "Inter-college competitions"],
  },
  otherFacilities: [
    { name: "Cafeteria", description: "Multiple food courts with seating for 300+" },
    { name: "Auditorium", description: "1500+ seating capacity, AC, equipped for seminars and cultural events" },
    { name: "Wi-Fi Campus", description: "High-speed internet across campus" },
    { name: "ATM", description: "On-campus banking facilities" },
    { name: "Medical Center", description: "24/7 first aid and medical assistance" },
    { name: "Transport", description: "Bus facility covering Madanapalle and nearby areas" },
    { name: "Stationery Store", description: "Books, supplies, and printing services" },
    { name: "Xerox Centers", description: "Multiple photocopying facilities" },
  ],
};

export const PLACEMENTS = {
  overview: {
    averagePackage: "4-6 LPA",
    highestPackage: "18+ LPA",
    placementRate: "80%+",
    recruiters: "150+ companies",
  },
  topRecruiters: [
    "TCS", "Infosys", "Wipro", "Cognizant", "Tech Mahindra",
    "HCL", "Capgemini", "Accenture", "IBM", "Amazon",
    "Deloitte", "KPMG", "L&T Infotech", "Mindtree", "Mphasis",
    "Zoho", "Virtusa", "NTT Data", "DXC Technology", "Hexaware",
  ],
  trainingPrograms: [
    "Aptitude Training",
    "Soft Skills Development",
    "Technical Training",
    "Mock Interviews",
    "Group Discussions",
    "Resume Building Workshops",
  ],
  internships: "Summer internship programs with partner companies",
  contact: "Training & Placement Cell: placement@mits.ac.in",
};

export const EVENTS = {
  technicalFests: [
    { name: "YUKTA", description: "Annual National Level Technical Fest", month: "March" },
    { name: "Hackathons", description: "Coding competitions and innovation challenges", frequency: "Quarterly" },
  ],
  culturalEvents: [
    { name: "AURA", description: "Annual Cultural Night with music, dance, and drama", month: "February" },
    { name: "Freshers Day", description: "Welcome event for new students", month: "August" },
    { name: "Farewell", description: "Send-off for graduating batch", month: "April" },
  ],
  academicEvents: [
    { name: "Guest Lectures", frequency: "Monthly" },
    { name: "Workshops & Seminars", frequency: "Regular" },
    { name: "Project Exhibitions", frequency: "End of each semester" },
    { name: "Industrial Visits", frequency: "As per academic calendar" },
  ],
  sportsMeet: { name: "Annual Sports Meet", month: "January" },
  convocation: { name: "Graduation Ceremony", month: "April" },
};

export const STUDENT_SUPPORT = {
  counseling: {
    name: "Student Counseling Center",
    services: ["Academic counseling", "Career guidance", "Personal counseling", "Mental health support"],
  },
  grievance: {
    name: "Grievance Redressal Cell",
    description: "Online portal for student complaints and feedback",
  },
  antiRagging: {
    name: "Anti-Ragging Committee",
    helpline: "Available 24/7",
    policy: "Strict zero-tolerance policy against ragging",
  },
  examination: {
    name: "Examination Cell",
    services: ["Exam schedules", "Hall tickets", "Results", "Revaluation requests"],
  },
  clubs: [
    "Coding Club",
    "Robotics Club",
    "Literary Club",
    "Music Club",
    "Dance Club",
    "Photography Club",
    "NSS (National Service Scheme)",
    "NCC (National Cadet Corps)",
  ],
};

// Helper function to get topic-specific information
export const getTopicInfo = (topic: string): string => {
  switch (topic.toLowerCase()) {
    case 'admissions':
      return `
MITS Admissions Information:

B.Tech Admissions:
- Eligibility: 10+2 with PCM, minimum 45% marks
- Entrance Exams: AP EAMCET, TS EAMCET, JEE Main
- Application Period: May to July
- Fee: Approximately ₹1,00,000 - ₹1,50,000 per year

M.Tech/MBA/MCA Admissions:
- M.Tech: B.Tech with 50% marks, GATE/PGECET
- MBA: Any degree with 50%, AP ICET
- MCA: Degree with Mathematics

Scholarships Available:
${ADMISSIONS.scholarships.map(s => `• ${s}`).join('\n')}

Contact: ${COLLEGE_INFO.contact.admissions}, ${COLLEGE_INFO.contact.phone}
      `.trim();

    case 'courses':
      return `
MITS Academic Programs:

Undergraduate Programs (B.Tech - 4 years):
${PROGRAMS.undergraduate.map(p => `• ${p.name} - ${p.seats} seats`).join('\n')}

Postgraduate Programs:
${PROGRAMS.postgraduate.map(p => `• ${p.name} - ${p.duration}`).join('\n')}

Doctoral Programs:
${PROGRAMS.doctoral.map(p => `• ${p.name}`).join('\n')}

Affiliation: JNTUA | Accreditation: NAAC A+, NBA
      `.trim();

    case 'campus':
      return `
MITS Campus Facilities:

Library:
• ${CAMPUS_FACILITIES.library.books} books
• Timings: ${CAMPUS_FACILITIES.library.timings}
• Digital Resources: ${CAMPUS_FACILITIES.library.digitalResources.join(', ')}

Hostels:
• Boys: ${CAMPUS_FACILITIES.hostels.boys.blocks} blocks, ${CAMPUS_FACILITIES.hostels.boys.capacity}
• Girls: ${CAMPUS_FACILITIES.hostels.girls.blocks} blocks, ${CAMPUS_FACILITIES.hostels.girls.capacity}
• Facilities: Wi-Fi, Mess, Hot Water, Gym

Sports:
• Outdoor: ${CAMPUS_FACILITIES.sports.outdoor.join(', ')}
• Indoor: ${CAMPUS_FACILITIES.sports.indoor.join(', ')}

Other Facilities:
${CAMPUS_FACILITIES.otherFacilities.map(f => `• ${f.name}: ${f.description}`).join('\n')}
      `.trim();

    case 'faculty':
      return `
MITS Departments & Faculty:

${DEPARTMENTS.map(d => `${d.name} (${d.code}):
• Programs: ${d.programs.join(', ')}${d.hod ? `\n• HOD: ${d.hod}` : ''}`).join('\n\n')}

Total Faculty: 200+ qualified members
Many faculty hold Ph.D. from premier institutions

For specific faculty information, please contact the respective department.
      `.trim();

    case 'events':
      return `
MITS Events & Activities:

Technical Fests:
${EVENTS.technicalFests.map(e => `• ${e.name} - ${e.description} (${e.month || e.frequency})`).join('\n')}

Cultural Events:
${EVENTS.culturalEvents.map(e => `• ${e.name} - ${e.description} (${e.month})`).join('\n')}

Academic Events:
${EVENTS.academicEvents.map(e => `• ${e.name} - ${e.frequency}`).join('\n')}

Sports: ${EVENTS.sportsMeet.name} - ${EVENTS.sportsMeet.month}
Convocation: ${EVENTS.convocation.month}
      `.trim();

    case 'support':
      return `
MITS Student Support Services:

Placements:
• Average Package: ${PLACEMENTS.overview.averagePackage}
• Highest Package: ${PLACEMENTS.overview.highestPackage}
• Top Recruiters: ${PLACEMENTS.topRecruiters.slice(0, 10).join(', ')}

Counseling: ${STUDENT_SUPPORT.counseling.services.join(', ')}

Student Clubs:
${STUDENT_SUPPORT.clubs.map(c => `• ${c}`).join('\n')}

Grievance Redressal: Online complaint portal available
Anti-Ragging: 24/7 helpline with zero-tolerance policy

Contact: ${COLLEGE_INFO.contact.placements}
      `.trim();

    default:
      return `
About MITS:
${COLLEGE_INFO.about}

Location: ${COLLEGE_INFO.location}
Contact: ${COLLEGE_INFO.contact.phone}
Website: ${COLLEGE_INFO.website}
      `.trim();
  }
};
