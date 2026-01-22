/**
 * Ivy League Schools Database
 * Complete data for all 8 Ivy League schools with 2025-26 essay prompts
 */

export interface IvySchool {
  id: string;
  name: string;
  shortName: string;
  location: string;
  acceptanceRate: number; // 2024 cycle
  mission: string;
  cultureKeywords: string[];
  valueKeywords: string[];
  notablePrograms: string[];
  essayPrompts: EssayPrompt[];
  fitSignals: FitSignal[];
  avoidSignals: string[];
}

export interface EssayPrompt {
  id: string;
  type: 'required' | 'optional' | 'choose_one';
  title: string;
  prompt: string;
  wordLimit: number;
  tips: string[];
  commonMistakes: string[];
}

export interface FitSignal {
  category: 'academic' | 'extracurricular' | 'values' | 'culture' | 'location';
  signal: string;
  weight: number; // 1-5
}

export const IVY_LEAGUE_SCHOOLS: IvySchool[] = [
  // HARVARD
  {
    id: 'harvard',
    name: 'Harvard University',
    shortName: 'Harvard',
    location: 'Cambridge, MA',
    acceptanceRate: 3.2,
    mission: 'To educate citizens and citizen-leaders for our society through transformative college experience.',
    cultureKeywords: [
      'intellectual curiosity',
      'veritas',
      'truth',
      'residential community',
      'house system',
      'gen ed',
      'liberal arts',
      'diversity of thought',
      'leadership',
      'public service',
    ],
    valueKeywords: [
      'curiosity',
      'integrity',
      'community',
      'impact',
      'growth',
      'collaboration',
      'excellence',
    ],
    notablePrograms: [
      'Harvard College',
      'Freshman Seminars',
      'Q Guide',
      'House System',
      'Undergraduate Research',
      'PRISE',
      'Radcliffe Institute',
      'Harvard Innovation Labs',
    ],
    essayPrompts: [
      {
        id: 'harvard-supplement-1',
        type: 'required',
        title: 'Harvard Supplement Essay',
        prompt: 'Harvard has long recognized the importance of enrolling a diverse student body. How will the life experiences that shape who you are today enable you to contribute to Harvard?',
        wordLimit: 200,
        tips: [
          'Focus on specific experiences, not just demographics',
          'Show how you will actively contribute to campus',
          'Connect your background to intellectual curiosity',
          'Be specific about Harvard resources you\'d utilize',
        ],
        commonMistakes: [
          'Being too generic about diversity',
          'Not mentioning Harvard specifically',
          'Listing accomplishments without reflection',
          'Focusing only on what Harvard can give you',
        ],
      },
      {
        id: 'harvard-intellectual',
        type: 'optional',
        title: 'Intellectual Experience',
        prompt: 'Describe an intellectual experience (course, project, book, discussion, paper, poetry, or research topic in engineering, mathematics, science or other modes of inquiry) that has meant the most to you.',
        wordLimit: 200,
        tips: [
          'Show genuine intellectual passion',
          'Go deep on ONE experience, not broad',
          'Demonstrate how it changed your thinking',
          'Connect to future academic goals',
        ],
        commonMistakes: [
          'Listing multiple topics superficially',
          'Choosing something to sound impressive',
          'Not showing personal engagement',
        ],
      },
      {
        id: 'harvard-future',
        type: 'optional',
        title: 'Future Goals',
        prompt: 'Briefly describe any of your extracurricular activities, employment experience, travel, or family responsibilities that have shaped who you are.',
        wordLimit: 200,
        tips: [
          'Choose experiences that reveal character',
          'Show growth and learning',
          'Be authentic, not resume-padding',
        ],
        commonMistakes: [
          'Just listing activities',
          'Choosing prestigious over meaningful',
          'Not showing personal impact',
        ],
      },
    ],
    fitSignals: [
      { category: 'academic', signal: 'mentions specific courses or professors', weight: 5 },
      { category: 'academic', signal: 'references house system', weight: 4 },
      { category: 'values', signal: 'demonstrates intellectual curiosity', weight: 5 },
      { category: 'culture', signal: 'mentions veritas or truth-seeking', weight: 3 },
      { category: 'extracurricular', signal: 'references Harvard labs or research', weight: 4 },
      { category: 'values', signal: 'shows interest in public service', weight: 4 },
    ],
    avoidSignals: [
      'prestige-chasing language',
      'name-dropping without substance',
      'generic "top school" references',
      'focusing only on career outcomes',
    ],
  },

  // YALE
  {
    id: 'yale',
    name: 'Yale University',
    shortName: 'Yale',
    location: 'New Haven, CT',
    acceptanceRate: 3.7,
    mission: 'To improve the world through path-breaking research, inspiring teaching, and the transformative power of liberal education.',
    cultureKeywords: [
      'lux et veritas',
      'residential colleges',
      'singing groups',
      'secret societies',
      'liberal arts',
      'interdisciplinary',
      'new haven community',
      'undergraduate focus',
      'directed studies',
      'seminars',
    ],
    valueKeywords: [
      'creativity',
      'collaboration',
      'community engagement',
      'intellectual depth',
      'artistic expression',
      'service',
    ],
    notablePrograms: [
      'Residential Colleges',
      'Directed Studies',
      'Yale Daily News',
      'Whiffenpoofs',
      'Yale Dramatic Association',
      'Bulldogs',
      'Dwight Hall',
      'Yale Center for British Art',
    ],
    essayPrompts: [
      {
        id: 'yale-why',
        type: 'required',
        title: 'Why Yale?',
        prompt: 'What is it about Yale that has led you to apply?',
        wordLimit: 125,
        tips: [
          'Be ultra-specific (125 words is tight)',
          'Name ONE thing unique to Yale',
          'Show you\'ve done research',
          'Connect to your specific interests',
        ],
        commonMistakes: [
          'Generic praise of prestige',
          'Mentioning things available at any school',
          'Not being specific enough',
          'Wasting words on flattery',
        ],
      },
      {
        id: 'yale-contribution',
        type: 'required',
        title: 'Community Contribution',
        prompt: 'What would you contribute to your Yale residential college community?',
        wordLimit: 125,
        tips: [
          'Focus on action, not just presence',
          'Be specific about HOW you\'d contribute',
          'Reference residential college culture',
          'Show you understand Yale community',
        ],
        commonMistakes: [
          'Being too abstract',
          'Not understanding residential colleges',
          'Focusing on receiving, not giving',
        ],
      },
      {
        id: 'yale-engage',
        type: 'required',
        title: 'Academic Engagement',
        prompt: 'Yale students, faculty, and alumni engage with the most significant challenges of our time. Describe an issue that matters to you and how your Yale education will help you address it.',
        wordLimit: 250,
        tips: [
          'Choose an issue you genuinely care about',
          'Be specific about Yale resources',
          'Show existing engagement with the issue',
          'Demonstrate thoughtfulness, not just passion',
        ],
        commonMistakes: [
          'Choosing a trendy topic you don\'t really engage with',
          'Not connecting to Yale specifically',
          'Being preachy or one-sided',
        ],
      },
      {
        id: 'yale-short-takes',
        type: 'required',
        title: 'Short Takes',
        prompt: 'Respond to each of the following: (1) What inspires you? (2) If you could live for a day as another person, living or historical, who would it be and why? (3) You are teaching a Yale course. What is it called?',
        wordLimit: 35,
        tips: [
          '35 words EACH - be punchy',
          'Show personality and wit',
          'Be unexpected but authentic',
          'Let your voice shine through',
        ],
        commonMistakes: [
          'Being too safe or generic',
          'Trying too hard to be quirky',
          'Not answering what was asked',
        ],
      },
    ],
    fitSignals: [
      { category: 'academic', signal: 'mentions specific seminars or Directed Studies', weight: 5 },
      { category: 'culture', signal: 'references residential colleges by name', weight: 5 },
      { category: 'culture', signal: 'mentions Yale arts/drama/singing', weight: 4 },
      { category: 'values', signal: 'demonstrates community engagement', weight: 4 },
      { category: 'location', signal: 'shows interest in New Haven', weight: 3 },
    ],
    avoidSignals: [
      'comparing Yale to Harvard negatively',
      'focusing only on academics, ignoring community',
      'not knowing residential college system',
    ],
  },

  // PRINCETON
  {
    id: 'princeton',
    name: 'Princeton University',
    shortName: 'Princeton',
    location: 'Princeton, NJ',
    acceptanceRate: 4.4,
    mission: 'Princeton in the nation\'s service and the service of humanity.',
    cultureKeywords: [
      'honor code',
      'undergraduate focus',
      'eating clubs',
      'residential colleges',
      'junior paper',
      'senior thesis',
      'precepts',
      'orange and black',
      'service',
      'independent work',
    ],
    valueKeywords: [
      'honor',
      'integrity',
      'service',
      'scholarship',
      'community',
      'independent thinking',
    ],
    notablePrograms: [
      'Honor Code',
      'Senior Thesis',
      'Junior Paper',
      'Precepts',
      'Residential Colleges',
      'Eating Clubs',
      'Bridge Year Program',
      'Princeton Prizes in Race Relations',
    ],
    essayPrompts: [
      {
        id: 'princeton-extracurricular',
        type: 'required',
        title: 'Extracurricular Depth',
        prompt: 'Briefly elaborate on an activity, organization, work experience, or hobby that has been particularly meaningful to you.',
        wordLimit: 150,
        tips: [
          'Go deep on ONE activity',
          'Show impact and growth',
          'Connect to Princeton values',
          'Be specific about your role',
        ],
        commonMistakes: [
          'Repeating Common App information',
          'Choosing most impressive vs. most meaningful',
          'Not showing personal growth',
        ],
      },
      {
        id: 'princeton-community',
        type: 'required',
        title: 'Community Essay',
        prompt: 'Princeton has a longstanding commitment to understanding our responsibility to society through service and civic engagement. How does your own story intersect with these ideals?',
        wordLimit: 250,
        tips: [
          'Show genuine service experience',
          'Reflect on why service matters to you',
          'Connect to "in the nation\'s service"',
          'Be specific, not abstract',
        ],
        commonMistakes: [
          'Service-as-resume-padding tone',
          'Not showing genuine reflection',
          'Missing Princeton\'s specific service mission',
        ],
      },
      {
        id: 'princeton-voice',
        type: 'required',
        title: 'Your Voice',
        prompt: 'Please respond to each of the following: What is a new skill you would like to learn in college? (50 words) What brings you joy? (50 words) What song represents the soundtrack of your life at this moment? (50 words)',
        wordLimit: 50,
        tips: [
          'Be authentic and personal',
          'Show personality, not perfection',
          'Let your real self shine through',
          '50 words each - every word counts',
        ],
        commonMistakes: [
          'Being too serious or formal',
          'Choosing answers to impress',
          'Not answering honestly',
        ],
      },
    ],
    fitSignals: [
      { category: 'academic', signal: 'mentions senior thesis or independent work', weight: 5 },
      { category: 'values', signal: 'references honor code', weight: 5 },
      { category: 'values', signal: 'demonstrates genuine service commitment', weight: 5 },
      { category: 'culture', signal: 'mentions precepts or small class discussion', weight: 4 },
      { category: 'culture', signal: 'references residential colleges', weight: 3 },
    ],
    avoidSignals: [
      'not understanding honor code importance',
      'service without reflection',
      'not mentioning undergraduate focus',
    ],
  },

  // COLUMBIA
  {
    id: 'columbia',
    name: 'Columbia University',
    shortName: 'Columbia',
    location: 'New York, NY',
    acceptanceRate: 3.9,
    mission: 'To advance knowledge and learning at the highest level and to convey the products of its efforts to the world.',
    cultureKeywords: [
      'core curriculum',
      'new york city',
      'morningside heights',
      'urban campus',
      'global perspective',
      'intellectual rigor',
      'contemporary civilization',
      'literature humanities',
      'frontiers of science',
      'art humanities',
    ],
    valueKeywords: [
      'intellectual rigor',
      'global citizenship',
      'engagement',
      'critical thinking',
      'debate',
      'urban life',
    ],
    notablePrograms: [
      'Core Curriculum',
      'Contemporary Civilization',
      'Literature Humanities',
      'Global Scholars Program',
      'Frontiers of Science',
      'Columbia Spectator',
      'Debate Team',
      'Undergraduate Research',
    ],
    essayPrompts: [
      {
        id: 'columbia-list-books',
        type: 'required',
        title: 'Reading List',
        prompt: 'List a few words, phrases, or sentences that describe your ideal college community.',
        wordLimit: 150,
        tips: [
          'Be creative with the list format',
          'Show intellectual range',
          'Include some unexpected picks',
          'Let your personality show',
        ],
        commonMistakes: [
          'Only listing "impressive" books',
          'Not including anything personal',
          'All from same genre/period',
        ],
      },
      {
        id: 'columbia-why',
        type: 'required',
        title: 'Why Columbia?',
        prompt: 'Why are you interested in attending Columbia University? We encourage you to focus on aspects that are particularly relevant to you.',
        wordLimit: 200,
        tips: [
          'Reference Core Curriculum specifically',
          'Mention NYC as educational resource',
          'Connect your interests to specific Columbia offerings',
          'Be specific, not generic',
        ],
        commonMistakes: [
          'Only talking about NYC nightlife/food',
          'Not mentioning Core',
          'Generic "great school" language',
          'Not connecting to your goals',
        ],
      },
      {
        id: 'columbia-core',
        type: 'required',
        title: 'Core Curriculum',
        prompt: 'Columbia\'s Core Curriculum brings together students from across the University in shared intellectual experiences. Please tell us about a text, idea, or question that has engaged you outside of your academic studies.',
        wordLimit: 200,
        tips: [
          'Show genuine intellectual engagement',
          'Connect to Core Curriculum values',
          'Demonstrate you understand Columbia\'s approach',
          'Be specific about the text/idea',
        ],
        commonMistakes: [
          'Choosing something just to sound smart',
          'Not connecting to intellectual community',
          'Superficial engagement with the topic',
        ],
      },
    ],
    fitSignals: [
      { category: 'academic', signal: 'mentions Core Curriculum courses by name', weight: 5 },
      { category: 'location', signal: 'articulates NYC as educational resource', weight: 5 },
      { category: 'values', signal: 'demonstrates broad intellectual curiosity', weight: 4 },
      { category: 'culture', signal: 'references Morningside Heights community', weight: 3 },
      { category: 'academic', signal: 'mentions specific professors or research', weight: 4 },
    ],
    avoidSignals: [
      'only focusing on NYC lifestyle',
      'not understanding Core Curriculum',
      'treating Columbia as backup to other Ivies',
    ],
  },

  // BROWN
  {
    id: 'brown',
    name: 'Brown University',
    shortName: 'Brown',
    location: 'Providence, RI',
    acceptanceRate: 5.1,
    mission: 'To serve the community, the nation, and the world by discovering, communicating, and preserving knowledge.',
    cultureKeywords: [
      'open curriculum',
      'self-directed',
      'interdisciplinary',
      'collaborative',
      'providence',
      'RISD partnership',
      'pass/fail',
      'shopping period',
      'student-designed majors',
      'engaged scholarship',
    ],
    valueKeywords: [
      'autonomy',
      'curiosity',
      'creativity',
      'collaboration',
      'risk-taking',
      'self-direction',
    ],
    notablePrograms: [
      'Open Curriculum',
      'Brown-RISD Dual Degree',
      'Independent Concentrations',
      'Engaged Scholars',
      'UTRA (Undergraduate Research)',
      'Swearer Center',
      'Writing Center',
      'Curricular Resource Center',
    ],
    essayPrompts: [
      {
        id: 'brown-open-curriculum',
        type: 'required',
        title: 'Open Curriculum',
        prompt: 'Brown\'s Open Curriculum allows students to explore broadly while also diving deep into their academic pursuits. Tell us about an academic interest (or interests) that excites you, and how you might pursue it at Brown.',
        wordLimit: 200,
        tips: [
          'Show genuine excitement for self-direction',
          'Be specific about Brown courses/programs',
          'Demonstrate you understand Open Curriculum',
          'Show intellectual depth AND breadth',
        ],
        commonMistakes: [
          'Just saying "I want freedom"',
          'Not being specific about Brown',
          'Focusing only on one narrow interest',
          'Not showing you\'ve researched courses',
        ],
      },
      {
        id: 'brown-community',
        type: 'required',
        title: 'Community',
        prompt: 'Brown students care deeply about their community. What contributions have you made to a community that matters to you?',
        wordLimit: 200,
        tips: [
          'Define YOUR community specifically',
          'Show impact, not just participation',
          'Connect to how you\'ll contribute at Brown',
          'Be authentic about what community means to you',
        ],
        commonMistakes: [
          'Choosing a community to sound impressive',
          'Not showing genuine connection',
          'Being too vague about contributions',
        ],
      },
      {
        id: 'brown-curious',
        type: 'required',
        title: 'Intellectual Curiosity',
        prompt: 'Tell us about something that you are curious about and how you would explore it at Brown.',
        wordLimit: 200,
        tips: [
          'Choose something genuinely interesting to you',
          'Be specific about Brown resources',
          'Show how you\'d use the Open Curriculum',
          'Demonstrate intellectual passion',
        ],
        commonMistakes: [
          'Choosing a "safe" topic',
          'Not connecting to specific Brown offerings',
          'Being too broad or abstract',
        ],
      },
    ],
    fitSignals: [
      { category: 'academic', signal: 'articulates understanding of Open Curriculum', weight: 5 },
      { category: 'values', signal: 'demonstrates self-direction and autonomy', weight: 5 },
      { category: 'academic', signal: 'mentions RISD partnership or arts', weight: 4 },
      { category: 'culture', signal: 'references Brown-specific programs', weight: 4 },
      { category: 'values', signal: 'shows intellectual risk-taking', weight: 4 },
    ],
    avoidSignals: [
      'wanting Open Curriculum just to avoid requirements',
      'not understanding self-directed learning',
      'purely pre-professional focus',
    ],
  },

  // DARTMOUTH
  {
    id: 'dartmouth',
    name: 'Dartmouth College',
    shortName: 'Dartmouth',
    location: 'Hanover, NH',
    acceptanceRate: 5.4,
    mission: 'To prepare students for a lifetime of learning and leadership, advancing knowledge and understanding.',
    cultureKeywords: [
      'd-plan',
      'undergraduate focus',
      'outdoors',
      'green key',
      'winter carnival',
      'hanover',
      'rural campus',
      'close-knit',
      'traditions',
      'the green',
      'big green',
    ],
    valueKeywords: [
      'community',
      'tradition',
      'outdoors',
      'undergraduate focus',
      'accessibility',
      'collaboration',
    ],
    notablePrograms: [
      'D-Plan (Quarter System)',
      'Dartmouth Outing Club',
      'Foreign Study Programs',
      'Hopkins Center',
      'Undergraduate Research',
      'Great Issues Courses',
      'Tucker Foundation',
      'First-Year Trips',
    ],
    essayPrompts: [
      {
        id: 'dartmouth-why',
        type: 'required',
        title: 'Why Dartmouth?',
        prompt: 'Dartmouth celebrates the ways in which its size and location shape our close-knit community. Students find meaning in their interactions with the nature and wilderness of the Upper Valley, and in shared experiences that define the Dartmouth experience. As you seek admission to the Class of 2029, what aspects of the Dartmouth experience prompt your application?',
        wordLimit: 250,
        tips: [
          'Embrace the outdoor/community culture',
          'Be specific about Dartmouth traditions',
          'Show you understand the D-Plan',
          'Reference specific programs or opportunities',
        ],
        commonMistakes: [
          'Ignoring the outdoor/location element',
          'Generic "small school" language',
          'Not mentioning specific Dartmouth programs',
        ],
      },
      {
        id: 'dartmouth-belonging',
        type: 'required',
        title: 'Belonging',
        prompt: 'There are many ways to "belong" at Dartmouth. What\'s important to you? Describe how you envision your sense of belonging at Dartmouth.',
        wordLimit: 250,
        tips: [
          'Define what belonging means to you',
          'Connect to specific Dartmouth communities',
          'Show how you\'ll contribute',
          'Be authentic about your values',
        ],
        commonMistakes: [
          'Being too abstract about community',
          'Not connecting to specific Dartmouth groups',
          'Focusing only on receiving, not giving',
        ],
      },
    ],
    fitSignals: [
      { category: 'culture', signal: 'mentions D-Plan or quarter system', weight: 5 },
      { category: 'culture', signal: 'references outdoor culture or DOC', weight: 5 },
      { category: 'academic', signal: 'mentions undergraduate focus', weight: 4 },
      { category: 'location', signal: 'shows appreciation for rural/small community', weight: 4 },
      { category: 'culture', signal: 'references specific traditions', weight: 3 },
    ],
    avoidSignals: [
      'treating size/location as negatives',
      'not understanding D-Plan',
      'ignoring outdoor culture entirely',
    ],
  },

  // CORNELL
  {
    id: 'cornell',
    name: 'Cornell University',
    shortName: 'Cornell',
    location: 'Ithaca, NY',
    acceptanceRate: 7.9,
    mission: 'Any person, any study - to discover, preserve, and disseminate knowledge for the public good.',
    cultureKeywords: [
      'any person any study',
      'seven colleges',
      'ithaca',
      'gorges',
      'land grant',
      'research university',
      'applied learning',
      'project teams',
      'diversity of programs',
      'big red',
    ],
    valueKeywords: [
      'accessibility',
      'diversity',
      'applied learning',
      'research',
      'practical impact',
      'exploration',
    ],
    notablePrograms: [
      'Seven Undergraduate Colleges',
      'Cornell Tech',
      'Project Teams',
      'Cornell Cooperative Extension',
      'Undergraduate Research',
      'Study Abroad',
      'Engineering Project Teams',
      'Agriculture Programs',
    ],
    essayPrompts: [
      {
        id: 'cornell-why-college',
        type: 'required',
        title: 'Why Your College at Cornell',
        prompt: 'In the online Common Application Writing Supplement, please respond to the essay question specific to the undergraduate college or school to which you are applying.',
        wordLimit: 650,
        tips: [
          'Be VERY specific to your chosen college',
          'Research the college\'s unique offerings',
          'Connect your goals to the college mission',
          'Show why that college, not just Cornell',
        ],
        commonMistakes: [
          'Writing generic Cornell essay',
          'Not understanding college differences',
          'Applying to wrong college for your interests',
          'Not being specific about programs',
        ],
      },
    ],
    fitSignals: [
      { category: 'academic', signal: 'demonstrates understanding of specific college', weight: 5 },
      { category: 'values', signal: 'connects to "any person any study"', weight: 4 },
      { category: 'academic', signal: 'mentions specific programs or courses', weight: 5 },
      { category: 'location', signal: 'shows appreciation for Ithaca/campus', weight: 3 },
      { category: 'culture', signal: 'references project teams or applied learning', weight: 4 },
    ],
    avoidSignals: [
      'confusing colleges or their purposes',
      'generic Cornell essay without college specificity',
      'not understanding land-grant mission',
    ],
  },

  // PENN (UPenn)
  {
    id: 'upenn',
    name: 'University of Pennsylvania',
    shortName: 'Penn',
    location: 'Philadelphia, PA',
    acceptanceRate: 5.8,
    mission: 'To educate the leaders and global citizens of tomorrow by integrating teaching, research, and service.',
    cultureKeywords: [
      'one university',
      'cross-school collaboration',
      'pre-professional',
      'wharton',
      'philadelphia',
      'west philly',
      'civic engagement',
      'entrepreneurship',
      'applied knowledge',
      'quakers',
    ],
    valueKeywords: [
      'integration',
      'practical impact',
      'entrepreneurship',
      'collaboration',
      'innovation',
      'civic engagement',
    ],
    notablePrograms: [
      'One University Policy',
      'Wharton',
      'Engineering',
      'Nursing',
      'Huntsman Program',
      'Jerome Fisher M&T',
      'Civic House',
      'Penn Center for Innovation',
      'West Philadelphia Programs',
    ],
    essayPrompts: [
      {
        id: 'penn-why',
        type: 'required',
        title: 'Why Penn?',
        prompt: 'Considering the specific undergraduate school to which you are applying, how will you explore your intellectual and academic interests at the University of Pennsylvania?',
        wordLimit: 450,
        tips: [
          'Be specific to your school (College, Wharton, Engineering, Nursing)',
          'Mention cross-school opportunities',
          'Reference specific courses, professors, or programs',
          'Show understanding of "One University"',
        ],
        commonMistakes: [
          'Writing about wrong school',
          'Not mentioning cross-school collaboration',
          'Being too generic about Penn',
          'Only focusing on one school when dual-degree',
        ],
      },
      {
        id: 'penn-community',
        type: 'required',
        title: 'Community',
        prompt: 'At Penn, learning and growth happen outside of the classroom, too. How will you explore the community at Penn? Consider how this community will help shape your perspective and identity, and how your identity and perspective will help shape this community.',
        wordLimit: 200,
        tips: [
          'Reference specific Penn organizations',
          'Show two-way contribution',
          'Connect to Philadelphia engagement',
          'Be specific about how you\'ll contribute',
        ],
        commonMistakes: [
          'Only talking about what you\'ll gain',
          'Not mentioning specific communities',
          'Ignoring West Philly/civic engagement',
        ],
      },
    ],
    fitSignals: [
      { category: 'academic', signal: 'demonstrates understanding of specific school', weight: 5 },
      { category: 'academic', signal: 'mentions cross-school opportunities', weight: 5 },
      { category: 'values', signal: 'shows entrepreneurial mindset', weight: 4 },
      { category: 'location', signal: 'references Philadelphia engagement', weight: 4 },
      { category: 'culture', signal: 'understands "One University" philosophy', weight: 4 },
    ],
    avoidSignals: [
      'confusing Penn schools',
      'only focusing on Wharton prestige',
      'not understanding cross-school nature',
      'ignoring civic engagement aspect',
    ],
  },
];

