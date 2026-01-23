/**
 * Extended Generic Phrase Database
 * Additional patterns to expand detection to 500+ phrases
 */

import type { GenericPhrase } from './types';

// =============================================================================
// ADDITIONAL OPENING CLICHES
// =============================================================================

export const EXTENDED_OPENING_PHRASES: GenericPhrase[] = [
  {
    id: 'opening-blank-stared',
    phrase: 'I stared at the blank',
    pattern: /I stared at the blank/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Meta-writing about writing is overdone. Start with your actual story.',
  },
  {
    id: 'opening-beep-alarm',
    phrase: 'The alarm clock beeped',
    pattern: /(?:the|my) alarm (?:clock )?(?:beeped|rang|went off)/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Morning alarm openings are extremely common. Find a more distinctive moment.',
  },
  {
    id: 'opening-nervous-sweating',
    phrase: 'My palms were sweating',
    pattern: /(?:my )?palms (?:were|started) sweating/i,
    severity: 'soft',
    category: 'opening',
    suggestion: 'Physical anxiety cues are overused. Show nervousness in more original ways.',
  },
  {
    id: 'opening-heart-pounding',
    phrase: 'My heart was pounding',
    pattern: /(?:my )?heart (?:was|started) (?:pounding|racing|beating)/i,
    severity: 'soft',
    category: 'opening',
    suggestion: 'This physical description is very common. Try something more specific.',
  },
  {
    id: 'opening-little-did-i-know',
    phrase: 'Little did I know',
    pattern: /little did I know/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'This foreshadowing is cliché. Let your story unfold naturally.',
  },
  {
    id: 'opening-never-imagined',
    phrase: 'I never imagined',
    pattern: /I never (?:imagined|thought|expected)/i,
    severity: 'soft',
    category: 'opening',
    suggestion: 'Show the unexpected instead of telling us it was unexpected.',
  },
  {
    id: 'opening-there-i-was',
    phrase: 'There I was',
    pattern: /there I was/i,
    severity: 'soft',
    category: 'opening',
    suggestion: 'This dramatic setup can feel forced. Drop directly into the scene.',
  },
  {
    id: 'opening-it-all-started',
    phrase: 'It all started when',
    pattern: /it all (?:started|began) when/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Avoid chronological storytelling cues. Start in media res.',
  },
  {
    id: 'opening-they-say',
    phrase: 'They say that',
    pattern: /they say (?:that)?/i,
    severity: 'soft',
    category: 'opening',
    suggestion: 'Who says? Be specific or start with your own voice.',
  },
  {
    id: 'opening-one-day',
    phrase: 'One day',
    pattern: /^one day/i,
    severity: 'soft',
    category: 'opening',
    suggestion: 'Which day? Add specificity or start differently.',
  },
  {
    id: 'opening-as-i-sat',
    phrase: 'As I sat there',
    pattern: /as I sat (?:there|down)/i,
    severity: 'soft',
    category: 'opening',
    suggestion: 'Sitting openings lack dynamism. Start with action.',
  },
  {
    id: 'opening-my-story-begins',
    phrase: 'My story begins',
    pattern: /my (?:story|journey) begins/i,
    severity: 'hard',
    category: 'opening',
    suggestion: 'Don\'t announce your story. Just tell it.',
  },
];

// =============================================================================
// ADDITIONAL REFLECTION CLICHES
// =============================================================================

