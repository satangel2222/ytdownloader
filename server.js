/**
 * TubeForge Bridge Server
 * Run this locally to enable the "Server Bridge" mode in the web app.
 * 
 * Setup:
 * 1. Install Node.js
 * 2. Run: npm install express cors yt-dlp-exec
 * 3. Run: node server.js
 */

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/download', async (req, res) => {
    const { url, quality } = req.body;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    console.log(`[Bridge] Request received for: ${url} (${quality})`);

    // Basic format selection
    let formatArgs = '-f "bv*[height<=1080]+ba/b"'; // Default 1080p
    if (quality === '2160p (4K)') formatArgs = '-f "bv*[height<=2160]+ba/b"';
    if (quality === '720p') formatArgs = '-f "bv*[height<=720]+ba/b"';
    if (quality === 'Audio Only (MP3)') formatArgs = '-x --audio-format mp3';

    // Construct command to stream to stdout
    // -o - tells yt-dlp to output to standard output
    const command = `yt-dlp ${formatArgs} -o - "${url}"`;

    console.log(`[Bridge] Executing: ${command}`);

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="video.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    const child = exec(command, { maxBuffer: 1024 * 1024 * 1024 }); // Increase buffer

    if (child.stdout) {
        child.stdout.pipe(res);
    }

    if (child.stderr) {
        child.stderr.on('data', (data) => {
            console.error(`[yt-dlp]: ${data}`);
        });
    }

    child.on('close', (code) => {
        console.log(`[Bridge] Process exited with code ${code}`);
        if (code !== 0) {
             // If we haven't sent headers yet, send error
             if (!res.headersSent) res.status(500).send('Download failed');
        }
    });
});

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`TubeForge Bridge Server Running on Port ${PORT}`);
    console.log(`1. Go to your TubeForge Web App`);
    console.log(`2. Select 'Server Bridge' Mode`);
    console.log(`3. Set endpoint to: http://localhost:3000/download`);
    console.log(`==================================================`);
});
