export type Word = {
  id: string;
  word: string;
  pos: string; // part of speech
  definition: string;
  etymology: string;
  synonyms: string[];
  antonyms: string[];
  casual: string;
  professional: string;
};

export const TOPICS = [
  { id: "business", title: "Business", icon: "Briefcase", desc: "Boardroom-ready vocabulary" },
  { id: "science", title: "Science", icon: "FlaskConical", desc: "Words from the lab" },
  { id: "everyday", title: "Everyday Life", icon: "Coffee", desc: "Words you'll actually use" },
  { id: "tech", title: "Technology", icon: "Cpu", desc: "Talk like a builder" },
  { id: "arts", title: "Arts & Culture", icon: "Palette", desc: "Sound like a curator" },
  { id: "nature", title: "Nature", icon: "Leaf", desc: "The wild side of language" },
];

export const WORDS: Record<string, Word[]> = {
  business: [
    { id: "b1", word: "Synergy", pos: "noun", definition: "The combined effect greater than the sum of separate effects.", etymology: "From Greek synergos, 'working together'.", synonyms: ["cooperation", "collaboration"], antonyms: ["discord", "friction"], casual: "Our band has real synergy on stage.", professional: "The merger created clear synergy across both portfolios." },
    { id: "b2", word: "Pivot", pos: "verb", definition: "To shift strategy or direction decisively.", etymology: "Old French pivot, 'hinge pin'.", synonyms: ["shift", "redirect"], antonyms: ["persist", "stagnate"], casual: "I had to pivot my weekend plans.", professional: "The startup pivoted from hardware to SaaS." },
    { id: "b3", word: "Leverage", pos: "verb", definition: "Use something to maximum advantage.", etymology: "From 'lever', Latin levare, 'to raise'.", synonyms: ["utilize", "exploit"], antonyms: ["waste", "neglect"], casual: "She leveraged her network for the gig.", professional: "We leverage AI to streamline operations." },
    { id: "b4", word: "Incumbent", pos: "noun", definition: "The current holder of a position or market.", etymology: "Latin incumbere, 'to lie upon'.", synonyms: ["holder", "occupant"], antonyms: ["challenger", "newcomer"], casual: "The incumbent always has the edge.", professional: "Disrupting the incumbent requires a 10x product." },
    { id: "b5", word: "Bandwidth", pos: "noun", definition: "Capacity to deal with new tasks or info.", etymology: "Coined in radio engineering.", synonyms: ["capacity", "headroom"], antonyms: ["overload"], casual: "I don't have the bandwidth tonight.", professional: "The team lacks bandwidth for a Q4 launch." },
    { id: "b6", word: "Cadence", pos: "noun", definition: "The rhythm or frequency of recurring events.", etymology: "Italian cadenza, 'falling'.", synonyms: ["rhythm", "tempo"], antonyms: ["arrhythmia"], casual: "We have a weekly catch-up cadence.", professional: "Establish a release cadence the team can sustain." },
    { id: "b7", word: "Bespoke", pos: "adj", definition: "Custom-made for a particular client.", etymology: "Old English bespeak, 'to speak for'.", synonyms: ["custom", "tailored"], antonyms: ["generic", "stock"], casual: "He wore a bespoke suit to the wedding.", professional: "We offer bespoke onboarding for enterprise accounts." },
    { id: "b8", word: "Mitigate", pos: "verb", definition: "Make less severe or painful.", etymology: "Latin mitigare, 'soften'.", synonyms: ["lessen", "reduce"], antonyms: ["aggravate"], casual: "Coffee mitigates Monday mornings.", professional: "Hedging mitigates currency risk." },
    { id: "b9", word: "Stakeholder", pos: "noun", definition: "A party with interest in a venture.", etymology: "Stake + holder, 17th c.", synonyms: ["party", "shareholder"], antonyms: [], casual: "Mom is a stakeholder in this dinner plan.", professional: "Align stakeholders before the kickoff." },
    { id: "b10", word: "Scalable", pos: "adj", definition: "Able to grow without losing performance.", etymology: "From scale, Latin scala 'ladder'.", synonyms: ["expandable"], antonyms: ["limited"], casual: "My side hustle isn't very scalable.", professional: "We need a scalable infrastructure tier." },
  ],
  science: [
    { id: "s1", word: "Entropy", pos: "noun", definition: "A measure of disorder in a system.", etymology: "Greek tropē, 'transformation'.", synonyms: ["disorder", "chaos"], antonyms: ["order"], casual: "My desk has high entropy this week.", professional: "Entropy in the dataset increased after sampling." },
    { id: "s2", word: "Catalyst", pos: "noun", definition: "Something that triggers or accelerates change.", etymology: "Greek katalysis, 'dissolution'.", synonyms: ["trigger", "spark"], antonyms: ["inhibitor"], casual: "Her message was the catalyst for our trip.", professional: "The enzyme acts as a catalyst in the reaction." },
    { id: "s3", word: "Quantum", pos: "noun", definition: "The smallest discrete unit of a phenomenon.", etymology: "Latin quantus, 'how much'.", synonyms: ["unit", "particle"], antonyms: [], casual: "A quantum of comfort goes a long way.", professional: "Quantum effects dominate at this scale." },
    { id: "s4", word: "Empirical", pos: "adj", definition: "Based on observation rather than theory.", etymology: "Greek empeiria, 'experience'.", synonyms: ["observed", "experimental"], antonyms: ["theoretical"], casual: "Empirical evidence: pizza fixes everything.", professional: "We rely on empirical data, not anecdotes." },
    { id: "s5", word: "Hypothesis", pos: "noun", definition: "A proposed explanation to be tested.", etymology: "Greek hupothesis, 'foundation'.", synonyms: ["theory", "conjecture"], antonyms: ["fact"], casual: "My hypothesis: the cat ate it.", professional: "Reject the null hypothesis at p < 0.05." },
    { id: "s6", word: "Photosynthesis", pos: "noun", definition: "Plants converting light into energy.", etymology: "Greek photo + synthesis.", synonyms: [], antonyms: [], casual: "I'm just out here photosynthesizing.", professional: "Photosynthesis efficiency varies with chlorophyll density." },
    { id: "s7", word: "Inertia", pos: "noun", definition: "Tendency to resist change in motion.", etymology: "Latin iners, 'idle'.", synonyms: ["sluggishness"], antonyms: ["momentum"], casual: "Sunday inertia is undefeated.", professional: "Organizational inertia slowed the rollout." },
    { id: "s8", word: "Symbiosis", pos: "noun", definition: "Mutually beneficial relationship.", etymology: "Greek 'living together'.", synonyms: ["cooperation"], antonyms: ["parasitism"], casual: "Me and coffee — pure symbiosis.", professional: "The partnership formed a strong symbiosis." },
    { id: "s9", word: "Paradigm", pos: "noun", definition: "A typical pattern or model.", etymology: "Greek paradeigma, 'pattern'.", synonyms: ["model", "framework"], antonyms: [], casual: "New paradigm: naps are productive.", professional: "AI represents a paradigm shift in software." },
    { id: "s10", word: "Refraction", pos: "noun", definition: "Bending of light passing through a medium.", etymology: "Latin refractus, 'broken'.", synonyms: ["bending"], antonyms: [], casual: "The pool makes my legs look weird — refraction.", professional: "Refraction index varies with wavelength." },
  ],
  everyday: [
    { id: "e1", word: "Serendipity", pos: "noun", definition: "Pleasant surprise; happy accident.", etymology: "Coined by Horace Walpole, 1754.", synonyms: ["luck", "chance"], antonyms: ["misfortune"], casual: "Bumping into you was pure serendipity.", professional: "Serendipity often drives breakthrough discovery." },
    { id: "e2", word: "Mundane", pos: "adj", definition: "Lacking interest; ordinary.", etymology: "Latin mundus, 'world'.", synonyms: ["ordinary", "dull"], antonyms: ["exciting"], casual: "Laundry is so mundane.", professional: "Automating mundane tasks frees creative work." },
    { id: "e3", word: "Quaint", pos: "adj", definition: "Attractively unusual or old-fashioned.", etymology: "Old French cointe, 'pretty'.", synonyms: ["charming"], antonyms: ["modern"], casual: "What a quaint little café.", professional: "The quaint town attracts heritage tourism." },
    { id: "e4", word: "Nostalgia", pos: "noun", definition: "Sentimental longing for the past.", etymology: "Greek nostos + algos.", synonyms: ["wistfulness"], antonyms: [], casual: "This song hits me with nostalgia.", professional: "Nostalgia marketing performs well with millennials." },
    { id: "e5", word: "Wholesome", pos: "adj", definition: "Conducive to wellbeing; morally good.", etymology: "Old English hāl, 'whole'.", synonyms: ["healthy", "pure"], antonyms: ["corrupt"], casual: "That dog video was so wholesome.", professional: "We aim for wholesome family-friendly content." },
    { id: "e6", word: "Cozy", pos: "adj", definition: "Warm, comfortable and snug.", etymology: "Scots cosie, 18th c.", synonyms: ["snug"], antonyms: ["uncomfortable"], casual: "Rainy day = cozy mode activated.", professional: "Design the lounge to feel cozy yet professional." },
    { id: "e7", word: "Meander", pos: "verb", definition: "To wander aimlessly.", etymology: "From the Maeander river.", synonyms: ["wander", "drift"], antonyms: ["rush"], casual: "We meandered through the market.", professional: "The discussion meandered without resolution." },
    { id: "e8", word: "Vibrant", pos: "adj", definition: "Full of energy and life.", etymology: "Latin vibrare, 'shake'.", synonyms: ["lively"], antonyms: ["dull"], casual: "Her outfit is so vibrant!", professional: "We foster a vibrant community of users." },
    { id: "e9", word: "Linger", pos: "verb", definition: "Stay in a place longer than necessary.", etymology: "Old English lengan, 'prolong'.", synonyms: ["loiter"], antonyms: ["leave"], casual: "Let's linger over dessert.", professional: "Doubts linger about the quarterly numbers." },
    { id: "e10", word: "Cherish", pos: "verb", definition: "Hold dear; protect lovingly.", etymology: "Old French cherir, 'hold dear'.", synonyms: ["treasure"], antonyms: ["neglect"], casual: "I cherish slow Sundays.", professional: "We cherish the trust our clients place in us." },
  ],
  tech: [],
  arts: [],
  nature: [],
};

