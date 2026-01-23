/**
 * RAG Seed Data
 * Initial feedback patterns and school insights for the RAG system
 *
 * This data bootstraps the system and will be enriched through the feedback loop
 */

// =============================================================================
// FEEDBACK PATTERNS
// =============================================================================

export interface SeedFeedbackPattern {
  issueType: string;
  issueCategory: 'structure' | 'content' | 'style' | 'fit' | 'voice' | 'mechanics';
  patternName: string;
  description: string;
  exampleBefore?: string;
  exampleAfter?: string;
  fixStrategy: string;
  severity: number; // 1-5
  essayType?: string;
  schoolId?: string;
}

export const SEED_FEEDBACK_PATTERNS: SeedFeedbackPattern[] = [
  // ===================
  // STRUCTURE PATTERNS
  // ===================
  {
    issueType: 'generic_opening',
    issueCategory: 'structure',
    patternName: 'Generic Opening',
    description: 'Essay opens with a dictionary definition, broad question, or cliche statement instead of jumping into the story.',
    exampleBefore: 'Have you ever wondered what it means to truly overcome adversity?',
    exampleAfter: 'The beaker shattered before I could react, three months of research pooling on the lab floor.',
    fixStrategy: 'Start in the middle of the action (in medias res). Drop the reader into a specific moment that captures attention immediately.',
    severity: 4,
  },
  {
    issueType: 'thesis_statement_opening',
    issueCategory: 'structure',
    patternName: 'Academic Essay Structure',
    description: 'Essay reads like a school assignment with thesis statement, topic sentences, and formal conclusion. College essays should be personal narratives.',
    exampleBefore: 'In this essay, I will discuss how my experience volunteering taught me three important lessons about community service.',
    exampleAfter: 'Maria handed me the shovel with a skeptical look. "You sure you know what you\'re doing?"',
    fixStrategy: 'Remove academic scaffolding. Tell a story with scenes, dialogue, and personal reflection rather than arguing a thesis.',
    severity: 4,
  },
  {
    issueType: 'weak_ending',
    issueCategory: 'structure',
    patternName: 'Weak or Generic Ending',
    description: 'Essay ends with a cliche, generic lesson, or abrupt stop without meaningful resolution.',
    exampleBefore: 'This experience taught me that hard work pays off and I will always remember this lesson.',
    exampleAfter: 'Now when I walk past the chemistry lab, I smile. That shattered beaker led to my first published paper.',
    fixStrategy: 'End with a specific image, callback to the opening, or concrete forward-looking statement. Avoid summarizing lessons.',
    severity: 3,
  },
  {
    issueType: 'missing_reflection',
    issueCategory: 'structure',
    patternName: 'All Action, No Reflection',
    description: 'Essay describes events but never shows the writer\'s internal growth, thoughts, or what they learned.',
    exampleBefore: 'I practiced for six hours every day. Then I won the competition. It was a great achievement.',
    exampleAfter: 'I practiced for six hours every day, but it was during hour five, when my fingers ached and my mind wandered, that I understood what discipline really meant.',
    fixStrategy: 'After each significant event, pause to show internal reaction. Use phrases like "I realized," "for the first time," or describe emotional/intellectual shifts.',
    severity: 5,
  },
  {
    issueType: 'chronological_trap',
    issueCategory: 'structure',
    patternName: 'Chronological Trap',
    description: 'Essay plods through events in strict chronological order ("First...then...finally") without narrative interest.',
    exampleBefore: 'First, I joined the robotics club in freshman year. Then, in sophomore year, I became team lead. Finally, in junior year, we won regionals.',
    exampleAfter: 'The robot\'s arm jerked wildly, sending our chances of winning spinning across the arena floor. I had thirty seconds to fix three years of work.',
    fixStrategy: 'Start at the climax or a pivotal moment. Use flashbacks strategically. Organize by theme or emotion, not timeline.',
    severity: 3,
  },

  // ===================
  // CONTENT PATTERNS
  // ===================
  {
    issueType: 'telling_not_showing',
    issueCategory: 'content',
    patternName: 'Telling Instead of Showing',
    description: 'Essay tells readers about qualities ("I am hardworking") instead of showing through specific scenes and actions.',
    exampleBefore: 'I am a very dedicated person who always works hard to achieve my goals.',
    exampleAfter: 'At 4 AM, my alarm went off for the third time. I pulled myself out of bed, grabbed my calculator, and got back to the problem set.',
    fixStrategy: 'Replace every adjective about yourself with a scene that demonstrates it. Let readers conclude your qualities from your actions.',
    severity: 5,
  },
  {
    issueType: 'resume_listing',
    issueCategory: 'content',
    patternName: 'Resume Listing',
    description: 'Essay reads like a list of accomplishments without depth, reflection, or personal connection.',
    exampleBefore: 'I am president of three clubs, captain of the tennis team, and have a 4.0 GPA while also volunteering 10 hours per week.',
    exampleAfter: 'The tennis court was empty at 6 AM, but that\'s when I did my best thinking. Between serves, I planned the club meeting agenda.',
    fixStrategy: 'Pick ONE activity or moment. Go deep instead of broad. Show what it means to you, not just what you did.',
    severity: 4,
  },
  {
    issueType: 'trauma_without_growth',
    issueCategory: 'content',
    patternName: 'Trauma Without Growth',
    description: 'Essay describes difficult experiences but focuses on the trauma itself rather than how the writer grew or changed.',
    exampleBefore: 'My parents\' divorce was the hardest thing I\'ve ever experienced. I cried every night for months.',
    exampleAfter: 'My parents\' divorce taught me that love isn\'t about perfection. I now bring that understanding to every relationship I build.',
    fixStrategy: 'The trauma should be context, not the focus. Spend 80% of the essay on growth, perspective gained, or positive action taken.',
    severity: 4,
  },
  {
    issueType: 'savior_complex',
    issueCategory: 'content',
    patternName: 'Savior Complex',
    description: 'Essay about volunteering or service focuses on "helping those less fortunate" rather than mutual learning and genuine connection.',
    exampleBefore: 'When I went to the orphanage, I felt so grateful for my privileged life and wanted to help these unfortunate children.',
    exampleAfter: 'Miguel taught me more about resilience in one afternoon than any book ever could. His optimism challenged everything I thought I knew about happiness.',
    fixStrategy: 'Center the people you worked with as full humans with agency. Focus on what you learned FROM them, not what you did FOR them.',
    severity: 4,
  },
  {
    issueType: 'missed_specificity',
    issueCategory: 'content',
    patternName: 'Lack of Specific Details',
    description: 'Essay uses vague language where specific details would create stronger imagery and credibility.',
    exampleBefore: 'I worked on an important research project that taught me a lot about science.',
    exampleAfter: 'I spent three months analyzing soil samples from the Amazon basin, discovering that microplastic contamination had spread 200 miles further than anyone expected.',
    fixStrategy: 'Add sensory details, names, numbers, and specific examples. Replace every "thing" and "stuff" with concrete nouns.',
    severity: 4,
  },

  // ===================
  // STYLE PATTERNS
  // ===================
  {
    issueType: 'passive_voice_overuse',
    issueCategory: 'style',
    patternName: 'Passive Voice Overuse',
    description: 'Essay overuses passive voice ("was done," "was learned") instead of active voice, making it feel distant.',
    exampleBefore: 'A lesson was learned by me about the importance of perseverance.',
    exampleAfter: 'I learned that perseverance isn\'t about never falling—it\'s about how quickly you get back up.',
    fixStrategy: 'Put yourself as the subject of sentences. Use "I did" instead of "it was done." Active voice shows ownership and agency.',
    severity: 3,
  },
  {
    issueType: 'thesaurus_abuse',
    issueCategory: 'style',
    patternName: 'Thesaurus Abuse',
    description: 'Essay uses overly complex vocabulary that sounds unnatural, likely to seem impressive rather than communicate clearly.',
    exampleBefore: 'This serendipitous concatenation of circumstances facilitated my metamorphosis into a perspicacious scholar.',
    exampleAfter: 'That lucky accident changed how I think about learning.',
    fixStrategy: 'Use the simplest word that conveys your meaning. Write how you speak. Authenticity beats vocabulary.',
    severity: 3,
  },
  {
    issueType: 'cliche_overload',
    issueCategory: 'style',
    patternName: 'Cliche Overload',
    description: 'Essay relies heavily on overused phrases that thousands of other applicants also use.',
    exampleBefore: 'This experience was a turning point that taught me to think outside the box and be the change I want to see.',
    exampleAfter: 'After that day, I stopped asking "why me?" and started asking "what now?"',
    fixStrategy: 'Flag every phrase you\'ve heard before. Replace with original language that could only come from your specific experience.',
    severity: 4,
  },
  {
    issueType: 'sentence_monotony',
    issueCategory: 'style',
    patternName: 'Sentence Monotony',
    description: 'All sentences have similar length and structure, creating a monotonous rhythm.',
    exampleBefore: 'I went to school. I studied hard. I got good grades. I joined clubs. I made friends.',
    exampleAfter: 'I went to school, studied hard, and joined every club that would have me. The good grades followed. So did the friends.',
    fixStrategy: 'Vary sentence length. Mix short punchy sentences with longer complex ones. Read aloud to check rhythm.',
    severity: 2,
  },

  // ===================
  // FIT PATTERNS
  // ===================
  {
    issueType: 'generic_why_us',
    issueCategory: 'fit',
    patternName: 'Generic "Why Us" Response',
    description: 'Essay mentions school features that could apply to any top university without demonstrating genuine research.',
    exampleBefore: 'I want to attend your prestigious university because of its excellent professors and diverse community.',
    exampleAfter: 'Professor Chen\'s research on neural networks for climate modeling directly connects to my work on satellite data analysis.',
    fixStrategy: 'Name specific courses, professors, programs, or traditions. Explain why this specific school, not just any good school.',
    severity: 5,
    essayType: 'WHY_US',
  },
  {
    issueType: 'prestige_chasing',
    issueCategory: 'fit',
    patternName: 'Prestige-Focused Language',
    description: 'Essay focuses on rankings, reputation, or "dream school" language rather than substantive fit.',
    exampleBefore: 'Harvard has been my dream school ever since I learned it was the best university in the world.',
    exampleAfter: 'The Freshman Seminars program caught my attention because I want to explore philosophy and physics together—and Dr. Sarah\'s "Physics of Music" seminar is exactly that intersection.',
    fixStrategy: 'Remove all references to rankings, prestige, or "dream school." Focus entirely on specific academic and community fit.',
    severity: 4,
    essayType: 'WHY_US',
  },
  {
    issueType: 'wikipedia_research',
    issueCategory: 'fit',
    patternName: 'Surface-Level Research',
    description: 'Essay only mentions information easily found on school\'s homepage without deeper research.',
    exampleBefore: 'Yale\'s residential college system and commitment to liberal arts education appeal to me.',
    exampleAfter: 'I want to join Trumbull College specifically because of its tradition of environmental advocacy—their campus garden project aligns perfectly with my urban farming research.',
    fixStrategy: 'Go beyond the homepage. Read student blogs, visit Reddit threads, watch YouTube vlogs, talk to alumni. Find details only a real researcher would know.',
    severity: 4,
    essayType: 'WHY_US',
  },

  // ===================
  // VOICE PATTERNS
  // ===================
  {
    issueType: 'ai_written_signals',
    issueCategory: 'voice',
    patternName: 'AI-Written Signals',
    description: 'Essay contains phrases, structures, or patterns commonly associated with AI-generated text.',
    exampleBefore: 'In conclusion, this experience served as a testament to my journey of self-discovery and personal growth.',
    exampleAfter: 'Looking back, I realize the experiment that failed taught me more than the one that succeeded ever could.',
    fixStrategy: 'Read your essay out loud. Does it sound like you? Remove any phrase you wouldn\'t say in conversation with a friend.',
    severity: 5,
  },
  {
    issueType: 'voice_inconsistency',
    issueCategory: 'voice',
    patternName: 'Voice Inconsistency',
    description: 'Essay shifts between different tones, vocabulary levels, or writing styles, suggesting multiple authors or heavy editing.',
    exampleBefore: 'I love playing video games lol. Subsequently, this recreational activity has engendered within me a profound appreciation for collaborative endeavors.',
    exampleAfter: 'Video games taught me something unexpected about teamwork. When you\'re in a raid with strangers, you learn to communicate fast—or you all fail together.',
    fixStrategy: 'Pick one voice and stick with it. Your essay should sound like one person wrote it. Have someone who knows you well read it and flag anything that doesn\'t sound like you.',
    severity: 4,
  },
  {
    issueType: 'overly_formal',
    issueCategory: 'voice',
    patternName: 'Overly Formal Tone',
    description: 'Essay sounds like a business letter or academic paper rather than a personal narrative.',
    exampleBefore: 'I am writing to express my sincere interest in attending your esteemed institution.',
    exampleAfter: 'The first time I walked into a chemistry lab, I knew I was home.',
    fixStrategy: 'Write as if you\'re telling the story to a friendly adult who wants to know you. Be yourself, not a version of yourself you think they want.',
    severity: 3,
  },

  // ===================
  // MECHANICS PATTERNS
  // ===================
  {
    issueType: 'word_limit_violation',
    issueCategory: 'mechanics',
    patternName: 'Word Limit Violation',
    description: 'Essay significantly exceeds the word limit, which may be automatically rejected by application systems.',
    exampleBefore: '850 words when limit is 650',
    exampleAfter: '645 words with tighter, more impactful prose',
    fixStrategy: 'Cut ruthlessly. Every sentence must earn its place. Remove qualifiers, combine sentences, and cut entire paragraphs if needed.',
    severity: 5,
  },
  {
    issueType: 'paragraph_wall',
    issueCategory: 'mechanics',
    patternName: 'Wall of Text',
    description: 'Essay has no paragraph breaks or has paragraphs that are too long, making it hard to read.',
    exampleBefore: 'One 500-word paragraph with no breaks',
    exampleAfter: '4-5 paragraphs of 80-150 words each',
    fixStrategy: 'Break into 4-6 paragraphs. Each paragraph should have one main idea. Add white space for readability.',
    severity: 3,
  },
];