export const EXTENDED_REFLECTION_PHRASES: GenericPhrase[] = [
  {
    id: 'reflection-moment-clarity',
    phrase: 'In that moment of clarity',
    pattern: /in that moment of clarity/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Show the clarity through specific thoughts, not a label.',
  },
  {
    id: 'reflection-everything-clicked',
    phrase: 'Everything clicked',
    pattern: /everything (?:clicked|fell into place|made sense)/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'What specifically clicked? Describe the actual insight.',
  },
  {
    id: 'reflection-hit-me',
    phrase: 'It hit me',
    pattern: /it (?:hit me|dawned on me|struck me)/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Show the realization process, don\'t just announce it.',
  },
  {
    id: 'reflection-suddenly-realized',
    phrase: 'I suddenly realized',
    pattern: /I suddenly (?:realized|understood|knew)/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Remove "suddenly" and show the realization.',
  },
  {
    id: 'reflection-new-perspective',
    phrase: 'Gained a new perspective',
    pattern: /(?:gained|got|developed) a new perspective/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'What specific perspective? Describe the actual new view.',
  },
  {
    id: 'reflection-grateful-experience',
    phrase: 'Grateful for the experience',
    pattern: /grateful (?:for|that).{0,20}experience/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Gratitude is good, but show what you\'re specifically grateful for.',
  },
  {
    id: 'reflection-never-forget',
    phrase: 'I will never forget',
    pattern: /I (?:will|would|could) never forget/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Instead of saying you won\'t forget, show why it\'s memorable.',
  },
  {
    id: 'reflection-changed-outlook',
    phrase: 'Changed my outlook',
    pattern: /changed (?:my|the way I) (?:outlook|view|perspective)/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Describe the before and after outlook specifically.',
  },
  {
    id: 'reflection-valuable-lesson',
    phrase: 'Valuable lesson',
    pattern: /valuable (?:lesson|experience|learning)/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'What made it valuable? Be specific.',
  },
  {
    id: 'reflection-shaped-who-i-am',
    phrase: 'Shaped who I am',
    pattern: /(?:shaped|made me) who I am/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Every applicant says this. Show specifically how you changed.',
  },
  {
    id: 'reflection-forever-grateful',
    phrase: 'Forever grateful',
    pattern: /forever grateful/i,
    severity: 'soft',
    category: 'reflection',
    suggestion: 'Overused phrase. Express gratitude more specifically.',
  },
  {
    id: 'reflection-opened-doors',
    phrase: 'Opened doors',
    pattern: /opened (?:so many )?doors/i,
    severity: 'hard',
    category: 'reflection',
    suggestion: 'Which doors specifically? Name them.',
  },
];

// =============================================================================
// ADDITIONAL "WHY SCHOOL" CLICHES
// =============================================================================

export const EXTENDED_WHY_SCHOOL_PHRASES: GenericPhrase[] = [
  {
    id: 'why-perfect-fit',
    phrase: 'Perfect fit',
    pattern: /(?:the )?perfect fit/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Don\'t claim fit—demonstrate it with specifics.',
  },
  {
    id: 'why-dream-school',
    phrase: 'Dream school',
    pattern: /(?:my )?dream school/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Dreams don\'t show fit. Explain specific reasons.',
  },
  {
    id: 'why-fall-in-love',
    phrase: 'Fell in love with',
    pattern: /fell in love with (?:the )?(?:campus|school|university)/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'What specifically did you love? Be concrete.',
  },
  {
    id: 'why-vibrant-community',
    phrase: 'Vibrant community',
    pattern: /vibrant (?:community|campus|culture)/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Every school claims this. What makes this one different?',
  },
  {
    id: 'why-rigorous-academics',
    phrase: 'Rigorous academics',
    pattern: /rigorous (?:academics|curriculum|program)/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'All top schools are rigorous. Name specific courses or programs.',
  },
  {
    id: 'why-since-visited',
    phrase: 'Ever since I visited',
    pattern: /ever since I (?:visited|toured)/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'What specifically about the visit? Don\'t rely on the visit alone.',
  },
  {
    id: 'why-resources-opportunities',
    phrase: 'Resources and opportunities',
    pattern: /resources and opportunities/i,
    severity: 'hard',
    category: 'buzzword',
    suggestion: 'Which resources? What opportunities? Be specific.',
  },
  {
    id: 'why-world-class',
    phrase: 'World-class',
    pattern: /world[- ]class/i,
    severity: 'hard',
    category: 'buzzword',
    suggestion: 'Generic praise. Show specific knowledge of the school.',
  },
  {
    id: 'why-unparalleled',
    phrase: 'Unparalleled',
    pattern: /\bunparalleled\b/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Hyperbolic. Be more measured and specific.',
  },
  {
    id: 'why-intellectually-curious',
    phrase: 'Intellectually curious students',
    pattern: /intellectually curious (?:students|peers|community)/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Every selective school says this. What about the curiosity here?',
  },
  {
    id: 'why-collaborative-environment',
    phrase: 'Collaborative environment',
    pattern: /collaborative (?:environment|atmosphere|culture)/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Generic. Give specific examples of collaboration.',
  },
  {
    id: 'why-cutting-edge',
    phrase: 'Cutting-edge',
    pattern: /cutting[- ]edge/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'What specifically is cutting-edge? Name it.',
  },
  {
    id: 'why-limitless-possibilities',
    phrase: 'Limitless possibilities',
    pattern: /limitless (?:possibilities|opportunities|potential)/i,
    severity: 'hard',
    category: 'buzzword',
    suggestion: 'Limits exist everywhere. Be realistic and specific.',
  },
];

// =============================================================================
// ADDITIONAL CLOSING CLICHES
// =============================================================================

