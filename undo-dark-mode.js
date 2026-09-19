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
  
  // Undo backgrounds
  code = code.replace(/ dark:bg-\[#1C1C1E\]/g, '');
  code = code.replace(/ dark:bg-white\/5/g, '');
  code = code.replace(/ dark:bg-white\/10/g, '');
  
  // Undo borders
  code = code.replace(/ dark:border-white\/5/g, '');
  code = code.replace(/ dark:border-white\/10/g, '');
  code = code.replace(/ dark:border-white\/20/g, '');

  // Undo hovers
  code = code.replace(/ dark:hover:bg-white\/10/g, '');
  code = code.replace(/ dark:hover:border-white\/20/g, '');
  code = code.replace(/ dark:hover:bg-apple-gray-5/g, '');

  fs.writeFileSync(file, code);
}
console.log("Undid injected classes.");
