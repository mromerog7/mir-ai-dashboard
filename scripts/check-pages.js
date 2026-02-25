const fs = require('fs');
const pages = [
    'src/app/(dashboard)/dashboard/page.tsx',
    'src/app/(dashboard)/projects/page.tsx',
    'src/app/(dashboard)/tasks/page.tsx',
    'src/app/(dashboard)/expenses/page.tsx',
    'src/app/(dashboard)/finanzas/page.tsx',
    'src/app/(dashboard)/incidents/page.tsx',
    'src/app/(dashboard)/notes/page.tsx',
    'src/app/(dashboard)/documents/surveys/page.tsx',
    'src/app/(dashboard)/documents/quotes/page.tsx',
    'src/app/(dashboard)/documents/minutes/page.tsx',
    'src/app/(dashboard)/documents/client-meetings/page.tsx',
    'src/app/(dashboard)/reports/page.tsx',
    'src/app/(dashboard)/weather/page.tsx',
    'src/app/(dashboard)/users/page.tsx',
];

pages.forEach(p => {
    const c = fs.readFileSync(p, 'utf8');
    const isClient = c.includes('"use client"') || c.includes("'use client'");
    console.log((isClient ? '[CLIENT]' : '[SERVER]') + ' ' + p);
});
