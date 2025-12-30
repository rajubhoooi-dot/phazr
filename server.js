require('dotenv').config({ path: __dirname + '/.env.local' });
const express = require('express');
const tumblr = require('tumblr.js');
const app = express();

const Log = {
    info: (m) => console.log(`\x1b[36m[INFO]\x1b[0m ${new Date().toLocaleTimeString()} | ${m}`),
    success: (m) => console.log(`\x1b[32m[OK]\x1b[0m   ${new Date().toLocaleTimeString()} | ${m}`),
    error: (m) => console.log(`\x1b[31m[FAIL]\x1b[0m ${new Date().toLocaleTimeString()} | ${m}`),
    sync: (m) => console.log(`\x1b[35m[SYNC]\x1b[0m ${m}`)
};

app.use(express.static('public'));

const client = tumblr.createClient({
    consumer_key: process.env.TUMBLR_CONSUMER_KEY?.trim(),
    consumer_secret: process.env.TUMBLR_CONSUMER_SECRET?.trim(),
    token: process.env.TUMBLR_TOKEN?.trim(),
    token_secret: process.env.TUMBLR_TOKEN_SECRET?.trim()
});

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const getList = () => process.env.BLOG_LIST ? process.env.BLOG_LIST.split(',').map(b => b.trim()).filter(b => b !== "") : [];

app.get('/api/blogs', (req, res) => res.json(getList()));

// DEEP SYNC WITH 500 POST CAP
app.get('/api/blog/:name', async (req, res) => {
    const name = req.params.name;
    Log.info(`Syncing Channel: @${name}`);

    client.blogInfo(name, async (err, infoData) => {
        if (err) return res.status(404).json({ error: "Not Found" });
        
        const totalCount = infoData.blog.posts;
        // Apply your rule: If 1000+ posts, fetch 500. Otherwise fetch all.
        const fetchLimit = totalCount >= 1000 ? 500 : totalCount;
        
        Log.sync(`@${name} has ${totalCount} posts. Target fetch: ${fetchLimit}`);
        
        let allPosts = [];
        try {
            for (let offset = 0; offset < fetchLimit; offset += 50) {
                const data = await new Promise((resolve, reject) => {
                    client.blogPosts(name, { 
                        limit: 50, 
                        offset: offset, 
                        npf: true, 
                        reblog_info: true 
                    }, (e, d) => e ? reject(e) : resolve(d));
                });

                if (data?.posts) {
                    allPosts = allPosts.concat(data.posts);
                    Log.sync(`Progress: ${allPosts.length} / ${fetchLimit}`);
                }
                if (allPosts.length >= fetchLimit) break;
            }
            Log.success(`Sync finished. Sending ${allPosts.length} posts.`);
            res.json(shuffle(allPosts));
        } catch (fetchErr) {
            Log.error(`Sync error on @${name}`);
            res.status(500).json({ error: "Fetch failed" });
        }
    });
});

app.get('/api/stream-posts', async (req, res) => {
    const list = shuffle(getList());
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    for (const blog of list) {
        if (req.closed) break;
        await new Promise(resolve => {
            const randomOffset = Math.floor(Math.random() * 20);
            client.blogPosts(blog, { limit: 15, offset: randomOffset, npf: true, reblog_info: true }, (err, data) => {
                if (!err && data?.posts) {
                    Log.success(`Live Stream: @${blog}`);
                    res.write(`data: ${JSON.stringify(data.posts)}\n\n`);
                }
                resolve();
            });
        });
        await new Promise(r => setTimeout(r, 1200));
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => Log.success(`PHAZR ENGINE RUNNING | PORT ${PORT}`));
