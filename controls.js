// ====== GAMEPAD INPUT ======
let gamepadIndex = null;
const GAMEPAD_DEADZONE = 0.2;

function applyDeadzone(v, dz = GAMEPAD_DEADZONE) {
  return Math.abs(v) < dz ? 0 : v;
}

window.addEventListener("gamepadconnected", (e) => {
  console.log("Gamepad connected:", e.gamepad.id);
  gamepadIndex = e.gamepad.index;
});
window.addEventListener("gamepaddisconnected", (e) => {
  if (gamepadIndex === e.gamepad.index) gamepadIndex = null;
});

// Call each frame
function handleGamepadInput() {
    if (gamepadIndex == null) return;
    const gp = navigator.getGamepads?.()[gamepadIndex];
    if (!gp) return;

    // --- NEW UPGRADE MENU GAMEPAD LOGIC ---
    // Place this before all other gamepad logic
    if (isGamepadUpgradeMode) {
        const now = Date.now();
        if (now - lastGamepadUpdate > GAMEPAD_INPUT_DELAY) {
            let moved = false;
            const prevIndex = selectedUpgradeIndex;
            const numOptions = document.querySelectorAll('.upgrade-card').length;
            
            // Check for horizontal movement (D-pad left/right or left stick)
            if (gp.buttons[15].pressed || gp.axes[0] > 0.5) {
                selectedUpgradeIndex = (selectedUpgradeIndex + 1) % numOptions;
                moved = true;
            } 
            else if (gp.buttons[14].pressed || gp.axes[0] < -0.5) {
                selectedUpgradeIndex = (selectedUpgradeIndex - 1 + numOptions) % numOptions;
                moved = true;
            }
            
            // Check for vertical movement (D-pad up/down)
            const cardsPerRow = 3; 
            if (gp.buttons[12].pressed) {
                selectedUpgradeIndex = Math.max(0, selectedUpgradeIndex - cardsPerRow);
                moved = true;
            } else if (gp.buttons[13].pressed) {
                selectedUpgradeIndex = Math.min(numOptions - 1, selectedUpgradeIndex + cardsPerRow);
                moved = true;
            }

            if (moved && prevIndex !== selectedUpgradeIndex) {
                const prevCard = document.querySelectorAll('.upgrade-card')[prevIndex];
                if (prevCard) {
                    prevCard.classList.remove('selected');
                }
                const newCard = document.querySelectorAll('.upgrade-card')[selectedUpgradeIndex];
                if (newCard) {
                    newCard.classList.add('selected');
                    playUISound('uiClick');
                    vibrate(10);
                }
                lastGamepadUpdate = now;
            }
            
            // Check for confirmation button (e.g., A/X button)
            if (gp.buttons[0].pressed) {
                const selectedCard = document.querySelectorAll('.upgrade-card')[selectedUpgradeIndex];
                if (selectedCard) {
                    selectedCard.querySelector('button').click();
                    isGamepadUpgradeMode = false;
                    lastGamepadUpdate = now;
                    return;
                }
            }
        }
    }

    // --- EXISTING GAMEPAD MOVEMENT LOGIC ---
    let lx = applyDeadzone(gp.axes[0] || 0);
    let ly = applyDeadzone(gp.axes[1] || 0);
    const lmag = Math.hypot(lx, ly);
    if (lmag > 0) {
        joystickDirX = lx / lmag;
        joystickDirY = ly / lmag;
    } else {
        joystickDirX = 0;
        joystickDirY = 0;
    }
    
    let rx = applyDeadzone(gp.axes[2] || 0);
    let ry = applyDeadzone(gp.axes[3] || 0);
    const rmag = Math.hypot(rx, ry);
    if (rmag > 0) {
        aimDx = rx / rmag;
        aimDy = ry / rmag;
    } else {
        aimDx = 0;
        aimDy = 0;
    }

    const pressed = (i) => !!gp.buttons?.[i]?.pressed;
    if (pressed(7) && !gp._rTriggerLatch) {
    gp._rTriggerLatch = true;
    triggerDash(player);
} else if (!pressed(7)) gp._rTriggerLatch = false;
    
    if ((pressed(9) || pressed(1)) && !gp._pauseLatch) {
        gp._pauseLatch = true;
        if (gameActive && !gameOver) togglePause();
    } else if (!pressed(9) && !pressed(1)) gp._pauseLatch = false;
}

