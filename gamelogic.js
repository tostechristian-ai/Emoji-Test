const CHARACTERS = {
            cowboy: {
                id: 'cowboy',
                name: 'The Cowboy',
                emoji: '🤠',
                description: 'The original survivor. Balanced and reliable.',
                perk: 'Standard bullets and dash.',
                unlockCondition: { type: 'start' },
                shootLogic: null, // Null means use default
                dodgeLogic: null, // Null means use default
            },
            skull: {
                id: 'skull',
                name: 'The Skeleton',
                emoji: '💀',
                description: 'A bony warrior who uses its own body as a weapon.',
                perk: 'Shoots bones. Dodge fires a nova of bones.',
                unlockCondition: { type: 'achievement', id: 'slayer' },
                shootLogic: null, // We'll handle this with a cheat check for now
                dodgeLogic: null, 
            }
        };

        const ENEMY_CONFIGS = {
            '🧟': { size: 17, baseHealth: 1, speedMultiplier: 1, type: 'pursuer', minLevel: 1 },
            '💀': { size: 20, baseHealth: 2, speedMultiplier: 1.15, type: 'pursuer', minLevel: 5 },
            '🌀': { size: 22, baseHealth: 4, speedMultiplier: 0.3, type: 'snail', minLevel: 4, initialProps: () => ({ lastPuddleSpawnTime: Date.now(), directionAngle: Math.random() * 2 * Math.PI }) },
            '🦟': { size: 15, baseHealth: 2, speedMultiplier: 1.5, type: 'mosquito', minLevel: 7, initialProps: () => ({ lastDirectionUpdateTime: Date.now(), currentMosquitoDirection: null, lastPuddleSpawnTime: Date.now() }) },
            '🦇': { size: 25 * 0.85, baseHealth: 3, speedMultiplier: 2, type: 'bat', minLevel: 10, initialProps: () => ({ isPaused: false, pauseTimer: 0, pauseDuration: 30, moveDuration: 30 }) },
            '😈': { size: 20 * 0.8, baseHealth: 3, speedMultiplier: 1.84, type: 'devil', minLevel: 12, initialProps: () => ({ moveAxis: 'x', lastAxisSwapTime: Date.now() }) }, 
            '👹': { size: 28 * 0.7, baseHealth: 4, speedMultiplier: 1.8975, type: 'demon', minLevel: 15, initialProps: () => ({ moveState: 'following', lastStateChangeTime: Date.now(), randomDx: 0, randomDy: 0 }) },
            '👻': { size: 22, baseHealth: 4, speedMultiplier: 1.2, type: 'ghost', minLevel: 12, initialProps: () => ({ isVisible: true, lastPhaseChange: Date.now(), phaseDuration: 3000, bobOffset: 0 }) },
            '👁️': { size: 25 * 0.6, baseHealth: 4, speedMultiplier: 1.1 * 1.1, type: 'eye', minLevel: 20, initialProps: () => ({ lastEyeProjectileTime: Date.now() }) },
            '🧟‍♀️': { size: 17 * 1.75, baseHealth: 6, speedMultiplier: 0.5, type: 'pursuer', minLevel: 25 },
            '🧛‍♀️': { size: 20, baseHealth: 5, speedMultiplier: 1.2, type: 'vampire', minLevel: 30 }
        };

        const BOSS_HEALTH = 20;
        const BOSS_XP_DROP = 20;
        const BOSS_XP_EMOJI = '🎇';
        const BOSS_SPAWN_INTERVAL_LEVELS = 11;
        const BOSSED_ENEMY_TYPES = ['🧟', SKULL_EMOJI, DEMON_EMOJI, FEMALE_ZOMBIE_EMOJI, BAT_EMOJI, MOSQUITO_EMOJI];
        let lastBossLevelSpawned = 0;
        function createEnemy(x_pos, y_pos, type) { 
            let x, y, enemyEmoji;
            if (x_pos !== undefined && y_pos !== undefined && type !== undefined) {
                x = x_pos; y = y_pos; enemyEmoji = type;
            } else {
                const spawnOffset = 29;
                const edge = Math.floor(Math.random() * 4);
                switch (edge) {
                    case 0: x = Math.random() * WORLD_WIDTH; y = -spawnOffset; break;
                    case 1: x = WORLD_WIDTH + spawnOffset; y = Math.random() * WORLD_HEIGHT; break;
                    case 2: x = Math.random() * WORLD_WIDTH; y = WORLD_HEIGHT + spawnOffset; break;
                    case 3: x = -spawnOffset; y = Math.random() * WORLD_HEIGHT; break;
                }
                const eligibleEnemyEmojis = Object.keys(ENEMY_CONFIGS).filter(emoji => ENEMY_CONFIGS[emoji].minLevel <= player.level);
                if (eligibleEnemyEmojis.length === 0) return;
                enemyEmoji = eligibleEnemyEmojis[Math.floor(Math.random() * eligibleEnemyEmojis.length)];
            }
            
            let difficultySpeedMultiplier = (currentDifficulty === 'easy') ? 0.9 : (currentDifficulty === 'medium') ? 1.35 : 1.75; 
            let levelSpeedMultiplier = (currentDifficulty === 'hard') ? (1 + 0.025 * (player.level - 1)) : (1 + 0.02 * (player.level - 1)); 
            const currentBaseEnemySpeed = baseEnemySpeed * difficultySpeedMultiplier * levelSpeedMultiplier;
            
            const config = ENEMY_CONFIGS[enemyEmoji];
            const newEnemy = { 
                x, y, size: config.size, emoji: enemyEmoji, speed: currentBaseEnemySpeed * config.speedMultiplier, 
                health: config.baseHealth, isHit: false, isHitByOrbiter: false, isHitByCircle: false, 
                isFrozen: false, freezeEndTime: 0, originalSpeed: currentBaseEnemySpeed * config.speedMultiplier, 
                isSlowedByPuddle: false, isBoss: false, isHitByAxe: false,
                isIgnited: false, ignitionEndTime: 0, lastIgnitionDamageTime: 0
                
            };
            if (config.initialProps) Object.assign(newEnemy, config.initialProps());
            enemies.push(newEnemy);
        }

        function handleEnemyDeath(enemy, explosionId = null) {
            if (enemy.isHit) return;
            enemy.isHit = true;
            enemiesDefeatedCount++;
            player.coins++; // Grant one coin per kill
            if (Math.random() < boxDropChance) {
            createPickup(enemy.x, enemy.y, '📦', BOX_SIZE, 0);
        }
            // Achievement Tracking
            runStats.killsThisRun++; // FIX 1: Corrected variable name
            playerStats.totalKills++; // FIX 2: Added missing total kills counter
            if(enemy.isBoss) { runStats.bossesKilledThisRun++; playerStats.totalBossesKilled++; }
            if(enemy.emoji === '🧛‍♀️') runStats.vampiresKilledThisRun++;
            if(explosionId) {
                if(!runStats.killsPerExplosion[explosionId]) runStats.killsPerExplosion[explosionId] = 0;
                runStats.killsPerExplosion[explosionId]++;
            }
            checkAchievements();

            createBloodPuddle(enemy.x, enemy.y, enemy.size);
            playSound('enemyDeath');

            if (enemy.isBoss) {
                createPickup(enemy.x, enemy.y, BOSS_XP_EMOJI, enemy.size / 2, BOSS_XP_DROP);
            } else if (enemy.emoji === VAMPIRE_EMOJI || enemy.emoji === FEMALE_ZOMBIE_EMOJI) {
                createPickup(enemy.x, enemy.y, '💎', DIAMOND_SIZE, 5);
            } else if (enemy.emoji === '🌀') {
                createPickup(enemy.x, enemy.y, DIAMOND_EMOJI, DIAMOND_SIZE, DIAMOND_XP_VALUE);
            } else if (enemy.emoji === MOSQUITO_EMOJI) {
                createPickup(enemy.x, enemy.y, DIAMOND_EMOJI, DIAMOND_SIZE, DIAMOND_XP_VALUE);
            } else if (Math.random() < appleDropChance) {
                createAppleItem(enemy.x, enemy.y);
            } else {
                if (enemy.emoji === '🧟') createPickup(enemy.x, enemy.y, COIN_EMOJI, COIN_SIZE, COIN_XP_VALUE);
                else if (enemy.emoji === '💀') createPickup(enemy.x, enemy.y, DIAMOND_EMOJI, DIAMOND_SIZE, DIAMOND_XP_VALUE);
                else if (enemy.emoji === BAT_EMOJI || enemy.emoji === '😈') createPickup(enemy.x, enemy.y, RING_SYMBOL_EMOJI, RING_SYMBOL_SIZE, RING_SYMBOL_XP_VALUE);
                else if (enemy.emoji === DEMON_EMOJI || enemy.emoji === EYE_EMOJI || enemy.emoji === '👻') createPickup(enemy.x, enemy.y, DEMON_XP_EMOJI, RING_SYMBOL_SIZE, DEMON_XP_VALUE);
            }

            if (Math.random() < boxDropChance) { createPickup(enemy.x, enemy.y, 'box', BOX_SIZE, 0); }
            score += 10;
        }