/**
 * Get school by ID
 */
export function getIvySchool(id: string): IvySchool | undefined {
  return IVY_LEAGUE_SCHOOLS.find(s => s.id === id);
}

/**
 * Get all Ivy League school IDs
 */
export function getIvySchoolIds(): string[] {
  return IVY_LEAGUE_SCHOOLS.map(s => s.id);
}

/**
 * Get school facts formatted for AI prompt
 */
export function getSchoolFactsForPrompt(schoolId: string): string {
  const school = getIvySchool(schoolId);
  if (!school) return '';

  return `
School: ${school.name}
Location: ${school.location}
Acceptance Rate: ${school.acceptanceRate}%
Mission: ${school.mission}

Core Values: ${school.valueKeywords.join(', ')}
Culture Keywords: ${school.cultureKeywords.join(', ')}
Notable Programs: ${school.notablePrograms.join(', ')}

What Admissions Looks For:
${school.fitSignals.map(s => `- ${s.signal} (${s.category})`).join('\n')}

What to Avoid:
${school.avoidSignals.map(s => `- ${s}`).join('\n')}
`.trim();
}

/**
 * Get essay prompts for a school
 */
export function getSchoolPrompts(schoolId: string): EssayPrompt[] {
  const school = getIvySchool(schoolId);
  return school?.essayPrompts || [];
}

