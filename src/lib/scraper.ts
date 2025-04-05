import metascraper from 'metascraper';
import metascraperAuthor from 'metascraper-author';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperLogo from 'metascraper-logo';
import metascraperTitle from 'metascraper-title';
import metascraperUrl from 'metascraper-url';
import fetch from 'node-fetch';

// Add a module declaration for node-fetch to resolve type issues
declare module 'node-fetch';

export type Metadata = {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
};

const scraper = metascraper([
  metascraperAuthor(),
  metascraperDescription(),
  metascraperImage(),
  metascraperLogo(),
  metascraperTitle(),
  metascraperUrl()
]);

export async function scrapeMetadata(url: string): Promise<Metadata> {
  try {
    console.log('Scraping metadata for URL:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LibraryApp/1.0; +https://libraryapp.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const metadata = await scraper({ html, url });

    return {
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      siteName: metadata.publisher,
      favicon: metadata.logo,
    };
  } catch (error) {
    console.error('Error scraping metadata:', error);
    return {};
  }
}