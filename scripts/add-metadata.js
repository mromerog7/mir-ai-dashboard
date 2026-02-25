const fs = require('fs');

const pages = [
    { file: 'src/app/(dashboard)/dashboard/page.tsx', title: 'Dashboard | MiR-AI', desc: 'Panel principal de seguimiento de proyectos' },
    { file: 'src/app/(dashboard)/projects/page.tsx', title: 'Proyectos | MiR-AI', desc: 'Gestión y seguimiento de proyectos' },
    { file: 'src/app/(dashboard)/expenses/page.tsx', title: 'Gastos de Proyectos | MiR-AI', desc: 'Control de gastos por proyecto' },
    { file: 'src/app/(dashboard)/finanzas/page.tsx', title: 'Finanzas | MiR-AI', desc: 'Balance financiero y control de retiros' },
    { file: 'src/app/(dashboard)/incidents/page.tsx', title: 'Incidencias | MiR-AI', desc: 'Registro y seguimiento de incidencias' },
    { file: 'src/app/(dashboard)/notes/page.tsx', title: 'Notas | MiR-AI', desc: 'Notas y documentación interna' },
    { file: 'src/app/(dashboard)/documents/surveys/page.tsx', title: 'Levantamientos | MiR-AI', desc: 'Gestión de levantamientos técnicos' },
    { file: 'src/app/(dashboard)/documents/quotes/page.tsx', title: 'Cotizaciones | MiR-AI', desc: 'Gestión de cotizaciones' },
    { file: 'src/app/(dashboard)/documents/minutes/page.tsx', title: 'Minutas | MiR-AI', desc: 'Registro de minutas de reunión' },
    { file: 'src/app/(dashboard)/documents/client-meetings/page.tsx', title: 'Reuniones con Clientes | MiR-AI', desc: 'Seguimiento de reuniones con clientes' },
    { file: 'src/app/(dashboard)/reports/page.tsx', title: 'Reportes | MiR-AI', desc: 'Reportes de trabajo y avance' },
    { file: 'src/app/(dashboard)/weather/page.tsx', title: 'Clima | MiR-AI', desc: 'Pronóstico del clima local' },
    { file: 'src/app/(dashboard)/users/page.tsx', title: 'Usuarios | MiR-AI', desc: 'Gestión de usuarios del sistema' },
];

let count = 0;
pages.forEach(({ file, title, desc }) => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('export const metadata')) {
        console.log('[SKIP] ' + file);
        return;
    }

    // Add Metadata import and export before the first import or after 'use client' if present
    const metadataBlock = `import type { Metadata } from "next"\n\nexport const metadata: Metadata = {\n    title: "${title}",\n    description: "${desc}",\n}\n\n`;

    // Find the first import statement
    const importIdx = content.indexOf('import ');
    if (importIdx >= 0) {
        content = content.slice(0, importIdx) + metadataBlock + content.slice(importIdx);
    }

    fs.writeFileSync(file, content);
    count++;
    console.log('[ADDED] ' + file);
});

console.log('\nTotal pages updated: ' + count);
