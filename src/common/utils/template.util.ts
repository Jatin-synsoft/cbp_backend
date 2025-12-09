import * as fs from 'fs';
import * as path from 'path';

export const loadTemplate = (
    templateName: string,
    data: Record<string, any> = {}
) => {
    const base = path.join(__dirname, 'templates');

    // Load layout + body template
    let layout = fs.readFileSync(path.join(base, 'layout.html'), 'utf8');
    let body = fs.readFileSync(path.join(base, `${templateName}`), 'utf8');

    // Replace variables in body
    Object.entries(data).forEach(([key, value]) => {
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    // Insert body inside layout
    layout = layout.replace('{{content}}', body);

    // Replace variables inside layout (year, subject, etc.)
    Object.entries(data).forEach(([key, value]) => {
        layout = layout.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    return layout;
};
