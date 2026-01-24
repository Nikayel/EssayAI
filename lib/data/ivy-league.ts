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
  // New fields for enhanced guidance
  aoInsights: AOInsight[];
  scoringNotes: SchoolScoringNotes[];
  whatMakesThisSchoolDifferent: string;
  studentBodyCharacter: string;
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

/**
 * Admissions Officer Insights
 * Based on public interviews, panels, and documented admissions practices
 * NOTE: These are educational summaries, not direct quotes
 */
export interface AOInsight {
  type: 'what_works' | 'common_mistake' | 'reader_perspective' | 'differentiation';
  content: string;
  source?: string; // e.g., "AO panel 2024", "Admissions blog"
}

/**
 * School-specific scoring adjustments
 * How this school weights different essay elements differently from generic rubric
 */
export interface SchoolScoringNotes {
  dimension: string;
  adjustment: 'higher' | 'lower' | 'critical';
  reason: string;
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
    aoInsights: [
      {
        type: 'what_works',
        content: 'Harvard readers spend about 8 minutes per application. They want to quickly understand WHO you are, not just WHAT you did. The best essays make readers feel like they know you personally.',
        source: 'Harvard admissions presentations',
      },
      {
        type: 'reader_perspective',
        content: 'AOs read in "committee" where your application is presented by one reader to others. Your essay needs to give that reader something memorable to SAY about you.',
        source: 'Former Harvard AO interviews',
      },
      {
        type: 'common_mistake',
        content: 'Many students write about Harvard\'s resources as if they\'re unique. Mentioning "world-class professors" or "amazing opportunities" tells us nothing - every top school has those.',
        source: 'Harvard admissions blog',
      },
      {
        type: 'differentiation',
        content: 'Harvard looks for "citizen-leaders" - people who will contribute to communities, not just achieve individually. Show how you\'ve already done this, not just how you plan to.',
        source: 'Harvard mission and admissions criteria',
      },
      {
        type: 'what_works',
        content: 'The 200-word supplement is brutal. Every word counts. The best responses feel like a conversation, not a pitch. Be specific about ONE way you\'d contribute.',
        source: 'Admissions counselor guidance',
      },
    ],
    scoringNotes: [
      {
        dimension: 'authenticity',
        adjustment: 'critical',
        reason: 'Harvard receives 50,000+ apps. Authentic voice is the only way to stand out from polished, similar-sounding essays.',
      },
      {
        dimension: 'school_fit',
        adjustment: 'lower',
        reason: 'Harvard\'s supplement is short (200 words). They care more about who you are than "why Harvard" specifically.',
      },
      {
        dimension: 'reflection',
        adjustment: 'higher',
        reason: 'Harvard values intellectual vitality - show how you THINK, not just what you\'ve done.',
      },
    ],
    whatMakesThisSchoolDifferent: 'Harvard\'s House system creates intimate communities within a large university. The General Education program ensures breadth. But the real differentiator is the alumni network and the expectation that graduates will lead in their fields.',
    studentBodyCharacter: 'Driven, ambitious, often "spiky" with deep expertise in one area. Harvard students tend to have national-level achievements or unique perspectives that stand out even in a talented pool.',
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
    aoInsights: [
      {
        type: 'what_works',
        content: 'Yale explicitly values creativity and artistic expression alongside academics. Students who thrive here often have a creative outlet - theater, music, writing, visual arts.',
        source: 'Yale admissions presentations',
      },
      {
        type: 'reader_perspective',
        content: 'The residential college system is CENTRAL to Yale identity. If you can\'t articulate how you\'d contribute to a residential community, you haven\'t understood Yale.',
        source: 'Yale AO interviews',
      },
      {
        type: 'common_mistake',
        content: 'The "Why Yale" is only 125 words. Students waste precious words on generic praise. Get specific immediately - name ONE thing and explain why it matters to YOU.',
        source: 'Yale admissions guidance',
      },
      {
        type: 'differentiation',
        content: 'Yale students are known for being well-rounded AND deeply passionate. The "short takes" reveal personality - be genuine, not calculated.',
        source: 'Yale student and AO perspectives',
      },
      {
        type: 'what_works',
        content: 'New Haven engagement matters. Yale invests heavily in its city. Showing awareness of town-gown dynamics and interest in community engagement resonates.',
        source: 'Yale mission and community focus',
      },
    ],
    scoringNotes: [
      {
        dimension: 'authenticity',
        adjustment: 'critical',
        reason: 'Yale\'s "short takes" are designed specifically to reveal personality. Trying too hard to be clever backfires.',
      },
      {
        dimension: 'school_fit',
        adjustment: 'critical',
        reason: 'At 125 words, the "Why Yale" must be laser-focused. Generic answers are immediately obvious.',
      },
      {
        dimension: 'structure',
        adjustment: 'lower',
        reason: 'Yale\'s prompts are short and varied. Perfect structure matters less than genuine voice.',
      },
    ],
    whatMakesThisSchoolDifferent: 'Yale\'s residential college system creates tight-knit communities. The arts scene (Yale Rep, School of Drama, Whiffenpoofs) is world-class. Yale has a more collaborative, less competitive culture than some peers.',
    studentBodyCharacter: 'Creative, collaborative, community-oriented. Yale students often have strong artistic or creative interests alongside academics. They value intellectual discourse but in a more relaxed, less cutthroat environment.',
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
    aoInsights: [
      {
        type: 'what_works',
        content: 'Princeton\'s Honor Code is non-negotiable. Every student pledges integrity on every exam. Essays that demonstrate genuine ethical commitment resonate deeply.',
        source: 'Princeton admissions and Honor Committee',
      },
      {
        type: 'reader_perspective',
        content: 'Princeton is the smallest Ivy with the most undergraduate focus. They want students who specifically want a smaller, teaching-focused community - not students who see it as a Harvard backup.',
        source: 'Princeton AO interviews',
      },
      {
        type: 'common_mistake',
        content: 'The service essay is where most students fail. Resume-padding service doesn\'t work. Princeton wants reflection on WHY service matters, not a list of volunteer hours.',
        source: 'Princeton admissions blog',
      },
      {
        type: 'differentiation',
        content: 'The senior thesis is a defining Princeton experience. Every student writes one. Show you\'re excited about deep, independent scholarly work.',
        source: 'Princeton academic culture',
      },
      {
        type: 'what_works',
        content: 'Princeton\'s "voice" prompts (what brings you joy, what song, what skill) are meant to reveal YOU. Overthinking these is the #1 mistake - just answer honestly.',
        source: 'Princeton admissions guidance',
      },
    ],
    scoringNotes: [
      {
        dimension: 'ethics_originality',
        adjustment: 'critical',
        reason: 'Princeton\'s Honor Code makes integrity central. Any hint of exaggeration or inauthenticity is a red flag.',
      },
      {
        dimension: 'reflection',
        adjustment: 'higher',
        reason: 'The service essay demands genuine reflection, not just description of activities.',
      },
      {
        dimension: 'specificity_fit',
        adjustment: 'higher',
        reason: 'Princeton wants students who specifically want Princeton\'s model: small, undergraduate-focused, thesis-based.',
      },
    ],
    whatMakesThisSchoolDifferent: 'Princeton is the most undergraduate-focused Ivy. No grad students teaching classes. Every student writes a senior thesis. The Honor Code creates a culture of trust where exams are unproctored.',
    studentBodyCharacter: 'Scholarly, earnest, service-oriented. Princeton students tend to be genuinely intellectual (not just achievement-oriented) and committed to the "nation\'s service" mission. Less pre-professional than Penn or Columbia.',
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
    aoInsights: [
      {
        type: 'what_works',
        content: 'Columbia\'s Core Curriculum is the heart of the school. EVERY student reads the same great books, discusses the same ideas. Show you understand and want this shared intellectual experience.',
        source: 'Columbia admissions presentations',
      },
      {
        type: 'reader_perspective',
        content: 'NYC is not a selling point by itself - it\'s a given. What matters is HOW you\'d use the city as an educational resource: internships, museums, communities, not nightlife.',
        source: 'Columbia AO guidance',
      },
      {
        type: 'common_mistake',
        content: 'The book list isn\'t just about showing you read - it\'s about showing intellectual range and genuine curiosity. All classics or all trendy books both miss the point.',
        source: 'Columbia admissions blog',
      },
      {
        type: 'differentiation',
        content: 'Columbia is more intellectually intense and urban than other Ivies. Students here WANT that rigor. Don\'t apply if you want a leafy campus or easy grades.',
        source: 'Columbia student perspectives',
      },
      {
        type: 'what_works',
        content: 'Morningside Heights is a specific community. References to the neighborhood, the relationship between campus and Harlem, show you understand Columbia\'s urban context.',
        source: 'Columbia community focus',
      },
    ],
    scoringNotes: [
      {
        dimension: 'specificity_fit',
        adjustment: 'critical',
        reason: 'Columbia\'s Core is unique. Essays must show genuine engagement with the Core\'s philosophy, not just lip service.',
      },
      {
        dimension: 'reflection',
        adjustment: 'higher',
        reason: 'The Core is about great ideas. Columbia wants students who genuinely engage with ideas, not just credentials.',
      },
      {
        dimension: 'structure',
        adjustment: 'higher',
        reason: 'Columbia values rigorous thinking. Well-organized arguments matter more here than at some peers.',
      },
    ],
    whatMakesThisSchoolDifferent: 'The Core Curriculum is a shared intellectual experience - everyone reads Homer, Plato, Woolf, Du Bois together. NYC is integrated into education. The campus is urban, not pastoral.',
    studentBodyCharacter: 'Intellectually intense, urban, diverse. Columbia students thrive on rigor and city energy. More pre-professional than Princeton or Brown, but with genuine intellectual depth. Global perspectives are common.',
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
    aoInsights: [
      {
        type: 'what_works',
        content: 'Brown\'s Open Curriculum requires genuine intellectual self-direction. The best essays show students who have ALREADY demonstrated they can create their own learning path, not just those who want "freedom."',
        source: 'Brown admissions presentations',
      },
      {
        type: 'reader_perspective',
        content: 'Brown looks for students who take intellectual risks. Playing it safe academically - only taking classes you know you\'ll ace - is counter to Brown\'s culture.',
        source: 'Brown AO interviews',
      },
      {
        type: 'common_mistake',
        content: 'Saying you want the Open Curriculum because you "hate requirements" is a red flag. Brown wants students who will USE freedom productively, not avoid challenge.',
        source: 'Brown admissions blog',
      },
      {
        type: 'differentiation',
        content: 'Brown-RISD partnership is unique. If you have creative interests, this is a major differentiator. You can literally take art classes at one of the best design schools in the world.',
        source: 'Brown-RISD programs',
      },
      {
        type: 'what_works',
        content: 'Providence is a small city but Brown students love it. Showing awareness of the Providence community - local organizations, city engagement - demonstrates fit.',
        source: 'Brown community focus',
      },
    ],
    scoringNotes: [
      {
        dimension: 'authenticity',
        adjustment: 'critical',
        reason: 'Brown explicitly values "authenticity" in admissions. Polished, over-edited essays feel out of place.',
      },
      {
        dimension: 'specificity_fit',
        adjustment: 'critical',
        reason: 'Open Curriculum means you must show HOW you\'d use it. Vague enthusiasm isn\'t enough.',
      },
      {
        dimension: 'reflection',
        adjustment: 'higher',
        reason: 'Self-directed learning requires self-awareness. Brown wants students who know themselves.',
      },
    ],
    whatMakesThisSchoolDifferent: 'The Open Curriculum is truly unique - no required courses outside your concentration. This attracts creative, self-directed learners. The RISD partnership enables art/design crossover. Culture is collaborative, not competitive.',
    studentBodyCharacter: 'Creative, self-directed, nonconformist. Brown students often resist traditional paths. The culture is genuinely collaborative - grading is less competitive than at peer schools. Strong arts and social justice presence.',
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
    aoInsights: [
      {
        type: 'what_works',
        content: 'Dartmouth is the smallest Ivy and proud of it. Students here chose a rural, close-knit community ON PURPOSE. Show you understand and want this - don\'t apologize for applying to a "smaller" school.',
        source: 'Dartmouth admissions presentations',
      },
      {
        type: 'reader_perspective',
        content: 'The D-Plan (quarter system with terms off) is central to Dartmouth. It enables study abroad, internships, and unique experiences. Show you understand how you\'d use it.',
        source: 'Dartmouth AO interviews',
      },
      {
        type: 'common_mistake',
        content: 'First-Year Trips is THE defining Dartmouth experience. 95% of students do it. If you can\'t enthusiastically discuss spending a week in the wilderness with strangers, Dartmouth might not be for you.',
        source: 'Dartmouth culture and traditions',
      },
      {
        type: 'differentiation',
        content: 'Dartmouth Outing Club is the oldest and largest college outing club in America. Outdoor culture isn\'t a side thing - it\'s central to Dartmouth identity.',
        source: 'Dartmouth DOC',
      },
      {
        type: 'what_works',
        content: 'Dartmouth has fierce school spirit (the Big Green). Traditions like Winter Carnival, Green Key, homecoming matter. Students who embrace tradition thrive here.',
        source: 'Dartmouth student life',
      },
    ],
    scoringNotes: [
      {
        dimension: 'school_fit',
        adjustment: 'critical',
        reason: 'Dartmouth\'s size and location are intentional choices. Essays must show genuine fit with small-town, outdoor culture.',
      },
      {
        dimension: 'authenticity',
        adjustment: 'higher',
        reason: 'Dartmouth\'s close-knit community means you\'ll actually know everyone. Authentic personality matters.',
      },
      {
        dimension: 'structure',
        adjustment: 'lower',
        reason: 'Dartmouth culture is more casual. Over-polished essays can feel out of place.',
      },
    ],
    whatMakesThisSchoolDifferent: 'Smallest Ivy, rural location, quarter system (D-Plan). The outdoor culture is genuine - students really do ski, hike, and embrace New Hampshire winters. Undergraduate focus rivals Princeton\'s.',
    studentBodyCharacter: 'Outdoorsy, community-oriented, tradition-loving. Dartmouth students actively chose a small-town experience. Strong athletics culture, school spirit, and tight-knit community. Less urban/cosmopolitan than peers.',
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
    aoInsights: [
      {
        type: 'what_works',
        content: 'Cornell has SEVEN undergraduate colleges, each with different admissions and culture. The #1 thing readers look for: do you actually understand the college you\'re applying to?',
        source: 'Cornell admissions presentations',
      },
      {
        type: 'reader_perspective',
        content: 'Each Cornell college has its own admissions committee. A Hotel School reader knows hospitality. An Engineering reader knows engineering. Don\'t fake expertise.',
        source: 'Cornell AO interviews',
      },
      {
        type: 'common_mistake',
        content: 'Writing a generic "Why Cornell" essay instead of "Why THIS College at Cornell" is the most common mistake. The 650-word essay is about your specific college.',
        source: 'Cornell admissions blog',
      },
      {
        type: 'differentiation',
        content: '"Any person, any study" is Cornell\'s founding motto. It\'s a land-grant institution - accessibility and practical application are core values, not just rhetoric.',
        source: 'Cornell mission and history',
      },
      {
        type: 'what_works',
        content: 'Cornell is in Ithaca, not near anything. Students who thrive here embrace the isolation - the gorges, the natural beauty, the self-contained community.',
        source: 'Cornell location and culture',
      },
    ],
    scoringNotes: [
      {
        dimension: 'specificity_fit',
        adjustment: 'critical',
        reason: 'Cornell essays MUST be college-specific. Generic Cornell essays are immediately flagged.',
      },
      {
        dimension: 'authenticity',
        adjustment: 'higher',
        reason: 'Each college has its own culture. Authenticity about why THIS college matters.',
      },
      {
        dimension: 'reflection',
        adjustment: 'higher',
        reason: 'The 650-word limit is generous. Cornell wants depth of thought about your fit.',
      },
    ],
    whatMakesThisSchoolDifferent: 'Seven distinct colleges under one university - from Hotel School to Agriculture to Engineering. Land-grant mission means practical application and accessibility. Largest Ivy by enrollment.',
    studentBodyCharacter: 'Diverse by design - different colleges attract very different students. Engineering is rigorous, Hotel is hospitality-focused, Arts & Sciences is liberal arts. United by a love for Ithaca\'s natural beauty.',
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
    aoInsights: [
      {
        type: 'what_works',
        content: 'Penn\'s "One University" policy means you can take classes across all four schools. The best essays show how you\'d COMBINE resources - Wharton + Engineering, or College + Nursing.',
        source: 'Penn admissions presentations',
      },
      {
        type: 'reader_perspective',
        content: 'Penn is more pre-professional than most Ivies and proud of it. "I want to make an impact in the real world" is valued here. Don\'t pretend to be purely academic if you\'re not.',
        source: 'Penn AO interviews',
      },
      {
        type: 'common_mistake',
        content: 'Wharton applicants often focus only on business prestige. Penn wants to see how you\'ll use Wharton\'s resources to CONTRIBUTE, not just advance your career.',
        source: 'Wharton admissions blog',
      },
      {
        type: 'differentiation',
        content: 'West Philadelphia engagement is a major Penn value. The university invests heavily in its neighborhood. Showing awareness of Penn\'s civic role resonates.',
        source: 'Penn Compact and community focus',
      },
      {
        type: 'what_works',
        content: 'Penn entrepreneurship culture is real - more startups come from Penn than most peers. If you have entrepreneurial interests, this is the place to highlight them.',
        source: 'Penn Center for Innovation',
      },
    ],
    scoringNotes: [
      {
        dimension: 'specificity_fit',
        adjustment: 'critical',
        reason: 'Penn has four undergraduate schools. Essays must show specific understanding of YOUR school and cross-school opportunities.',
      },
      {
        dimension: 'school_fit',
        adjustment: 'higher',
        reason: 'The 450-word "Why Penn" is substantial. They want detailed, researched responses.',
      },
      {
        dimension: 'reflection',
        adjustment: 'lower',
        reason: 'Penn values action and impact. Pure reflection without connection to doing is less valued here.',
      },
    ],
    whatMakesThisSchoolDifferent: 'Most pre-professional Ivy. Cross-school collaboration ("One University"). Strong entrepreneurship and innovation culture. Urban campus with civic engagement. Wharton is the only Ivy undergraduate business school.',
    studentBodyCharacter: 'Ambitious, entrepreneurial, practical. Penn students want to DO things in the world, not just study them. More career-focused than Brown or Yale, but with genuine intellectual engagement. Philadelphia engagement is real.',
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
