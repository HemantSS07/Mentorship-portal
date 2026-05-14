const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
if (!urlMatch || !keyMatch) {
  console.log("No env");
  process.exit(1);
}
const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`
  }
}).then(r => r.json()).then(spec => {
  const table = spec.definitions.notifications;
  console.log(table);
}).catch(console.error);
