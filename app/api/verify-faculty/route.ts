import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'MISSING_IDENTITY_DATA' }, { status: 400 });
    }

    const facultySearchName = name.trim().toLowerCase();
    const facultySearchEmail = email.trim().toLowerCase();

    const normalize = (str: string) => {
      return str.toLowerCase()
        .replace(/\b(dr|prof|mr|mrs|ms|assistant professor|associate professor|professor)\.?\s+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedSearchName = normalize(name);

    // Stage 1: Load University Faculty Directory
    const response = await fetch('https://jaipur.manipal.edu/muj-faculties.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('UNIVERSITY_SERVER_UNREACHABLE');
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Stage 2: Identify Potential Nodes (Multi-Match Loop)
    const matches: { name: string; url: string }[] = [];
    $('.faculty-card, .faculty-list-item, div').each((i, el) => {
      const facultyName = $(el).find('h2, h4').first().text().trim();
      const profileUrl = $(el).find('a[href*="faculty-details"]').first().attr('href') || $(el).find('.v-more a').attr('href');
      
      if (facultyName && normalize(facultyName).includes(normalizedSearchName)) {
        matches.push({
          name: facultyName,
          url: profileUrl ? `https://jaipur.manipal.edu/${profileUrl.replace(/^\//, '')}` : ''
        });
      }
    });

    if (matches.length === 0) {
      return NextResponse.json({ error: 'IDENTITY_NOT_FOUND_IN_CORE' }, { status: 404 });
    }

    // Stage 3: Neural Recursive Verification (The "Aditi" Protocol)
    for (const match of matches) {
      if (!match.url) continue;

      try {
        const profileRes = await fetch(match.url);
        if (!profileRes.ok) continue;

        const profileHtml = await profileRes.text();
        const $profile = cheerio.load(profileHtml);

        // Find Official Email in Profile Page
        const officialEmail = $profile('.faculty-details-email, a[href^="mailto:"], .contact-info p').text().trim().toLowerCase();
        
        // Match comparison
        if (officialEmail.includes(facultySearchEmail) || profileHtml.toLowerCase().includes(facultySearchEmail)) {
          
          // Phase 4: Data Purification
          let officialName = $profile('h2').first().text().trim();
          let officialDesignation = $profile('.faculty-details-designation, .designation').text().trim();

          // Normalization: Title Case & Spacing Logic
          const cleanName = officialName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          
          // Fix spacing before parentheses: "Professor(Selection Grade)" -> "Professor (Selection Grade)"
          let cleanDesignation = officialDesignation.replace(/([a-zA-Z])\(/g, '$1 (');
          
          // Capitalization of First Letter in every word of designation
          cleanDesignation = cleanDesignation.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          return NextResponse.json({
            status: 'IDENTITY_VERIFIED',
            nomenclature: cleanName,
            designation: cleanDesignation
          });
        }
      } catch (err) {
        console.error(`NODE_AUDIT_FAILURE: ${match.url}`, err);
        continue;
      }
    }

    // After all recursive checks, if no email matches
    return NextResponse.json({ error: 'IDENTITY_NOT_FOUND_IN_UNIVERSITY_CORE' }, { status: 404 });

  } catch (error: any) {
    console.error('ORACLE_CRITICAL_FAILURE:', error);
    return NextResponse.json({ error: 'ORACLE_SYNC_FAILED', details: error.message }, { status: 500 });
  }
}
