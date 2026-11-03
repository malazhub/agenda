import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const kindergartenMath = [
  'Counting groups of objects', 'Recognizing numerals to 10', 'Counting forward and backward',
  'Comparing groups: more, fewer, or equal', 'Writing numbers to 10', 'Adding within 5',
  'Subtracting within 5', 'Making 10 with number pairs', 'Sorting by shape and color',
  'Repeating patterns', 'Naming circles and triangles', 'Naming squares and rectangles',
  'Describing position and direction', 'Comparing length and height', 'Comparing weight',
  'Recognizing numbers to 20', 'Counting by tens', 'Adding within 10 with objects',
  'Subtracting within 10 with objects', 'Reading a simple picture graph',
  'Days, weeks, and daily routines', 'Putting shapes together and taking them apart',
  'Math stories with pictures', 'Cumulative counting and shapes review',
];

const grade1Math = [
  'Counting and writing numbers to 120', 'Number lines to 120', 'Comparing two-digit numbers',
  'Tens and ones place value', 'Addition within 20', 'Subtraction within 20',
  'Making ten to add', 'Related addition and subtraction facts', 'Word problems within 20',
  'Adding two-digit numbers with models', 'Subtracting tens', 'Skip counting by 2, 5, and 10',
  'Equal groups and repeated addition', 'Half and quarter as equal parts',
  'Comparing length with standard units', 'Reading clocks to the hour and half hour',
  'Coins and simple money problems', 'Organizing data in picture graphs',
  'Two-dimensional shape attributes', 'Three-dimensional shape attributes',
  'Composing and decomposing shapes', 'Addition and subtraction equations',
  'Reasoning with measurement and data', 'Cumulative grade-one review',
];

const grade2Math = [
  'Place value to 1,000', 'Compare and order three-digit numbers', 'Add within 1,000',
  'Subtract within 1,000', 'Add and subtract word problems', 'Skip counting and number patterns',
  'Equal groups and arrays', 'Introduction to multiplication', 'Introduction to division',
  'Even and odd numbers', 'Fractions as equal parts', 'Fractions on a number line',
  'Measure length with standard units', 'Estimate and compare measurements',
  'Tell time to five minutes', 'Money and making change', 'Bar graphs and picture graphs',
  'Shapes, sides, and vertices', 'Area with unit squares', 'Perimeter of polygons',
  'Counting by equal groups', 'Two-step story problems', 'Reasoning with data',
  'Cumulative grade-two review',
];

const grade3Math = [
  'Multiplication facts and strategies', 'Division facts and related multiplication',
  'Multiplication and division word problems', 'Rounding to the nearest ten and hundred',
  'Place value and four-digit numbers', 'Addition and subtraction within 1,000',
  'Fractions on number lines', 'Equivalent fractions with models',
  'Comparing fractions with like denominators', 'Fractions of a set',
  'Area of rectangles', 'Perimeter and missing side lengths',
  'Measuring mass and liquid volume', 'Time intervals and elapsed time',
  'Bar graphs and scaled picture graphs', 'Line plots and measurement data',
  'Classifying quadrilaterals', 'Angles as turns and corners',
  'Two-step arithmetic problems', 'Patterns in multiplication tables',
  'Representing data and solving questions', 'Estimation and checking answers',
  'Reasoning with shapes and fractions', 'Cumulative grade-three review',
];

const grade4Math = [
  'Place value to one million', 'Multi-digit addition and subtraction',
  'Multi-digit multiplication', 'Division with remainders',
  'Factors, multiples, and prime numbers', 'Equivalent fractions',
  'Comparing fractions with unlike denominators', 'Adding and subtracting fractions',
  'Fractions and mixed numbers', 'Decimal notation and place value',
  'Comparing decimals', 'Measurement unit conversions',
  'Area and perimeter of composite figures', 'Angles and angle measurement',
  'Lines, rays, and geometric figures', 'Symmetry and shape classification',
  'Coordinate grids in the first quadrant', 'Line plots with fractional data',
  'Word problems with multi-step operations', 'Estimation and numerical reasoning',
  'Patterns and rules in number sequences', 'Reading and interpreting data',
  'Applying operations to real-world problems', 'Cumulative grade-four review',
];

