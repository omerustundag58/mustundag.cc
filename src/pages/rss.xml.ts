import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: { site: URL }) {
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'mustundag.cc — Ömer Üstündağ',
    description: 'Ağ, güvenlik ve yazılım üzerine notlar.',
    site: context.site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: '<language>tr-TR</language><ttl>60</ttl>',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/blog/${p.id}`,
      categories: p.data.tags,
    })),
  });
}