let isGamepadUpgradeMode = false;
let selectedUpgradeIndex = 0;
let lastGamepadUpdate = 0;
const GAMEPAD_INPUT_DELAY = 200; // milliseconds

function handleGamepadInput() {
    if (gamepadIndex == null) return;
    const gp = navigator.getGamepads?.()[gamepadIndex];
    if (!gp) return;

    // --- NEW UPGRADE MENU GAMEPAD LOGIC ---
    if (isGamepadUpgradeMode) {
        const now = Date.now();
        if (now - lastGamepadUpdate > GAMEPAD_INPUT_DELAY) {
            let moved = false;
            const prevIndex = selectedUpgradeIndex;
            const numOptions = document.querySelectorAll('.upgrade-card').length;
            
            // D-pad Right or Left Stick Right
            if (gp.buttons[15].pressed || gp.axes[0] > 0.5) {
                selectedUpgradeIndex = (selectedUpgradeIndex + 1) % numOptions;
                moved = true;
            } 
            // D-pad Left or Left Stick Left
            else if (gp.buttons[14].pressed || gp.axes[0] < -0.5) {
                selectedUpgradeIndex = (selectedUpgradeIndex - 1 + numOptions) % numOptions;
                moved = true;
            }
            
            // D-pad Up/Down (for wrapping)
            const cardsPerRow = 3; 
            if (gp.buttons[12].pressed) {
                selectedUpgradeIndex = Math.max(0, selectedUpgradeIndex - cardsPerRow);
                moved = true;
            } else if (gp.buttons[13].pressed) {
                selectedUpgradeIndex = Math.min(numOptions - 1, selectedUpgradeIndex + cardsPerRow);
                moved = true;
            }

            if (moved && prevIndex !== selectedUpgradeIndex) {
                const prevCard = document.querySelectorAll('.upgrade-card')[prevIndex];
                if (prevCard) {
                    prevCard.classList.remove('selected');
                }
                const newCard = document.querySelectorAll('.upgrade-card')[selectedUpgradeIndex];
                if (newCard) {
                    newCard.classList.add('selected');
                    playUISound('uiClick');
                    vibrate(10);
                }
                lastGamepadUpdate = now;
            }
            
            // Check for confirmation button (e.g., A/X button)
            if (gp.buttons[0].pressed) {
                const selectedCard = document.querySelectorAll('.upgrade-card')[selectedUpgradeIndex];
                if (selectedCard) {
                    selectedCard.querySelector('button').click();
                    isGamepadUpgradeMode = false;
                    lastGamepadUpdate = now;
                    return;
                }
            }
        }
    }
    
    // --- EXISTING GAMEPAD MOVEMENT LOGIC ---
    let lx = applyDeadzone(gp.axes[0] || 0);
    let ly = applyDeadzone(gp.axes[1] || 0);
    const lmag = Math.hypot(lx, ly);
    if (lmag > 0) {
        joystickDirX = lx / lmag;
        joystickDirY = ly / lmag;
    } else {
        joystickDirX = 0;
        joystickDirY = 0;
    }

    let rx = applyDeadzone(gp.axes[2] || 0);
    let ry = applyDeadzone(gp.axes[3] || 0);
    const rmag = Math.hypot(rx, ry);
    if (rmag > 0) {
        aimDx = rx / rmag;
        aimDy = ry / rmag;
    } else {
        aimDx = 0;
        aimDy = 0;
    }

    const pressed = (i) => !!gp.buttons?.[i]?.pressed;
    if (pressed(7) && !gp._rTriggerLatch) {
    gp._rTriggerLatch = true;
    triggerDash(player);
} else if (!pressed(7)) gp._rTriggerLatch = false;
    
    if ((pressed(9) || pressed(1)) && !gp._pauseLatch) {
        gp._pauseLatch = true;
        if (gameActive && !gameOver) togglePause();
    } else if (!pressed(9) && !pressed(1)) gp._pauseLatch = false;
}

        let joystickDirX = 0; let joystickDirY = 0;
        let aimDx = 0; let aimDy = 0;
        let lastMoveStickTapTime = 0;
        let lastFireStickTapTime = 0;
        let lastMoveStickDirection = {x: 0, y: 0};
        
        let fireRateBoostActive = false;
        let fireRateBoostEndTime = 0;
        const FIRE_RATE_BOOST_DURATION = 3000;
        
        let mouseX = 0; let mouseY = 0;
        let isMouseInCanvas = false;

        const keys = {};
        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if(gameActive && !gameOver) { togglePause(); }
                return;
            }
             if (e.key === 'o') {
                triggerDash(player2);

            }
            if (keys['-'] && keys['=']) { // Secret coin cheat
                playerData.currency += 5000;
                savePlayerData();
                floatingTexts.push({ text: "+5000 Coins!", x: player.x, y: player.y - player.size, startTime: Date.now(), duration: 2000, color: '#FFD700' });
            }
            
            if (e.key === 'Insert' && gameActive && !gameOver && !gamePaused) {
                if (player.lives > 1 && (!player2 || !player2.active)) {
                    player.lives--;
                    updateUIStats();
                    player2 = {
                        active: true, x: player.x, y: player.y, size: 35, speed: 1.4,
                        facing: 'down', stepPhase: 0, gunAngle: -Math.PI / 2,
                        lastFireTime: 0, fireInterval: 400,
                        isDashing: false, dashEndTime: 0, lastDashTime: 0, dashCooldown: 6000,
                        spinStartTime: null, // For spin animation
                        spinDirection: 0, // For spin animation
                        dx: 0, dy: 0 // Add movement direction for gamepad
                    };
                    floatingTexts.push({
                        text: "Player 2 has joined!", x: player.x, y: player.y - player.size,
                        startTime: Date.now(), duration: 2000, color: '#FFFF00'
                    });
                }
            }
            keys[e.key] = true;
            if (e.key === 'ArrowUp') aimDy = -1;
            else if (e.key === 'ArrowDown') aimDy = 1;
            else if (e.key === 'ArrowLeft') aimDx = -1;
            else if (e.key === 'ArrowRight') aimDx = 1;
        });

        window.addEventListener('keyup', (e) => {
            keys[e.key] = false;
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                if (keys['ArrowDown']) { aimDy = 1; } else if (keys['ArrowUp']) { aimDy = -1; } else { aimDy = 0; }
                if (keys['ArrowRight']) { aimDx = 1; } else if (keys['ArrowLeft']) { aimDx = -1; } else { aimDx = 0; }
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (gamePaused || gameOver || !gameActive) return;
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
            const playerScreenX = player.x - cameraOffsetX;
            const playerScreenY = player.y - cameraOffsetY;
            aimDx = mouseX - playerScreenX;
            aimDy = mouseY - playerScreenY;
        });

        canvas.addEventListener('mouseenter', () => { if (gameActive && !document.body.classList.contains('is-mobile')) { isMouseInCanvas = true; } });
        canvas.addEventListener('mouseleave', () => { if (gameActive) { isMouseInCanvas = false; } });
        canvas.addEventListener('mousedown', (e) => {
    // e.button === 0 corresponds to the left mouse button
    if (e.button === 0 && gameActive && !gamePaused && !gameOver) {
        triggerDash(player);
    }
});
        
        function vibrate(duration) { if (isMobileDevice && navigator.vibrate) { navigator.vibrate(duration); } }
        function playSound(name) { if (gameActive && !gamePaused && audioPlayers[name]) { audioPlayers[name].start(getSafeToneTime()); } }
        function playUISound(name) { if (audioPlayers[name]) { audioPlayers[name].start(getSafeToneTime()); } }
        
        audioPlayers['playerScream'].volume.value = -10;
        const swordSwingSynth = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.01, release: 0.05 } }).toDestination();
        const eyeProjectileHitSynth = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.001, decay: 0.08, sustain: 0.01, release: 0.1 } }).toDestination();
        const bombExplosionSynth = new Tone.Synth({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.2 } }).toDestination();
        
        const backgroundMusicPaths = [ 
            'audio/background_music.mp3',  'audio/background_music2.mp3', 
            'audio/background_music3.mp3', 'audio/background_music4.mp3', 'audio/background_music5.mp3',
            'audio/background_music6.mp3', 'audio/background_music7.mp3', 'audio/background_music8.mp3',
            'audio/background_music9.mp3', 'audio/background_music10.mp3', 'audio/background_music11.mp3', 
        ];
        let currentBGMPlayer = null;

        function startBGM() { if (currentBGMPlayer && currentBGMPlayer.state !== 'started') { currentBGMPlayer.start(); } Tone.Transport.start(); }
        function stopBGM() { if (currentBGMPlayer) { currentBGMPlayer.stop(); } Tone.Transport.stop(); }
        
        function startMainMenuBGM() {
            if (Tone.context.state !== 'running') {
                Tone.start().then(() => {
                    if (audioPlayers['mainMenu'] && audioPlayers['mainMenu'].state !== 'started') { stopBGM(); audioPlayers['mainMenu'].start(); }
                });
            } else {
                if (audioPlayers['mainMenu'] && audioPlayers['mainMenu'].state !== 'started') { stopBGM(); audioPlayers['mainMenu'].start(); }
            }
        }

        function stopMainMenuBGM() { if (audioPlayers['mainMenu'] && audioPlayers['mainMenu'].state === 'started') { audioPlayers['mainMenu'].stop(); } }
        function playBombExplosionSound() { if (gameActive && !gamePaused) bombExplosionSynth.triggerAttackRelease("F3", "8n", getSafeToneTime()); } 
        function playSwordSwingSound() { if (gameActive && !gamePaused) swordSwingSynth.triggerAttackRelease("D4", "16n", getSafeToneTime()); } 
        function playEyeProjectileHitSound() { if (gameActive && !gamePaused) eyeProjectileHitSynth.triggerAttackRelease("G2", "16n", getSafeToneTime()); }
        
        function resizeCanvas() {
            canvas.width = 1125;
            canvas.height = 676;
            player.x = Math.max(player.size / 2, Math.min(WORLD_WIDTH - player.size / 2, player.x));
            player.y = Math.max(player.size / 2, Math.min(WORLD_HEIGHT - player.size / 2, player.y));
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let activeTouches = {};

document.body.addEventListener('touchstart', (e) => {
    if (gameGuideModal.style.display === 'flex' || achievementsModal.style.display === 'flex' || cheatsModal.style.display === 'flex') return;
    if (!gameActive || gamePaused || gameOver) return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const moveRect = movementStickBase.getBoundingClientRect();
        const fireRect = firestickBase.getBoundingClientRect();

        // This is the corrected block for the LEFT (MOVEMENT) stick
        if (touch.clientX > moveRect.left && touch.clientX < moveRect.right && touch.clientY > moveRect.top && touch.clientY < moveRect.bottom) {
            if (!activeTouches[touch.identifier]) {
                activeTouches[touch.identifier] = {
                    type: 'movement'
                };

                // The old dodge logic has been completely removed from here.

                const {
                    dx,
                    dy
                } = getJoystickInput(touch.clientX, touch.clientY, movementStickBase, movementStickCap);
                const magnitude = Math.hypot(dx, dy);
                if (magnitude > 0) {
                    joystickDirX = dx / magnitude;
                    joystickDirY = dy / magnitude;
                }
            }
        }
        // This is the corrected block for the RIGHT (AIMING) stick
        else if (touch.clientX > fireRect.left && touch.clientX < fireRect.right && touch.clientY > fireRect.top && touch.clientY < fireRect.bottom) {
            if (!activeTouches[touch.identifier]) {
                activeTouches[touch.identifier] = {
                    type: 'fire'
                };

                // --- DODGE LOGIC IS NOW HERE ---
                const now = Date.now();
                if (now - lastFireStickTapTime < 300) {
                    triggerDash(player);
                }
                lastFireStickTapTime = now;
                // --- END OF DODGE LOGIC ---

                const {
                    dx,
                    dy
                } = getJoystickInput(touch.clientX, touch.clientY, firestickBase, firestickCap);
                aimDx = dx;
                aimDy = dy;
            }
        }
    }
}, {
    passive: false
});

        document.body.addEventListener('touchmove', (e) => {
            if (gameGuideModal.style.display === 'flex' || achievementsModal.style.display === 'flex' || cheatsModal.style.display === 'flex') return;
            if (!gameActive || gamePaused || gameOver) return;
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const touchInfo = activeTouches[touch.identifier];
                if (touchInfo) {
                    if (touchInfo.type === 'movement') {
                        const { dx, dy } = getJoystickInput(touch.clientX, touch.clientY, movementStickBase, movementStickCap);
                        const magnitude = Math.hypot(dx, dy);
                        if (magnitude > 0) { joystickDirX = dx / magnitude; joystickDirY = dy / magnitude; } 
                        else { joystickDirX = 0; joystickDirY = 0; }
                    } else if (touchInfo.type === 'fire') {
                        const { dx, dy } = getJoystickInput(touch.clientX, touch.clientY, firestickBase, firestickCap);
                        aimDx = dx; aimDy = dy;
                    }
                }
            }
        }, { passive: false });

        document.body.addEventListener('touchend', (e) => {
            if (gameGuideModal.style.display === 'flex' || achievementsModal.style.display === 'flex' || cheatsModal.style.display === 'flex') return;
            if (!gameActive || gamePaused || gameOver) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const touchInfo = activeTouches[touch.identifier];
                if (touchInfo) {
                    if (touchInfo.type === 'movement') { if (movementStickCap) movementStickCap.style.transform = 'translate(0, 0)'; joystickDirX = 0; joystickDirY = 0; } 
                    else if (touchInfo.type === 'fire') { if (firestickCap) firestickCap.style.transform = 'translate(0, 0)'; aimDx = 0; aimDy = 0; }
                    delete activeTouches[touch.identifier];
                }
            }
        });

        document.body.addEventListener('touchcancel', (e) => {
            if (gameGuideModal.style.display === 'flex' || achievementsModal.style.display === 'flex' || cheatsModal.style.display === 'flex') return;
            if (!gameActive || gamePaused || gameOver) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const touchInfo = activeTouches[touch.identifier];
                if (touchInfo) {
                    if (touchInfo.type === 'movement') { if (movementStickCap) movementStickCap.style.transform = 'translate(0, 0)'; joystickDirX = 0; joystickDirY = 0; } 
                    else if (touchInfo.type === 'fire') { if (firestickCap) firestickCap.style.transform = 'translate(0, 0)'; aimDx = 0; aimDy = 0; }
                    delete activeTouches[touch.identifier];
                }
            }
        });

        let mouseActiveStick = null;

        document.body.addEventListener('mousedown', (e) => {
            if (gameGuideModal.style.display === 'flex' || achievementsModal.style.display === 'flex' || cheatsModal.style.display === 'flex') return;
            if (!gameActive || gamePaused || gameOver) return;
            const moveRect = movementStickBase.getBoundingClientRect();
            const fireRect = firestickBase.getBoundingClientRect();
            if (e.clientX > moveRect.left && e.clientX < moveRect.right && e.clientY > moveRect.top && e.clientY < moveRect.bottom) {
                mouseActiveStick = 'movement';
                activeTouches['mouse'] = { type: 'movement' };
                const { dx, dy } = getJoystickInput(e.clientX, e.clientY, movementStickBase, movementStickCap);
                const magnitude = Math.hypot(dx, dy);
                if (magnitude > 0) { joystickDirX = dx / magnitude; joystickDirY = dy / magnitude; }
            } else if (e.clientX > fireRect.left && e.clientX < fireRect.right && e.clientY > fireRect.top && e.clientY < fireRect.bottom) {
                mouseActiveStick = 'fire';
                activeTouches['mouse'] = { type: 'fire' };
                const { dx, dy } = getJoystickInput(e.clientX, e.clientY, firestickBase, firestickCap);
                aimDx = dx; aimDy = dy;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (gameGuideModal.style.display === 'flex' || achievementsModal.style.display === 'flex' || cheatsModal.style.display === 'flex') return;
            if (!gameActive || gamePaused || gameOver) return;
            if (mouseActiveStick) {
                if (mouseActiveStick === 'movement') {
                    const { dx, dy } = getJoystickInput(e.clientX, e.clientY, movementStickBase, movementStickCap);
                     const magnitude = Math.hypot(dx, dy);
                    if (magnitude > 0) { joystickDirX = dx / magnitude; joystickDirY = dy / magnitude; } 
                    else { joystickDirX = 0; joystickDirY = 0; }
                } else if (mouseActiveStick === 'fire') {
                    const { dx, dy } = getJoystickInput(e.clientX, e.clientY, firestickBase, firestickCap);
                    aimDx = dx; aimDy = dy;
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (gameGuideModal.style.display === 'flex' || achievementsModal.style.display === 'flex' || cheatsModal.style.display === 'flex') return;
            if (!gameActive || gamePaused || gameOver) return;
            if (mouseActiveStick === 'movement') { if (movementStickCap) movementStickCap.style.transform = 'translate(0, 0)'; joystickDirX = 0; joystickDirY = 0; } 
            else if (mouseActiveStick === 'fire') { if (firestickCap) firestickCap.style.transform = 'translate(0, 0)'; aimDx = 0; aimDy = 0; }
            mouseActiveStick = null;
            delete activeTouches['mouse'];
        });

        restartButton.addEventListener('click', () => {
            vibrate(10);
            playUISound('uiClick');
            showDifficultyScreen();
        });

        