/**
 * Cornell college-specific prompts
 */
export const CORNELL_COLLEGE_PROMPTS: Record<string, EssayPrompt> = {
  arts_sciences: {
    id: 'cornell-cas',
    type: 'required',
    title: 'College of Arts & Sciences',
    prompt: 'At the College of Arts and Sciences, curiosity will be your guide. Discuss how your passion for learning is shaping your academic journey, and how you will continue to explore your interests in the College of Arts and Sciences.',
    wordLimit: 650,
    tips: [
      'Show intellectual breadth',
      'Connect diverse interests',
      'Reference specific A&S programs',
    ],
    commonMistakes: ['Too narrow focus', 'Not showing curiosity'],
  },
  engineering: {
    id: 'cornell-eng',
    type: 'required',
    title: 'College of Engineering',
    prompt: 'Instructions: All applicants to the College of Engineering are required to respond to this prompt. Question: Fundamentally, engineering is the application of math, science, and technology to solve complex problems. Why do you want to study engineering? And more specifically, why do you want to study the major you have indicated in Cornell Engineering?',
    wordLimit: 650,
    tips: [
      'Be specific about your engineering major',
      'Show technical projects or experience',
      'Reference Cornell Engineering programs',
    ],
    commonMistakes: ['Too generic', 'Not connecting to specific major'],
  },
  hotel: {
    id: 'cornell-hotel',
    type: 'required',
    title: 'School of Hotel Administration',
    prompt: 'The global hospitality industry includes hotel and food service management, real estate, finance, entrepreneurship, marketing, technology, and law. Describe what has influenced your decision to study business through the lens of hospitality at SHA, and how your experiences and interests have prepared you for an education at Cornell.',
    wordLimit: 650,
    tips: [
      'Show hospitality experience',
      'Connect business and service',
      'Reference SHA-specific programs',
    ],
    commonMistakes: ['Not understanding hospitality scope', 'Too focused on one aspect'],
  },
  human_ecology: {
    id: 'cornell-humec',
    type: 'required',
    title: 'College of Human Ecology',
    prompt: 'How has your decision to apply to the College of Human Ecology (CHE) been influenced by your related experiences? How will your choice of major impact your goals and plans for the future?',
    wordLimit: 650,
    tips: [
      'Connect human-centered design thinking',
      'Show relevant experience',
      'Be specific about your major',
    ],
    commonMistakes: ['Not understanding HumEc mission', 'Too generic'],
  },
  ilr: {
    id: 'cornell-ilr',
    type: 'required',
    title: 'School of Industrial & Labor Relations',
    prompt: 'Using your personal, academic, or volunteer/work experiences, describe the topics or issues that you care about and why they are important to you. Your response should show us that your interests align with the ILR School.',
    wordLimit: 650,
    tips: [
      'Focus on workplace, labor, or policy issues',
      'Show relevant experience',
      'Connect to ILR curriculum',
    ],
    commonMistakes: ['Not understanding ILR focus', 'Too broad'],
  },
  cals: {
    id: 'cornell-cals',
    type: 'required',
    title: 'College of Agriculture & Life Sciences',
    prompt: 'Why are you drawn to studying the major you have selected and how will your study of this major at Cornell CALS prepare you for the future?',
    wordLimit: 650,
    tips: [
      'Show connection to agriculture, environment, or life sciences',
      'Reference CALS research',
      'Connect to land-grant mission',
    ],
    commonMistakes: ['Not understanding CALS scope', 'Missing land-grant connection'],
  },
  aap: {
    id: 'cornell-aap',
    type: 'required',
    title: 'College of Architecture, Art & Planning',
    prompt: 'How do your interests directly connect with your intended major at the College of Architecture, Art, and Planning (AAP)? Why architecture, art, or urban and regional studies? What prepared you for this study?',
    wordLimit: 650,
    tips: [
      'Show creative portfolio connection',
      'Reference AAP-specific programs',
      'Demonstrate visual thinking',
    ],
    commonMistakes: ['Not connecting to design thinking', 'Portfolio disconnect'],
  },
};