export const EXTENDED_CLOSING_PHRASES: GenericPhrase[] = [
  {
    id: 'closing-bright-future',
    phrase: 'Bright future',
    pattern: /bright (?:future|tomorrow)/i,
    severity: 'soft',
    category: 'closing',
    suggestion: 'Vague optimism. Be specific about your plans.',
  },
  {
    id: 'closing-sky-limit',
    phrase: 'The sky is the limit',
    pattern: /sky(?:'s| is) the limit/i,
    severity: 'hard',
    category: 'closing',
    suggestion: 'Cliché. Express ambition more originally.',
  },
  {
    id: 'closing-world-awaits',
    phrase: 'The world awaits',
    pattern: /(?:the )?world awaits/i,
    severity: 'hard',
    category: 'closing',
    suggestion: 'Overwrought ending. Be more grounded.',
  },
  {
    id: 'closing-chapter-begins',
    phrase: 'A new chapter begins',
    pattern: /(?:a )?new chapter (?:begins|starts|of my life)/i,
    severity: 'hard',
    category: 'closing',
    suggestion: 'Avoid book metaphors for life transitions.',
  },
  {
    id: 'closing-rest-is-history',
    phrase: 'The rest is history',
    pattern: /the rest is history/i,
    severity: 'hard',
    category: 'closing',
    suggestion: 'Skips the actual story. Tell us what happened.',
  },
  {
    id: 'closing-forever-changed',
    phrase: 'I was forever changed',
    pattern: /I (?:was|am) forever changed/i,
    severity: 'hard',
    category: 'closing',
    suggestion: 'Show the change, don\'t declare it.',
  },
  {
    id: 'closing-ready-future',
    phrase: 'Ready for whatever the future holds',
    pattern: /ready for (?:whatever|anything).{0,20}(?:future|comes)/i,
    severity: 'soft',
    category: 'closing',
    suggestion: 'Be specific about what you\'re ready for.',
  },
  {
    id: 'closing-person-today',
    phrase: 'The person I am today',
    pattern: /the person I am today/i,
    severity: 'soft',
    category: 'closing',
    suggestion: 'Show who you are through examples, not declarations.',
  },
  {
    id: 'closing-excited-future',
    phrase: 'Excited for what\'s to come',
    pattern: /excited (?:for|about) what'?s (?:to come|ahead|next)/i,
    severity: 'soft',
    category: 'closing',
    suggestion: 'Express specific excitement about specific things.',
  },
  {
    id: 'closing-journey-beginning',
    phrase: 'My journey is just beginning',
    pattern: /(?:my )?journey (?:is|has) just (?:begun|beginning|started)/i,
    severity: 'hard',
    category: 'closing',
    suggestion: 'Avoid journey clichés. End with something specific.',
  },
];

// =============================================================================
// ADDITIONAL ACTIVITY/LEADERSHIP CLICHES
// =============================================================================

export const EXTENDED_ACTIVITY_PHRASES: GenericPhrase[] = [
  {
    id: 'activity-natural-leader',
    phrase: 'Natural leader',
    pattern: /natural (?:born )?leader/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Show leadership through actions, not labels.',
  },
  {
    id: 'activity-took-initiative',
    phrase: 'Took initiative',
    pattern: /took (?:the )?initiative/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'What initiative specifically? Describe the action.',
  },
  {
    id: 'activity-stepped-up',
    phrase: 'Stepped up',
    pattern: /stepped (?:up|in)/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Describe specifically what you did.',
  },
  {
    id: 'activity-role-model',
    phrase: 'Role model',
    pattern: /(?:a|as a|became a) role model/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Let others call you a role model. Show your impact.',
  },
  {
    id: 'activity-work-ethic',
    phrase: 'Strong work ethic',
    pattern: /strong work ethic/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Demonstrate work ethic through examples.',
  },
  {
    id: 'activity-time-management',
    phrase: 'Time management skills',
    pattern: /time management (?:skills|abilities)/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Show, don\'t tell. Give an example.',
  },
  {
    id: 'activity-passion-helping',
    phrase: 'Passion for helping others',
    pattern: /passion for helping (?:others|people)/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Show the passion through specific actions.',
  },
  {
    id: 'activity-giving-back',
    phrase: 'Giving back',
    pattern: /giving back/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'What specifically? How? To whom?',
  },
  {
    id: 'activity-community-service',
    phrase: 'Community service is important to me',
    pattern: /community service is (?:important|meaningful) to me/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Show why through a specific story.',
  },
  {
    id: 'activity-volunteer-hours',
    phrase: 'Volunteer hours',
    pattern: /(?:\d+|many|numerous) (?:volunteer |community service )?hours/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Hours matter less than impact. Focus on what you did.',
  },
];

// =============================================================================
// FILLER WORDS AND WEAK INTENSIFIERS
// =============================================================================

export const FILLER_PHRASES: GenericPhrase[] = [
  {
    id: 'filler-basically',
    phrase: 'basically',
    pattern: /\bbasically\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Remove "basically"—it adds nothing.',
  },
  {
    id: 'filler-literally',
    phrase: 'literally',
    pattern: /\bliterally\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Usually misused. Remove unless actually literal.',
  },
  {
    id: 'filler-actually',
    phrase: 'actually',
    pattern: /\bactually\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Often unnecessary. Consider removing.',
  },
  {
    id: 'filler-definitely',
    phrase: 'definitely',
    pattern: /\bdefinitely\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Weak emphasis. Let your content speak.',
  },
  {
    id: 'filler-extremely',
    phrase: 'extremely',
    pattern: /\bextremely\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Overused intensifier. Find a stronger word.',
  },
  {
    id: 'filler-incredibly',
    phrase: 'incredibly',
    pattern: /\bincredibly\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Overused. Be more specific about degree.',
  },
  {
    id: 'filler-absolutely',
    phrase: 'absolutely',
    pattern: /\babsolutely\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Often empty emphasis. Consider removing.',
  },
  {
    id: 'filler-truly',
    phrase: 'truly',
    pattern: /\btruly\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Weak intensifier. Let your point stand alone.',
  },
  {
    id: 'filler-totally',
    phrase: 'totally',
    pattern: /\btotally\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Informal and weak. Remove or replace.',
  },
  {
    id: 'filler-completely',
    phrase: 'completely',
    pattern: /\bcompletely\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Often unnecessary. Is it really complete?',
  },
  {
    id: 'filler-ultimately',
    phrase: 'ultimately',
    pattern: /\bultimately\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Often filler. Cut if not adding meaning.',
  },
  {
    id: 'filler-essentially',
    phrase: 'essentially',
    pattern: /\bessentially\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Often vague. Be direct instead.',
  },
];

// =============================================================================
// PRETENTIOUS/OVERREACHING PHRASES
// =============================================================================

export const PRETENTIOUS_PHRASES: GenericPhrase[] = [
  {
    id: 'pretentious-existential',
    phrase: 'existential',
    pattern: /\bexistential\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Often overused in essays. Use only if genuinely applicable.',
  },
  {
    id: 'pretentious-transcend',
    phrase: 'transcend',
    pattern: /\btranscend(?:s|ed|ing)?\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'High-register word that may seem pretentious.',
  },
  {
    id: 'pretentious-profound',
    phrase: 'profound',
    pattern: /\bprofound(?:ly)?\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Let readers decide if it\'s profound.',
  },
  {
    id: 'pretentious-ephemeral',
    phrase: 'ephemeral',
    pattern: /\bephemeral\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Fancy word—is "fleeting" or "brief" clearer?',
  },
  {
    id: 'pretentious-quintessential',
    phrase: 'quintessential',
    pattern: /\bquintessential\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Overused in essays. Find a simpler way to say it.',
  },
  {
    id: 'pretentious-ubiquitous',
    phrase: 'ubiquitous',
    pattern: /\bubiquitous\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Academic jargon. "Everywhere" works fine.',
  },
  {
    id: 'pretentious-ineffable',
    phrase: 'ineffable',
    pattern: /\bineffable\b/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'If it\'s ineffable, why are you writing about it? Describe it.',
  },
  {
    id: 'pretentious-myriad',
    phrase: 'a myriad of',
    pattern: /a myriad of/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Overused. Try "many" or list specifics.',
  },
  {
    id: 'pretentious-plethora',
    phrase: 'plethora',
    pattern: /\bplethora\b/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Red flag for coached essays. Use "many" or be specific.',
  },
  {
    id: 'pretentious-juxtaposition',
    phrase: 'juxtaposition',
    pattern: /\bjuxtaposition\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Academic term—show the contrast instead.',
  },
  {
    id: 'pretentious-dichotomy',
    phrase: 'dichotomy',
    pattern: /\bdichotomy\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Describe the contrast directly.',
  },
  {
    id: 'pretentious-epitome',
    phrase: 'epitome',
    pattern: /\bepitome\b/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Often overused. Is it really the perfect example?',
  },
];

// =============================================================================
// DIVERSITY ESSAY CLICHES
// =============================================================================

export const DIVERSITY_PHRASES: GenericPhrase[] = [
  {
    id: 'diversity-rich-tapestry',
    phrase: 'Rich tapestry',
    pattern: /rich tapestry/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Extremely overused diversity metaphor.',
  },
  {
    id: 'diversity-melting-pot',
    phrase: 'Melting pot',
    pattern: /melting pot/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Dated metaphor. Be more original.',
  },
  {
    id: 'diversity-two-worlds',
    phrase: 'Between two worlds',
    pattern: /between two (?:worlds|cultures)/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Very common framing. Find a more original angle.',
  },
  {
    id: 'diversity-cultural-bridge',
    phrase: 'Cultural bridge',
    pattern: /cultural bridge/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Overused metaphor. Show specific examples.',
  },
  {
    id: 'diversity-unique-background',
    phrase: 'Unique background',
    pattern: /(?:my )?unique (?:cultural )?background/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Everyone\'s background is unique. Be specific.',
  },
  {
    id: 'diversity-diverse-perspective',
    phrase: 'Diverse perspective',
    pattern: /diverse (?:perspective|viewpoint|lens)/i,
    severity: 'soft',
    category: 'buzzword',
    suggestion: 'Show the perspective, don\'t label it.',
  },
  {
    id: 'diversity-underrepresented',
    phrase: 'As an underrepresented',
    pattern: /as an underrepresented/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Focus on your story, not the label.',
  },
  {
    id: 'diversity-struggle-identity',
    phrase: 'Struggled with my identity',
    pattern: /struggled with (?:my )?identity/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Common framing. Show specific struggles.',
  },
];

// =============================================================================
// ADVERSITY ESSAY CLICHES
// =============================================================================

export const ADVERSITY_PHRASES: GenericPhrase[] = [
  {
    id: 'adversity-darkest-hour',
    phrase: 'Darkest hour',
    pattern: /(?:my )?darkest (?:hour|moment|time)/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Melodramatic. Describe the situation specifically.',
  },
  {
    id: 'adversity-rock-bottom',
    phrase: 'Hit rock bottom',
    pattern: /hit rock bottom/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Cliché. Describe the low point specifically.',
  },
  {
    id: 'adversity-blessing-disguise',
    phrase: 'Blessing in disguise',
    pattern: /blessing in disguise/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Cliché. Show how difficulty became positive.',
  },
  {
    id: 'adversity-silver-lining',
    phrase: 'Silver lining',
    pattern: /silver lining/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Cliché. Describe the positive outcome directly.',
  },
  {
    id: 'adversity-overcome-odds',
    phrase: 'Against all odds',
    pattern: /against (?:all )?odds/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'What were the actual odds? Be specific.',
  },
  {
    id: 'adversity-never-give-up',
    phrase: 'Never give up',
    pattern: /never (?:gave up|give up)/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Show perseverance through actions.',
  },
  {
    id: 'adversity-what-doesnt-kill',
    phrase: 'What doesn\'t kill you',
    pattern: /what doesn'?t kill (?:you|me)/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Famous cliché. Find your own words.',
  },
  {
    id: 'adversity-light-tunnel',
    phrase: 'Light at the end of the tunnel',
    pattern: /light at the end of the tunnel/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Very common. Describe hope more originally.',
  },
  {
    id: 'adversity-rose-ashes',
    phrase: 'Rose from the ashes',
    pattern: /(?:rose|rising) from the ashes/i,
    severity: 'hard',
    category: 'jargon',
    suggestion: 'Phoenix metaphor is overused.',
  },
  {
    id: 'adversity-made-stronger',
    phrase: 'Made me stronger',
    pattern: /made me (?:a )?stronger/i,
    severity: 'soft',
    category: 'jargon',
    suggestion: 'Show the strength gained through examples.',
  },
];

// =============================================================================
// COMBINE ALL EXTENDED PHRASES
// =============================================================================

export const ALL_EXTENDED_PHRASES: GenericPhrase[] = [
  ...EXTENDED_OPENING_PHRASES,
  ...EXTENDED_REFLECTION_PHRASES,
  ...EXTENDED_WHY_SCHOOL_PHRASES,
  ...EXTENDED_CLOSING_PHRASES,
  ...EXTENDED_ACTIVITY_PHRASES,
  ...FILLER_PHRASES,
  ...PRETENTIOUS_PHRASES,
  ...DIVERSITY_PHRASES,
  ...ADVERSITY_PHRASES,
];

// Count of extended phrases
export const EXTENDED_PHRASE_COUNT = ALL_EXTENDED_PHRASES.length;
