#!/usr/bin/env python3
"""
PHAZR Sitemap Generator
Generates sitemap.xml with all blog posts from blogs/index.json
"""
import json
from pathlib import Path
from datetime import datetime

# Configuration
DOMAIN = "https://phaz.onrender.com"
BLOGS_DIR = Path("blogs")
INDEX_FILE = BLOGS_DIR / "index.json"
SITEMAP_FILE = Path("sitemap.xml")

# Main pages with their priorities
MAIN_PAGES = [
    {"url": "/", "priority": "1.0", "changefreq": "daily"},
    {"url": "/index.html", "priority": "1.0", "changefreq": "daily"},
    {"url": "/bloglist.html", "priority": "0.9", "changefreq": "daily"},
    {"url": "/about.html", "priority": "0.5", "changefreq": "monthly"},
    {"url": "/policy.html", "priority": "0.3", "changefreq": "yearly"},
    {"url": "/legal.html", "priority": "0.3", "changefreq": "yearly"},
]

def generate_sitemap():
    """Generate sitemap.xml from blog index"""
    
    # Check if index file exists
    if not INDEX_FILE.exists():
        print(f"❌ Error: {INDEX_FILE} not found!")
        print("   Run update-index.py first to generate the blog index.")
        return False
    
    # Load blog posts
    try:
        with open(INDEX_FILE, 'r', encoding='utf-8') as f:
            blog_posts = json.load(f)
    except Exception as e:
        print(f"❌ Error reading {INDEX_FILE}: {e}")
        return False
    
    # Get current date
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Start XML
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <!-- Main Pages -->',
    ]
    
    # Add main pages
    for page in MAIN_PAGES:
        xml_lines.extend([
            '  <url>',
            f'    <loc>{DOMAIN}{page["url"]}</loc>',
            f'    <lastmod>{today}</lastmod>',
            f'    <changefreq>{page["changefreq"]}</changefreq>',
            f'    <priority>{page["priority"]}</priority>',
            '  </url>',
        ])
    
    # Add blog posts
    xml_lines.append('  <!-- Blog Stories -->')
    for post in blog_posts:
        # URL encode the filename for the detail page
        from urllib.parse import quote
        encoded_post = quote(post)
        story_url = f'/detail.html?id={encoded_post}'
        
        xml_lines.extend([
            '  <url>',
            f'    <loc>{DOMAIN}{story_url}</loc>',
            f'    <lastmod>{today}</lastmod>',
            f'    <changefreq>monthly</changefreq>',
            f'    <priority>0.8</priority>',
            '  </url>',
        ])
    
    # Close XML
    xml_lines.append('</urlset>')
    
    # Write to file
    try:
        with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
            f.write('\n'.join(xml_lines))
        
        total_urls = len(MAIN_PAGES) + len(blog_posts)
        print(f"✅ SUCCESS: Sitemap generated!")
        print(f"   📍 Location: {SITEMAP_FILE}")
        print(f"   📊 Total URLs: {total_urls}")
        print(f"      - Main pages: {len(MAIN_PAGES)}")
        print(f"      - Blog stories: {len(blog_posts)}")
        print(f"\n🌐 Next steps:")
        print(f"   1. Commit and push sitemap.xml to GitHub")
        print(f"   2. Wait for Render deployment")
        print(f"   3. Submit to Google Search Console:")
        print(f"      https://search.google.com/search-console")
        print(f"   4. Submit sitemap URL: {DOMAIN}/sitemap.xml")
        
        return True
        
    except Exception as e:
        print(f"❌ Error writing sitemap: {e}")
        return False

if __name__ == "__main__":
    generate_sitemap()
