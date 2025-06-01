const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function generateMetadata(youtubeUrl) {
  try {
    const tmpDir = './assets/songs';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    // Get metadata using yt-dlp
    const raw = execSync(`yt-dlp --dump-json ${youtubeUrl}`, { encoding: 'utf-8' });
    const data = JSON.parse(raw);

    // Step 2: Download mp3
    const outputFile = path.join(tmpDir, `${data.id}.mp3`);
    execSync(`yt-dlp -x --audio-format mp3 -o "${tmpDir}/%(id)s.%(ext)s" ${youtubeUrl}`);

    // Step 3: Construct metadata JSON
    const metadata = {
      title: data.title,
      artist: data.uploader,
      description: data.description || '',
      source: youtubeUrl,
      cover: data.thumbnail,
      file: outputFile,
      duration: Math.round(data.duration)
    };

    // Print the metadata in the terminal
    console.log(JSON.stringify(metadata, null, 2));

    // Uncomment below to output metadata to a file
    // fs.writeFileSync('./metadata.json', JSON.stringify(metadata, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Example usage
const youtubeLink = process.argv[2];
if (!youtubeLink) {
  console.error('Usage: node generate-metadata.js <youtube-url>');
  process.exit(1);
}

generateMetadata(youtubeLink);
