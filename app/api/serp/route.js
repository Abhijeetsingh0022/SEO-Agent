import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Call DuckDuckGo HTML directly (Free & Keyless)
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `DuckDuckGo API Error: ${errorText}` }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const organic = [];
    $('.result').each((i, el) => {
      if (organic.length >= 10) return;
      
      const title = $(el).find('.result__title').text().trim();
      const rawLink = $(el).find('.result__url').attr('href');
      const snippet = $(el).find('.result__snippet').text().trim();

      if (title && rawLink) {
        let link = rawLink;
        if (link.startsWith('//')) link = 'https:' + link;
        else if (link.startsWith('/l/?uddg=')) {
          try {
            link = decodeURIComponent(link.split('uddg=')[1].split('&')[0]);
          } catch(e) {}
        }
        
        organic.push({ title, link, snippet, position: organic.length + 1 });
      }
    });

    const relatedSearches = [];
    $('.result--more__btn').each((i, el) => {
      const q = $(el).text().trim();
      if (q && q !== 'More results') {
        relatedSearches.push({ query: q });
      }
    });

    return NextResponse.json({
      organic,
      relatedSearches,
      peopleAlsoAsk: [], // Not exposed directly by DDG html
      mock: false,
      source: "DuckDuckGo (Free)"
    });

  } catch (error) {
    console.error('SERP Scraper Error:', error);
    return NextResponse.json({ error: 'Failed to fetch free SERP data' }, { status: 500 });
  }
}