function createBoss() {
            let x, y;
            const spawnOffset = 29;
            const edge = Math.floor(Math.random() * 4);
            switch (edge) {
                case 0: x = Math.random() * WORLD_WIDTH; y = -spawnOffset; break;
                case 1: x = WORLD_WIDTH + spawnOffset; y = Math.random() * WORLD_HEIGHT; break;
                case 2: x = Math.random() * WORLD_WIDTH; y = WORLD_HEIGHT + spawnOffset; break;
                case 3: x = -spawnOffset; y = Math.random() * WORLD_HEIGHT; break;
            }
            const mimickedEmoji = BOSSED_ENEMY_TYPES[Math.floor(Math.random() * BOSSED_ENEMY_TYPES.length)];
            const config = ENEMY_CONFIGS[mimickedEmoji];
            let difficultySpeedMultiplier = (currentDifficulty === 'easy') ? 0.9 : (currentDifficulty === 'medium') ? 1.35 : 1.75; 
            const currentBaseEnemySpeed = baseEnemySpeed * difficultySpeedMultiplier * (1 + 0.02 * (player.level - 1));
            const bossSpeed = currentBaseEnemySpeed * config.speedMultiplier * 0.75;
            const bossSize = config.size * 2;
            const boss = { 
                x, y, size: bossSize, emoji: mimickedEmoji, speed: bossSpeed, health: BOSS_HEALTH, 
                isBoss: true, mimics: mimickedEmoji, isHit: false, isHitByOrbiter: false, isHitByCircle: false, 
                isFrozen: false, freezeEndTime: 0, originalSpeed: bossSpeed, isSlowedByPuddle: false,
                isHitByAxe: false, isIgnited: false, ignitionEndTime: 0, lastIgnitionDamageTime: 0
            };
            if (config.initialProps) Object.assign(boss, config.initialProps());
            enemies.push(boss);
            console.log(`Spawned a boss mimicking ${mimickedEmoji} at level ${player.level}`);
        }

        function createPickup(x, y, type, size, xpValue) {
            if (x === -1 || y === -1) { x = Math.random() * WORLD_WIDTH; y = Math.random() * WORLD_HEIGHT; }
            pickupItems.push({ x, y, size, type, xpValue, glimmerStartTime: Date.now() + Math.random() * 2000 });
        }
        
        function spawnMerchant(x, y) {
    merchants.push({
        x: x,
        y: y,
        size: 40 // wizard size on screen
    });
}

        function createAppleItem(x, y) {
            appleItems.push({ x, y, size: APPLE_ITEM_SIZE, type: 'apple', spawnTime: Date.now(), lifetime: APPLE_LIFETIME, glimmerStartTime: Date.now() + Math.random() * 2000 });
        }

        function getJoystickInput(touchClientX, touchClientY, baseElement, capElement) {
            const rect = baseElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            let dx = touchClientX - centerX;
            let dy = touchClientY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > joystickRadius) {
                const angle = Math.atan2(dy, dx);
                dx = Math.cos(angle) * joystickRadius;
                dy = Math.sin(angle) * joystickRadius;
            }
            if (capElement) capElement.style.transform = `translate(${dx}px, ${dy}px)`;
            return { dx, dy, distance };
        }

        // OPTIMIZATION: Rewritten createWeapon to use the object pool
        function createWeapon(shooter = player, customAngle = null) {
            let weaponAngle;
            if (customAngle !== null) {
                weaponAngle = customAngle;
            } else if (autoAimActive && enemies.length > 0) {
                 let closestEnemy = null; let minDistance = Infinity;
                enemies.forEach(enemy => {
                    const distSq = (shooter.x - enemy.x) ** 2 + (shooter.y - enemy.y) ** 2;
                    if (distSq < minDistance) { minDistance = distSq; closestEnemy = enemy; }
                });
                if (closestEnemy) { weaponAngle = Math.atan2(closestEnemy.y - shooter.y, closestEnemy.x - shooter.x); } 
                else { weaponAngle = shooter.rotationAngle; }
            }
            else if (aimDx !== 0 || aimDy !== 0) { weaponAngle = Math.atan2(aimDy, aimDx); } 
            else {
                let closestEnemy = null; let minDistance = Infinity;
                enemies.forEach(enemy => {
                    const distSq = (shooter.x - enemy.x) ** 2 + (shooter.y - enemy.y) ** 2;
                    if (distSq < minDistance) { minDistance = distSq; closestEnemy = enemy; }
                });
                if (closestEnemy) { weaponAngle = Math.atan2(closestEnemy.y - shooter.y, closestEnemy.x - shooter.x); } 
                else { weaponAngle = shooter.rotationAngle; }
            }
            
            const fireWeaponFromPool = (angle) => {
                for(const weapon of weaponPool) {
                    if(!weapon.active) {
                        // Found a dead weapon, reuse it!
                        weapon.x = shooter.x;
                        weapon.y = shooter.y;
                        weapon.size = shotgunBlastActive ? 30 * player.projectileSizeMultiplier : 38 * player.projectileSizeMultiplier * (rocketLauncherActive ? 2 : 1);
                        weapon.speed = 5.04 * player.projectileSpeedMultiplier;
                        weapon.angle = angle;
                        weapon.dx = Math.cos(angle) * weapon.speed;
                        weapon.dy = Math.sin(angle) * weapon.speed;
                        weapon.lifetime = Date.now() + 2000;
                        weapon.hitsLeft = rocketLauncherActive ? 3 : (ricochetActive ? 2 : 1);
                        weapon.hitEnemies.length = 0; // Clear the hit list
                        weapon.active = true;
                        return; // Exit after finding one
                    }
                }
            };

            let angles = [weaponAngle];
            if (shotgunBlastActive && shooter === player) {
                angles = [];
                const projectileCount = 8; const spreadAngle = Math.PI / 8;
                for (let i = 0; i < projectileCount; i++) {
                    const angleOffset = (Math.random() - 0.5) * spreadAngle;
                    angles.push(weaponAngle + angleOffset);
                }
            } else if (vShapeProjectileLevel > 0 && shooter === player) {
                const projectilesToEmit = vShapeProjectileLevel + 1;
                angles = [];
                const totalSpreadAngle = V_SHAPE_INCREMENT_ANGLE * (projectilesToEmit - 1);
                const halfTotalSpread = totalSpreadAngle / 2;
                for (let i = 0; i < projectilesToEmit; i++) {
                    angles.push(weaponAngle - halfTotalSpread + i * V_SHAPE_INCREMENT_ANGLE);
                }
            }
            
            angles.forEach(angle => fireWeaponFromPool(angle));
            if(dualGunActive && shooter === player) { angles.forEach(angle => fireWeaponFromPool(angle + Math.PI)); }

            if (shooter === player) {
                const elementsToShake = [gameContainer, gameStats, pauseButton];
                elementsToShake.forEach(el => {
                    if (el) {
                        el.classList.remove('ui-shake-active');
                        void el.offsetWidth;
                        el.classList.add('ui-shake-active');
                        el.addEventListener('animationend', () => { el.classList.remove('ui-shake-active'); }, { once: true });
                    }
                });
                 vibrate(10);
            }
           
            playSound('playerShoot');
        }

        function createPlayer2Weapon() {
            if (!player2 || !player2.active) return;
            
            // Use the weapon pool for Player 2 as well
            for(const weapon of weaponPool) {
                if(!weapon.active) {
                    weapon.x = player2.x;
                    weapon.y = player2.y;
                    weapon.size = 38;
                    weapon.speed = 5.04;
                    weapon.angle = player2.gunAngle;
                    weapon.dx = Math.cos(player2.gunAngle) * weapon.speed;
                    weapon.dy = Math.sin(player2.gunAngle) * weapon.speed;
                    weapon.lifetime = Date.now() + 2000;
                    weapon.hitsLeft = 1;
                    weapon.hitEnemies.length = 0;
                    weapon.active = true;
                    break; // Only fire one bullet
                }
            }
            playSound('playerShoot');
        }

        function createBloodSplatter(x, y) {
            const particleCount = 6;
            const speed = 2 + Math.random() * 2;
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                bloodSplatters.push({
                    x: x, y: y, dx: Math.cos(angle) * speed + (Math.random() - 0.5),
                    dy: Math.sin(angle) * speed + (Math.random() - 0.5),
                    size: 2 + Math.random() * 3, spawnTime: Date.now(), lifetime: 800 + Math.random() * 400
                });
            }
        }

        function createBloodPuddle(x, y, size) {
            if (!sprites.bloodPuddle) return;
            bloodPuddles.push({
                x: x, y: y, initialSize: size * 1.5,
                spawnTime: Date.now(), rotation: Math.random() * Math.PI * 2, lifetime: 10000
            });
        }

        function levelUp() {
            gamePaused = true;
            player.level++;
            checkAchievements();
            player.xp -= player.xpToNextLevel;
            if (player.xp < 0) player.xp = 0;
            if(cheats.instantLevelUp) player.xp = player.xpToNextLevel;
            else player.xpToNextLevel += 1; 
            Tone.Transport.bpm.value = 120 * (player.level >= 30 ? 2.5 : player.level >= 20 ? 2 : player.level >= 10 ? 1.5 : 1);
            updateUIStats();
            vibrate(50);
            playSound('levelUp');
            showUpgradeMenu();
        }

        function showUpgradeMenu() {
            if (upgradeOptionsContainer) upgradeOptionsContainer.innerHTML = '';
            let availableUpgrades = [...UPGRADE_OPTIONS];
            let selectedChoices = [];
            let choiceCount = cheats.hardcoreMode ? 2 : 3;
            for (let i = 0; i < choiceCount; i++) {
                if (availableUpgrades.length === 0) break;
                const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
                selectedChoices.push(availableUpgrades.splice(randomIndex, 1)[0]);
            }
            selectedChoices.forEach(upgrade => {
                const upgradeCard = document.createElement('div');
                upgradeCard.classList.add('upgrade-card');
                const borderColor = UPGRADE_BORDER_COLORS[upgrade.type] || "#66bb6a";
                upgradeCard.style.border = `2.5px solid ${borderColor}`;
                upgradeCard.dataset.borderColor = borderColor;
                upgradeCard.innerHTML = `
                    <div class="upgrade-icon">${upgrade.icon}</div>
                    <h3>${upgrade.name}</h3>
                    <p>${upgrade.desc}</p>
                    <button>Choose</button>
                `;
                upgradeCard.querySelector('button').onclick = () => { applyUpgrade(upgrade); vibrate(10); };
                upgradeCard.addEventListener('click', () => {
             // De-select all cards first
             document.querySelectorAll('.upgrade-card').forEach(card => card.classList.remove('selected'));
             // Select the clicked card
             upgradeCard.classList.add('selected');
             // Set the selected index to the clicked card's index
             selectedUpgradeIndex = index;
             // Vibrate and play sound
             vibrate(10);
             playUISound('uiClick');
        });
                upgradeCard.addEventListener('mouseover', () => playUISound('uiClick'));
                if (upgradeOptionsContainer) upgradeOptionsContainer.appendChild(upgradeCard);
            });
            if (upgradeMenu) {
                levelUpBoxImage.classList.add('animate');
                levelUpBoxImage.style.display = 'block';
                isGamepadUpgradeMode = true;
selectedUpgradeIndex = 0; // Start with the first card selected
// Apply the 'selected' class to the first card
const firstCard = upgradeOptionsContainer.querySelector('.upgrade-card');
if (firstCard) {
    firstCard.classList.add('selected');
}
                upgradeMenu.style.display = 'flex';
            }
        }

        function applyUpgrade(upgrade) {
            playUISound('levelUpSelect');
            if (upgrade.type === "speed") { player.speed *= (1 + upgrade.value); player.originalPlayerSpeed = player.speed; } 
            else if (upgrade.type === "fireRate") { weaponFireInterval = Math.max(50, weaponFireInterval * (1 - upgrade.value)); } 
            else if (upgrade.type === "magnetRadius") { player.magnetRadius *= (1 + upgrade.value); } 
            else if (upgrade.type === "damage") { player.damageMultiplier *= (1 + upgrade.value); } 
            else if (upgrade.type === "projectileSpeed") { player.projectileSpeedMultiplier *= (1 + upgrade.value); } 
            else if (upgrade.type === "knockback") { player.knockbackStrength += upgrade.value; } 
            else if (upgrade.type === "luck") { boxDropChance += upgrade.value; appleDropChance += upgrade.value; }
            
            if (player.upgradeLevels.hasOwnProperty(upgrade.type)) { player.upgradeLevels[upgrade.type]++; }
            updateUpgradeStatsUI(); 

            if (upgradeMenu) {
                levelUpBoxImage.classList.remove('animate');
                levelUpBoxImage.style.display = 'none';
                upgradeMenu.style.display = 'none';
            }
            gamePaused = false;
            isGamepadUpgradeMode = false;
            joystickDirX = 0; joystickDirY = 0; aimDx = 0; aimDy = 0;
            if (movementStickCap) movementStickCap.style.transform = 'translate(0, 0)';
            if (firestickCap) firestickCap.style.transform = 'translate(0, 0)';
        }
        
        function triggerAnimation(element, animationClass, color = '#FFFFFF') {
            if (!element) return;
            element.classList.add(animationClass);
            if (color !== '#FFFFFF') {
                element.style.color = color;
                element.style.textShadow = `0 0 8px ${color}`;
            }
            element.addEventListener('animationend', () => {
                element.classList.remove(animationClass);
                element.style.color = '';
                element.style.textShadow = '';
            }, { once: true });
        }

        function updateUIStats() {
            const oldLevel = currentLevelSpan.textContent;
            const newLevel = player.level;
            if (oldLevel !== newLevel.toString()) {
                currentLevelSpan.textContent = newLevel;
                triggerAnimation(currentLevelSpan, 'stat-updated');
            }

            const oldLives = playerLivesIcon.innerHTML;
            let newLivesHTML = '';
            if (player.lives > 0) {
                newLivesHTML = '<span class="pulsating-heart">❤️</span>';
                newLivesHTML += '❤️'.repeat(player.lives - 1);
            }
            if (oldLives !== newLivesHTML) { playerLivesIcon.innerHTML = newLivesHTML; }

            const oldXp = currentXpSpan.textContent;
            const newXp = player.xp;
            if(oldXp !== newXp.toString()){
                currentXpSpan.textContent = newXp;
                triggerAnimation(currentXpSpan, 'stat-updated');
            }
            
            const oldRequiredXp = requiredXpSpan.textContent;
            const newRequiredXp = player.xpToNextLevel;
            if(oldRequiredXp !== newRequiredXp.toString()){ requiredXpSpan.textContent = newRequiredXp; }
            
            const oldScore = currentScoreSpan.textContent;
            const newScore = Math.floor(score);
            if(oldScore !== newScore.toString()){ currentScoreSpan.textContent = newScore; }
            
            if (appleCounterSpan) appleCounterSpan.textContent = player.appleCount;
            if (coinCounterSpan) coinCounterSpan.textContent = player.coins;
            if (xpBar) xpBar.style.width = `${(player.xp / player.xpToNextLevel) * 100}%`;
        }

        
        function updatePowerupIconsUI() {
            powerupIconsDiv.innerHTML = '';
            if (shotgunBlastActive) { powerupIconsDiv.innerHTML += '<span>💥</span>';
            } else {
                if (rocketLauncherActive) powerupIconsDiv.innerHTML += '<span>🚀</span>';
                if (vShapeProjectileLevel > 0) powerupIconsDiv.innerHTML += `<span>🕊️${vShapeProjectileLevel > 1 ? `x${vShapeProjectileLevel}` : ''}</span>`;
            }
            if (dogCompanionActive && magneticProjectileActive) { powerupIconsDiv.innerHTML += '<span>🎯🐶</span>';
            } else {
                if (dogCompanionActive) powerupIconsDiv.innerHTML += '<span>🐶</span>';
                if (magneticProjectileActive) powerupIconsDiv.innerHTML += '<span>🧲</span>';
            }
            if (doppelgangerActive) powerupIconsDiv.innerHTML += '<span>👯</span>';
            if (temporalWardActive) powerupIconsDiv.innerHTML += '<span>⏱️</span>';
            if (bombEmitterActive) powerupIconsDiv.innerHTML += '<span>💣</span>';
            if (orbitingPowerUpActive) powerupIconsDiv.innerHTML += '<span>💫</span>';
            if (damagingCircleActive) powerupIconsDiv.innerHTML += '<span>⭕</span>';
            if (lightningProjectileActive) powerupIconsDiv.innerHTML += '<span>⚡️</span>';
            if (player.swordActive) powerupIconsDiv.innerHTML += '<span>🗡️</span>';
            if (iceProjectileActive) powerupIconsDiv.innerHTML += '<span>❄️</span>';
            if (puddleTrailActive) powerupIconsDiv.innerHTML += '<span>💧</span>';
            if (laserPointerActive) powerupIconsDiv.innerHTML += '<span>🔴</span>';
            if (autoAimActive) powerupIconsDiv.innerHTML += '<span>🎯</span>';
            if (explosiveBulletsActive) powerupIconsDiv.innerHTML += '<span>💥</span>';
            if (vengeanceNovaActive) powerupIconsDiv.innerHTML += '<span>🛡️</span>';
            if (antiGravityActive) powerupIconsDiv.innerHTML += '<span>💨</span>';
            if (ricochetActive) powerupIconsDiv.innerHTML += '<span>🔄</span>';
            if (blackHoleActive) powerupIconsDiv.innerHTML += '<span>⚫</span>';
            if (dualGunActive) powerupIconsDiv.innerHTML += '<span>🔫</span>';
            if (flamingBulletsActive) powerupIconsDiv.innerHTML += '<span>🔥</span>';
            if (bugSwarmActive) powerupIconsDiv.innerHTML += '<span>🪰</span>';
            if (nightOwlActive) powerupIconsDiv.innerHTML += '<span>🦉</span>';
            if (whirlwindAxeActive) powerupIconsDiv.innerHTML += '<span>🪓</span>';
            if (lightningStrikeActive) powerupIconsDiv.innerHTML += '<span>⚡</span>';
            if (hasDashInvincibility) powerupIconsDiv.innerHTML += '<span>🛡️💨</span>';
            
            if (powerupIconsDiv.scrollHeight > powerupIconsDiv.clientHeight) { powerupIconsDiv.classList.add('small-icons'); } 
            else { powerupIconsDiv.classList.remove('small-icons'); }
        }

        
        function updateUpgradeStatsUI() {
            upgradeStatsDiv.innerHTML = '';
            const upgradeNames = {
                speed: 'SPD', fireRate: 'FR', magnetRadius: 'MAG',
                damage: 'DMG', projectileSpeed: 'P.SPD', knockback: 'KB',
                luck: 'LUCK'
            };
            for (const [type, level] of Object.entries(player.upgradeLevels)) {
                if (level > 0) {
                    const p = document.createElement('p');
                    p.textContent = `${upgradeNames[type] || type.toUpperCase()}: ${'⭐'.repeat(level)}`;
                    upgradeStatsDiv.appendChild(p);
                }
            }
        }

        function saveHighScore(finalScore, finalLevel) {
            try {
                const highScores = JSON.parse(localStorage.getItem('highScores')) || {
                    easy: { score: 0, level: 1 }, medium: { score: 0, level: 1 }, hard: { score: 0, level: 1 }
                };
                if (finalScore > highScores[currentDifficulty].score) {
                    highScores[currentDifficulty] = { score: finalScore, level: finalLevel };
                    localStorage.setItem('highScores', JSON.stringify(highScores));
                }
            } catch (error) { console.error("Could not save high score:", error); }
        }

        async function endGame() {
            playSound('gameOver');
            vibrate([100, 30, 100]);
            playerStats.totalDeaths++;
            gameOver = true; gamePaused = true; gameActive = false;
            stopBGM();
            cameraZoom = 1.0;
            if (canvas) canvas.style.cursor = 'default';
            isMouseInCanvas = false;
            if (pauseButton) pauseButton.style.display = 'none'; 
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (gameContainer) gameContainer.style.display = 'none'; 
            if (movementStickBase) movementStickBase.style.display = 'none';
            if (firestickBase) firestickBase.style.display = 'none';
            
            const totalTimeSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
            if (finalScoreSpan) finalScoreSpan.textContent = Math.floor(score);
            if (finalTimeSpan) finalTimeSpan.textContent = `${totalTimeSeconds}s`;
            
            const coins = enemiesDefeatedCount;
            if (coinsEarnedSpan) coinsEarnedSpan.textContent = coins;
            playerData.currency += coins;
            savePlayerData();
            savePlayerStats();

            saveHighScore(Math.floor(score), player.level);

            if (gameOverlay) gameOverlay.style.display = 'flex';
            
            if (loadingStoryDiv) loadingStoryDiv.style.display = 'block';
            if (storytellerOutputDiv) storytellerOutputDiv.textContent = '';
            const epicMessage = `Hark, a hero's tale is sung! For ${totalTimeSeconds} grueling seconds, a noble warrior battled the emoji hordes. With unmatched courage, they gathered ${player.xp} XP and etched a legendary score of ${Math.floor(score)} into the annals of history!`;
            if (storytellerOutputDiv) storytellerOutputDiv.textContent = epicMessage;
            if (loadingStoryDiv) loadingStoryDiv.style.display = 'none';
        }

