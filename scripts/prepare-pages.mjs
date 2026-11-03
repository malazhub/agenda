import { cp, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';

const componentFiles = [
  'AIChatBot.tsx',
  'ArchiveExplorer.tsx',
  'ArchiveSessionsModal.tsx',
  'BookingModal.tsx',
  'CoursesHub.tsx',
  'DirectorSessionsPanel.tsx',
  'CurriculumOverview.tsx',
  'ExamPracticeModal.tsx',
  'GradeSessionsView.tsx',
  'Header.tsx',
  'HeroSearch.tsx',
  'HomeworkAgenda.tsx',
  'RegisterModal.tsx',
  'TutorMarketplace.tsx',
  'VirtualClassroom.tsx',
];

const dataFiles = [
  'mockAgenda.ts',
  'mockExams.ts',
  'mockGradesAndSessions.ts',
  'mockTeachers.ts',
];

const copies = [
  ['App.tsx', 'src/App.tsx'],
  ['main.tsx', 'src/main.tsx'],
  ['index.css', 'src/index.css'],
  ['types.ts', 'src/types.ts'],
  ['translations.ts', 'src/translations.ts'],
  ['aiSolverService.ts', 'src/services/aiSolverService.ts'],
  ['cloudflareApi.ts', 'src/services/cloudflareApi.ts'],
  ...componentFiles.map((file) => [file, `src/components/${file}`]),
  ...dataFiles.map((file) => [file, `src/data/${file}`]),
];

for (const [source] of copies) {
  try {
    await access(source);
  } catch {
    throw new Error(`Required source file is missing from the repository root: ${source}`);
  }
}

for (const [, destination] of copies) {
  await mkdir(join(destination, '..'), { recursive: true });
}

for (const [source, destination] of copies) {
  await cp(source, destination);
}

console.log(`Prepared ${copies.length} application files under src/ for the Pages build.`);
