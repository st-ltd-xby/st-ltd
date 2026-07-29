const fs = require('fs');
const path = require('path');

// Try multiple locations for auth.json
const locations = [
  path.join(process.env.LOCALAPPDATA, 'com.vercel.cli', 'auth.json'),
  path.join(process.env.USERPROFILE, '.vercel', 'auth.json'),
  path.join(process.env.APPDATA, 'com.vercel.cli', 'auth.json'),
];

let token = null;
for (const loc of locations) {
  try {
    if (fs.existsSync(loc)) {
      const content = fs.readFileSync(loc, 'utf8');
      const match = content.match(/"token"\s*:\s*"([^"]+)"/);
      if (match) { token = match[1]; break; }
    }
  } catch (e) {}
}

if (!token) {
  console.log('Token not found');
  process.exit(1);
}

fetch('https://api.vercel.com/v2/user', {
  headers: { Authorization: 'Bearer ' + token }
})
  .then(r => r.json())
  .then(d => {
    console.log('Email:', d.email || 'N/A');
    console.log('Name:', d.name || 'N/A');
    console.log('Username:', d.username || 'N/A');
    console.log('ID:', d.id || 'N/A');
  })
  .catch(e => console.log('Error:', e.message));