// =============================================================================
// SCHOOL INSIGHTS
// =============================================================================

export interface SeedSchoolInsight {
  schoolId: string;
  insightType: 'ao_quote' | 'student_tip' | 'common_mistake' | 'what_works' | 'program_detail';
  content: string;
  source?: string;
  essayTypes: string[];
  relevanceScore: number; // 1-5
}

export const SEED_SCHOOL_INSIGHTS: SeedSchoolInsight[] = [
  // ===================
  // HARVARD
  // ===================
  {
    schoolId: 'harvard',
    insightType: 'ao_quote',
    content: 'We\'re looking for students who will take full advantage of the resources here. Tell us specifically what you\'d do.',
    source: 'Harvard Admissions Information Session',
    essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
    relevanceScore: 5,
  },
  {
    schoolId: 'harvard',
    insightType: 'what_works',
    content: 'Successful Harvard essays often demonstrate intellectual curiosity through specific examples—not just claiming to be curious, but showing a genuine question that keeps them up at night.',
    essayTypes: ['PERSONAL_STATEMENT', 'SUPPLEMENTAL'],
    relevanceScore: 5,
  },
  {
    schoolId: 'harvard',
    insightType: 'common_mistake',
    content: 'Many applicants focus on what Harvard can give them (prestige, network, name) rather than what they will contribute to the community. This reads as transactional.',
    essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
    relevanceScore: 4,
  },
  {
    schoolId: 'harvard',
    insightType: 'student_tip',
    content: 'Mentioning the House system and how you\'d engage with residential life shows you understand Harvard\'s community structure beyond just academics.',
    essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
    relevanceScore: 4,
  },
  {
    schoolId: 'harvard',
    insightType: 'program_detail',
    content: 'Freshman Seminars are small (12 students) discussion-based courses on specialized topics. Mentioning a specific seminar shows deep research.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },

  // ===================
  // YALE
  // ===================
  {
    schoolId: 'yale',
    insightType: 'ao_quote',
    content: 'We read holistically, but we\'re especially interested in students who will engage deeply with our residential college community.',
    source: 'Yale Admissions Podcast',
    essayTypes: ['SUPPLEMENTAL'],
    relevanceScore: 5,
  },
  {
    schoolId: 'yale',
    insightType: 'what_works',
    content: 'Strong Yale essays reference specific residential colleges, arts organizations, or academic programs rather than general Yale attributes.',
    essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
    relevanceScore: 5,
  },
  {
    schoolId: 'yale',
    insightType: 'common_mistake',
    content: 'Comparing Yale favorably to Harvard in your essay is a red flag. Focus on Yale\'s unique strengths, not relative rankings.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },
  {
    schoolId: 'yale',
    insightType: 'student_tip',
    content: 'Yale\'s "short takes" questions are meant to show personality. Don\'t try to be impressive—try to be interesting and authentic.',
    essayTypes: ['SUPPLEMENTAL'],
    relevanceScore: 5,
  },
  {
    schoolId: 'yale',
    insightType: 'program_detail',
    content: 'Directed Studies is a year-long humanities program for freshmen that integrates literature, history, and philosophy. Mentioning it shows you understand Yale\'s interdisciplinary approach.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },

  // ===================
  // PRINCETON
  // ===================
  {
    schoolId: 'princeton',
    insightType: 'ao_quote',
    content: '"In the nation\'s service" isn\'t just a motto—we look for students who demonstrate genuine commitment to making a difference beyond themselves.',
    source: 'Princeton Admission Website',
    essayTypes: ['PERSONAL_STATEMENT', 'SUPPLEMENTAL'],
    relevanceScore: 5,
  },
  {
    schoolId: 'princeton',
    insightType: 'what_works',
    content: 'Princeton values intellectual independence. Essays that show you pursuing knowledge for its own sake, not just for grades or applications, resonate strongly.',
    essayTypes: ['PERSONAL_STATEMENT'],
    relevanceScore: 5,
  },
  {
    schoolId: 'princeton',
    insightType: 'common_mistake',
    content: 'Writing about service experiences without genuine reflection comes across as resume-padding at Princeton, which takes service seriously.',
    essayTypes: ['SUPPLEMENTAL'],
    relevanceScore: 4,
  },
  {
    schoolId: 'princeton',
    insightType: 'student_tip',
    content: 'The senior thesis is a defining Princeton experience. If you\'re excited about deep research, mentioning this shows you understand Princeton\'s academic culture.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },
  {
    schoolId: 'princeton',
    insightType: 'program_detail',
    content: 'Princeton\'s Honor Code creates a culture of trust where exams are unproctored. Referencing this shows you understand and value academic integrity.',
    essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
    relevanceScore: 4,
  },

  // ===================
  // COLUMBIA
  // ===================
  {
    schoolId: 'columbia',
    insightType: 'ao_quote',
    content: 'The Core Curriculum means every student shares foundational intellectual experiences. We want students excited by this community of inquiry.',
    source: 'Columbia Admissions',
    essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
    relevanceScore: 5,
  },
  {
    schoolId: 'columbia',
    insightType: 'what_works',
    content: 'Columbia essays that effectively use NYC as an educational extension—not just for fun or food—demonstrate understanding of the urban campus advantage.',
    essayTypes: ['WHY_US'],
    relevanceScore: 5,
  },
  {
    schoolId: 'columbia',
    insightType: 'common_mistake',
    content: 'Focusing on NYC nightlife, restaurants, or entertainment without academic connection makes you seem more interested in the city than the university.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },
  {
    schoolId: 'columbia',
    insightType: 'student_tip',
    content: 'The list questions (books, movies, etc.) are a chance to show intellectual personality. Include unexpected choices alongside classics.',
    essayTypes: ['SUPPLEMENTAL'],
    relevanceScore: 4,
  },
  {
    schoolId: 'columbia',
    insightType: 'program_detail',
    content: 'Literature Humanities and Contemporary Civilization are Core classes that all Columbia students take. Mentioning excitement for specific texts shows you\'ve researched the curriculum.',
    essayTypes: ['WHY_US'],
    relevanceScore: 5,
  },

  // ===================
  // BROWN
  // ===================
  {
    schoolId: 'brown',
    insightType: 'ao_quote',
    content: 'The Open Curriculum requires students to be self-directed learners. We want evidence you can design your own intellectual path.',
    source: 'Brown Admissions',
    essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
    relevanceScore: 5,
  },
  {
    schoolId: 'brown',
    insightType: 'what_works',
    content: 'The best Brown essays show intellectual curiosity that spans disciplines. If you\'re interested in one field only, explain why depth matters more than breadth to you.',
    essayTypes: ['PERSONAL_STATEMENT', 'WHY_US'],
    relevanceScore: 5,
  },
  {
    schoolId: 'brown',
    insightType: 'common_mistake',
    content: 'Saying you want the Open Curriculum "because you don\'t like requirements" suggests you want to avoid challenge, not embrace intellectual freedom.',
    essayTypes: ['WHY_US'],
    relevanceScore: 5,
  },
  {
    schoolId: 'brown',
    insightType: 'student_tip',
    content: 'Brown-RISD dual degree applicants should show genuine interest in both art/design AND academics. Don\'t use RISD as a backup plan.',
    essayTypes: ['SUPPLEMENTAL'],
    relevanceScore: 4,
  },
  {
    schoolId: 'brown',
    insightType: 'program_detail',
    content: 'Independent Concentrations let students design their own major. If you\'d create one, describe it—this shows you understand Brown\'s self-directed philosophy.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },

  // ===================
  // DARTMOUTH
  // ===================
  {
    schoolId: 'dartmouth',
    insightType: 'ao_quote',
    content: 'Our location shapes our community in profound ways. Students who thrive here embrace the outdoor culture and close-knit environment.',
    source: 'Dartmouth Admissions',
    essayTypes: ['WHY_US'],
    relevanceScore: 5,
  },
  {
    schoolId: 'dartmouth',
    insightType: 'what_works',
    content: 'Dartmouth essays that acknowledge and embrace the rural setting (rather than treating it as a drawback to overcome) show genuine fit.',
    essayTypes: ['WHY_US'],
    relevanceScore: 5,
  },
  {
    schoolId: 'dartmouth',
    insightType: 'common_mistake',
    content: 'Ignoring the D-Plan (quarter system with off-terms) in your essay suggests you haven\'t researched how Dartmouth actually works.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },
  {
    schoolId: 'dartmouth',
    insightType: 'student_tip',
    content: 'First-Year Trips is a beloved Dartmouth tradition. Mentioning it shows you understand the community-building culture that starts before classes even begin.',
    essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
    relevanceScore: 4,
  },
  {
    schoolId: 'dartmouth',
    insightType: 'program_detail',
    content: 'The Dartmouth Outing Club is the oldest and largest collegiate outing club in America. If outdoors are part of your identity, this is a key reference.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },

  // ===================
  // CORNELL
  // ===================
  {
    schoolId: 'cornell',
    insightType: 'ao_quote',
    content: '"Any person, any study" means we value diverse paths and perspectives. Show us your unique journey.',
    source: 'Cornell Mission',
    essayTypes: ['PERSONAL_STATEMENT', 'WHY_US'],
    relevanceScore: 5,
  },
  {
    schoolId: 'cornell',
    insightType: 'what_works',
    content: 'Cornell has 7 undergraduate colleges with different cultures and requirements. Essays must address your specific college, not just "Cornell."',
    essayTypes: ['WHY_US'],
    relevanceScore: 5,
  },
  {
    schoolId: 'cornell',
    insightType: 'common_mistake',
    content: 'Writing a generic Cornell essay without addressing the specific college you\'re applying to is one of the most common mistakes applicants make.',
    essayTypes: ['WHY_US'],
    relevanceScore: 5,
  },
  {
    schoolId: 'cornell',
    insightType: 'student_tip',
    content: 'Cornell\'s Project Teams let undergrads work on real engineering challenges. If applying to Engineering, mentioning a specific team shows research.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },
  {
    schoolId: 'cornell',
    insightType: 'program_detail',
    content: 'Cornell\'s land-grant mission emphasizes practical education and service to New York State. Understanding this history shows depth of research.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },

  // ===================
  // UPENN
  // ===================
  {
    schoolId: 'upenn',
    insightType: 'ao_quote',
    content: 'Penn is one university—we want students who will take advantage of all four schools, not just their home school.',
    source: 'Penn Admissions',
    essayTypes: ['WHY_US'],
    relevanceScore: 5,
  },
  {
    schoolId: 'upenn',
    insightType: 'what_works',
    content: 'Penn essays that show specific cross-school interests (taking Wharton classes as an Engineering student, etc.) demonstrate understanding of Penn\'s integrated approach.',
    essayTypes: ['WHY_US'],
    relevanceScore: 5,
  },
  {
    schoolId: 'upenn',
    insightType: 'common_mistake',
    content: 'Applying to Wharton only because of its business prestige, without showing genuine interest in business education, is obvious and ineffective.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },
  {
    schoolId: 'upenn',
    insightType: 'student_tip',
    content: 'Penn has strong civic engagement with West Philadelphia. Mentioning community partnership programs shows you understand Penn\'s commitment to its neighborhood.',
    essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
    relevanceScore: 4,
  },
  {
    schoolId: 'upenn',
    insightType: 'program_detail',
    content: 'The Huntsman Program and M&T (Management & Technology) are coordinated dual-degree programs. If applying, show genuine interest in both disciplines.',
    essayTypes: ['WHY_US'],
    relevanceScore: 4,
  },
];

// =============================================================================
// EXAMPLE ESSAYS (Anonymized Excerpts)
// =============================================================================

export interface SeedExampleEssay {
  schoolId: string;
  essayType: string;
  contentSnippet: string;
  outcome: string;
  scoreRange: string;
  themeTags: string[];
  spikeCategory: string;
  strengthNotes: string;
  keyTechniques: string[];
}

export const SEED_EXAMPLE_ESSAYS: SeedExampleEssay[] = [
  {
    schoolId: 'harvard',
    essayType: 'PERSONAL_STATEMENT',
    contentSnippet: `The beaker shattered before I could react. Three months of research, scattered across the lab floor in a puddle of blue solution. My mentor looked at me, waiting. I could have blamed the faulty equipment, the cramped workspace, anything. Instead, I knelt down and started cleaning.

"Why aren't you upset?" she asked.

"Because I learned something," I said. "The solution crystallized on impact. That's not supposed to happen at room temperature. Something in my formula is different."

That accident became my breakthrough. What I thought was a ruined experiment was actually a discovery—an unexpected chemical reaction that would eventually lead to my first published paper.`,
    outcome: 'ACCEPTED',
    scoreRange: '90-100',
    themeTags: ['research', 'failure', 'curiosity', 'resilience'],
    spikeCategory: 'stem-research',
    strengthNotes: 'Strong in-medias-res opening, dialogue creates scene, shows intellectual curiosity through action rather than claim, failure-to-success arc',
    keyTechniques: ['in-medias-res', 'dialogue', 'show-dont-tell', 'specific-details', 'growth-arc'],
  },
  {
    schoolId: 'yale',
    essayType: 'SUPPLEMENTAL',
    contentSnippet: `My grandmother's kitchen was my first laboratory. At seven, I watched her transform a handful of ingredients into dishes that made our neighbors knock on the door at dinnertime. She never used recipes—she tasted, adjusted, improvised.

"Cooking is chemistry," she told me once, adding a mysterious pinch of something to the pot. "Every ingredient reacts with others. Your job is to understand the reaction."

I didn't know it then, but she was teaching me science. Today, when I run experiments in the lab, I channel her intuition. I taste the data, adjust my hypotheses, improvise when results surprise me. My grandmother never went to college, but she taught me how to think like a scientist.`,
    outcome: 'ACCEPTED',
    scoreRange: '85-95',
    themeTags: ['family', 'science', 'heritage', 'mentorship'],
    spikeCategory: 'stem-research',
    strengthNotes: 'Personal connection to academic interest, concrete sensory details, dialogue, bridges past to present to future',
    keyTechniques: ['personal-connection', 'dialogue', 'sensory-details', 'metaphor', 'circular-structure'],
  },
  {
    schoolId: 'princeton',
    essayType: 'PERSONAL_STATEMENT',
    contentSnippet: `Every Saturday at 6 AM, I knock on doors. Not to sell anything—to listen.

It started as a school requirement: volunteer hours with the local food bank. But somewhere between Mrs. Patterson's stories about her late husband and Mr. Garcia's questions about my college plans, the requirement became a purpose.

I've learned that hunger isn't just about food. It's about dignity. When Mrs. Patterson thanks me for treating her "like a real person," I understand why service matters. When Mr. Garcia asks if I could help his grandson with homework, I see how one connection creates others.

The food bank doesn't need me to save anyone. It needs me to show up, consistently, and treat every person I meet as worthy of my full attention.`,
    outcome: 'ACCEPTED',
    scoreRange: '85-95',
    themeTags: ['service', 'community', 'growth', 'dignity'],
    spikeCategory: 'social-impact',
    strengthNotes: 'Avoids savior complex, focuses on mutual relationship, concrete examples, reflects on meaning of service',
    keyTechniques: ['specific-characters', 'dialogue', 'reflection', 'avoids-savior-complex', 'humble-tone'],
  },
  {
    schoolId: 'brown',
    essayType: 'WHY_US',
    contentSnippet: `I want to study the politics of food.

Not a traditional major, I know. But at Brown, I could combine Political Science with Urban Studies and Environmental Economics to understand why certain neighborhoods have grocery stores and others don't.

I've already started this research informally. Last summer, I mapped every food source within two miles of my house—I found 17 fast food restaurants and one grocery store. When I presented this to my city council, they invited me to join their food security task force.

At Brown, I'd take Professor Smith's "Urban Political Economy" alongside "Environmental Justice" from the Institute at Brown for Environment and Society. I'd propose an independent concentration if needed. The Open Curriculum isn't about avoiding requirements—it's about building something that doesn't exist yet.`,
    outcome: 'ACCEPTED',
    scoreRange: '90-100',
    themeTags: ['interdisciplinary', 'research', 'civic-engagement', 'self-directed'],
    spikeCategory: 'social-impact',
    strengthNotes: 'Shows understanding of Open Curriculum, specific courses and professors, demonstrates existing work, clear intellectual vision',
    keyTechniques: ['specific-research', 'concrete-examples', 'professor-mentions', 'demonstrates-fit', 'forward-looking'],
  },
];
