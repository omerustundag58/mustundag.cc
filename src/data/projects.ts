/**
 * Proje listesi.
 * Kaynak: elle bakımı yapılan "curated" liste + derleme anında GitHub API'den
 * yıldız/son güncelleme bilgisi (varsa). Ağ yoksa liste sessizce sabit veriye döner.
 */

export type Project = {
  /** GitHub depo adı (istatistik eşleştirmesi için) */
  repo?: string;
  name: string;
  desc: string;
  /** Kaynak / repo adresi */
  url?: string | null;
  /** Canlı site */
  site?: string;
  lang: string;
  tags?: string[];
  status?: string;
  featured?: boolean;
  stars?: number;
  pushedAt?: string;
};

const curated: Project[] = [
  {
    repo: 'dpi-vpn',
    name: 'dpi-vpn',
    desc: "DPI engelini record-split ile aşan özgür VPN. Windows ve Android için; kayıt yok, hesap yok, tamamen açık kaynak.",
    url: 'https://github.com/omerustundag58/dpi-vpn',
    site: 'https://vpn.mustundag.cc',
    lang: 'Rust · Kotlin',
    tags: ['VPN', 'DPI', 'TLS', 'Android', 'Windows'],
    status: 'aktif',
    featured: true,
  },
  {
    repo: 'email-mcp',
    name: 'email-mcp',
    desc: 'OpenCode için genel amaçlı IMAP/SMTP MCP sunucusu: e-posta oku, ara, gönder, klasörleri yönet.',
    url: 'https://github.com/omerustundag58/email-mcp',
    lang: 'TypeScript',
    tags: ['MCP', 'IMAP', 'SMTP', 'AI'],
    status: 'aktif',
  },
  {
    repo: 'mustundag.cc',
    name: 'mustundag.cc',
    desc: 'Bu site. Astro ile üretilir, GitHub Actions ile yayımlanır, Cloudflare arkasında yaşar. CRT terminal teması.',
    url: 'https://github.com/omerustundag58/mustundag.cc',
    site: 'https://mustundag.cc',
    lang: 'Astro · TypeScript',
    tags: ['Web', 'Astro', 'CI'],
    status: 'canlı',
  },
  {
    name: 'yt-arsiv',
    desc: "YouTube arşivleyici: indir, transkript çıkar, AI ile özetle, yerel arşivde ara. Kendi kendine çalışan CLI/TUI.",
    lang: 'Python',
    tags: ['Python', 'AI', 'TUI'],
    status: 'gizli',
  },
  {
    name: 'npu-denoise',
    desc: 'GT-CRNN tabanlı gerçek zamanlı ses gürültü azaltma — ONNX + NPU, yerel model, mikrofon akışı üzerinde çalışır.',
    lang: 'Python · ONNX',
    tags: ['Ses', 'NPU', 'ONNX'],
    status: 'deney',
  },
  {
    name: 'hardcore-pvp-pack',
    desc: 'Minecraft 1.21 için Fabric tabanlı, PvP ve performans odaklı mod paketi: 40+ mod, ayar dosyaları ve kurulum betiği.',
    lang: 'Python · Fabric',
    tags: ['Minecraft', 'Fabric'],
    status: 'yayında',
  },
];

type GhRepo = {
  html_url?: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  pushed_at?: string;
};

async function fetchGithub(): Promise<Record<string, GhRepo>> {
  const headers: Record<string, string> = {
    'User-Agent': 'mustundag.cc-build',
    Accept: 'application/vnd.github+json',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(
    'https://api.github.com/users/omerustundag58/repos?sort=updated&per_page=30',
    { headers },
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data: Array<{ name: string } & GhRepo> = await res.json();

  const map: Record<string, GhRepo> = {};
  for (const r of data) map[r.name] = r;
  return map;
}

/** Projeleri döndürür (GitHub istatistikleri derleme anında zenginleştirilir). */
export async function getProjects(): Promise<Project[]> {
  let gh: Record<string, GhRepo> = {};
  try {
    gh = await fetchGithub();
  } catch {
    gh = {}; // çevrimdışı / limit: sabit listeyle devam
  }

  return curated.map((p) => {
    const g = p.repo ? gh[p.repo] : undefined;
    if (!g) return p;
    return {
      ...p,
      url: p.url ?? g.html_url ?? null,
      stars: g.stargazers_count ?? p.stars,
      pushedAt: g.pushed_at ?? p.pushedAt,
      lang: p.lang || g.language || '',
    };
  });
}

/** Öne çıkan + ilk N (ana sayfa için). */
export async function getFeaturedProjects(limit = 4): Promise<Project[]> {
  const all = await getProjects();
  const feat = all.filter((p) => p.featured);
  const rest = all.filter((p) => !p.featured);
  return [...feat, ...rest].slice(0, limit);
}