async function tryLoadMusic(retries = 3) {
            if (backgroundMusicPaths.length === 0) {
                console.error("No background music paths available.");
                return;
            }
            let availableTracks = [...backgroundMusicPaths];
            for(let i = 0; i < retries; i++) {
                try {
                    if(availableTracks.length === 0) availableTracks = [...backgroundMusicPaths]; // Reset if all failed
                    const musicIndex = Math.floor(Math.random() * availableTracks.length);
                    const randomMusicPath = availableTracks.splice(musicIndex, 1)[0];

                    if (currentBGMPlayer) { currentBGMPlayer.stop(); currentBGMPlayer.dispose(); }
                    
                    currentBGMPlayer = new Tone.Player({ url: randomMusicPath, loop: true, autostart: false, volume: -10 }).toDestination();
                    musicVolumeSlider.dispatchEvent(new Event('input'));
                    await Tone.loaded();
                    startBGM();
                    return; // Success
                } catch (error) {
                    console.error(`Failed to load music track. Attempt ${i + 1}/${retries}.`, error);
                }
            }
            console.error("Failed to load any background music after multiple retries.");
        }

        function applyCheats() {
            // Apply cheats that modify starting player stats or game rules
            if (cheats.hearts_start_10) {
                player.lives = 10;
                player.maxLives = 10;
            }
            if (cheats.all_powerups_start) {
                console.log("Activating all power-ups cheat.");
                // Activate all standard powerups
                for(const powerupKey in ALWAYS_AVAILABLE_PICKUPS){
                    activatePowerup(powerupKey);
                }
                // Activate all unlocked special powerups
                for(const powerupKey in UNLOCKABLE_PICKUPS){
                     if(playerData.unlockedPickups[powerupKey]){
                         activatePowerup(powerupKey);
                     }
                }
            }
            if (cheats.dog_companion_start) {
                activatePowerup('dog_companion');
            }
            if (cheats.magnet_mode) {
                player.magnetRadius = WORLD_WIDTH; // Set a huge magnet radius
            }
        }