const grade5Math = [
  'Place value with decimals', 'Operations with whole numbers',
  'Add and subtract fractions with unlike denominators', 'Multiply fractions and mixed numbers',
  'Divide fractions in context', 'Add and subtract decimals', 'Multiply decimals',
  'Divide decimals by whole numbers', 'Numerical expressions and order of operations',
  'Patterns and relationships', 'Coordinate plane and ordered pairs',
  'Volume of rectangular prisms', 'Convert customary and metric units',
  'Classify two-dimensional figures', 'Properties of triangles and quadrilaterals',
  'Graphing and interpreting data', 'Mean and line plots',
  'Fractions, decimals, and equivalent forms', 'Multi-step word problems',
  'Estimate products and quotients', 'Write and evaluate simple expressions',
  'Reasoning with volume and measurement', 'Analyze patterns in tables',
  'Cumulative grade-five review',
];

const middleMath = [
  'Rational numbers and number operations', 'Fractions, decimals, and signed numbers',
  'Ratios and proportional relationships', 'Rates, unit rates, and scale drawings',
  'Percent change and applications', 'Expressions and equivalent forms', 'Linear equations',
  'Inequalities and solution sets', 'Exponents and scientific notation',
  'Functions and input-output relationships', 'Slope and linear graphs',
  'Systems of linear equations', 'Polynomials and factoring foundations',
  'Roots and the Pythagorean theorem', 'Transformations and congruence',
  'Similarity and scale factors', 'Area, surface area, and volume',
  'Circles and angle relationships', 'Statistics and data distributions',
  'Probability models', 'Sequences and patterns', 'Multi-step modeling problems',
  'Reasoning and mathematical proof', 'Cumulative grade-level review',
];

const algebraMath = [
  'Variables and algebraic expressions', 'Evaluating expressions', 'One-step equations',
  'Two-step equations', 'Multi-step linear equations', 'Inequalities on a number line',
  'Ratios and proportional relationships', 'Unit rates and percent applications',
  'Exponents and integer operations', 'Linear relationships and tables',
  'Graphing linear equations', 'Slope and rate of change', 'Systems of linear equations',
  'Polynomials and combining like terms', 'Factoring simple expressions',
  'Quadratic patterns and equations', 'Functions and function notation',
  'Sequences and patterns', 'Angles and parallel lines', 'Area and volume applications',
  'Right triangles and the Pythagorean theorem', 'Statistics and data displays',
  'Probability and compound events', 'Cumulative algebra review',
];

const algebra2Math = [
  'Polynomial operations', 'Factoring polynomials', 'Quadratic functions',
  'Completing the square and quadratic formula', 'Complex numbers',
  'Rational expressions and equations', 'Radical expressions and equations',
  'Exponential functions', 'Logarithmic functions', 'Sequences and series',
  'Function composition and inverses', 'Transformations of functions',
  'Systems of equations and inequalities', 'Conic sections',
  'Trigonometric ratios and the unit circle', 'Trigonometric graphs',
  'Trigonometric identities', 'Vectors and parametric equations',
  'Probability and counting principles', 'Normal distributions and statistics',
  'Modeling with functions', 'Proof and mathematical reasoning',
  'Exam-style multi-step problems', 'Cumulative algebra-two review',
];

const calculusMath = [
  'Limits and continuity', 'Limit laws and algebraic techniques',
  'Continuity and the intermediate value theorem', 'Derivative from first principles',
  'Power, product, and quotient rules', 'Chain rule and composite functions',
  'Implicit differentiation', 'Related rates', 'Tangent lines and linear approximation',
  'Critical points and extrema', 'Increasing and decreasing functions',
  'Concavity and inflection points', 'Curve sketching and optimization',
  'Mean value theorem', 'Antiderivatives and indefinite integrals',
  'Definite integrals and Riemann sums', 'Fundamental theorem of calculus',
  'Substitution and integration techniques', 'Area between curves',
  'Accumulation and average value', 'Differential equations and growth models',
  'Applications of derivatives and integrals', 'Exam-style calculus problems',
  'Cumulative calculus review',
];

