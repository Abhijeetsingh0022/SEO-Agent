import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(finalUrl, {
      signal: controller.signal,
      cache: 'no-store', // Force Vercel/Next to not cache this fetch
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Expires': '0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return NextResponse.json({ error: `Failed to fetch url: ${response.status} ${response.statusText}` }, { status: response.status });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noisy elements to isolate purely semantic content
    $('script, style, noscript, svg, iframe, nav, footer, header, aside').remove();

    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content')?.trim() || '';
    const description = $('meta[name="description"]').attr('content')?.trim() || $('meta[property="og:description"]').attr('content')?.trim() || '';
    
    const h1 = $('h1').first().text().trim() || '';
    const h2s = $('h2').map((i, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 5).join(' | ');
    const h3s = $('h3').map((i, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 5).join(' | ');

    // Intelligently extract actual main content (fallback to dense paragraph clusters if <main> is missing)
    let mainText = $('main').text().replace(/\s+/g, ' ').trim();
    if (!mainText || mainText.length < 50) mainText = $('article').text().replace(/\s+/g, ' ').trim();
    if (!mainText || mainText.length < 50) {
      mainText = $('p').map((i, el) => $(el).text().trim()).get().filter(p => p.length > 30).slice(0, 6).join(' ');
    }
    mainText = mainText.slice(0, 1500) + (mainText.length > 1500 ? '...' : '');

    const robots = $('meta[name="robots"]').attr('content') || 'index, follow';
    const canonical = $('link[rel="canonical"]').attr('href') || '';

    return NextResponse.json({
      title,
      description,
      h1,
      h2s,
      h3s,
      mainText,
      robots,
      canonical
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

