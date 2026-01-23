/**
 * AO (Admissions Officer) Insights by School
 * What each school values, how AOs think, and what they look for
 *
 * Based on:
 * - Public AO interviews and talks
 * - Admissions consultant research
 * - Published admissions criteria
 */

export interface SchoolAOInsights {
  schoolId: string;
  values: {
    trait: string;
    description: string;
    keywords: string[];
  }[];
  commonMistakes: string[];
  whatTheyLove: string[];
  readingProcess: {
    timeSpent: string;
    whatTheyNotice: string[];
    instantTurnoffs: string[];
  };
}

export const AO_INSIGHTS_BY_SCHOOL: Record<string, SchoolAOInsights> = {
  harvard: {
    schoolId: 'harvard',
    values: [
      {
        trait: 'Intellectual Curiosity',
        description: 'Genuine love of learning, not just achievement',
        keywords: ['curious', 'question', 'wonder', 'explore', 'discover', 'fascinated'],
      },
      {
        trait: 'Leadership with Impact',
        description: 'Leading to make change, not for resume',
        keywords: ['led', 'founded', 'organized', 'changed', 'impact', 'initiative'],
      },
      {
        trait: 'Character & Integrity',
        description: 'Who you are matters as much as what you do',
        keywords: ['integrity', 'honest', 'values', 'believe', 'stand for'],
      },
      {
        trait: 'Community Contribution',
        description: 'How you\'ll add to campus life',
        keywords: ['community', 'contribute', 'together', 'collaborate', 'house'],
      },
    ],
    commonMistakes: [
      'Focusing on Harvard\'s prestige rather than fit',
      'Name-dropping professors without substance',
      'Writing about achievement instead of growth',
      'Being too polished - losing authentic voice',
    ],
    whatTheyLove: [
      'Students who would be interesting dorm-room conversationalists',
      'Genuine intellectual passion beyond required coursework',
      'Evidence of impact on others, not just personal achievement',
      'Specific knowledge of Harvard programs (Gen Ed, House system)',
    ],
    readingProcess: {
      timeSpent: '8-12 minutes on first read',
      whatTheyNotice: [
        'First sentence - is this going to be interesting?',
        'Does the essay reveal something not in the rest of the application?',
        'Would I want this student in my freshman seminar?',
        'Is this genuinely their voice or coached/AI?',
      ],
      instantTurnoffs: [
        '"I have always wanted to go to Harvard"',
        '"Harvard is the best school in the world"',
        'Focusing on networking or career outcomes',
        'Dictionary definitions or famous quotes as openers',
      ],
    },
  },

  yale: {
    schoolId: 'yale',
    values: [
      {
        trait: 'Intellectual Depth',
        description: 'Deep thinkers who pursue ideas for their own sake',
        keywords: ['think', 'ideas', 'question', 'understand', 'philosophy', 'theory'],
      },
      {
        trait: 'Creative Expression',
        description: 'Artists, writers, performers - creativity matters',
        keywords: ['create', 'art', 'music', 'write', 'perform', 'design', 'imagine'],
      },
      {
        trait: 'Community Spirit',
        description: 'Yale is about residential college life',
        keywords: ['community', 'together', 'belong', 'residential', 'college'],
      },
      {
        trait: 'Quirky Interests',
        description: 'Yale loves "weirdly passionate" students',
        keywords: ['obsessed', 'fascinated', 'unusual', 'unique', 'collection', 'hobby'],
      },
    ],
    commonMistakes: [
      'Comparing Yale to Harvard (instant red flag)',
      'Being too serious - Yale appreciates humor and quirkiness',
      'Ignoring residential college culture',
      'Focusing only on academics, missing arts and community',
    ],
    whatTheyLove: [
      'Students with unusual, deep passions',
      'Those who understand residential college culture',
      'People who will sing in the Whiffenpoofs or write for the Daily News',
      'Thinkers who connect disparate ideas in interesting ways',
    ],
    readingProcess: {
      timeSpent: '6-10 minutes on first read',
      whatTheyNotice: [
        'Is this student interesting and intellectually alive?',
        'Will they contribute to residential college life?',
        'Do they have genuine depth, or just breadth?',
        'Is there something delightfully quirky about them?',
      ],
      instantTurnoffs: [
        '"Yale is my second choice after Harvard"',
        'Focus on pre-professional outcomes only',
        'Generic intellectual virtue signaling',
        'Not understanding what makes Yale unique',
      ],
    },
  },

  princeton: {
    schoolId: 'princeton',
    values: [
      {
        trait: 'Service Commitment',
        description: '"In the Nation\'s Service" is the motto - mean it',
        keywords: ['service', 'help', 'community', 'give back', 'volunteer', 'impact'],
      },
      {
        trait: 'Honor & Integrity',
        description: 'The honor code matters deeply',
        keywords: ['honor', 'integrity', 'honest', 'ethics', 'truth', 'trust'],
      },
      {
        trait: 'Independent Thinking',
        description: 'Senior thesis culture values original thought',
        keywords: ['research', 'question', 'discover', 'thesis', 'independent', 'original'],
      },
      {
        trait: 'Undergraduate Focus',
        description: 'Princeton is undergrad-focused - appreciate that',
        keywords: ['undergraduate', 'teaching', 'professor', 'mentor', 'learn'],
      },
    ],
    commonMistakes: [
      'Service that sounds like resume padding',
      'Ignoring the honor code and academic integrity',
      'Not understanding Princeton\'s undergraduate focus',
      'Writing about service to "less fortunate" (savior complex)',
    ],
    whatTheyLove: [
      'Genuine service commitment with reflection',
      'Students excited about the senior thesis',
      'Those who appreciate close faculty relationships',
      'People who understand Princeton\'s eating club culture',
    ],
    readingProcess: {
      timeSpent: '8-10 minutes on first read',
      whatTheyNotice: [
        'Is service genuine or for college apps?',
        'Will this student uphold our honor code?',
        'Are they excited about independent research?',
        'Do they want Princeton specifically, or just prestige?',
      ],
      instantTurnoffs: [
        '"I helped the less fortunate"',
        'Service trips that sound like tourism',
        'Focus on prestige over education',
        'Not knowing about precepts or independent work',
      ],
    },
  },

  brown: {
    schoolId: 'brown',
    values: [
      {
        trait: 'Self-Direction',
        description: 'Open Curriculum requires knowing yourself',
        keywords: ['choose', 'explore', 'decide', 'path', 'own', 'direct'],
      },
      {
        trait: 'Intellectual Risk-Taking',
        description: 'Willing to fail in pursuit of learning',
        keywords: ['risk', 'try', 'fail', 'experiment', 'challenge', 'push'],
      },
      {
        trait: 'Interdisciplinary Thinking',
        description: 'Crossing boundaries between fields',
        keywords: ['connect', 'combine', 'interdisciplinary', 'both', 'bridge'],
      },
      {
        trait: 'Authenticity',
        description: 'Brown wants real people, not polished applicants',
        keywords: ['real', 'honest', 'genuine', 'true', 'myself'],
      },
    ],
    commonMistakes: [
      'Saying you want Brown because it\'s "less stressful"',
      'Wanting Open Curriculum to avoid subjects you don\'t like',
      'Being too polished - Brown wants authenticity',
      'Not demonstrating self-direction in your history',
    ],
    whatTheyLove: [
      'Students who\'ve already shown self-directed learning',
      'Interdisciplinary thinkers who connect ideas',
      'People unafraid to be different or weird',
      'Those who understand what Open Curriculum really means',
    ],
    readingProcess: {
      timeSpent: '6-8 minutes on first read',
      whatTheyNotice: [
        'Have they actually directed their own learning?',
        'Will they thrive without required courses?',
        'Is this a conformist trying to seem unconventional?',
        'Do they understand what Open Curriculum requires?',
      ],
      instantTurnoffs: [
        '"No requirements sounds easier"',
        '"I can avoid subjects I don\'t like"',
        'Pass/fail to protect GPA',
        'No evidence of self-directed exploration',
      ],
    },
  },

  columbia: {
    schoolId: 'columbia',
    values: [
      {
        trait: 'Intellectual Rigor',
        description: 'Core Curriculum demands rigorous thinking',
        keywords: ['rigorous', 'challenge', 'think', 'analyze', 'debate', 'question'],
      },
      {
        trait: 'Global Perspective',
        description: 'NYC as classroom, world as focus',
        keywords: ['global', 'world', 'international', 'diverse', 'city', 'NYC'],
      },
      {
        trait: 'Core Curriculum Engagement',
        description: 'You must be excited about reading great books',
        keywords: ['core', 'books', 'read', 'literature', 'philosophy', 'classics'],
      },
      {
        trait: 'Urban Engagement',
        description: 'Using NYC as an educational resource',
        keywords: ['city', 'New York', 'NYC', 'urban', 'museums', 'internship'],
      },
    ],
    commonMistakes: [
      'Loving NYC for nightlife, not education',
      'Not mentioning the Core Curriculum',
      'Treating Columbia as backup to Harvard/Yale',
      'Not understanding what makes Columbia different',
    ],
    whatTheyLove: [
      'Students genuinely excited about the Core',
      'Those who will engage with NYC intellectually',
      'Global thinkers who want diverse perspectives',
      'People who love debating big ideas',
    ],
    readingProcess: {
      timeSpent: '6-10 minutes on first read',
      whatTheyNotice: [
        'Do they understand what the Core Curriculum is?',
        'Will they use NYC as more than entertainment?',
        'Are they intellectually rigorous?',
        'Is this a genuine Columbia fit or prestige chase?',
      ],
      instantTurnoffs: [
        '"I love New York nightlife"',
        '"The city that never sleeps"',
        'No mention of Core or academics',
        'Treating location as the main draw',
      ],
    },
  },

  upenn: {
    schoolId: 'upenn',
    values: [
      {
        trait: 'Practical Application',
        description: 'Penn values putting knowledge to use',
        keywords: ['apply', 'practical', 'real-world', 'impact', 'build', 'create'],
      },
      {
        trait: 'Cross-School Collaboration',
        description: 'One University - using multiple schools',
        keywords: ['combine', 'dual', 'both', 'and', 'across', 'interdisciplinary'],
      },
      {
        trait: 'Entrepreneurship',
        description: 'Wharton influence means startup culture',
        keywords: ['start', 'build', 'business', 'innovate', 'venture', 'entrepreneur'],
      },
      {
        trait: 'Civic Engagement',
        description: 'Philadelphia integration and service',
        keywords: ['community', 'Philadelphia', 'civic', 'engage', 'local'],
      },
    ],
    commonMistakes: [
      'Wanting Wharton only for prestige/Wall Street',
      'Not mentioning cross-school opportunities',
      'Ignoring Penn\'s civic engagement culture',
      'Being purely theoretical without application',
    ],
    whatTheyLove: [
      'Students who will take classes across schools',
      'Practical doers, not just thinkers',
      'Those interested in Penn\'s unique programs (M&T, Huntsman)',
      'People who will engage with Philadelphia',
    ],
    readingProcess: {
      timeSpent: '6-8 minutes on first read',
      whatTheyNotice: [
        'Do they understand "One University"?',
        'Will they engage across schools?',
        'Is this Wharton-for-prestige or genuine fit?',
        'Do they want to apply knowledge practically?',
      ],
      instantTurnoffs: [
        '"Wharton for the name"',
        '"Wall Street connections"',
        'Only interested in one school',
        'No practical application of learning',
      ],
    },
  },

  dartmouth: {
    schoolId: 'dartmouth',
    values: [
      {
        trait: 'Community Orientation',
        description: 'Dartmouth is tight-knit - you must want that',
        keywords: ['community', 'together', 'belong', 'close', 'family', 'home'],
      },
      {
        trait: 'Outdoor Appreciation',
        description: 'The outdoors are integral to Dartmouth life',
        keywords: ['outdoor', 'nature', 'hike', 'ski', 'trip', 'adventure'],
      },
      {
        trait: 'Undergraduate Focus',
        description: 'Teaching-focused, small classes',
        keywords: ['professor', 'mentor', 'small', 'undergraduate', 'teach'],
      },
      {
        trait: 'Tradition Love',
        description: 'Dartmouth has strong traditions',
        keywords: ['tradition', 'history', 'culture', 'green', 'bonfire'],
      },
    ],
    commonMistakes: [
      'Treating rural location as negative',
      'Ignoring outdoor culture entirely',
      'Not understanding the D-Plan',
      'Wanting a big city experience',
    ],
    whatTheyLove: [
      'Students excited about tight-knit community',
      'Those who appreciate the outdoors',
      'People who want close faculty relationships',
      'Applicants excited about First-Year Trips',
    ],
    readingProcess: {
      timeSpent: '6-8 minutes on first read',
      whatTheyNotice: [
        'Do they actually want to be in rural NH?',
        'Will they embrace Dartmouth\'s community?',
        'Are they excited about outdoor culture?',
        'Do they understand the D-Plan?',
      ],
      instantTurnoffs: [
        '"Despite the location"',
        '"Even though it\'s rural"',
        'Wanting city access',
        'No mention of community or outdoors',
      ],
    },
  },

  cornell: {
    schoolId: 'cornell',
    values: [
      {
        trait: 'College-Specific Passion',
        description: 'You apply to a specific college - know it',
        keywords: ['college', 'school', 'program', 'specific', 'engineering', 'hotel'],
      },
      {
        trait: '"Any Person" Philosophy',
        description: 'Founded on accessibility and diversity',
        keywords: ['any person', 'access', 'opportunity', 'diverse', 'open'],
      },
      {
        trait: 'Applied Learning',
        description: 'Hands-on, practical education',
        keywords: ['hands-on', 'apply', 'practical', 'project', 'lab', 'research'],
      },
      {
        trait: 'Research Passion',
        description: 'Cornell is a research powerhouse',
        keywords: ['research', 'discover', 'lab', 'professor', 'study'],
      },
    ],
    commonMistakes: [
      'Writing generic Cornell essay without college focus',
      'Applying to wrong college for your interests',
      'Not knowing differences between colleges',
      'Ignoring "any person, any study" history',
    ],
    whatTheyLove: [
      'Students who know exactly why their college',
      'Those excited about specific programs',
      'People who appreciate land-grant mission',
      'Applicants who\'ve researched faculty',
    ],
    readingProcess: {
      timeSpent: '6-10 minutes on first read',
      whatTheyNotice: [
        'Do they know which college and why?',
        'Have they researched college-specific programs?',
        'Is this the right college fit?',
        'Do they understand what makes Cornell unique?',
      ],
      instantTurnoffs: [
        '"Cornell in general"',
        '"Any of Cornell\'s colleges"',
        'Wrong college for stated interests',
        'No college-specific content',
      ],
    },
  },
};