async function startGame() {
            stopMainMenuBGM();
            if (Tone.context.state !== 'running') { await Tone.start(); console.log("AudioContext started!"); }
            
            if (selectedMapIndex !== -1 && selectedMapIndex < backgroundImages.length) {
    currentBackgroundIndex = selectedMapIndex;
    // ADD THIS LINE
    console.log(`SUCCESS: Using selected map index: ${currentBackgroundIndex}`);
} else {
    if (backgroundImages.length > 0) {
        currentBackgroundIndex = Math.floor(Math.random() * backgroundImages.length);
        // ADD THIS LINE
        console.log(`RANDOM: No valid map was selected. Using random index: ${currentBackgroundIndex}`);
    }
}

            await tryLoadMusic();
            
            // Hide all menu buttons during gameplay
            document.querySelector('.bottom-menu-buttons').style.display = 'none';

            // *** OPTIMIZATION: Initialize Quadtree for the game world
            quadtree = new Quadtree({ x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT });

            if (gameOverlay) gameOverlay.style.display = 'none';
            if (difficultyContainer) difficultyContainer.style.display = 'none';
            if (mapSelectContainer) mapSelectContainer.style.display = 'none';
            if (characterSelectContainer) characterSelectContainer.style.display = 'none';
            if (gameGuideModal) gameGuideModal.style.display = 'none';
            if (achievementsModal) achievementsModal.style.display = 'none';
            if (cheatsModal) cheatsModal.style.display = 'none';
            if (pauseButton) pauseButton.style.display = 'block'; 
            if (gameContainer) gameContainer.style.display = 'block'; 
            if (gameStats) gameStats.style.display = 'block'; // Show game stats
            
            if (isMobileDevice) {
                if (movementStickBase) movementStickBase.style.display = 'flex';
                if (firestickBase) firestickBase.style.display = 'flex';
                if (mobileResetButton) mobileResetButton.style.display = 'block'; // Show mobile reset button
                cameraZoom = 1.4; zoomToggle.checked = true;
            } else {
                if (movementStickBase) movementStickBase.style.display = 'none';
                if (firestickBase) firestickBase.style.display = 'none';
                if (canvas) canvas.style.cursor = 'none';
                cameraZoom = 1.0; zoomToggle.checked = false;
            }
            isMouseInCanvas = false;
            
            gameActive = true; gameOver = false; gamePaused = false;
            
            let basePlayerSpeed = 1.4;
            applyPermanentUpgrades();
            
            let difficultyMultiplier = 1.0;
            if (currentDifficulty === 'medium') difficultyMultiplier = 1.1;
            else if (currentDifficulty === 'hard') difficultyMultiplier = 1.2;

            Object.assign(player, { 
                xp: 0, level: 1, xpToNextLevel: 3, projectileSizeMultiplier: 1, projectileSpeedMultiplier: 1, 
                speed: basePlayerSpeed * difficultyMultiplier, lives: player.maxLives, orbitAngle: 0, 
                boxPickupsCollectedCount: 0, bgmFastModeActive: false, swordActive: false, 
                lastSwordSwingTime: 0, currentSwordSwing: null, isSlowedByMosquitoPuddle: false, 
                facing: 'down', appleCount: 0,
                isDashing: false, dashEndTime: 0, lastDashTime: 0 - (playerData.hasReducedDashCooldown ? 3000: 6000), 
                dashCooldown: playerData.hasReducedDashCooldown ? 3000: 6000,
                isInvincible: false,
                spinStartTime: null, spinDirection: 0,
                upgradeLevels: { speed: 0, fireRate: 0, magnetRadius: 0, damage: 0, projectileSpeed: 0, knockback: 0, luck: 0 }
            });
            player.originalPlayerSpeed = player.speed;
            boxDropChance = 0.01; appleDropChance = 0.05;

            [enemies, pickupItems, appleItems, eyeProjectiles, playerPuddles, snailPuddles, mosquitoPuddles, bombs, floatingTexts, visualWarnings, explosions, blackHoles, bloodSplatters, bloodPuddles, antiGravityPulses, vengeanceNovas, dogHomingShots, destructibles, flameAreas, flies, owlProjectiles, lightningStrikes, smokeParticles].forEach(arr => arr.length = 0);
            
            spawnInitialObstacles();

            score = 0; lastEnemySpawnTime = 0; enemySpawnInterval = 1000;
            lastWeaponFireTime = 0; weaponFireInterval = 400; enemiesDefeatedCount = 0;
            fireRateBoostActive = false; fireRateBoostEndTime = 0; bombEmitterActive = false; orbitingPowerUpActive = false;
            damagingCircleActive = false; lastDamagingCircleDamageTime = 0; lightningProjectileActive = false; lastLightningSpawnTime = 0;
            magneticProjectileActive = false; vShapeProjectileLevel = 0; iceProjectileActive = false; puddleTrailActive = false;
            laserPointerActive = false; autoAimActive = false; explosiveBulletsActive = false; vengeanceNovaActive = false;
            dogCompanionActive = false; antiGravityActive = false; ricochetActive = false; rocketLauncherActive = false;
            blackHoleActive = false; dualGunActive = false; flamingBulletsActive = false; hasDashInvincibility = false;
            lastAntiGravityPushTime = 0; lastBlackHoleTime = 0; shotgunBlastActive = false; doppelgangerActive = false;
            doppelganger = null;
            bugSwarmActive = false; nightOwlActive = false; whirlwindAxeActive = false; lightningStrikeActive = false; owl = null;
            
            dog = { x: player.x, y: player.y, size: 25, state: 'returning', target: null, lastHomingShotTime: 0 };
            player2 = null;
            merchant = null; // Ensure no merchant at start

            temporalWardActive = false; isTimeStopped = false; timeStopEndTime = 0;
            resetRunStats();
            applyCheats();

            player.x = WORLD_WIDTH / 2; player.y = WORLD_HEIGHT / 2;
            aimDx = 0; aimDy = 0;
            
            updatePowerupIconsUI(); updateUpgradeStatsUI(); updateUIStats();
            
            gameStartText.textContent = "Game Start!";
            gameStartDifficulty.textContent = currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);
            gameStartOverlay.style.display = 'flex';
            setTimeout(() => { gameStartOverlay.style.display = 'none'; }, 2000);

            Tone.Transport.bpm.value = 120;
            gameStartTime = Date.now();
            runStats.startTime = gameStartTime; // ACHIEVEMENT FIX
            lastFrameTime = gameStartTime;
            runStats.lastDamageTime = gameStartTime;
            lastCircleSpawnEventTime = gameStartTime; 
            lastBarrelSpawnTime = gameStartTime;
            lastDoppelgangerSpawnTime = gameStartTime;
            lastMerchantSpawnTime = gameStartTime;
            animationFrameId = requestAnimationFrame(gameLoop);
        }

        function displayHighScores() {
            try {
                const highScores = JSON.parse(localStorage.getItem('highScores')) || {
                    easy: { score: 0, level: 1 }, medium: { score: 0, level: 1 }, hard: { score: 0, level: 1 }
                };
                document.getElementById('easyHighScore').textContent = highScores.easy.score;
                document.getElementById('easyHighLevel').textContent = highScores.easy.level;
                document.getElementById('mediumHighScore').textContent = highScores.medium.score;
                document.getElementById('mediumHighLevel').textContent = highScores.medium.level;
                document.getElementById('hardHighScore').textContent = highScores.hard.score;
                document.getElementById('hardHighLevel').textContent = highScores.hard.level;
            } catch (error) { console.error("Could not display high scores:", error); }
        }

        async function showDifficultyScreen() { 
            // Show all menu buttons when returning to menu
            document.querySelector('.bottom-menu-buttons').style.display = 'flex';

            if (gameContainer) gameContainer.style.display = 'none';
            if (gameStats) gameStats.style.display = 'none'; // Hide game stats
            if (mobileResetButton) mobileResetButton.style.display = 'block'; // Hide mobile reset
            if (movementStickBase) movementStickBase.style.display = 'none';
            if (firestickBase) firestickBase.style.display = 'none';
            if (upgradeMenu) upgradeMenu.style.display = 'none';
            if (gameOverlay) gameOverlay.style.display = 'none';
            if (gameGuideModal) gameGuideModal.style.display = 'none';
            if (achievementsModal) achievementsModal.style.display = 'none';
            if (cheatsModal) cheatsModal.style.display = 'none';
            if (pauseButton) pauseButton.style.display = 'none'; 
            if (pauseOverlay) pauseOverlay.style.display = 'none'; 
            if (upgradeShop) upgradeShop.style.display = 'none';
            if (mapSelectContainer) mapSelectContainer.style.display = 'none';
            if (characterSelectContainer) characterSelectContainer.style.display = 'none';
            stopBGM();
            startMainMenuBGM();
            displayHighScores();
            if (difficultyContainer) difficultyContainer.style.display = 'block';
            if (canvas) canvas.style.cursor = 'default';
            isMouseInCanvas = false; cameraZoom = 1.0;
        }
        function togglePause() {
            vibrate(20);
            gamePaused = !gamePaused;
            if (gamePaused) { pauseOverlay.style.display = 'flex'; Tone.Transport.pause(); } 
            else { pauseOverlay.style.display = 'none'; Tone.Transport.start(); }
        }
        
        function triggerDash(entity) {
            const now = Date.now();
            if (!entity || entity.isDashing || now - entity.lastDashTime < entity.dashCooldown) {
                return;
            }
            entity.isDashing = true;
            entity.dashEndTime = now + 300; // 300ms dash duration
            entity.lastDashTime = now;
            entity.spinStartTime = now; // For spin animation
            playSound('dodge'); // Play dodge sound
            if (entity === player) {
                playerStats.totalDashes++;
            }
        }

        function triggerCircleSpawnEvent() {
            const numEnemies = 24;
            const radius = Math.min(canvas.width, canvas.height);
            const enemyType = Math.random() < 0.5 ? '🧟' : '💀';
            visualWarnings.push({ x: player.x, y: player.y, radius: radius, spawnTime: Date.now(), duration: 2000 });
            setTimeout(() => {
                for (let i = 0; i < numEnemies; i++) {
                    const angle = (i / numEnemies) * 2 * Math.PI;
                    const x = player.x + radius * Math.cos(angle);
                    const y = player.y + radius * Math.sin(angle);
                    const boundedX = Math.max(0, Math.min(WORLD_WIDTH, x));
                    const boundedY = Math.max(0, Math.min(WORLD_HEIGHT, y));
                    createEnemy(boundedX, boundedY, enemyType);
                }
            }, 2000);
        }

