const fs = require('fs');

const files = [
  'client/src/pages/Dashboard.tsx',
  'client/src/pages/Profile.tsx',
  'client/src/pages/Feed.tsx',
  'client/src/pages/Settings.tsx',
  'client/src/pages/Leaderboard.tsx',
  'client/src/pages/Login.tsx',
  'client/src/pages/Register.tsx',
  'client/src/components/feed/FeedPostCard.tsx',
  'client/src/components/layout/Navbar.tsx',
  'client/src/components/ui/index.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  
  // Backgrounds
  code = code.replace(/bg-white(?!\/)(?! dark:)(?! text-white)(?! ring-white)/g, 'bg-white dark:bg-[#1C1C1E]');
  code = code.replace(/bg-white\/50(?!\/)(?! dark:)/g, 'bg-white/50 dark:bg-white/5');
  code = code.replace(/bg-white\/40(?!\/)(?! dark:)/g, 'bg-white/40 dark:bg-white/5');
  code = code.replace(/bg-white\/60(?!\/)(?! dark:)/g, 'bg-white/60 dark:bg-white/10');
  code = code.replace(/bg-white\/70(?!\/)(?! dark:)/g, 'bg-white/70 dark:bg-white/10');
  
  code = code.replace(/bg-apple-gray-6\/50(?!\/)(?! dark:)/g, 'bg-apple-gray-6/50 dark:bg-white/5');
  code = code.replace(/bg-apple-gray-6(?!\/)(?! dark:)/g, 'bg-apple-gray-6 dark:bg-white/10');
  
  // Borders
  code = code.replace(/border-\[rgba\(0,0,0,0\.08\)\](?!\/)(?! dark:)/g, 'border-[rgba(0,0,0,0.08)] dark:border-white/10');
  code = code.replace(/border-\[rgba\(0,0,0,0\.06\)\](?!\/)(?! dark:)/g, 'border-[rgba(0,0,0,0.06)] dark:border-white/5');
  code = code.replace(/border-\[rgba\(0,0,0,0\.1\)\](?!\/)(?! dark:)/g, 'border-[rgba(0,0,0,0.1)] dark:border-white/10');
  code = code.replace(/border-\[rgba\(0,0,0,0\.15\)\](?!\/)(?! dark:)/g, 'border-[rgba(0,0,0,0.15)] dark:border-white/20');

  // Hovers
  code = code.replace(/hover:bg-white(?!\/)(?! dark:)/g, 'hover:bg-white dark:hover:bg-white/10');
  code = code.replace(/hover:border-black\/\[0\.12\](?!\/)(?! dark:)/g, 'hover:border-black/[0.12] dark:hover:border-white/20');
  code = code.replace(/hover:bg-apple-gray-6(?!\/)(?! dark:)/g, 'hover:bg-apple-gray-6 dark:hover:bg-white/10');

  fs.writeFileSync(file, code);
}
console.log("Replaced classes in TSX files.");
