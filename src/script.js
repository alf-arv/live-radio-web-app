document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const audio = document.getElementById('audio-player');
    const volumeSlider = document.getElementById('volume');
    const muteBtn = document.getElementById('mute');
    const muteIcon = muteBtn.querySelector('i');
    const coverImage = document.getElementById('cover-image');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const trackDesc = document.getElementById('track-desc');
    const sourceLink = document.getElementById('source-link');
    const progressBar = document.getElementById('progress');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const statusText = document.getElementById('status-text');
    const unmuteOverlay = document.getElementById('unmute-overlay');
    
    // Load playlist data
    const playlist = loadPlaylist();
    
    // Calculate total playlist duration
    const totalPlaylistDuration = playlist.reduce((sum, track) => sum + track.duration, 0);
    
    // Initialize player state
    let currentTrackIndex = 0;
    let nextTrackIndex = 1;
    let isPlaying = false;
    let nextAudio = null;
    
    // Update UI with track info
    function updateTrackInfo(track) {
        trackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;
        trackDesc.textContent = track.description;
        sourceLink.href = track.source;
        coverImage.src = track.cover;
        updateBackgroundBlur(track.cover)
    }

    let currentBlur = 1;
    function updateBackgroundBlur(newUrl) {
        const nextBlur = currentBlur *(-1);
        const currentEl = document.querySelector(`.blur-${currentBlur}`);
        const nextEl = document.querySelector(`.blur-${nextBlur}`);

        // Preload the image
        const img = new Image();
        img.src = newUrl;

        img.onload = () => {
            // Set the image only after it’s loaded
            nextEl.style.backgroundImage = `url(${newUrl})`;

            // Trigger fade transition
            nextEl.classList.add('visible');
            currentEl.classList.remove('visible');

            currentBlur = nextBlur;
        };
    }
    
    // Preload next track
    function preloadNextTrack() {
        if (nextAudio) {
            nextAudio.pause();
            nextAudio = null;
        }
        
        nextAudio = new Audio(playlist[nextTrackIndex].file);
        nextAudio.preload = "auto";
    }
    
    // Format time to MM:SS
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    // Calculate synchronized playback position
    function getSynchronizedPosition() {
        const now = new Date();
        const utcSeconds = (now.getUTCHours() * 3600) + 
                          (now.getUTCMinutes() * 60) + 
                          now.getUTCSeconds();
        
        // Calculate position in playlist cycle
        const positionInCycle = utcSeconds % totalPlaylistDuration;
        
        // Find current track and offset
        let accumulated = 0;
        for (let i = 0; i < playlist.length; i++) {
            const track = playlist[i];
            if (positionInCycle < accumulated + track.duration) {
                return {
                    trackIndex: i,
                    offset: positionInCycle - accumulated
                };
            }
            accumulated += track.duration;
        }
        
        // Default to first track
        return {
            trackIndex: 0,
            offset: 0
        };
    }
    
    function startSynchronizedPlayback() {
        const { trackIndex, offset } = getSynchronizedPosition();
        currentTrackIndex = trackIndex;
        nextTrackIndex = (currentTrackIndex + 1) % playlist.length;
        
        updateTrackInfo(playlist[currentTrackIndex]);
        
        audio.src = playlist[currentTrackIndex].file;
        audio.currentTime = offset;
        
        // Preload next track
        preloadNextTrack();
        
        totalTimeEl.textContent = formatTime(playlist[currentTrackIndex].duration);
        
        // Start muted playback
        audio.muted = true;
        updateMuteIcon();
        
        // Try to play muted
        audio.play().then(() => {
            isPlaying = true;
            statusText.textContent = "Playback muted - Click to unmute";
        }).catch(e => {
            console.log("Muted autoplay prevented:", e);
            statusText.textContent = "Click to start playback";
            unmuteOverlay.querySelector('.unmute-text').innerHTML = 
                "Welcome! Your browser prevented autoplay, click anywhere to start listening.";
        });
    }
    
    // Unmute the audio
    function unmutePlayback() {
        audio.muted = false;
        updateMuteIcon();
        statusText.textContent = "Live Streaming";
        
        // Hide the overlay
        unmuteOverlay.classList.add('hidden');
        
        // Remove overlay after animation completed
        setTimeout(() => {
            unmuteOverlay.style.display = 'none';
        }, 500);
    }

    function loadPlaylist(url){
        // for demonstration purposes, if no playlist URL provided, load sample playlist
        if (!url){
            return [ 
                {
                    "title": "Cat saying Huh!",
                    "artist": "MemeHub",
                    "description": "🐱🤔 tags:cat meme, cat huh meme, cat say huh, huh cat, confused cat, confused cat meme, funny cat meme, cat saying huh, cat hu, cat ha, cat say ha, cat ha meme, cat hau meme, cat hah meme",
                    "source": "https://www.youtube.com/watch?v=xVWeRnStdSA",
                    "cover": "https://i.ytimg.com/vi/xVWeRnStdSA/maxresdefault.jpg",
                    "file": "assets/songs/xVWeRnStdSA.mp3",
                    "duration": 16
                },
                {
                    "title": "MOTHER/ - POLLYANNA (I BELIEVE IN YOU)",
                    "artist": "Korone Ch. 戌神ころね",
                    "description": "だいすきなゲームの大好きな曲を歌いました",
                    "source": "https://youtu.be/Za9BWNQaJYI",
                    "cover": "https://i.ytimg.com/vi_webp/Za9BWNQaJYI/maxresdefault.webp",
                    "file": "assets/songs/Za9BWNQaJYI.mp3",
                    "duration": 225
                },
                {
                    "title": "You're Correct Horse",
                    "artist": "Isaiah",
                    "description": ":)\n\n\n\"Saxophone Horse\" by David Flavin and Roland Rudzitis, on iTunes and Amazon",
                    "source": "https://www.youtube.com/watch?v=b3_lVSrPB6w",
                    "cover": "https://i.ytimg.com/vi_webp/b3_lVSrPB6w/maxresdefault.webp",
                    "file": "assets/songs/b3_lVSrPB6w.mp3",
                    "duration": 38
                },
            ]; 
        }
        
        try {
            return fetch(url)
                .then(response => {
                if (!response.ok) {
                    console.error("Failed to load configured playlist URL: ${url}.");
                }
                return response.json();
                });
        }  catch (error) {
            console.error("Failed to load configured playlist URL: ${url}.", error);   
        }
    }
    
    // Handle track ended
    function handleTrackEnded() {
        // Move to next track
        currentTrackIndex = nextTrackIndex;
        nextTrackIndex = (currentTrackIndex + 1) % playlist.length;
        
        // Update UI
        updateTrackInfo(playlist[currentTrackIndex]);
        
        // Set audio source to next track
        audio.src = playlist[currentTrackIndex].file;
        audio.currentTime = 0;
        audio.play();
        
        // Preload the next next track
        preloadNextTrack();
        
        // Update time display
        totalTimeEl.textContent = formatTime(playlist[currentTrackIndex].duration);
    }
    
    // Update progress bar
    function updateProgress() {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${percent}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        }
    }
    
    // Volume controls
    volumeSlider.addEventListener('input', function() {
        audio.volume = volumeSlider.value;
        updateMuteIcon();
    });
    
    // Mute button
    muteBtn.addEventListener('click', function() {
        audio.muted = !audio.muted;
        updateMuteIcon();
    });
    
    // Unmute button
    unmuteOverlay.addEventListener('click', function() {
        unmutePlayback();
        
        // If playback hasn't started, try to start it
        if (!isPlaying) {
            audio.play().then(() => {
                isPlaying = true;
                statusText.textContent = "Live Streaming";
            }).catch(e => {
                console.error("Playback failed:", e);
                statusText.textContent = "Playback failed. Click to retry.";
            });
        }
    });
    
    // Update mute icon based on volume/mute state
    function updateMuteIcon() {
        if (audio.muted || audio.volume === 0) {
            muteIcon.className = 'fas fa-volume-mute';
            muteBtn.style.color = '#e74c3c';
        } else if (audio.volume < 0.5) {
            muteIcon.className = 'fas fa-volume-down';
            muteBtn.style.color = '#fff';
        } else {
            muteIcon.className = 'fas fa-volume-up';
            muteBtn.style.color = '#fff';
        }
    }
    
    // Event listeners
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleTrackEnded);
    audio.addEventListener('durationchange', function() {
        if (audio.duration !== Infinity) {
            totalTimeEl.textContent = formatTime(audio.duration);
        }
    });
    
    // Start synchronized playback
    startSynchronizedPlayback();
    
    // Update progress every second
    setInterval(updateProgress, 1000);
});
