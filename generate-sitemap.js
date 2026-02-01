const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://phaz.onrender.com';
const BLOGS_DIR = './blogs'; // Your folder with .md files
const OUTPUT_FILE = './sitemap.xml';

// Start the XML structure
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/bloglist.html</loc><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/about.html</loc><priority>0.5</priority></url>`;

// Read all files in the blogs folder
fs.readdirSync(BLOGS_DIR).forEach(file => {
    if (file.endsWith('.md')) {
        const url = `${BASE_URL}/detail.html?id=${encodeURIComponent(file)}`;
        sitemap += `
  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
});

sitemap += `\n</urlset>`;

// Save the file
fs.writeFileSync(OUTPUT_FILE, sitemap);
console.log('✅ sitemap.xml updated with all blog posts!');
