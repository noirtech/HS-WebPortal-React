// Script to apply CollapsibleInfoBox to all remaining pages
// This will be run manually to update each page

const pagesToUpdate = [
  'src/app/[locale]/payments/page.tsx',
  'src/app/[locale]/customers/page.tsx', 
  'src/app/[locale]/boats/page.tsx',
  'src/app/[locale]/berths/page.tsx',
  'src/app/[locale]/reports/page.tsx',
  'src/app/[locale]/profile/page.tsx',
  'src/app/[locale]/admin/users/page.tsx',
  'src/app/[locale]/admin/marinas/page.tsx',
  'src/app/[locale]/admin/pending-operations/page.tsx',
  'src/app/[locale]/marina-walk/page.tsx'
];

console.log('Pages that need CollapsibleInfoBox applied:');
pagesToUpdate.forEach(page => console.log(`- ${page}`));

// For each page, we need to:
// 1. Add import: import { CollapsibleInfoBox } from '@/components/ui/collapsible-info-box'
// 2. Replace the blue and green info boxes with CollapsibleInfoBox component
// 3. Ensure consistent styling and text
