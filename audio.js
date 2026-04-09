// audio.js

// Function to vibrate the device
function vibrate(duration) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

// Function to play a sound
function playSound(soundFile) {
    const audio = new Audio(soundFile);
    audio.play();
}

// Function to play UI sound
function playUISound() {
    playSound('path/to/ui_sound.mp3');
}

// Function to start background music
function startBGM() {
    playSound('path/to/background_music.mp3');
}

// Function to stop background music
function stopBGM() {
    // Logic to stop background music goes here
}

// Function to play bomb explosion sound
function playBombExplosionSound() {
    playSound('path/to/bomb_explosion.mp3');
}

// Function to play sword swing sound
function playSwordSwingSound() {
    playSound('path/to/sword_swing.mp3');
}

// Function to play eye projectile hit sound
function playEyeProjectileHitSound() {
    playSound('path/to/eye_projectile_hit.mp3');
}