const grammarTopics = [
  'Parts of speech and word classes', 'Sentence structure and clauses',
  'Subject-verb agreement', 'Verb tense and aspect', 'Pronouns and clear reference',
  'Punctuation and capitalization', 'Vocabulary in context', 'Reading for main idea',
  'Inference and textual evidence', 'Tone, purpose, and audience',
  'Comparing texts and perspectives', 'Argument claims and supporting evidence',
  'Building a clear thesis', 'Organizing paragraphs and transitions',
  'Writing summaries and paraphrases', 'Revising for clarity and coherence',
  'Editing grammar and mechanics', 'Literary themes and characterization',
  'Figurative language and imagery', 'Close reading and annotation',
  'Evaluating sources and media literacy', 'Research questions and citations',
  'French and English language structures', 'Cumulative reading and writing review',
];

const worldHistoryTopics = [
  'Historical chronology and periodization', 'Primary and secondary sources',
  'Early civilizations and urban life', 'Trade routes and cultural exchange',
  'Religions and belief systems in history', 'Empires and political power',
  'Medieval societies and institutions', 'Renaissance and scientific change',
  'The Ottoman and Mediterranean worlds', 'European exploration and exchange',
  'Revolutions and political change', 'Industrialization and urbanization',
  'Nationalism and state formation', 'Colonialism and resistance',
  'World War I and its consequences', 'Interwar societies and ideologies',
  'World War II and global consequences', 'Decolonization and independence',
  'The Cold War and international relations', 'Lebanon and the modern Middle East',
  'Human rights and international institutions', 'Reading maps and historical data',
  'Cause, consequence, and continuity', 'Cumulative world-history review',
];

const biology = [
  'Cell structure and organelles', 'Cell membranes and transport', 'Enzymes and metabolism',
  'Cellular respiration', 'Photosynthesis', 'Mitosis and the cell cycle',
  'Meiosis and genetic variation', 'DNA structure and replication', 'Gene expression and proteins',
  'Mendelian inheritance', 'Patterns of inheritance', 'Mutations and genetic disorders',
  'Natural selection and adaptation', 'Evidence for evolution', 'Population genetics',
  'Ecology and energy flow', 'Food webs and trophic levels', 'Population interactions',
  'Ecosystems and nutrient cycles', 'Human body systems', 'Homeostasis and feedback',
  'Immunity and disease', 'Experimental design and data', 'Cumulative biology review',
];

const economics = [
  'Scarcity, choice, and opportunity cost', 'Supply and demand', 'Market equilibrium',
  'Elasticity and consumer response', 'Production and cost', 'Competition and market structure',
  'Labor markets and wages', 'Externalities and public goods', 'Taxes and subsidies',
  'Gross domestic product', 'Inflation and price indices', 'Unemployment and labor force',
  'Aggregate demand and supply', 'Fiscal policy and government budgets', 'Money and banking',
  'Central banks and monetary policy', 'Interest rates and credit', 'Trade and comparative advantage',
  'Exchange rates and global markets', 'Income distribution and poverty',
  'Economic growth and productivity', 'Financial literacy and compound interest',
  'Reading economic data', 'Cumulative economics review',
];