// fallback for empty topics: reuse business words
WORDS.tech = WORDS.business;
WORDS.arts = WORDS.everyday;
WORDS.nature = WORDS.science;

// Advanced (C1/C2) words — rotated daily for the Word of the Day
export const ADVANCED_WORDS: Word[] = [
  { id: "wow-ephemeral", word: "Ephemeral", pos: "adjective", definition: "Lasting for a very short time — fleeting, transient.", etymology: "From Greek ephēmeros — 'lasting only a day'.", synonyms: ["fleeting", "transient", "short-lived"], antonyms: ["permanent", "enduring"], casual: "That perfect sunset was so ephemeral.", professional: "Ephemeral resources are torn down after each deploy." },
  { id: "wow-perfunctory", word: "Perfunctory", pos: "adjective", definition: "Carried out with minimal effort or reflection.", etymology: "Latin perfunctorius — 'careless'.", synonyms: ["cursory", "superficial"], antonyms: ["thorough", "diligent"], casual: "He gave a perfunctory nod and walked off.", professional: "The audit was perfunctory at best." },
  { id: "wow-sycophant", word: "Sycophant", pos: "noun", definition: "A person who acts obsequiously to gain advantage.", etymology: "Greek sykophantēs — 'informer'.", synonyms: ["flatterer", "yes-man"], antonyms: ["critic"], casual: "The boss is surrounded by sycophants.", professional: "Beware of sycophants in leadership circles." },
  { id: "wow-quixotic", word: "Quixotic", pos: "adjective", definition: "Exceedingly idealistic; unrealistic and impractical.", etymology: "From Don Quixote, by Cervantes.", synonyms: ["idealistic", "romantic"], antonyms: ["pragmatic"], casual: "His plan to sail solo was quixotic.", professional: "A quixotic vision unsupported by data rarely scales." },
  { id: "wow-perspicacious", word: "Perspicacious", pos: "adjective", definition: "Having keen insight or discernment.", etymology: "Latin perspicax — 'sharp-sighted'.", synonyms: ["astute", "shrewd"], antonyms: ["obtuse"], casual: "She's perspicacious about people.", professional: "A perspicacious analyst spots trends early." },
  { id: "wow-obfuscate", word: "Obfuscate", pos: "verb", definition: "To deliberately make something unclear or hard to understand.", etymology: "Latin obfuscare — 'to darken'.", synonyms: ["confuse", "muddle"], antonyms: ["clarify"], casual: "Stop trying to obfuscate the truth.", professional: "Jargon obfuscates the report's findings." },
  { id: "wow-ineffable", word: "Ineffable", pos: "adjective", definition: "Too great or extreme to be expressed in words.", etymology: "Latin ineffabilis — 'unutterable'.", synonyms: ["indescribable", "sublime"], antonyms: ["mundane"], casual: "The view was ineffable.", professional: "An ineffable quality defines great design." },
];

