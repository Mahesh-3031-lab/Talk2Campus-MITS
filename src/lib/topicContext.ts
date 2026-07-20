// Topic definitions for homepage feature cards
export type TopicId = 'admissions' | 'courses' | 'campus' | 'faculty' | 'events' | 'support';

export interface TopicConfig {
  id: TopicId;
  title: string;
  description: string;
  initialPrompt: string;
  followUpQuestions: string[];
}

export const TOPIC_CONFIGS: Record<TopicId, TopicConfig> = {
  admissions: {
    id: 'admissions',
    title: 'Admissions',
    description: 'Get instant answers about admission procedures, eligibility criteria, and application deadlines.',
    initialPrompt: 'I want to know about admissions at MITS. Please explain the admission procedures, eligibility criteria, important dates, and how to apply.',
    followUpQuestions: [
      'What is the eligibility for B.Tech admission?',
      'When are the application deadlines?',
      'How can I apply for scholarships?',
      'What is the fee structure?',
    ],
  },
  courses: {
    id: 'courses',
    title: 'Courses & Programs',
    description: 'Explore available courses, curriculum details, and specialization options across departments.',
    initialPrompt: 'Tell me about the courses and academic programs available at MITS. What are the undergraduate, postgraduate, and doctoral programs offered?',
    followUpQuestions: [
      'What specializations are available in B.Tech CSE?',
      'Tell me about the MBA program.',
      'What are the Ph.D. research areas?',
      'Which department should I choose?',
    ],
  },
  campus: {
    id: 'campus',
    title: 'Campus Info',
    description: 'Discover campus facilities, hostels, labs, libraries, and amenities available at MITS.',
    initialPrompt: 'I want to explore the MITS campus. Tell me about the facilities, hostels, library, labs, and other amenities available.',
    followUpQuestions: [
      'How is the hostel facility?',
      'What are the library timings?',
      'Tell me about the sports facilities.',
      'Is there Wi-Fi on campus?',
    ],
  },
  faculty: {
    id: 'faculty',
    title: 'Faculty & Staff',
    description: 'Find information about faculty members, departments, and administrative contacts.',
    initialPrompt: 'Tell me about the faculty and staff at MITS. Which departments are there and who are the key faculty members?',
    followUpQuestions: [
      'Who is the CSE department HOD?',
      'How many faculty have Ph.D.?',
      'How can I contact a professor?',
      'Tell me about the principal.',
    ],
  },
  events: {
    id: 'events',
    title: 'Events & Activities',
    description: 'Stay updated with academic calendar, fests, seminars, and extracurricular activities.',
    initialPrompt: 'What events and activities happen at MITS? Tell me about fests, workshops, seminars, and the academic calendar.',
    followUpQuestions: [
      'When is the tech fest YUKTA?',
      'Are there cultural events?',
      'What workshops are coming up?',
      'When is the annual sports meet?',
    ],
  },
  support: {
    id: 'support',
    title: 'Student Support',
    description: 'Access guidance on scholarships, placements, internships, and student services.',
    initialPrompt: 'I need information about student support services at MITS. Tell me about placements, scholarships, counseling, and other support available.',
    followUpQuestions: [
      'What companies visit for placements?',
      'How to apply for scholarships?',
      'Is there a counseling center?',
      'How does the internship program work?',
    ],
  },
};

// Get topic config by ID
export const getTopicConfig = (topicId: TopicId): TopicConfig => {
  return TOPIC_CONFIGS[topicId];
};