const gradeCatalog = {
  kg: { source: 'https://www.khanacademy.org/math/cc-kindergarten-math', topics: kindergartenMath, subject: 'Mathematics' },
  eb1: { source: 'https://www.khanacademy.org/math/cc-1st-grade-math', topics: grade1Math, subject: 'Mathematics' },
  eb2: { source: 'https://www.khanacademy.org/math/cc-2nd-grade-math', topics: grade2Math, subject: 'Mathematics' },
  eb3: { source: 'https://www.khanacademy.org/math/cc-3rd-grade-math', topics: grade3Math, subject: 'Mathematics' },
  eb4: { source: 'https://www.khanacademy.org/math/cc-4th-grade-math', topics: grade4Math, subject: 'Mathematics' },
  eb5: { source: 'https://www.khanacademy.org/math/cc-5th-grade-math', topics: grade5Math, subject: 'Mathematics' },
  eb6: { source: 'https://www.khanacademy.org/math/cc-6th-grade-math', topics: middleMath, subject: 'Mathematics' },
  eb7: { source: 'https://www.khanacademy.org/math/cc-7th-grade-math', topics: middleMath, subject: 'Mathematics' },
  eb8: { source: 'https://www.khanacademy.org/math/cc-8th-grade-math', topics: middleMath, subject: 'Mathematics' },
  brevet: { source: 'https://www.khanacademy.org/math/algebra-basics', topics: algebraMath, subject: 'Mathematics' },
  seconde: { source: 'https://www.khanacademy.org/math/algebra', topics: algebraMath, subject: 'Mathematics' },
  premiere_sc: { source: 'https://www.khanacademy.org/math/algebra2', topics: algebra2Math, subject: 'Mathematics' },
  premiere_lit: { source: 'https://www.khanacademy.org/humanities/grammar', topics: grammarTopics, subject: 'Humanities' },
  bac_sg: { source: 'https://www.khanacademy.org/math/calculus-1', topics: calculusMath, subject: 'Mathematics' },
  bac_sv: { source: 'https://www.khanacademy.org/science/biology', topics: biology, subject: 'Biology' },
  bac_se: { source: 'https://www.khanacademy.org/economics-finance-domain', topics: economics, subject: 'Economics' },
  bac_lh: { source: 'https://www.khanacademy.org/humanities/world-history', topics: worldHistoryTopics, subject: 'Humanities' },
};

const escapeSql = (value) => `'${String(value).replace(/'/g, "''")}'`;
const inserts = [];
for (const [gradeId, catalog] of Object.entries(gradeCatalog)) {
  for (const [index, title] of catalog.topics.entries()) {
    const id = `ka-${gradeId}-${String(index + 1).padStart(2, '0')}`;
    inserts.push(
      `INSERT OR REPLACE INTO sessions (id, grade_id, subject, title, source_name, source_url, playback_url, is_live) VALUES (` +
      `${escapeSql(id)}, ${escapeSql(gradeId)}, ${escapeSql(catalog.subject)}, ${escapeSql(title)}, ` +
      `${escapeSql('Khan Academy')}, ${escapeSql(catalog.source)}, ${escapeSql(catalog.source)}, 0);`,
    );
  }
}

if (process.argv.includes('--dry-run')) {
  console.log(`Catalog contains ${inserts.length} sessions across ${Object.keys(gradeCatalog).length} grades.`);
  process.exit(0);
}

const tempDir = await mkdtemp(join(tmpdir(), 'agenda-session-seed-'));
const sqlFile = join(tempDir, 'sessions.sql');
const wranglerCli = join(process.cwd(), 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const location = process.argv.includes('--local') ? '--local' : '--remote';
try {
  await writeFile(sqlFile, inserts.join('\n'), { encoding: 'utf8', mode: 0o600 });
  const result = spawnSync(
    process.execPath,
    [wranglerCli, 'd1', 'execute', 'agenda-db', location, '--config', 'cloudflare/wrangler.toml', '--file', sqlFile],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
  if (result.error) {
    console.error('Could not run Wrangler. Install project dependencies and authenticate with Cloudflare first.');
    process.exitCode = 1;
  } else if (result.status !== 0) {
    process.exitCode = result.status || 1;
  } else {
    console.log(`Seeded ${inserts.length} source-linked learning sessions across ${Object.keys(gradeCatalog).length} grades.`);
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