export const getWordOfDay = (): Word => {
  const day = Math.floor(Date.now() / 86400000);
  return ADVANCED_WORDS[day % ADVANCED_WORDS.length];
};

export const WORD_OF_WEEK = {
  word: "Ephemeral",
  pos: "adjective",
  definition: "Lasting for a very short time — fleeting, transient.",
  teaser: "From Greek ephēmeros, 'lasting only a day'.",
};

export const ACHIEVEMENTS = [
  { id: 1, label: "First Word", icon: "Sparkles", unlocked: true },
  { id: 2, label: "7 Day Streak", icon: "Flame", unlocked: true },
  { id: 3, label: "50 Words Learned", icon: "BookOpen", unlocked: true },
  { id: 4, label: "Night Owl", icon: "Moon", unlocked: true },
  { id: 5, label: "Early Bird", icon: "Sunrise", unlocked: true },
  { id: 6, label: "Word Master", icon: "Crown", unlocked: false },
  { id: 7, label: "Perfect Session", icon: "Target", unlocked: true },
  { id: 8, label: "Quick Thinker", icon: "Zap", unlocked: true },
  { id: 9, label: "Bookworm", icon: "Library", unlocked: true },
  { id: 10, label: "Streak Saver", icon: "Shield", unlocked: false },
  { id: 11, label: "100 Words", icon: "Trophy", unlocked: true },
  { id: 12, label: "Topic Explorer", icon: "Compass", unlocked: true },
  { id: 13, label: "Daily Dozen", icon: "Star", unlocked: true },
  { id: 14, label: "Marathoner", icon: "Medal", unlocked: false },
  { id: 15, label: "Wordsmith", icon: "PenTool", unlocked: false },
  { id: 16, label: "Polyglot", icon: "Globe", unlocked: false },
  { id: 17, label: "30 Day Streak", icon: "Flame", unlocked: false },
  { id: 18, label: "Encyclopedist", icon: "Book", unlocked: false },
];
