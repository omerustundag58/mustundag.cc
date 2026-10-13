/**
 * Proje listesi — doğrudan GitHub API'inden canlı çekilir.
 * Derleme anında (GitHub Actions) çalıştığı için liste her yayında tazelenir:
 * yıldız, açıklama, dil, konu etiketleri ve son commit tarihi GitHub'dan gelir.
 * Ağ başarısız olursa sessizce sabit yedeğe döner (site asla boş kalmaz).
 */

export type Project = {
  name: string;
  desc: string;
  /** Depo adresi */
  url: string;
  /** Canlı site (varsa) */
  site?: string;
  lang: string;
  topics: string[];
  stars: number;
  /** pushed_at */
  updatedAt: string;
  featured?: boolean;
  archived?: boolean;
};

/** GitHub'da olmayan küçük düzeltmeler (ör. dpi-vpn'in ayrı sitesi). */
const OVERRIDES: Record<string, Partial<Project>> = {
  'dpi-vpn': { site: 'https://vpn.mustundag.cc', featured: true },
};

/** Çevrimdışı / API hatası durumunda kullanılacak asgari liste. */
const FALLBACK: Project[] = [
  {
    name: 'dpi-vpn',
    desc: 'DPI engelini record-split ile aşan özgür VPN (Windows + Android).',
    url: 'https://github.com/omerustundag58/dpi-vpn',
    site: 'https://vpn.mustundag.cc',
    lang: 'Rust',
    topics: ['vpn', 'dpi'],
    stars: 0,
    updatedAt: '2026-10-12T00:00:00Z',
    featured: true,
  },
  {
    name: 'email-mcp',
    desc: 'OpenCode için genel amaçlı IMAP/SMTP MCP sunucusu.',
    url: 'https://github.com/omerustundag58/email-mcp',
    lang: 'TypeScript',
    topics: ['mcp', 'imap'],
    stars: 0,
    updatedAt: '2026-10-11T00:00:00Z',
  },
];

type GhRepo = {
  name: string;
  html_url: string;
  homepage?: string | null;
  description?: string | null;
  language?: string | null;
  topics?: string[];
  stargazers_count?: number;
  pushed_at?: string;
  archived?: boolean;
  fork?: boolean;
  private?: boolean;
};

async function fetchGithub(): Promise<Project[]> {
  const headers: Record<string, string> = {
    'User-Agent': 'mustundag.cc-build',
    Accept: 'application/vnd.github+json',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(
    'https://api.github.com/users/omerustundag58/repos?type=owner&sort=updated&per_page=50',
    { headers },
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);

  const data: GhRepo[] = await res.json();

  return data
    .filter((r) => !r.fork && !r.private)
    .map((r) => {
      const base: Project = {
        name: r.name,
        desc: r.description?.trim() || 'Açıklama eklenmemiş.',
        url: r.html_url,
        site: r.homepage?.trim() || undefined,
        lang: r.language ?? '',
        topics: r.topics ?? [],
        stars: r.stargazers_count ?? 0,
        updatedAt: r.pushed_at ?? r.name,
        archived: r.archived,
      };
      return { ...base, ...(OVERRIDES[r.name] ?? {}) };
    })
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

/** Canlı proje listesi (son itilen ilk). */
export async function getProjects(): Promise<Project[]> {
  try {
    return await fetchGithub();
  } catch {
    return FALLBACK;
  }
}

/** Ana sayfa vitrini: öne çıkan + en yeniler. */
export async function getFeaturedProjects(limit = 4): Promise<Project[]> {
  const all = await getProjects();
  const feat = all.filter((p) => p.featured);
  const rest = all.filter((p) => !p.featured);
  return [...feat, ...rest].slice(0, limit);
}
