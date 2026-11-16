// script.js
const playerContainer = document.getElementById('playerContainer');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volumeSlider');
const volumeIcon = document.getElementById('volumeIcon');
const likeBtn = document.getElementById('likeBtn');
const audioUpload = document.getElementById('audioUpload');
const trackTitle = document.getElementById('trackTitle');
const artistName = document.getElementById('artistName');
const statusMsg = document.getElementById('statusMsg');

let isPlaying = false;

// 1. Play / Pause Toggle
function togglePlay() {
    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play().catch(err => {
            statusMsg.textContent = "Click 'Load MP3' to select your local audio file.";
            console.error(err);
        });
    }
}

playPauseBtn.addEventListener('click', togglePlay);

// Touch & Click Rainbow Glow Trigger for Mobile and Desktop
playPauseBtn.addEventListener('touchstart', () => {
    playPauseBtn.classList.add('rainbow-touch');
});

playPauseBtn.addEventListener('touchend', () => {
    setTimeout(() => {
        playPauseBtn.classList.remove('rainbow-touch');
    }, 600);
});

// 2. Sync UI & Edge Lighting with Audio State
audioPlayer.addEventListener('play', () => {
    isPlaying = true;
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    playerContainer.classList.add('playing'); // Activates edge lighting
});

audioPlayer.addEventListener('pause', () => {
    isPlaying = false;
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    playerContainer.classList.remove('playing'); // Deactivates edge lighting
});

audioPlayer.addEventListener('ended', () => {
    isPlaying = false;
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    playerContainer.classList.remove('playing');
    progressBar.style.width = '0%';
});

// 3. Load Local MP3 File ("Worldwide" by Asake)
audioUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        audioPlayer.src = fileURL;
        
        // Clean file name for display or keep "Worldwide - Asake"
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        trackTitle.textContent = cleanName;
        artistName.textContent = "Asake";
        statusMsg.textContent = "Loaded: " + file.name;
        
        audioPlayer.play();
    }
});

// 4. Update Progress Bar & Timestamps
audioPlayer.addEventListener('timeupdate', () => {
    const { currentTime, duration } = audioPlayer;
    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(currentTime);
        durationEl.textContent = formatTime(duration);
    }
});

// Click on Progress Bar to Seek
progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    if (duration) {
        audioPlayer.currentTime = (clickX / width) * duration;
    }
});

// Format Seconds to M:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 5. Volume Control
volumeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    audioPlayer.volume = val;
    if (val == 0) {
        volumeIcon.className = 'fa-solid fa-volume-xmark';
    } else if (val < 0.5) {
        volumeIcon.className = 'fa-solid fa-volume-low';
    } else {
        volumeIcon.className = 'fa-solid fa-volume-high';
    }
});

// 6. Like Button Toggle
likeBtn.addEventListener('click', () => {
    likeBtn.classList.toggle('liked');
    const icon = likeBtn.querySelector('i');
    icon.classList.toggle('fa-regular');
    icon.classList.toggle('fa-solid');
});

// 7. Toggle Active States on Shuffle & Repeat
document.getElementById('shuffleBtn').addEventListener('click', function() {
    this.classList.toggle('active');
});

document.getElementById('repeatBtn').addEventListener('click', function() {
    this.classList.toggle('active');
    audioPlayer.loop = this.classList.contains('active');
});