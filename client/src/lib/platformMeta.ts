/**
 * platformMeta.ts
 * Static metadata for every supported developer platform:
 * category, display name, brand color, icon SVG path, placeholder text.
 */

export type PlatformCategory =
  | 'Source Code'
  | 'Competitive'
  | 'AI / ML'
  | 'Packages'
  | 'Community'
  | 'Certifications'
  | 'Social & Portfolio';

export interface PlatformMeta {
  id: string;
  name: string;
  category: PlatformCategory;
  color: string;          // brand hex
  bgColor: string;        // subtle bg
  placeholder: string;    // input placeholder
  hasApi: boolean;        // true = we fetch real data
  urlTemplate?: string;   // for display-only
}

export const PLATFORM_META: Record<string, PlatformMeta> = {
  // ── Source Code ────────────────────────────────────────────
  github: {
    id: 'github', name: 'GitHub', category: 'Source Code',
    color: '#24292f', bgColor: 'rgba(36,41,47,0.08)',
    placeholder: 'your-github-username',
    hasApi: true,
  },
  gitlab: {
    id: 'gitlab', name: 'GitLab', category: 'Source Code',
    color: '#FC6D26', bgColor: 'rgba(252,109,38,0.08)',
    placeholder: 'your-gitlab-username',
    hasApi: true,
  },
  bitbucket: {
    id: 'bitbucket', name: 'Bitbucket', category: 'Source Code',
    color: '#0052CC', bgColor: 'rgba(0,82,204,0.08)',
    placeholder: 'your-bitbucket-username',
    hasApi: true,
  },
  codeberg: {
    id: 'codeberg', name: 'Codeberg', category: 'Source Code',
    color: '#2185D0', bgColor: 'rgba(33,133,208,0.08)',
    placeholder: 'your-codeberg-username',
    hasApi: true,
  },

  // ── Competitive Programming ────────────────────────────────
  leetcode: {
    id: 'leetcode', name: 'LeetCode', category: 'Competitive',
    color: '#FFA116', bgColor: 'rgba(255,161,22,0.08)',
    placeholder: 'your-leetcode-username',
    hasApi: true,
  },
  codeforces: {
    id: 'codeforces', name: 'Codeforces', category: 'Competitive',
    color: '#1F8DD6', bgColor: 'rgba(31,141,214,0.08)',
    placeholder: 'your-codeforces-handle',
    hasApi: true,
  },
  codechef: {
    id: 'codechef', name: 'CodeChef', category: 'Competitive',
    color: '#5B4638', bgColor: 'rgba(91,70,56,0.08)',
    placeholder: 'your-codechef-username',
    hasApi: false,
  },
  hackerrank: {
    id: 'hackerrank', name: 'HackerRank', category: 'Competitive',
    color: '#2EC866', bgColor: 'rgba(46,200,102,0.08)',
    placeholder: 'your-hackerrank-username',
    hasApi: false,
  },
  atcoder: {
    id: 'atcoder', name: 'AtCoder', category: 'Competitive',
    color: '#222222', bgColor: 'rgba(34,34,34,0.08)',
    placeholder: 'your-atcoder-username',
    hasApi: false,
  },

  // ── AI / ML ───────────────────────────────────────────────
  kaggle: {
    id: 'kaggle', name: 'Kaggle', category: 'AI / ML',
    color: '#20BEFF', bgColor: 'rgba(32,190,255,0.08)',
    placeholder: 'your-kaggle-username',
    hasApi: false,
  },
  huggingface: {
    id: 'huggingface', name: 'Hugging Face', category: 'AI / ML',
    color: '#FF9D00', bgColor: 'rgba(255,157,0,0.08)',
    placeholder: 'your-hf-username',
    hasApi: true,
  },

  // ── Packages ──────────────────────────────────────────────
  npm: {
    id: 'npm', name: 'npm', category: 'Packages',
    color: '#CB3837', bgColor: 'rgba(203,56,55,0.08)',
    placeholder: 'your-npm-username',
    hasApi: true,
  },
  pypi: {
    id: 'pypi', name: 'PyPI', category: 'Packages',
    color: '#3775A9', bgColor: 'rgba(55,117,169,0.08)',
    placeholder: 'your-pypi-username',
    hasApi: true,
  },
  dockerhub: {
    id: 'dockerhub', name: 'Docker Hub', category: 'Packages',
    color: '#2496ED', bgColor: 'rgba(36,150,237,0.08)',
    placeholder: 'your-dockerhub-username',
    hasApi: true,
  },

  // ── Developer Community ────────────────────────────────────
  stackoverflow: {
    id: 'stackoverflow', name: 'Stack Overflow', category: 'Community',
    color: '#F48024', bgColor: 'rgba(244,128,36,0.08)',
    placeholder: 'username or user ID (e.g. 1234567)',
    hasApi: true,
  },
  devto: {
    id: 'devto', name: 'DEV.to', category: 'Community',
    color: '#09090b', bgColor: 'rgba(9,9,11,0.08)',
    placeholder: 'your-dev-username',
    hasApi: true,
  },
  hashnode: {
    id: 'hashnode', name: 'Hashnode', category: 'Community',
    color: '#2563EB', bgColor: 'rgba(37,99,235,0.08)',
    placeholder: 'your-hashnode-username',
    hasApi: true,
  },

  // ── Social & Portfolio ─────────────────────────────────────
  linkedin: {
    id: 'linkedin', name: 'LinkedIn', category: 'Social & Portfolio',
    color: '#0A66C2', bgColor: 'rgba(10,102,194,0.08)',
    placeholder: 'your-linkedin-username',
    hasApi: false,
  },
  twitter: {
    id: 'twitter', name: 'X / Twitter', category: 'Social & Portfolio',
    color: '#000000', bgColor: 'rgba(0,0,0,0.08)',
    placeholder: 'your-twitter-handle',
    hasApi: false,
  },
  youtube: {
    id: 'youtube', name: 'YouTube', category: 'Social & Portfolio',
    color: '#FF0000', bgColor: 'rgba(255,0,0,0.08)',
    placeholder: 'your-youtube-channel',
    hasApi: false,
  },
  codepen: {
    id: 'codepen', name: 'CodePen', category: 'Social & Portfolio',
    color: '#000000', bgColor: 'rgba(0,0,0,0.08)',
    placeholder: 'your-codepen-username',
    hasApi: false,
  },
  replit: {
    id: 'replit', name: 'Replit', category: 'Social & Portfolio',
    color: '#F26207', bgColor: 'rgba(242,98,7,0.08)',
    placeholder: 'your-replit-username',
    hasApi: false,
  },
  producthunt: {
    id: 'producthunt', name: 'Product Hunt', category: 'Social & Portfolio',
    color: '#DA552F', bgColor: 'rgba(218,85,47,0.08)',
    placeholder: 'your-producthunt-username',
    hasApi: false,
  },
  portfolio: {
    id: 'portfolio', name: 'Personal Portfolio', category: 'Social & Portfolio',
    color: '#7C3AED', bgColor: 'rgba(124,58,237,0.08)',
    placeholder: 'https://yourportfolio.dev',
    hasApi: false,
  },

  // ── Certifications ─────────────────────────────────────────
  credly: {
    id: 'credly', name: 'Credly', category: 'Certifications',
    color: '#FF6B00', bgColor: 'rgba(255,107,0,0.08)',
    placeholder: 'your-credly-username',
    hasApi: false,
  },
  microsoftlearn: {
    id: 'microsoftlearn', name: 'Microsoft Learn', category: 'Certifications',
    color: '#00A4EF', bgColor: 'rgba(0,164,239,0.08)',
    placeholder: 'your-ms-learn-username',
    hasApi: false,
  },
  googledeveloper: {
    id: 'googledeveloper', name: 'Google Developer', category: 'Certifications',
    color: '#4285F4', bgColor: 'rgba(66,133,244,0.08)',
    placeholder: 'your-google-dev-username',
    hasApi: false,
  },
};

export const PLATFORM_CATEGORIES: PlatformCategory[] = [
  'Source Code',
  'Competitive',
  'AI / ML',
  'Packages',
  'Community',
  'Certifications',
  'Social & Portfolio',
];

/** Get platforms grouped by category. */
export function getPlatformsByCategory(): Record<PlatformCategory, PlatformMeta[]> {
  const result = {} as Record<PlatformCategory, PlatformMeta[]>;
  for (const cat of PLATFORM_CATEGORIES) result[cat] = [];
  for (const meta of Object.values(PLATFORM_META)) result[meta.category].push(meta);
  return result;
}

/** Platform icon component as inline SVG data-URLs (brand logos). */
export function getPlatformIcon(platformId: string): string {
  const icons: Record<string, string> = {
    github: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z%22 fill%3D%22%2324292f%22%2F%3E%3C%2Fsvg%3E',
    gitlab: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 380 380%22%3E%3Cpath d%3D%22M282.83 170.73l-.27-.69-26.14-68.22a6.81 6.81 0 0 0-2.69-3.24 7 7 0 0 0-8 .43 7 7 0 0 0-2.32 3.52l-17.65 54H154.29l-17.65-54A6.86 6.86 0 0 0 134.32 99a7 7 0 0 0-8-.43 6.87 6.87 0 0 0-2.69 3.24L97.44 170l-.26.69a48.54 48.54 0 0 0 16.1 56.1l.09.07.24.17 39.82 29.82 19.7 14.91 12 9.06a8.07 8.07 0 0 0 9.76 0l12-9.06 19.7-14.91 40.06-30 .1-.08a48.56 48.56 0 0 0 16.08-56.04z%22 fill%3D%22%23FC6D26%22%2F%3E%3C%2Fsvg%3E',
    leetcode: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z%22 fill%3D%22%23FFA116%22%2F%3E%3C%2Fsvg%3E',
    codeforces: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M4.5 7.5C5.328 7.5 6 8.172 6 9v10.5c0 .828-.672 1.5-1.5 1.5h-3C.672 21 0 20.328 0 19.5V9c0-.828.672-1.5 1.5-1.5h3zm9-4.5c.828 0 1.5.672 1.5 1.5V19.5c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5V4.5C9 3.672 9.672 3 10.5 3h3zm9 7.5c.828 0 1.5.672 1.5 1.5v9c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5v-9c0-.828.672-1.5 1.5-1.5h3z%22 fill%3D%22%231F8DD6%22%2F%3E%3C%2Fsvg%3E',
    stackoverflow: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.731H17.78v-2.137H6.111v2.137zm.259-4.852l11.446 2.39.451-2.091-11.446-2.39-.451 2.091zm1.359-5.056l10.605 4.941.903-1.938-10.605-4.94-.903 1.937zm2.748-4.653l8.753 7.46 1.356-1.59-8.753-7.46-1.356 1.59zM15.008 0l-1.699 1.255 6.759 9.145 1.7-1.255L15.008 0z%22 fill%3D%22%23F48024%22%2F%3E%3C%2Fsvg%3E',
    huggingface: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Ctext y%3D%2218%22 font-size%3D%2218%22%3E%F0%9F%A4%97%3C%2Ftext%3E%3C%2Fsvg%3E',
    npm: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z%22 fill%3D%22%23CB3837%22%2F%3E%3C%2Fsvg%3E',
    devto: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.29zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z%22 fill%3D%22%2309090b%22%2F%3E%3C%2Fsvg%3E',
    kaggle: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v4.973c0 .304-.149.456-.446.456H5.81c-.297 0-.445-.152-.445-.456V.457C5.365.152 5.513 0 5.81 0h2.032c.297 0 .446.152.446.457v14.083l6.479-6.082c.188-.164.375-.246.562-.246h3.28c.145 0 .236.043.27.13.033.085-.007.19-.111.317l-6.116 5.965 6.242 7.812c.098.104.133.208.11.323z%22 fill%3D%22%2320BEFF%22%2F%3E%3C%2Fsvg%3E',
    linkedin: 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z%22 fill%3D%22%230A66C2%22%2F%3E%3C%2Fsvg%3E',
  };
  return icons[platformId] ?? '';
}
