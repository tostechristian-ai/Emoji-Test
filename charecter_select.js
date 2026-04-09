
// ================================================================================= //
        // ======================== MERCHANT AND GAME LOGIC START ========================== //
        // ================================================================================= //

        function closeMerchantShop() {
    merchantShop.style.display = 'none';
    gamePaused = false;
    // The merchant is now removed upon collision, not when closing the shop.
}

        function showMerchantShop() {
            gamePaused = true;
            merchantOptionsContainer.innerHTML = ''; // Clear previous options
            playUISound('levelUp');

            const options = [];
            
            // Option 1: Trade 3 apples for XP
            const canAffordXp = player.appleCount >= 3;
            options.push({
                type: 'xp_for_apples',
                name: "Gain Experience",
                desc: "A hearty meal to fuel your journey.",
                icon: '📈',
                cost: 3,
                currency: 'apples',
                xpAmount: player.xpToNextLevel, // Give a full level up's worth
                enabled: canAffordXp
            });

            // Options 2 & 3: Buy a random powerup with coins
            const availablePowerups = [];
            if (!magneticProjectileActive) availablePowerups.push({id:'magnetic_projectile', name: 'Magnetic Shots', icon: '🧲'});
            if (!explosiveBulletsActive) availablePowerups.push({id: 'explosive_bullets', name: 'Explosive Bullets', icon: '💥'});
            if (!ricochetActive) availablePowerups.push({id:'ricochet', name: 'Ricochet Shots', icon: '🔄'});
            if (!player.swordActive) availablePowerups.push({id:'sword', name: 'Auto-Sword', icon: '🗡️'});
            if (!dogCompanionActive && playerData.unlockedPickups.dog_companion) availablePowerups.push({id: 'dog_companion', name: 'Dog Companion', icon: '🐶'});
            if (!nightOwlActive && playerData.unlockedPickups.night_owl) availablePowerups.push({id: 'night_owl', name: 'Night Owl', icon: '🦉'});

            for (let i = availablePowerups.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availablePowerups[i], availablePowerups[j]] = [availablePowerups[j], availablePowerups[i]];
            }

            const powerupsToSell = availablePowerups.slice(0, 2);
            powerupsToSell.forEach(powerup => {
                const coinCost = 50 + Math.floor(player.level * 5);
                options.push({
                    type: 'buy_powerup',
                    name: powerup.name,
                    desc: `A powerful artifact.`,
                    icon: powerup.icon,
                    cost: coinCost,
                    currency: 'coins',
                    powerupId: powerup.id,
                    enabled: player.coins >= coinCost
                });
            });

            // Create the cards
            options.forEach(option => {
                const card = document.createElement('div');
                card.className = 'merchant-card';
                card.innerHTML = `
                    <div class="merchant-icon">${option.icon}</div>
                    <h3>${option.name}</h3>
                    <p>${option.desc}</p>
                    <div class="cost">${option.cost} ${option.currency === 'apples' ? '🍎' : '🪙'}</div>
                `;
                if (!option.enabled) {
                    card.style.opacity = '0.5';
                    card.style.cursor = 'not-allowed';
                } else {
                    card.onclick = () => purchaseFromMerchant(option);
                    card.addEventListener('mouseover', () => playUISound('uiClick'));
                }
                merchantOptionsContainer.appendChild(card);
            });

            merchantShop.style.display = 'flex';
        }

        function purchaseFromMerchant(option) {
            playUISound('levelUpSelect');
            vibrate(20);

            if (option.type === 'xp_for_apples') {
                player.appleCount -= option.cost;
                player.xp += option.xpAmount;
                floatingTexts.push({ text: `+${option.xpAmount} XP!`, x: player.x, y: player.y - player.size, startTime: Date.now(), duration: 1500, color: '#00c6ff' });
                if (player.xp >= player.xpToNextLevel) {
                    // Delay closing the shop slightly to see the level up screen
                    setTimeout(() => levelUp(), 200);
                }
            } else if (option.type === 'buy_powerup') {
                player.coins -= option.cost;
                activatePowerup(option.powerupId);
                floatingTexts.push({ text: `${option.name}!`, x: player.x, y: player.y - player.size, startTime: Date.now(), duration: 1500 });
            }

            if (option.type !== 'xp_for_apples' || player.xp < player.xpToNextLevel) {
                closeMerchantShop();
            }
        }

        // Helper function to consolidate powerup activation logic
        function activatePowerup(id) {
            if (id === 'doppelganger') {
                doppelgangerActive = true; runStats.lastDoppelgangerStartTime = Date.now();
                doppelganger = {
                    x: player.x - player.size * 2, y: player.y, size: player.size,
                    rotationAngle: 0, lastFireTime: 0, endTime: Date.now() + DOPPELGANGER_DURATION
                };
            }
            else if (id === 'dash_invincibility') { hasDashInvincibility = true; }
            else if (id === 'dash_cooldown') { playerData.hasReducedDashCooldown = true; player.dashCooldown = 3000; savePlayerData(); }
            else if (id === 'temporal_ward') temporalWardActive = true;
            else if (id === 'bomb') { bombEmitterActive = true; lastBombEmitMs = Date.now(); }
            else if (id === 'orbiter') { orbitingPowerUpActive = true; player.orbitAngle = 0; }
            else if (id === 'circle') { damagingCircleActive = true; lastDamagingCircleDamageTime = Date.now(); }
            else if (id === 'lightning_projectile') { lightningProjectileActive = true; lastLightningSpawnTime = Date.now(); }
            else if (id === 'magnetic_projectile') magneticProjectileActive = true;
            else if (id === 'v_shape_projectile') vShapeProjectileLevel = Math.min(4, vShapeProjectileLevel + 1);
            else if (id === 'sword') { player.swordActive = true; player.lastSwordSwingTime = Date.now() - SWORD_SWING_INTERVAL; }
            else if (id === 'ice_projectile') iceProjectileActive = true;
            else if (id === 'puddle_trail') { puddleTrailActive = true; lastPlayerPuddleSpawnTime = Date.now() - PLAYER_PUDDLE_SPAWN_INTERVAL; }
            else if (id === 'laser_pointer') laserPointerActive = true; 
            else if (id === 'auto_aim') autoAimActive = true;
            else if (id === 'explosive_bullets') explosiveBulletsActive = true;
            else if (id === 'vengeance_nova') vengeanceNovaActive = true;
            else if (id === 'dog_companion') {  dogCompanionActive = true; dog.x = player.x; dog.y = player.y; dog.state = 'returning'; }
            else if (id === 'anti_gravity') { antiGravityActive = true; lastAntiGravityPushTime = Date.now(); }
            else if (id === 'ricochet') ricochetActive = true;
            else if (id === 'rocket_launcher') { rocketLauncherActive = true; weaponFireInterval *= 2; }
            else if (id === 'black_hole') { blackHoleActive = true; lastBlackHoleTime = Date.now(); }
            else if (id === 'dual_gun') dualGunActive = true;
            else if (id === 'flaming_bullets') flamingBulletsActive = true;
            else if (id === 'bug_swarm') { bugSwarmActive = true; lastBugSwarmSpawnTime = Date.now(); }
            else if (id === 'night_owl') { nightOwlActive = true; }
            else if (id === 'whirlwind_axe') { whirlwindAxeActive = true; }
            else if (id === 'lightning_strike') { lightningStrikeActive = true; lastLightningStrikeTime = Date.now(); }
            updatePowerupIconsUI();
        }

        function update() {
    if (gamePaused || gameOver || !gameActive) return;

    // *** OPTIMIZATION: Clear and repopulate the Quadtree each frame ***
    quadtree.clear();
    const allGameObjects = [...enemies, ...destructibles, player];
    if (player2 && player2.active) allGameObjects.push(player2);
    if (doppelganger) allGameObjects.push(doppelganger);
    
    for(const obj of allGameObjects) {
        quadtree.insert({
            x: obj.x - obj.size / 2,
            y: obj.y - obj.size / 2,
            width: obj.size,
            height: obj.size,
            ref: obj // Keep a reference to the original object
        });
    }
    // *** END OF QUADTREE POPULATION ***

    const now = Date.now();
            const deltaTime = now - lastFrameTime;
            if (deltaTime > 0) {
                const xpGainMultiplier = 1 + (playerData.upgrades.xpGain || 0) * PERMANENT_UPGRADES.xpGain.effect;
                if(doppelgangerActive && runStats.lastDoppelgangerStartTime > 0){
                    runStats.doppelgangerActiveTimeThisRun += deltaTime;
                }
            }
            lastFrameTime = now;
            checkAchievements();
            
            if (Date.now() - lastMerchantSpawnTime >= MERCHANT_SPAWN_INTERVAL) {
    spawnMerchant(player.x + 200, player.y); 
    lastMerchantSpawnTime = Date.now(); // Reset the timer right after spawning
}

// Loop through all active merchants to check for collision.
for (let i = merchants.length - 1; i >= 0; i--) {
    const currentMerchant = merchants[i];
    const dx = player.x - currentMerchant.x;
    const dy = player.y - currentMerchant.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < (player.size / 2) + (currentMerchant.size / 2)) {
        showMerchantShop();      // Open the shop
        merchants.splice(i, 1); // Remove THIS merchant from the array
        break;                   // Stop checking for this frame
    }
}

            if (fireRateBoostActive && now > fireRateBoostEndTime) fireRateBoostActive = false;
            
            if (isTimeStopped && now > timeStopEndTime) {
                isTimeStopped = false;
            }
            
            if (now - lastCircleSpawnEventTime > 180000) {
                triggerCircleSpawnEvent();
                lastCircleSpawnEventTime = now;
            }

            if (now - lastBarrelSpawnTime > 30000) {
                spawnRandomBarrel();
                lastBarrelSpawnTime = now;
            }
            


            let moveX = 0; let moveY = 0; let isMoving = false;
            if (keys['ArrowUp'] || keys['w']) moveY -= 1;
            if (keys['ArrowDown'] || keys['s']) moveY += 1;
            if (keys['ArrowLeft'] || keys['a']) moveX -= 1;
            if (keys['ArrowRight'] || keys['d']) moveX += 1;

            if (moveX === 0 && moveY === 0) { moveX = joystickDirX; moveY = joystickDirY; }

            const moveMagnitude = Math.hypot(moveX, moveY);
            if (moveMagnitude > 0) {
                isMoving = true;
                moveX /= moveMagnitude;
                moveY /= moveMagnitude;
            }

            const spinDuration = 500; // Spin completes in 0.5 seconds
            if (player.isDashing && player.spinStartTime) {
                if (now < player.spinStartTime + spinDuration) {
                    if (moveX > 0) {
                        player.spinDirection = 1; // clockwise
                    } else if (moveX < 0) {
                        player.spinDirection = -1; // counter-clockwise
                    } else if (player.spinDirection === 0) {
                        player.spinDirection = 1; // Default to clockwise if no horizontal movement
                    }
                } else {
                    player.spinStartTime = null;
                    player.spinDirection = 0;
                }
            }

            if (isMoving && !player.isDashing) { player.stepPhase += player.speed * 0.1; }
            
            let currentPlayerSpeed = player.speed;
            if (cheats.double_game_speed) currentPlayerSpeed *= 2;


            if(player.isDashing) {
                currentPlayerSpeed *= 3.5;
                if(now > player.dashEndTime) {
                    player.isDashing = false;
                    player.isInvincible = false;
                } else {
                    if (hasDashInvincibility) player.isInvincible = true;
                    // Spawn dash trail
                    if (Math.random() > 0.5) {
                        smokeParticles.push({
                            x: player.x, y: player.y + player.size / 4,
                            dx: (Math.random() - 0.5) * 0.5, dy: (Math.random() - 0.5) * 0.5,
                            size: 15 + Math.random() * 10, alpha: 0.8,
                            angle: Math.PI / 2 + (Math.random() - 0.5) * 0.2
                        });
                    }
                }
            }

            player.isSlowedByMosquitoPuddle = false;
            for (const puddle of mosquitoPuddles) {
                const dx = player.x - puddle.x;
                const dy = player.y - puddle.y;
                if (dx*dx + dy*dy < ((player.size / 2) + (puddle.size / 2))**2) {
                    currentPlayerSpeed *= MOSQUITO_PUDDLE_SLOW_FACTOR;
                    player.isSlowedByMosquitoPuddle = true;
                    break;
                }
            }

            for (const puddle of snailPuddles) {
                const dx = player.x - puddle.x;
                const dy = player.y - puddle.y;
                if (dx*dx + dy*dy < ((player.size / 2) + (puddle.size / 2))**2) {
                    currentPlayerSpeed *= PLAYER_PUDDLE_SLOW_FACTOR; 
                    break;
                }
            }

            if (isMoving) {
                let nextX = player.x + moveX * currentPlayerSpeed;
                let nextY = player.y + moveY * currentPlayerSpeed;
                let collision = false;
                for (const obs of destructibles) {
                    const dx = nextX - obs.x;
                    const dy = nextY - obs.y;
                    if(dx*dx + dy*dy < ((player.size / 2) + (obs.size / 2))**2) {
                        collision = true;
                        break;
                    }
                }
                if (!collision) { player.x = nextX; player.y = nextY; }
            }
            
            const PUSH_BACK_STRENGTH = 2.5;
            const halfPlayerSize = player.size / 2;
            if (player.x < halfPlayerSize) player.x += PUSH_BACK_STRENGTH;
            if (player.x > WORLD_WIDTH - halfPlayerSize) player.x -= PUSH_BACK_STRENGTH;
            if (player.y < halfPlayerSize) player.y += PUSH_BACK_STRENGTH;
            if (player.y > WORLD_HEIGHT - halfPlayerSize) player.y -= PUSH_BACK_STRENGTH;
            player.x = Math.max(halfPlayerSize, Math.min(WORLD_WIDTH - halfPlayerSize, player.x));
            player.y = Math.max(halfPlayerSize, Math.min(WORLD_HEIGHT - halfPlayerSize, player.y));

            const aimMagnitude = Math.hypot(aimDx, aimDy);
            const normAimDx = aimMagnitude > 0 ? aimDx / aimMagnitude : 0;
            const normAimDy = aimMagnitude > 0 ? aimDy / aimMagnitude : 0;
            const targetAimOffsetX = normAimDx * CAMERA_PULL_STRENGTH;
            const targetAimOffsetY = normAimDy * CAMERA_PULL_STRENGTH;
            cameraAimOffsetX += (targetAimOffsetX - cameraAimOffsetX) * CAMERA_LERP_FACTOR;
            cameraAimOffsetY += (targetAimOffsetY - cameraAimOffsetY) * CAMERA_LERP_FACTOR;
            const targetCameraX = player.x + cameraAimOffsetX;
            const targetCameraY = player.y + cameraAimOffsetY;
            cameraOffsetX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, targetCameraX - canvas.width / 2));
            cameraOffsetY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, targetCameraY - canvas.height / 2));
            
            if (autoAimActive) {
                let closestEnemy = null; let minDistanceSq = Infinity;
                enemies.forEach(enemy => {
                    if (!enemy.isHit) {
                        const distSq = (player.x - enemy.x)**2 + (player.y - enemy.y)**2;
                        if (distSq < minDistanceSq) { minDistanceSq = distSq; closestEnemy = enemy; }
                    }
                });
                if (closestEnemy) {
                    const angle = Math.atan2(closestEnemy.y - player.y, closestEnemy.x - player.x);
                    player.rotationAngle = angle;
                    if (angle > -Math.PI / 4 && angle <= Math.PI / 4) player.facing = 'right';
                    else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) player.facing = 'down';
                    else if (angle > 3 * Math.PI / 4 || angle <= -3 * Math.PI / 4) player.facing = 'left';
                    else player.facing = 'up';
                }
            } else if (aimDx !== 0 || aimDy !== 0) {
                const angle = Math.atan2(aimDy, aimDx);
                player.rotationAngle = angle;
                if (angle > -Math.PI / 4 && angle <= Math.PI / 4) player.facing = 'right';
                else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) player.facing = 'down';
                else if (angle > 3 * Math.PI / 4 || angle <= -3 * Math.PI / 4) player.facing = 'left';
                else player.facing = 'up';
            }

            // ===== UPDATED PLAYER 2 CONTROLS =====
            if (player2 && player2.active) {
                // Reset Player 2 movement and aiming each frame
                let p2VelX = 0; let p2VelY = 0;
                let p2aimDx = 0; let p2aimDy = 0;
                
                // Movement with jkli keys
                if (keys['j']) p2VelX -= player2.speed;
                if (keys['l']) p2VelX += player2.speed;
                if (keys['i']) p2VelY -= player2.speed;
                if (keys['k']) p2VelY += player2.speed;
                


                // Player 2 spin animation logic
                if(player2.isDashing && player2.spinStartTime) {
                    if (now < player2.spinStartTime + spinDuration) {
                        if (p2VelX > 0) {
                            player2.spinDirection = 1; // clockwise
                        } else if (p2VelX < 0) {
                            player2.spinDirection = -1; // counter-clockwise
                        } else if (player2.spinDirection === 0) {
                            player2.spinDirection = 1; // Default
                        }
                    } else {
                        player2.spinStartTime = null;
                        player2.spinDirection = 0;
                    }
                }

                // Apply dash speed multiplier
                if(player2.isDashing){
                    p2VelX *= 3.5;
                    p2VelY *= 3.5;
                    if(now > player2.dashEndTime) player2.isDashing = false;
                }
                
                // Apply movement
                player2.x += p2VelX; 
                player2.y += p2VelY;
                
                // Update facing direction
                if (p2VelX > 0) player2.facing = 'right'; 
                else if (p2VelX < 0) player2.facing = 'left';
                if (p2VelY > 0) player2.facing = 'down'; 
                else if (p2VelY < 0) player2.facing = 'up';
                
                // Keep Player 2 within world bounds
                player2.x = Math.max(player2.size / 2, Math.min(WORLD_WIDTH - player2.size / 2, player2.x));
                player2.y = Math.max(player2.size / 2, Math.min(WORLD_HEIGHT - player2.size / 2, player2.y));
                
                // Player 2 aiming with numpad (8=up, 2=down, 4=left, 6=right)
                if (keys['8']) p2aimDy = -1; // Numpad 8 is up
                if (keys['2']) p2aimDy = 1;  // Numpad 2 is down  
                if (keys['4']) p2aimDx = -1; // Numpad 4 is left
                if (keys['6']) p2aimDx = 1;  // Numpad 6 is right
                
                // Diagonal aiming support
                if (keys['7']) { p2aimDx = -1; p2aimDy = -1; } // Up-left
                if (keys['9']) { p2aimDx = 1; p2aimDy = -1; }  // Up-right
                if (keys['1']) { p2aimDx = -1; p2aimDy = 1; }  // Down-left
                if (keys['3']) { p2aimDx = 1; p2aimDy = 1; }   // Down-right
                
                // Normalize diagonal aiming
                const p2AimMagnitude = Math.hypot(p2aimDx, p2aimDy);
                if (p2AimMagnitude > 0) {
                    p2aimDx /= p2AimMagnitude;
                    p2aimDy /= p2AimMagnitude;
                    player2.gunAngle = Math.atan2(p2aimDy, p2aimDx);
                }
                
                // Player 2 shooting logic
                const p2isShooting = p2aimDx !== 0 || p2aimDy !== 0;
                if (p2isShooting && now - player2.lastFireTime > player2.fireInterval) {
                    createPlayer2Weapon();
                    player2.lastFireTime = now;
                }
            }
// --- NEW POWERUP LOGIC ---
            if (bugSwarmActive && !isTimeStopped && now - lastBugSwarmSpawnTime > BUG_SWARM_INTERVAL) {
                for (let i = 0; i < BUG_SWARM_COUNT; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    flies.push({
                        x: player.x + Math.cos(angle) * player.size,
                        y: player.y + Math.sin(angle) * player.size,
                        target: null, isHit: false
                    });
                }
                lastBugSwarmSpawnTime = now;
            }
            if (nightOwlActive && !isTimeStopped) {
                if (!owl) { owl = { x: player.x, y: player.y - OWL_FOLLOW_DISTANCE, lastFireTime: 0 }; }
                const targetX = player.x; const targetY = player.y - OWL_FOLLOW_DISTANCE;
                owl.x += (targetX - owl.x) * 0.05; owl.y += (targetY - owl.y) * 0.05;
                if (now - owl.lastFireTime > OWL_FIRE_INTERVAL && enemies.length > 0) {
                    let closestEnemy = null, minDistanceSq = Infinity;
                    enemies.forEach(enemy => {
                        if (!enemy.isHit) {
                            const distSq = (owl.x - enemy.x)**2 + (owl.y - enemy.y)**2;
                            if (distSq < minDistanceSq) { minDistanceSq = distSq; closestEnemy = enemy; }
                        }
                    });
                    if (closestEnemy) {
                        const angle = Math.atan2(closestEnemy.y - owl.y, closestEnemy.x - owl.x);
                        owlProjectiles.push({
                            x: owl.x, y: owl.y, size: OWL_PROJECTILE_SIZE,
                            dx: Math.cos(angle) * OWL_PROJECTILE_SPEED,
                            dy: Math.sin(angle) * OWL_PROJECTILE_SPEED,
                            angle: angle, isHit: false, lifetime: now + 3000
                        });
                        owl.lastFireTime = now;
                    }
                }
            }
            if (lightningStrikeActive && !isTimeStopped && now - lastLightningStrikeTime > LIGHTNING_STRIKE_INTERVAL) {
                if (enemies.length > 0) {
                    const targetEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                    if (targetEnemy && !targetEnemy.isHit) {
                        lightningStrikes.push({ x: targetEnemy.x, y: targetEnemy.y, startTime: now, duration: 500 });
                        targetEnemy.health -= LIGHTNING_STRIKE_DAMAGE;
                        playerStats.totalEnemiesHitByLightning++;
                        createBloodSplatter(targetEnemy.x, targetEnemy.y);
                        if (targetEnemy.health <= 0) { handleEnemyDeath(targetEnemy); }
                        lastLightningStrikeTime = now;
                    }
                }
            }


            let enemySpawnCap = cheats.noSpawnCap ? Infinity : 100;
            let currentEnemySpawnInterval = enemySpawnInterval / Math.pow(1.3, player.boxPickupsCollectedCount) * (1 - 0.01 * (player.level - 1));
            currentEnemySpawnInterval = Math.max(80, currentEnemySpawnInterval);
            if (player.level > 0 && player.level % BOSS_SPAWN_INTERVAL_LEVELS === 0 && player.level !== lastBossLevelSpawned) {
                createBoss();
                lastBossLevelSpawned = player.level;
            }
            if (enemies.length < enemySpawnCap && now - lastEnemySpawnTime > currentEnemySpawnInterval) {
                createEnemy();
                lastEnemySpawnTime = now;
            }
            
            const enemyMovements = new Map();
            enemies.forEach((enemy) => {
                if (isTimeStopped) return;
                if (enemy.isIgnited) {
                    if (now > enemy.ignitionEndTime) { enemy.isIgnited = false; } 
                    else if (now - enemy.lastIgnitionDamageTime > 3000) {
                        enemy.health -= 1;
                        createBloodSplatter(enemy.x, enemy.y);
                        if (enemy.health <= 0) { handleEnemyDeath(enemy); }
                        enemy.lastIgnitionDamageTime = now;
                    }
                }

                let moveX = 0; let moveY = 0;
                let target = player;
                let minTargetDistSq = (player.x - enemy.x)**2 + (player.y - enemy.y)**2;

                if (player2 && player2.active) {
                    const distToPlayer2Sq = (player2.x - enemy.x)**2 + (player2.y - enemy.y)**2;
                    if (distToPlayer2Sq < minTargetDistSq) { target = player2; minTargetDistSq = distToPlayer2Sq; }
                }
                if (doppelganger) {
                    const distToDoppelgangerSq = (doppelganger.x - enemy.x)**2 + (doppelganger.y - enemy.y)**2;
                    if(distToDoppelgangerSq < minTargetDistSq) { target = doppelganger; minTargetDistSq = distToDoppelgangerSq; }
                }
                
                let angleToTarget = Math.atan2(target.y - enemy.y, target.x - enemy.x);

                let effectiveEnemySpeed = enemy.speed;
                if(cheats.fastEnemies) effectiveEnemySpeed *= 1.5;
                if(cheats.slowEnemies) effectiveEnemySpeed *= 0.5;

                enemy.isSlowedByPuddle = false;
                for (const puddle of playerPuddles) {
                    const dx = enemy.x - puddle.x;
                    const dy = enemy.y - puddle.y;
                    if (dx*dx + dy*dy < ((enemy.size / 2) + (puddle.size / 2))**2) {
                        effectiveEnemySpeed *= PLAYER_PUDDLE_SLOW_FACTOR;
                        enemy.isSlowedByPuddle = true;
                        break;
                    }
                }
                 for (const puddle of snailPuddles) {
                    const dx = enemy.x - puddle.x;
                    const dy = enemy.y - puddle.y;
                    if (dx*dx + dy*dy < ((enemy.size / 2) + (puddle.size / 2))**2) {
                        effectiveEnemySpeed *= PLAYER_PUDDLE_SLOW_FACTOR;
                        enemy.isSlowedByPuddle = true;
                        break;
                    }
                }
                if (enemy.isFrozen && now < enemy.freezeEndTime) {
                    enemyMovements.set(enemy, {moveX: 0, moveY: 0});
                    return;
                } else if (enemy.isFrozen && now >= enemy.freezeEndTime) enemy.isFrozen = false;
                
                const enemyBehaviorType = enemy.isBoss ? ENEMY_CONFIGS[enemy.mimics].type : ENEMY_CONFIGS[enemy.emoji].type;
                switch (enemyBehaviorType) {
                    case 'bat':
                        enemy.pauseTimer++;
                        if (enemy.isPaused) { if (enemy.pauseTimer >= enemy.pauseDuration) { enemy.isPaused = false; enemy.pauseTimer = 0; } }
                        else { moveX += Math.cos(angleToTarget) * effectiveEnemySpeed; moveY += Math.sin(angleToTarget) * effectiveEnemySpeed; if (enemy.pauseTimer >= enemy.moveDuration) { enemy.isPaused = true; enemy.pauseTimer = 0; } }
                        break;
                    case 'devil': 
                        if (now - enemy.lastAxisSwapTime > 500) {
                            enemy.moveAxis = enemy.moveAxis === 'x' ? 'y' : 'x';
                            enemy.lastAxisSwapTime = now;
                        }
                        if (enemy.moveAxis === 'x') { moveX += Math.sign(target.x - enemy.x) * effectiveEnemySpeed; } 
                        else { moveY += Math.sign(target.y - enemy.y) * effectiveEnemySpeed; }
                        break;
                    case 'demon':
                        if (now - enemy.lastStateChangeTime >= 2000) { enemy.moveState = (enemy.moveState === 'following') ? 'random' : 'following'; enemy.lastStateChangeTime = now; if (enemy.moveState === 'random') { const randomAngle = Math.random() * Math.PI * 2; enemy.randomDx = Math.cos(randomAngle); enemy.randomDy = Math.sin(randomAngle); } }
                        if (enemy.moveState === 'following') { moveX += Math.cos(angleToTarget) * effectiveEnemySpeed; moveY += Math.sin(angleToTarget) * effectiveEnemySpeed; }
                        else { moveX += enemy.randomDx * effectiveEnemySpeed; moveY += enemy.randomDy * effectiveEnemySpeed; }
                        break;
                    case 'ghost':
                        if (now - enemy.lastPhaseChange > enemy.phaseDuration) {
                            enemy.isVisible = !enemy.isVisible;
                            enemy.lastPhaseChange = now;
                        }
                        enemy.bobOffset = Math.sin(now / 200) * 4;
                        if(enemy.isVisible) {
                           moveX += Math.cos(angleToTarget) * effectiveEnemySpeed;
                           moveY += Math.sin(angleToTarget) * effectiveEnemySpeed;
                        }
                        break;
                    case 'eye':
                        const distanceToTarget = Math.sqrt(minTargetDistSq);
                        if (distanceToTarget < EYE_SAFE_DISTANCE) { moveX -= Math.cos(angleToTarget) * effectiveEnemySpeed; moveY -= Math.sin(angleToTarget) * effectiveEnemySpeed; }
                        else if (distanceToTarget > EYE_TOO_FAR_DISTANCE) { moveX += Math.cos(angleToTarget) * effectiveEnemySpeed; moveY += Math.sin(angleToTarget) * effectiveEnemySpeed; }
                        else { if (now - enemy.lastEyeProjectileTime > EYE_PROJECTILE_INTERVAL) { eyeProjectiles.push({ x: enemy.x, y: enemy.y, size: EYE_PROJECTILE_SIZE, emoji: EYE_PROJECTILE_EMOJI, speed: EYE_PROJECTILE_SPEED, dx: Math.cos(angleToTarget) * EYE_PROJECTILE_SPEED, dy: Math.sin(angleToTarget) * EYE_PROJECTILE_SPEED, lifetime: now + EYE_PROJECTILE_LIFETIME }); enemy.lastEyeProjectileTime = now; playSound('playerShoot'); } }
                        break;
                    case 'vampire':
                        let dodgeVectorX = 0, dodgeVectorY = 0;
                        for (const weapon of weaponPool) {
                            if(weapon.active) {
                                const distSq = (enemy.x - weapon.x)**2 + (enemy.y - weapon.y)**2;
                                if (distSq < VAMPIRE_DODGE_DETECTION_RADIUS * VAMPIRE_DODGE_DETECTION_RADIUS) {
                                    if ((weapon.dx * (enemy.x - weapon.x)) + (weapon.dy * (enemy.y - weapon.y)) > 0) {
                                        const perpDx = -weapon.dy, perpDy = weapon.dx;
                                        const normalizeFactor = Math.sqrt(perpDx * perpDx + perpDy * perpDy);
                                        if (normalizeFactor > 0) { dodgeVectorX += (perpDx / normalizeFactor); dodgeVectorY += (perpDy / normalizeFactor); }
                                    }
                                }
                            }
                        }
                        const dodgeMagnitude = Math.sqrt(dodgeVectorX * dodgeVectorX + dodgeVectorY * dodgeVectorY);
                        if (dodgeMagnitude > 0) { dodgeVectorX = (dodgeVectorX / dodgeMagnitude) * VAMPIRE_DODGE_STRENGTH; dodgeVectorY = (dodgeVectorY / dodgeMagnitude) * VAMPIRE_DODGE_STRENGTH; }
                        moveX += (Math.cos(angleToTarget) * effectiveEnemySpeed) + dodgeVectorX;
                        moveY += (Math.sin(angleToTarget) * effectiveEnemySpeed) + dodgeVectorY;
                        break;
                    case 'mosquito':
                        if (!enemy.currentMosquitoDirection || (now - enemy.lastDirectionUpdateTime > MOSQUITO_DIRECTION_UPDATE_INTERVAL)) { enemy.lastDirectionUpdateTime = now; enemy.currentMosquitoDirection = { dx: Math.cos(angleToTarget), dy: Math.sin(angleToTarget) }; }
                        moveX += enemy.currentMosquitoDirection.dx * effectiveEnemySpeed;
                        moveY += enemy.currentMosquitoDirection.dy * effectiveEnemySpeed;
                        if (now - enemy.lastPuddleSpawnTime > MOSQUITO_PUDDLE_SPAWN_INTERVAL) { mosquitoPuddles.push({ x: enemy.x, y: enemy.y, size: MOSQUITO_PUDDLE_SIZE, spawnTime: now, lifetime: MOSQUITO_PUDDLE_LIFETIME }); enemy.lastPuddleSpawnTime = now; }
                        break;
                    case 'snail':
                        moveX += Math.cos(enemy.directionAngle) * effectiveEnemySpeed;
                        moveY += Math.sin(enemy.directionAngle) * effectiveEnemySpeed;
                        if (enemy.x < 0 || enemy.x > WORLD_WIDTH || enemy.y < 0 || enemy.y > WORLD_HEIGHT) {
                           enemy.directionAngle = Math.random() * 2 * Math.PI; // Change direction when off-screen
                        }
                        if (now - enemy.lastPuddleSpawnTime > PLAYER_PUDDLE_SPAWN_INTERVAL * 2) { // Slower than player
                            snailPuddles.push({ x: enemy.x, y: enemy.y, size: PLAYER_PUDDLE_SIZE, spawnTime: now, lifetime: PLAYER_PUDDLE_LIFETIME * 2 });
                            enemy.lastPuddleSpawnTime = now;
                        }
                        break;
                    default:
                        moveX += Math.cos(angleToTarget) * effectiveEnemySpeed;
                        moveY += Math.sin(angleToTarget) * effectiveEnemySpeed;
                        break;
                }
                enemyMovements.set(enemy, {moveX, moveY});
            });
            
            const separationForce = 1.5;
            const finalMovements = new Map();
            enemies.forEach(e1 => {
                let totalMove = enemyMovements.get(e1);
                if (!totalMove) return;

                // This section for pushing away from obstacles (like brick walls) remains.
                let repulsionX = 0; let repulsionY = 0;
                destructibles.forEach(obs => {
                    const dx = e1.x - obs.x;
                    const dy = e1.y - obs.y;
                    const distSq = dx*dx + dy*dy;
                    const repulsionRadius = obs.size/2 + e1.size/2 + 5;
                    if (distSq < repulsionRadius*repulsionRadius) {
                        const dist = Math.sqrt(distSq);
                        const pushForce = (1 - (dist / repulsionRadius)) * 2;
                        if(dist > 0.1) {
                            repulsionX += (dx / dist) * pushForce;
                            repulsionY += (dy / dist) * pushForce;
                        }
                    }
                });

                // The calculation for finalX and finalY no longer includes the separation force.
                finalMovements.set(e1, {
                    finalX: totalMove.moveX + repulsionX,
                    finalY: totalMove.moveY + repulsionY
                });
            });
            
            enemies.forEach(enemy => {
                const finalMove = finalMovements.get(enemy);
                if (finalMove) {
                    let nextX = enemy.x + finalMove.finalX;
                    let nextY = enemy.y + finalMove.finalY;
                    let collision = false;
                    for (const obs of destructibles) {
                        const dx = nextX - obs.x;
                        const dy = nextY - obs.y;
                        if (dx*dx + dy*dy < ((enemy.size / 2) + (obs.size / 2))**2) {
                            collision = true;
                            break;
                        }
                    }
                    if (!collision) { enemy.x = nextX; enemy.y = nextY; }
                }

                const canGhostDamage = enemy.emoji !== '👻' || (enemy.emoji === '👻' && enemy.isVisible);
                const combinedRadius = (player.size / 2) + (enemy.size / 2) - 5.6;
                const dx_player = player.x - enemy.x;
                const dy_player = player.y - enemy.y;

                if (canGhostDamage && !player.isInvincible && !cheats.god_mode && (dx_player*dx_player + dy_player*dy_player) < combinedRadius*combinedRadius) {
                    player.lives--;
                    runStats.lastDamageTime = now;
                    createBloodSplatter(player.x, player.y); createBloodPuddle(player.x, player.y, player.size);
                    vibrate(50); playSound('playerScream');
                    isPlayerHitShaking = true; playerHitShakeStartTime = now;
                    if (vengeanceNovaActive) { vengeanceNovas.push({ x: player.x, y: player.y, startTime: now, duration: 500, maxRadius: player.size * 3 }); }
                    if (temporalWardActive) { isTimeStopped = true; timeStopEndTime = now + 2000; playSound('levelUpSelect'); }
                    if (player.lives <= 0) { endGame(); }
                    handleEnemyDeath(enemy);
                }
                if (canGhostDamage && player2 && player2.active) {
                    const combinedRadiusP2 = (player2.size / 2) + (enemy.size / 2);
                    const dx_p2 = player2.x - enemy.x;
                    const dy_p2 = player2.y - enemy.y;
                    if((dx_p2*dx_p2 + dy_p2*dy_p2) < combinedRadiusP2*combinedRadiusP2) {
                        player2.active = false; playSound('playerScream');
                        createBloodSplatter(player2.x, player2.y); createBloodPuddle(player2.x, player2.y, player2.size);
                        handleEnemyDeath(enemy);
                    }
                }
                if (canGhostDamage && doppelganger) {
                    const combinedRadiusDop = (doppelganger.size / 2) + (enemy.size / 2);
                    const dx_dop = doppelganger.x - enemy.x;
                    const dy_dop = doppelganger.y - enemy.y;
                    if((dx_dop*dx_dop + dy_dop*dy_dop) < combinedRadiusDop*combinedRadiusDop) {
                        createBloodSplatter(doppelganger.x, doppelganger.y); createBloodPuddle(doppelganger.x, doppelganger.y, doppelganger.size);
                        doppelganger = null; doppelgangerActive = false;
                        runStats.lastDoppelgangerStartTime = 0;
                        updatePowerupIconsUI(); handleEnemyDeath(enemy);
                    }
                }
            });
            
            if (doppelganger) {
                if (now > doppelganger.endTime) {
                    doppelganger = null; doppelgangerActive = false;
                    runStats.lastDoppelgangerStartTime = 0;
                    updatePowerupIconsUI();
                } else {
                    let closestEnemy = null; let minDistanceSq = Infinity;
                    enemies.forEach(enemy => {
                        if (!enemy.isHit) {
                            const distSq = (doppelganger.x - enemy.x)**2 + (doppelganger.y - enemy.y)**2;
                            if (distSq < minDistanceSq) { minDistanceSq = distSq; closestEnemy = enemy; }
                        }
                    });
                    if (closestEnemy) {
                        doppelganger.rotationAngle = Math.atan2(closestEnemy.y - doppelganger.y, closestEnemy.x - doppelganger.x);
                        if (now - doppelganger.lastFireTime > DOPPELGANGER_FIRE_INTERVAL) {
                            createWeapon(doppelganger, doppelganger.rotationAngle);
                            doppelganger.lastFireTime = now;
                        }
                    }
                }
            }

            if (dogCompanionActive && !isTimeStopped) {
                const DOG_SPEED = baseEnemySpeed * SKULL_SPEED_MULTIPLIER;
                if (dog.state === 'returning') {
                    const dx = player.x - dog.x;
                    const dy = player.y - dog.y;
                    if (dx*dx + dy*dy < (player.size/2)**2) { dog.state = 'seeking'; dog.target = null; } 
                    else {
                        const angleToPlayer = Math.atan2(player.y - dog.y, player.x - dog.x);
                        dog.x += Math.cos(angleToPlayer) * DOG_SPEED;
                        dog.y += Math.sin(angleToPlayer) * DOG_SPEED;
                    }
                } else if (dog.state === 'seeking') {
                    if (dog.target && dog.target.isHit) { dog.target = null; }
                    if (!dog.target) {
                        let closestEnemy = null; let minDistanceSq = Infinity;
                        enemies.forEach(enemy => {
                            if (!enemy.isHit && !enemy.isBoss) {
                                const distSq = (dog.x - enemy.x)**2 + (dog.y - enemy.y)**2;
                                if (distSq < minDistanceSq) { minDistanceSq = distSq; closestEnemy = enemy; }
                            }
                        });
                        dog.target = closestEnemy;
                    }
                    if (dog.target) {
                        const dx = dog.target.x - dog.x;
                        const dy = dog.target.y - dog.y;
                        const combinedRadius = (dog.size / 2) + (dog.target.size / 2);
                        if (dx*dx + dy*dy < combinedRadius*combinedRadius) {
                            handleEnemyDeath(dog.target);
                            dog.target = null;
                            dog.state = 'returning';
                        } else {
                            const angleToTarget = Math.atan2(dy, dx);
                            dog.x += Math.cos(angleToTarget) * DOG_SPEED;
                            dog.y += Math.sin(angleToTarget) * DOG_SPEED;
                        }
                    } else { dog.state = 'returning'; }
                }
                if (magneticProjectileActive && dog.target && now - dog.lastHomingShotTime > DOG_HOMING_SHOT_INTERVAL) {
                    const angleToTarget = Math.atan2(dog.target.y - dog.y, dog.target.x - dog.x);
                    const shot = {
                        x: dog.x, y: dog.y, size: 15, speed: 5.04,
                        dx: Math.cos(angleToTarget) * 5.04, dy: Math.sin(angleToTarget) * 5.04,
                        angle: angleToTarget, isHit: false, lifetime: now + 2000, isHoming: true
                    };
                    dogHomingShots.push(shot); dog.lastHomingShotTime = now; playSound('playerShoot');
                }
            }

            for (let i = pickupItems.length - 1; i >= 0; i--) {
                const item = pickupItems[i];
                const dx = player.x - item.x;
                const dy = player.y - item.y;
                const distanceSq = dx*dx + dy*dy;
                
                if (distanceSq < player.magnetRadius*player.magnetRadius) {
                    const angle = Math.atan2(dy, dx);
                    item.x += Math.cos(angle) * MAGNET_STRENGTH;
                    item.y += Math.sin(angle) * MAGNET_STRENGTH;
                }
                
                let collected = distanceSq < ((player.size / 2) + (item.size / 2))**2;
                if (!collected && player2 && player2.active) {
                    const dx2 = player2.x - item.x;
                    const dy2 = player2.y - item.y;
                    collected = (dx2*dx2 + dy2*dy2) < ((player2.size / 2) + (item.size / 2))**2;
                }

                if (collected) {
                    if (item.type === 'box') {
                        vibrate(20);
                        player.boxPickupsCollectedCount++;
                        playerStats.totalBoxesOpened++;
                        const powerUpChoices = [];
                        let powerupName = ""; 
                        if (vShapeProjectileLevel < 4 && !shotgunBlastActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.v_shape_projectile);
                        if (!magneticProjectileActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.magnetic_projectile);
                        if (!iceProjectileActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.ice_projectile);
                        if (!ricochetActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.ricochet);
                        if (!explosiveBulletsActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.explosive_bullets);
                        if (!puddleTrailActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.puddle_trail);
                        if (!player.swordActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.sword);
                        if (!laserPointerActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.laser_pointer);
                        if (!autoAimActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.auto_aim);
                        if (!dualGunActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.dual_gun);
                        if (!bombEmitterActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.bomb);
                        if (!orbitingPowerUpActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.orbiter);
                        if (!lightningProjectileActive) powerUpChoices.push(ALWAYS_AVAILABLE_PICKUPS.lightning_projectile);
                        if (!bugSwarmActive) powerUpChoices.push({id: 'bug_swarm', name: 'Bug Swarm'});
                        if (!lightningStrikeActive) powerUpChoices.push({id: 'lightning_strike', name: 'Lightning Strike'});
                        if (!hasDashInvincibility) powerUpChoices.push({id: 'dash_invincibility', name: 'Dash Invincibility'});
                        if (!playerData.hasReducedDashCooldown) powerUpChoices.push({id: 'dash_cooldown', name: 'Dash Cooldown'});

                        const unlocked = playerData.unlockedPickups;
                        if (unlocked.doppelganger && !doppelgangerActive) powerUpChoices.push({id: 'doppelganger', name: 'Doppelganger'});
                        if (unlocked.temporal_ward && !temporalWardActive) powerUpChoices.push({id: 'temporal_ward', name: 'Temporal Ward'});
                        if (unlocked.circle && !damagingCircleActive) powerUpChoices.push({id:'circle', name: 'Damaging Circle'});
                        if (unlocked.vengeance_nova && !vengeanceNovaActive) powerUpChoices.push({id: 'vengeance_nova', name: 'Vengeance Nova'});
                        if (unlocked.dog_companion && !dogCompanionActive) powerUpChoices.push({id: 'dog_companion', name: 'Dog Companion'});
                        if (unlocked.anti_gravity && !antiGravityActive) powerUpChoices.push({id: 'anti_gravity', name: 'Anti-Gravity'});
                        if (unlocked.rocket_launcher && !rocketLauncherActive && !shotgunBlastActive) powerUpChoices.push({id: 'rocket_launcher', name: 'Heavy Shells'});
                        if (unlocked.black_hole && !blackHoleActive) powerUpChoices.push({id: 'black_hole', name: 'Black Hole'});
                        if (unlocked.flaming_bullets && !flamingBulletsActive) powerUpChoices.push({id: 'flaming_bullets', name: 'Flaming Bullets'});
                        if (unlocked.night_owl && !nightOwlActive) powerUpChoices.push({id: 'night_owl', name: 'Night Owl'});
                        if (unlocked.whirlwind_axe && !whirlwindAxeActive) powerUpChoices.push({id: 'whirlwind_axe', name: 'Whirlwind Axe'});

                        if (powerUpChoices.length > 0) {
                            const randomChoice = powerUpChoices[Math.floor(Math.random() * powerUpChoices.length)];
                            powerupName = randomChoice.name; 
                            activatePowerup(randomChoice.id);
                            
                            playSound('boxPickup');
                            floatingTexts.push({ text: powerupName + "!", x: player.x, y: player.y - player.size, startTime: now, duration: 1500 });
                            updatePowerupIconsUI(); 
                        }
                        pickupItems.splice(i, 1);
                        continue;
                    }
                    player.xp += item.xpValue * (cheats.xp_boost ? 2 : 1);
                    runStats.xpCollectedThisRun += item.xpValue;
                    score += item.xpValue * 7;
                    vibrate(10);
                    pickupItems.splice(i, 1);
                    playSound('xpPickup');
                    if (player.xp >= player.xpToNextLevel) levelUp();
                }
            }
            for (let i = appleItems.length - 1; i >= 0; i--) {
                const apple = appleItems[i];
                if (now - apple.spawnTime > apple.lifetime) { appleItems.splice(i, 1); continue; }
                const dx = player.x - apple.x;
                const dy = player.y - apple.y;
                const distanceSq = dx*dx + dy*dy;

                if (distanceSq < player.magnetRadius*player.magnetRadius) {
                    const angle = Math.atan2(dy, dx);
                    apple.x += Math.cos(angle) * MAGNET_STRENGTH; 
                    apple.y += Math.sin(angle) * MAGNET_STRENGTH; 
                }

                let collected = distanceSq < ((player.size / 2) + (apple.size / 2))**2;
                if (!collected && player2 && player2.active) {
                    const dx2 = player2.x - apple.x;
                    const dy2 = player2.y - apple.y;
                    collected = (dx2*dx2 + dy2*dy2) < ((player2.size / 2) + (apple.size / 2))**2;
                }
                
                if (collected) {
                    vibrate(20);
                    player.appleCount++;
                    runStats.applesEatenThisRun++;
                    playerStats.totalApplesEaten++;
                    if (player.appleCount >= 5) {
                        player.maxLives++;
                        player.appleCount = 0;
                        vibrate(50);
                        playSound('levelUpSelect');
                        floatingTexts.push({ text: "Max Life +1!", x: player.x, y: player.y - player.size, startTime: now, duration: 1500 });
                    }
                    player.lives = player.maxLives;
                    fireRateBoostActive = true;
                    fireRateBoostEndTime = now + FIRE_RATE_BOOST_DURATION;
                    playSound('xpPickup');
                    updateUIStats();
                    appleItems.splice(i, 1);
                }
            }
            let currentFireInterval = weaponFireInterval;
if(fireRateBoostActive) currentFireInterval /= 2;
if(cheats.fastShooting) currentFireInterval /= 5;
if(cheats.double_game_speed) currentFireInterval /= 2;
currentFireInterval = Math.max(50, currentFireInterval);
if (!cheats.no_gun_mode && (aimDx !== 0 || aimDy !== 0) && (now - lastWeaponFireTime > currentFireInterval)) {
    createWeapon();
    lastWeaponFireTime = now;
}

            for(const weapon of weaponPool) {
                if(!weapon.active) continue;

                if (magneticProjectileActive && enemies.length > 0) {
                    let closestEnemy = null, minDistanceSq = Infinity;
                    enemies.forEach(enemy => {
                        if (enemy.isHit || (enemy.isFrozen && now < enemy.freezeEndTime)) return;
                        const distSq = (weapon.x - enemy.x)**2 + (weapon.y - enemy.y)**2;
                        if (distSq < minDistanceSq) { minDistanceSq = distSq; closestEnemy = enemy; }
                    });
                    if (closestEnemy) {
                        const targetAngle = Math.atan2(closestEnemy.y - weapon.y, closestEnemy.x - weapon.x);
                        let angleDiff = targetAngle - weapon.angle;
                        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        weapon.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.02);
                        weapon.dx = Math.cos(weapon.angle) * weapon.speed;
                        weapon.dy = Math.sin(weapon.angle) * weapon.speed;
                    }
                }
                weapon.x += weapon.dx;
                weapon.y += weapon.dy;
                if (now > weapon.lifetime) weapon.active = false;
            }

            for (const weapon of weaponPool) {
                if(!weapon.active) continue;
                for (let j = destructibles.length - 1; j >= 0; j--) {
                    const obs = destructibles[j];
                    const dx = weapon.x - obs.x;
                    const dy = weapon.y - obs.y;
                    if (dx*dx + dy*dy < ((weapon.size / 2) + (obs.size / 2))**2) {
                        weapon.active = false;
                        if(obs.health !== Infinity) obs.health--;
                        if (obs.health <= 0) {
                            handleBarrelDestruction(obs);
                            destructibles.splice(j, 1);
                        }
                        break; 
                    }
                }
            }


            for (const weapon of weaponPool) {
    if (!weapon.active) continue;

    // Define the weapon's bounding box to search the quadtree
    const weaponBounds = {
        x: weapon.x - weapon.size / 2,
        y: weapon.y - weapon.size / 2,
        width: weapon.size,
        height: weapon.size
    };
    
    // Ask the quadtree for a small list of only the objects near the weapon
    const nearbyObjects = quadtree.retrieve(weaponBounds);

    // Now, only loop through this much smaller list of potential targets
    for (const targetObject of nearbyObjects) {
        const enemy = targetObject.ref; // Get the original enemy object using our reference

        // Make sure the object is a valid, hittable enemy
        if (!enemy || !enemy.health || enemy.isHit) {
            continue;
        }

        const canGhostBeHit = enemy.emoji !== '👻' || (enemy.emoji === '👻' && enemy.isVisible);

        if (canGhostBeHit && !weapon.hitEnemies.includes(enemy)) {
            const dx = weapon.x - enemy.x;
            const dy = weapon.y - enemy.y;
            const combinedRadius = (weapon.size / 2) + (enemy.size / 2);

            // This is the same distance check as before
            if (dx * dx + dy * dy < combinedRadius * combinedRadius) {
                
                // --- ALL YOUR ORIGINAL COLLISION LOGIC IS COPIED HERE ---
                let damageToDeal = player.damageMultiplier;
                if (rocketLauncherActive) { damageToDeal *= 2; }
                if (cheats.one_hit_kill) damageToDeal = Infinity;

                enemy.health -= damageToDeal;
                createBloodSplatter(enemy.x, enemy.y);
                weapon.hitEnemies.push(enemy);

                if (explosiveBulletsActive) {
                    const explosionId = Math.random();
                    explosions.push({
                        x: weapon.x, y: weapon.y, radius: enemy.size * 2,
                        startTime: Date.now(), duration: 300
                    });
                    // This part can also be optimized later, but let's leave it for now
                    enemies.forEach(otherEnemy => { 
                        if (otherEnemy !== enemy && !otherEnemy.isHit) {
                            const distSq = (otherEnemy.x - weapon.x)**2 + (otherEnemy.y - weapon.y)**2;
                            if (distSq < (enemy.size * 2)**2 + (otherEnemy.size / 2)**2) {
                                otherEnemy.health -= player.damageMultiplier;
                                if(cheats.instaKill) otherEnemy.health = 0;
                                createBloodSplatter(otherEnemy.x, otherEnemy.y);
                                if (otherEnemy.health <= 0) { handleEnemyDeath(otherEnemy, explosionId); }
                            }
                        }
                    });
                }

                if (player.knockbackStrength > 0 && !enemy.isBoss) {
                    const knockbackDistance = 50 * player.knockbackStrength;
                    const normDx = weapon.dx / weapon.speed;
                    const normDy = weapon.dy / weapon.speed;
                    enemy.x += normDx * knockbackDistance;
                    enemy.y += normDy * knockbackDistance;
                }
                if (iceProjectileActive) { 
                    enemy.isFrozen = true; 
                    enemy.freezeEndTime = Date.now() + 250;
                    playerStats.totalEnemiesFrozen++;
                }
                if (flamingBulletsActive) {
                    enemy.isIgnited = true;
                    enemy.ignitionEndTime = Date.now() + 6000;
                    enemy.lastIgnitionDamageTime = Date.now();
                }
                if (enemy.health <= 0) { handleEnemyDeath(enemy); }
                weapon.hitsLeft--;
                if (weapon.hitsLeft > 0 && ricochetActive && !rocketLauncherActive) {
                    let newTarget = null; let minDistanceSq = Infinity;
                    enemies.forEach(otherEnemy => {
                        if (!weapon.hitEnemies.includes(otherEnemy) && !otherEnemy.isHit) {
                            const distSq = (weapon.x - otherEnemy.x)**2 + (weapon.y - otherEnemy.y)**2;
                            if (distSq < minDistanceSq) { minDistanceSq = distSq; newTarget = otherEnemy; }
                        }
                    });
                    if (newTarget) {
                        if (explosiveBulletsActive) { explosions.push({ x: weapon.x, y: weapon.y, radius: enemy.size * 2, startTime: Date.now(), duration: 300 }); }
                        const angle = Math.atan2(newTarget.y - weapon.y, newTarget.x - weapon.x);
                        weapon.angle = angle;
                        weapon.dx = Math.cos(angle) * weapon.speed;
                        weapon.dy = Math.sin(angle) * weapon.speed;
                    } else { weapon.active = false; }
                } else { weapon.active = false; }

                // Break from the inner loop if the weapon is gone
                if (!weapon.active) {
                    break;
                }
            }
        }
    }
}
            if (bombEmitterActive && now - lastBombEmitMs >= BOMB_INTERVAL_MS) {
                bombs.push({ x: player.x, y: player.y, size: BOMB_SIZE, spawnTime: now });
                lastBombEmitMs = now;
            }
            for (let b = bombs.length - 1; b >= 0; b--) {
                const bomb = bombs[b];
                if (now - bomb.spawnTime > BOMB_LIFETIME_MS) { bombs.splice(b, 1); continue; }
                for (let e = enemies.length - 1; e >= 0; e--) {
                    const enemy = enemies[e];
                    const dx = enemy.x - bomb.x;
                    const dy = enemy.y - bomb.y;
                    if (dx*dx + dy*dy < ((enemy.size / 2) + (bomb.size / 2))**2) {
                        explosions.push({
                            x: bomb.x, y: bomb.y, radius: bomb.size * 2,
                            startTime: now, duration: 300
                        });
                        handleEnemyDeath(enemy);
                        playBombExplosionSound();
                        bombs.splice(b, 1);
                        break;
                    }
                }
            }
            if (orbitingPowerUpActive) {
                player.orbitAngle = (player.orbitAngle + ORBIT_SPEED) % (Math.PI * 2);
                const orbitX = player.x + ORBIT_RADIUS * Math.cos(player.orbitAngle);
                const orbitY = player.y + ORBIT_RADIUS * Math.sin(player.orbitAngle);
                for (let i = enemies.length - 1; i >= 0; i--) {
                    const enemy = enemies[i];
                    const dx = orbitX - enemy.x;
                    const dy = orbitY - enemy.y;
                    if (dx*dx + dy*dy < ((ORBIT_POWER_UP_SIZE / 2) + (enemy.size / 2))**2) {
                        if (!enemy.isHit && !enemy.isHitByOrbiter) {
                            enemy.health -= player.damageMultiplier;
                            createBloodSplatter(enemy.x, enemy.y);
                            enemy.isHitByOrbiter = true;
                            if (enemy.health <= 0) { handleEnemyDeath(enemy); }
                        }
                    } else { enemy.isHitByOrbiter = false; }
                }
                for (let i = eyeProjectiles.length - 1; i >= 0; i--) {
                    const eyeProj = eyeProjectiles[i];
                    const dx = orbitX - eyeProj.x;
                    const dy = orbitY - eyeProj.y;
                    if (!eyeProj.isHit && (dx*dx + dy*dy) < ((ORBIT_POWER_UP_SIZE / 2) + (eyeProj.size / 2))**2) {
                        eyeProj.isHit = true; 
                    }
                }
            }
             if (whirlwindAxeActive) {
                whirlwindAxeAngle -= WHIRLWIND_AXE_SPEED;
                const axeX = player.x + WHIRLWIND_AXE_RADIUS * Math.cos(whirlwindAxeAngle);
                const axeY = player.y + WHIRLWIND_AXE_RADIUS * Math.sin(whirlwindAxeAngle);
                for (let i = enemies.length - 1; i >= 0; i--) {
                    const enemy = enemies[i];
                    const dx = axeX - enemy.x;
                    const dy = axeY - enemy.y;
                    if (dx*dx + dy*dy < ((WHIRLWIND_AXE_SIZE / 2) + (enemy.size / 2))**2) {
                        if (!enemy.isHit && !enemy.isHitByAxe) { 
                            enemy.health -= 1;
                            createBloodSplatter(enemy.x, enemy.y);
                            enemy.isHitByAxe = true;
                            if (enemy.health <= 0) { handleEnemyDeath(enemy); }
                        }
                    } else { enemy.isHitByAxe = false; }
                }
            }
            if (damagingCircleActive && now - lastDamagingCircleDamageTime > DAMAGING_CIRCLE_DAMAGE_INTERVAL) {
                const radiusSq = (DAMAGING_CIRCLE_RADIUS)**2;
                for (let i = enemies.length - 1; i >= 0; i--) {
                    const enemy = enemies[i];
                    const dx = player.x - enemy.x;
                    const dy = player.y - enemy.y;
                    if (!enemy.isHit && (dx*dx + dy*dy) < radiusSq + (enemy.size / 2)**2) {
                        if (!enemy.isHitByCircle) {
                            enemy.health -= player.damageMultiplier; 
                            createBloodSplatter(enemy.x, enemy.y);
                            enemy.isHitByCircle = true;
                            if (enemy.health <= 0) { handleEnemyDeath(enemy); }
                        }
                    } else { enemy.isHitByCircle = false; }
                }
                lastDamagingCircleDamageTime = now;
            }
            if (lightningProjectileActive && now - lastLightningSpawnTime > LIGHTNING_SPAWN_INTERVAL) {
                let closestEnemy = null, minDistanceSq = Infinity;
                enemies.forEach(enemy => {
                    if (enemy.isHit || (enemy.isFrozen && now < enemy.freezeEndTime)) return;
                    const distSq = (player.x - enemy.x)**2 + (player.y - enemy.y)**2;
                    if (distSq < minDistanceSq) { minDistanceSq = distSq; closestEnemy = enemy; }
                });
                if (closestEnemy) {
                    const angle = Math.atan2(closestEnemy.y - player.y, closestEnemy.x - player.x);
                    lightningBolts.push({ x: player.x, y: player.y, size: LIGHTNING_SIZE, emoji: LIGHTNING_EMOJI, speed: 5.6, dx: Math.cos(angle) * 5.6, dy: Math.sin(angle) * 5.6, angle: angle, isHit: false, lifetime: now + 2000 });
                    playSound('playerShoot');
                }
                lastLightningSpawnTime = now;
            }
                
for (let i = lightningBolts.length - 1; i >= 0; i--) {
                const bolt = lightningBolts[i];
                bolt.x += bolt.dx; bolt.y += bolt.dy;
                if (now > bolt.lifetime) bolt.isHit = true;
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    const dx = bolt.x - enemy.x;
                    const dy = bolt.y - enemy.y;
                    if (!enemy.isHit && !bolt.isHit && (dx*dx + dy*dy) < ((bolt.size / 2) + (enemy.size / 2))**2) {
                        enemy.health -= player.damageMultiplier; bolt.isHit = true; 
                        createBloodSplatter(enemy.x, enemy.y);
                        if (enemy.health <= 0) { handleEnemyDeath(enemy); }
                        break;
                    }
                }
            }
            lightningBolts = lightningBolts.filter(bolt => !bolt.isHit);
            if (player.swordActive && now - player.lastSwordSwingTime > SWORD_SWING_INTERVAL) {
                let swordAngle;
                if (aimDx !== 0 || aimDy !== 0) swordAngle = Math.atan2(aimDy, aimDx);
                else {
                    let closestEnemy = null, minDistanceSq = Infinity;
                    enemies.forEach(enemy => {
                        if (enemy.isHit || (enemy.isFrozen && now < enemy.freezeEndTime)) return;
                        const distSq = (player.x - enemy.x)**2 + (player.y - enemy.y)**2;
                        if (distSq < minDistanceSq) { minDistanceSq = distSq; closestEnemy = enemy; }
                    });
                    swordAngle = closestEnemy ? Math.atan2(closestEnemy.y - player.y, closestEnemy.x - player.x) : -Math.PI / 2;
                }
                player.currentSwordSwing = { x: player.x, y: player.y, angle: swordAngle, activeUntil: now + SWORD_SWING_DURATION, startTime: now };
                playSwordSwingSound();
                const swordAttackRadiusSq = (player.size + SWORD_THRUST_DISTANCE)**2;
                for (let i = enemies.length - 1; i >= 0; i--) {
                    const enemy = enemies[i];
                    const dx = player.x - enemy.x;
                    const dy = player.y - enemy.y;
                    if ((dx*dx + dy*dy) < swordAttackRadiusSq + (enemy.size / 2)**2 && !enemy.isHit) {
                        enemy.health -= player.damageMultiplier; 
                        createBloodSplatter(enemy.x, enemy.y);
                        if (enemy.health <= 0) { handleEnemyDeath(enemy); }
                    }
                }
                player.lastSwordSwingTime = now;
            }
            if (player.currentSwordSwing && now > player.currentSwordSwing.activeUntil) player.currentSwordSwing = null;
            for (let i = eyeProjectiles.length - 1; i >= 0; i--) {
                const eyeProj = eyeProjectiles[i];
                eyeProj.x += eyeProj.dx; eyeProj.y += eyeProj.dy;
                if (now > eyeProj.lifetime) eyeProj.isHit = true;
                const dx = player.x - eyeProj.x;
                const dy = player.y - eyeProj.y;
                if (!player.isInvincible && (dx*dx + dy*dy) < ((player.size / 2) + (eyeProj.size / 2))**2 && !eyeProj.isHit) {
                    player.lives--; 
                    runStats.lastDamageTime = now;
                    createBloodSplatter(player.x, player.y); createBloodPuddle(player.x, player.y, player.size);
                    playSound('playerScream'); playEyeProjectileHitSound(); 
                    updateUIStats(); eyeProj.isHit = true;
                    isPlayerHitShaking = true; playerHitShakeStartTime = now;
                    if (player.lives <= 0) endGame();
                }
            }
            if (puddleTrailActive && now - lastPlayerPuddleSpawnTime > PLAYER_PUDDLE_SPAWN_INTERVAL) {
                playerPuddles.push({ x: player.x, y: player.y, size: PLAYER_PUDDLE_SIZE, spawnTime: now, lifetime: PLAYER_PUDDLE_LIFETIME });
                lastPlayerPuddleSpawnTime = now;
            }
            if (antiGravityActive && !isTimeStopped && now - lastAntiGravityPushTime > ANTI_GRAVITY_INTERVAL) {
                antiGravityPulses.push({ x: player.x, y: player.y, spawnTime: now, duration: 500 });
                enemies.forEach(enemy => {
                    if (!enemy.isBoss) {
                        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
                        if (dist < ANTI_GRAVITY_RADIUS && dist > 0) {
                            const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                            enemy.x += Math.cos(angle) * ANTI_GRAVITY_STRENGTH;
                            enemy.y += Math.sin(angle) * ANTI_GRAVITY_STRENGTH;
                        }
                    }
                });
                lastAntiGravityPushTime = now;
            }
            
            if (blackHoleActive && !isTimeStopped && now - lastBlackHoleTime > BLACK_HOLE_INTERVAL) {
                blackHoles.push({
                    x: player.x, y: player.y, spawnTime: now, lifetime: BLACK_HOLE_DELAY + BLACK_HOLE_PULL_DURATION,
                    radius: BLACK_HOLE_RADIUS, pullStrength: BLACK_HOLE_PULL_STRENGTH
                });
                lastBlackHoleTime = now;
            }

            for (let i = blackHoles.length - 1; i >= 0; i--) {
                const hole = blackHoles[i];
                if (now - hole.spawnTime > hole.lifetime) { blackHoles.splice(i, 1); continue; }
                if (now - hole.spawnTime > BLACK_HOLE_DELAY) {
                    enemies.forEach(enemy => {
                        if (!enemy.isBoss) {
                            const dist = Math.hypot(enemy.x - hole.x, enemy.y - hole.y);
                            if (dist < hole.radius && dist > 0) {
                                const angle = Math.atan2(hole.y - enemy.y, hole.x - enemy.x);
                                const pullForce = hole.pullStrength * (1 - dist / hole.radius);
                                enemy.x += Math.cos(angle) * pullForce;
                                enemy.y += Math.sin(angle) * pullForce;
                            }
                        }
                    });
                }
            }

            for (let i = playerPuddles.length - 1; i >= 0; i--) { if (now - playerPuddles[i].spawnTime > playerPuddles[i].lifetime) playerPuddles.splice(i, 1); }
            for (let i = snailPuddles.length - 1; i >= 0; i--) { if (now - snailPuddles[i].spawnTime > snailPuddles[i].lifetime) snailPuddles.splice(i, 1); }
            for (let i = mosquitoPuddles.length - 1; i >= 0; i--) { if (now - mosquitoPuddles[i].spawnTime > mosquitoPuddles[i].lifetime) mosquitoPuddles.splice(i, 1); }
            for (let i = bloodSplatters.length - 1; i >= 0; i--) {
                const p = bloodSplatters[i];
                if (now - p.spawnTime > p.lifetime) { bloodSplatters.splice(i, 1); continue; }
                p.x += p.dx; p.y += p.dy; p.dx *= 0.96; p.dy *= 0.96; 
            }
            for (let i = bloodPuddles.length - 1; i >= 0; i--) { if (now - bloodPuddles[i].spawnTime > bloodPuddles[i].lifetime) { bloodPuddles.splice(i, 1); } }

            dogHomingShots.forEach(shot => {
                if (shot.isHoming && enemies.length > 0) {
                    let closestEnemy = null, minDistanceSq = Infinity;
                    enemies.forEach(enemy => {
                        if (enemy.isHit) return;
                        const distSq = (shot.x - enemy.x)**2 + (shot.y - enemy.y)**2;
                        if (distSq < minDistanceSq) { minDistanceSq = distSq; closestEnemy = enemy; }
                    });
                    if (closestEnemy) {
                        const targetAngle = Math.atan2(closestEnemy.y - shot.y, closestEnemy.x - shot.x);
                        let angleDiff = targetAngle - shot.angle;
                        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        shot.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.04);
                        shot.dx = Math.cos(shot.angle) * shot.speed;
                        shot.dy = Math.sin(shot.angle) * shot.speed;
                    }
                }
                shot.x += shot.dx; shot.y += shot.dy;
                if (now > shot.lifetime) shot.isHit = true;
            });

            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                if (!enemy.isHit) {
                    for (let j = dogHomingShots.length - 1; j >= 0; j--) {
                        const shot = dogHomingShots[j];
                        const dx = shot.x - enemy.x;
                        const dy = shot.y - enemy.y;
                        if (!shot.isHit && (dx*dx + dy*dy) < ((shot.size / 2) + (enemy.size / 2))**2) {
                            enemy.health -= 1;
                            createBloodSplatter(enemy.x, enemy.y);
                            if (enemy.health <= 0) handleEnemyDeath(enemy);
                            shot.isHit = true;
                        }
                    }
                }
            }

            for (let i = flameAreas.length - 1; i >= 0; i--) {
                const area = flameAreas[i];
                if (now > area.endTime) { flameAreas.splice(i, 1); continue; }
                enemies.forEach(enemy => {
                    const dx = enemy.x - area.x;
                    const dy = enemy.y - area.y;
                    if (!enemy.isHit && (dx*dx + dy*dy) < area.radius*area.radius) {
                        if (!enemy.isIgnited || now > enemy.ignitionEndTime) {
                            enemy.isIgnited = true;
                            enemy.ignitionEndTime = now + 6000;
                            enemy.lastIgnitionDamageTime = now;
                        }
                    }
                });
            }

             for (let i = flies.length - 1; i >= 0; i--) {
                const fly = flies[i];
                if (fly.isHit || enemies.length === 0) { flies.splice(i, 1); continue; }
                let closestEnemy = null, minDistanceSq = Infinity;
                enemies.forEach(enemy => {
                    if (!enemy.isHit) {
                        const distSq = (fly.x - enemy.x)**2 + (fly.y - enemy.y)**2;
                        if (distSq < minDistanceSq) { minDistanceSq = distSq; closestEnemy = enemy; }
                    }
                });
                fly.target = closestEnemy;
                if (fly.target) {
                    const angle = Math.atan2(fly.target.y - fly.y, fly.target.x - fly.x);
                    fly.x += Math.cos(angle) * FLY_SPEED;
                    fly.y += Math.sin(angle) * FLY_SPEED;
                    const dx = fly.x - fly.target.x;
                    const dy = fly.y - fly.target.y;
                    if ((dx*dx + dy*dy) < ((FLY_SIZE / 2) + (fly.target.size / 2))**2) {
                        fly.target.health -= FLY_DAMAGE;
                        createBloodSplatter(fly.target.x, fly.target.y);
                        if (fly.target.health <= 0) { handleEnemyDeath(fly.target); }
                        fly.isHit = true;
                    }
                }
            }
            for (let i = owlProjectiles.length - 1; i >= 0; i--) {
                const proj = owlProjectiles[i];
                proj.x += proj.dx; proj.y += proj.dy;
                if (now > proj.lifetime) proj.isHit = true;
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    const dx = proj.x - enemy.x;
                    const dy = proj.y - enemy.y;
                    if (!enemy.isHit && !proj.isHit && (dx*dx + dy*dy) < ((proj.size / 2) + (enemy.size / 2))**2) {
                        enemy.health -= player.damageMultiplier;
                        proj.isHit = true;
                        createBloodSplatter(enemy.x, enemy.y);
                        if (enemy.health <= 0) { handleEnemyDeath(enemy); }
                        break;
                    }
                }
            }
             for (let i = smokeParticles.length - 1; i >= 0; i--) {
                const p = smokeParticles[i];
                p.x += p.dx;
                p.y += p.dy;
                p.alpha -= 0.02;
                if (p.alpha <= 0) {
                    smokeParticles.splice(i, 1);
                }
            }


            antiGravityPulses = antiGravityPulses.filter(p => now - p.spawnTime < p.duration);
            explosions = explosions.filter(exp => now - exp.startTime < exp.duration);
            vengeanceNovas.forEach(nova => {
                const age = now - nova.startTime;
                if (age < nova.duration) {
                    const currentRadius = nova.maxRadius * (age / nova.duration);
                    for (let i = enemies.length - 1; i >= 0; i--) {
                        const enemy = enemies[i];
                        const dx = nova.x - enemy.x;
                        const dy = nova.y - enemy.y;
                        if (!enemy.isHit && (dx*dx + dy*dy) < currentRadius*currentRadius) {
                            handleEnemyDeath(enemy);
                        }
                    }
                }
            });
            vengeanceNovas = vengeanceNovas.filter(nova => now - nova.startTime < nova.duration);
            floatingTexts = floatingTexts.filter(ft => now - ft.startTime < ft.duration);
            enemies = enemies.filter(e => !e.isHit);
            eyeProjectiles = eyeProjectiles.filter(p => !p.isHit);
            dogHomingShots = dogHomingShots.filter(s => !s.isHit);
            owlProjectiles = owlProjectiles.filter(p => !p.isHit);
            lightningStrikes = lightningStrikes.filter(ls => now - ls.startTime < ls.duration);
        }

        function draw() {
            if (!gameActive) return;
            const now = Date.now();
            let currentHitShakeX = 0, currentHitShakeY = 0;
            if (isPlayerHitShaking) {
                const elapsedTime = now - playerHitShakeStartTime;
                if (elapsedTime < PLAYER_HIT_SHAKE_DURATION) {
                    const shakeIntensity = MAX_PLAYER_HIT_SHAKE_OFFSET * (1 - (elapsedTime / PLAYER_HIT_SHAKE_DURATION));
                    currentHitShakeX = (Math.random() - 0.5) * 2 * shakeIntensity;
                    currentHitShakeY = (Math.random() - 0.5) * 2 * shakeIntensity;
                } else isPlayerHitShaking = false;
            }

            let finalCameraOffsetX = cameraOffsetX - currentHitShakeX;
            let finalCameraOffsetY = cameraOffsetY - currentHitShakeY;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(cameraZoom, cameraZoom);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            
            ctx.save();
            ctx.translate(-finalCameraOffsetX, -finalCameraOffsetY);
            if (backgroundImages.length > 0) ctx.drawImage(backgroundImages[currentBackgroundIndex], 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
            else { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT); }
            ctx.restore();
            
            ctx.save();
            ctx.translate(-finalCameraOffsetX, -finalCameraOffsetY);
            
            destructibles.forEach(obs => {
                if(obs.health !== Infinity) ctx.globalAlpha = 0.5 + (obs.health / obs.maxHealth) * 0.5;
                const preRendered = preRenderedEntities[obs.emoji];
                if(preRendered) {
                    ctx.drawImage(preRendered, obs.x - preRendered.width / 2, obs.y - preRendered.height / 2);
                }
                ctx.globalAlpha = 1.0;
            });

            flameAreas.forEach(area => {
                const age = now - area.startTime;
                const lifeRatio = age / (area.endTime - area.startTime);
                const alpha = 1 - lifeRatio;
                ctx.save();
                ctx.globalAlpha = alpha * 0.4;
                ctx.fillStyle = '#1a1a1a'; // Black puddle
                ctx.beginPath();
                ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = alpha * 0.7;
                const flameCount = 2;
                for (let i = 0; i < flameCount; i++) {
                    const angle = (i / flameCount) * Math.PI * 2 + (now / 500);
                    const dist = Math.random() * area.radius * 0.8;
                    const flameX = area.x + Math.cos(angle) * dist;
                    const flameY = area.y + Math.sin(angle) * dist;
                    const flameSize = 10 + Math.random() * 5;
                    ctx.font = `${flameSize}px sans-serif`;
                    ctx.fillText('🔥', flameX, flameY);
                }
                ctx.restore();
            });

            bloodSplatters.forEach(p => {
                const age = now - p.spawnTime;
                const alpha = 1 - (age / p.lifetime);
                ctx.save();
                ctx.globalAlpha = Math.max(0, alpha);
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            if (damagingCircleActive) {
                damagingCircleAngle += DAMAGING_CIRCLE_SPIN_SPEED;
                const pulse = 1 + Math.sin(now / 300) * 0.1;
                const size = DAMAGING_CIRCLE_RADIUS * 2 * pulse;
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.translate(player.x, player.y);
                ctx.rotate(damagingCircleAngle);
                ctx.drawImage(sprites.circle, -size / 2, -size / 2, size, size);
                ctx.restore();
            }

            for (const puddle of playerPuddles) {
                const age = now - puddle.spawnTime;
                const opacity = 1 - (age / puddle.lifetime);
                if (opacity > 0) {
                    ctx.save();
                    ctx.globalAlpha = opacity * 0.7;
                    ctx.drawImage(sprites.slime, puddle.x - puddle.size / 2, puddle.y - puddle.size / 2, puddle.size, puddle.size);
                    ctx.restore();
                }
            }

            for (const puddle of mosquitoPuddles) {
                const age = now - puddle.spawnTime;
                const opacity = 1 - (age / puddle.lifetime);
                if (opacity > 0) {
                    ctx.save();
                    ctx.globalAlpha = opacity * 0.5;
                    ctx.fillStyle = 'rgba(255, 0, 0, 1)';
                    ctx.beginPath();
                    ctx.arc(puddle.x, puddle.y, puddle.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            
            bloodPuddles.forEach(puddle => {
                const age = now - puddle.spawnTime;
                if (age < puddle.lifetime) {
                    const lifeRatio = age / puddle.lifetime;
                    const currentSize = puddle.initialSize * (1 - lifeRatio);
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.translate(puddle.x, puddle.y);
                    ctx.rotate(puddle.rotation);
                    ctx.drawImage(sprites.bloodPuddle, -currentSize / 2, -currentSize / 2, currentSize, currentSize);
                    ctx.restore();
                }
            });

            antiGravityPulses.forEach(pulse => {
                const age = now - pulse.spawnTime;
                const lifeRatio = age / pulse.duration;
                const currentRadius = ANTI_GRAVITY_RADIUS * lifeRatio;
                const alpha = 1 - lifeRatio;
                ctx.save();
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(pulse.x, pulse.y, currentRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            });

            blackHoles.forEach(hole => {
                const age = now - hole.spawnTime;
                const lifeRatio = age / hole.lifetime;
                const alpha = 1 - lifeRatio;
                ctx.save();
                const timeIntoDelay = now - hole.spawnTime;
                let currentRadius = hole.radius;
                let coreRadius = 20 * (1 - lifeRatio);
                if (timeIntoDelay < BLACK_HOLE_DELAY) {
                    const delayProgress = timeIntoDelay / BLACK_HOLE_DELAY;
                    currentRadius = hole.radius * delayProgress;
                    const pulse = 1 + Math.sin(now / 100) * 0.2;
                    coreRadius = 10 * pulse;
                    ctx.beginPath();
                    ctx.arc(hole.x, hole.y, currentRadius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(150, 0, 200, ${alpha * 0.1 * delayProgress})`;
                    ctx.fill();
                    ctx.strokeStyle = `rgba(200, 100, 255, ${alpha * 0.5 * delayProgress})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.arc(hole.x, hole.y, currentRadius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(50, 0, 100, ${alpha * 0.2})`;
                    ctx.fill();
                }
                ctx.beginPath();
                ctx.arc(hole.x, hole.y, coreRadius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                ctx.fill();
                ctx.restore();
            });
            
            smokeParticles.forEach(p => {
    ctx.save();
    // This is the correct way to apply the particle's alpha
    ctx.globalAlpha = p.alpha;
    
    // Draw the smoke particle
    ctx.font = `${p.size}px sans-serif`;
    ctx.fillText('💨', p.x, p.y);
    
    ctx.restore();
});

            enemies.forEach(enemy => {
                ctx.save();
                if (enemy.emoji === '👻') {
                    ctx.globalAlpha = enemy.isVisible ? 1.0 : 0.2;
                }
                if (enemy.isFrozen) ctx.filter = 'saturate(0.5) brightness(1.5) hue-rotate(180deg)';
                if (enemy.isSlowedByPuddle) ctx.filter = 'saturate(2) brightness(0.8)';
                
                const emojiToDraw = enemy.isBoss ? enemy.mimics : enemy.emoji;
                const preRenderedImage = preRenderedEntities[emojiToDraw];
                if(preRenderedImage) {
                    ctx.drawImage(preRenderedImage, enemy.x - preRenderedImage.width / 2, enemy.y - preRenderedImage.height / 2 + (enemy.bobOffset || 0));
                }

                if (enemy.isIgnited) {
                    if (Math.random() < 0.1) {
                        smokeParticles.push({ x: enemy.x + (Math.random() - 0.5) * enemy.size, y: enemy.y, dx: (Math.random() - 0.5) * 0.5, dy: -Math.random() * 1, size: 10 + Math.random() * 5, alpha: 0.7 });
                    }
                    ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.8);
                    ctx.font = `${enemy.size * 0.8}px sans-serif`;
                    ctx.fillText('🔥', enemy.x, enemy.y + (enemy.bobOffset || 0));
                }
                ctx.restore();
            });

            explosions.forEach(explosion => {
                const age = now - explosion.startTime;
                if (age < explosion.duration) {
                    const lifeRatio = age / explosion.duration;
                    const currentRadius = explosion.radius * lifeRatio;
                    const alpha = 1 - lifeRatio;
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(explosion.x, explosion.y, currentRadius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 165, 0, ${alpha * 0.7})`;
                    ctx.fill();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();
                }
            });

            vengeanceNovas.forEach(nova => {
                const age = now - nova.startTime;
                if (age < nova.duration) {
                    const lifeRatio = age / nova.duration;
                    const currentRadius = nova.maxRadius * lifeRatio;
                    const alpha = 1 - lifeRatio;
                    ctx.save();
                    ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.arc(nova.x, nova.y, currentRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            });

            for(const weapon of weaponPool) {
                if(!weapon.active) continue;
                ctx.save();
                ctx.translate(weapon.x, weapon.y);
                ctx.rotate(weapon.angle);
                if (flamingBulletsActive) ctx.filter = 'hue-rotate(30deg) saturate(5) brightness(1.5)';
                else if (magneticProjectileActive && iceProjectileActive) ctx.filter = 'hue-rotate(270deg) saturate(2)';
                else if (magneticProjectileActive) ctx.filter = 'hue-rotate(0deg) saturate(5) brightness(1.5)';
                else if (iceProjectileActive) ctx.filter = 'hue-rotate(180deg) saturate(2)';
                ctx.drawImage(sprites.bullet, -weapon.size / 2, -weapon.size / 2, weapon.size, weapon.size * 0.5);
                ctx.restore();
            }

            dogHomingShots.forEach(shot => {
                ctx.save();
                ctx.translate(shot.x, shot.y);
                ctx.rotate(shot.angle);
                ctx.filter = 'hue-rotate(0deg) saturate(5) brightness(1.5)';
                ctx.drawImage(sprites.bullet, -shot.size / 2, -shot.size / 2, shot.size, shot.size * 0.5);
                ctx.restore();
            });

            lightningBolts.forEach(bolt => {
                const preRendered = preRenderedEntities[bolt.emoji];
                if(preRendered) {
                    ctx.save();
                    ctx.translate(bolt.x, bolt.y);
                    ctx.rotate(bolt.angle + Math.PI / 2);
                    ctx.drawImage(preRendered, -preRendered.width/2, -preRendered.height/2);
                    ctx.restore();
                }
            });

            bombs.forEach(bomb => {
                const preRendered = preRenderedEntities['💣'];
                if(preRendered) ctx.drawImage(preRendered, bomb.x - preRendered.width/2, bomb.y - preRendered.height/2);
            });

            const drawGlimmer = (item) => {
                const glimmerDuration = 1000;
                const timeSinceStart = (now - item.glimmerStartTime) % 2000;
                if (timeSinceStart < glimmerDuration) {
                    const progress = timeSinceStart / glimmerDuration;
                    const alpha = Math.sin(progress * Math.PI);
                    const size = item.size * (1 + progress * 0.5);
                    ctx.save();
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(item.x, item.y, size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            };

            pickupItems.forEach(item => {
                drawGlimmer(item);
                if (item.type === 'box') { 
                    ctx.drawImage(sprites.pickupBox, item.x - item.size / 2, item.y - item.size / 2, item.size, item.size); 
                } else {
                    const preRendered = preRenderedEntities[item.type];
                    if(preRendered) ctx.drawImage(preRendered, item.x - preRendered.width/2, item.y - preRendered.height/2);
                }
            });
            
            appleItems.forEach(item => { 
                drawGlimmer(item);
                const preRendered = preRenderedEntities[APPLE_ITEM_EMOJI];
                if(preRendered) ctx.drawImage(preRendered, item.x - preRendered.width/2, item.y - preRendered.height/2);
            });
            eyeProjectiles.forEach(proj => { 
                const preRendered = preRenderedEntities[proj.emoji];
                if(preRendered) ctx.drawImage(preRendered, proj.x - preRendered.width/2, proj.y - preRendered.height/2);
            });
            
            merchants.forEach(m => {
    ctx.save();
    ctx.font = `${m.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧙‍♂️', m.x, m.y);
    ctx.restore();
});
            
            const bobOffset = player.isDashing ? 0 : Math.sin(player.stepPhase) * BOB_AMPLITUDE;
            const spinDuration = 500; // 0.5 seconds

            const FOOT_SIZE = 8; const FOOT_OFFSET_X = 2; const FOOT_OFFSET_Y = 2;
            const STEP_LENGTH = 10; const stepOffset = Math.sin(player.stepPhase) * STEP_LENGTH;
            
            const isSpinning = player.spinStartTime && now < player.spinStartTime + spinDuration;
            if(!player.isDashing && !isSpinning){
                ctx.save();
                ctx.translate(player.x, player.y + bobOffset);
                ctx.rotate(player.rotationAngle - Math.PI / 2);
                ctx.fillStyle = '#322110';
                ctx.beginPath(); ctx.arc(-FOOT_OFFSET_X, FOOT_OFFSET_Y + stepOffset, FOOT_SIZE, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(FOOT_OFFSET_X, FOOT_OFFSET_Y - stepOffset, FOOT_SIZE, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }

            let playerSprite;
            switch (player.facing) {
                case 'up': playerSprite = sprites.playerUp; break;
                case 'down': playerSprite = sprites.playerDown; break;
                case 'left': playerSprite = sprites.playerLeft; break;
                case 'right': playerSprite = sprites.playerRight; break;
                default: playerSprite = sprites.playerDown;
            }
            
            ctx.save();
            ctx.translate(player.x, player.y + bobOffset);
            if (isSpinning) {
                const spinProgress = (now - player.spinStartTime) / spinDuration;
                const rotation = spinProgress * 2.1 * Math.PI * player.spinDirection;
                ctx.rotate(rotation);
            }
            ctx.drawImage(playerSprite, -player.size / 2, -player.size / 2, player.size, player.size);
            ctx.restore();


            // Dash Cooldown Bar
            const dashCharge = Math.min(1, (now - player.lastDashTime) / player.dashCooldown);
            if (dashCharge < 1) {
                const barWidth = player.size * 0.8;
                const barX = player.x - barWidth / 2;
                const barY = player.y + player.size / 2 + 4;
                ctx.fillStyle = '#444';
                ctx.fillRect(barX, barY, barWidth, 4);
                ctx.fillStyle = '#00FFFF';
                ctx.fillRect(barX, barY, barWidth * dashCharge, 4);
            }

            // Dash Invincibility Shield
            if (player.isInvincible) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#007BFF';
                ctx.beginPath();
                ctx.arc(player.x, player.y, player.size / 2 + 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }


            if (aimDx !== 0 || aimDy !== 0 || autoAimActive) {
                const aimAngle = player.rotationAngle;
                ctx.save();
                ctx.translate(player.x, player.y + bobOffset);
                ctx.rotate(aimAngle);
                if (aimAngle > Math.PI / 2 || aimAngle < -Math.PI / 2) { ctx.scale(1, -1); }
                const gunWidth = player.size * 0.8;
                const gunHeight = gunWidth * (sprites.gun.height / sprites.gun.width);
                const gunXOffset = player.size / 4;
                const gunYOffset = -gunHeight / 2;
                ctx.drawImage(sprites.gun, gunXOffset, gunYOffset, gunWidth, gunHeight);
                if (dualGunActive) { ctx.save(); ctx.scale(-1, 1); ctx.drawImage(sprites.gun, -gunXOffset, gunYOffset, gunWidth, gunHeight); ctx.restore(); }
                if (laserPointerActive) {
                    ctx.save(); ctx.beginPath();
                    const startX = gunXOffset + gunWidth * 0.9; const startY = gunYOffset + gunHeight / 2;
                    ctx.moveTo(startX, startY); 
                    const isMobile = document.body.classList.contains('is-mobile');
                    if (isMobile) { ctx.lineTo(1000, startY); } 
                    else {
                        const worldMouseX = mouseX / cameraZoom + finalCameraOffsetX; const worldMouseY = mouseY / cameraZoom + finalCameraOffsetY;
                        const rotatedMouseX = (worldMouseX - (player.x)) * Math.cos(-aimAngle) - (worldMouseY - (player.y + bobOffset)) * Math.sin(-aimAngle);
                        ctx.lineTo(rotatedMouseX, startY);
                    }
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'; ctx.lineWidth = 1; ctx.stroke();
                    ctx.restore();
                }
                ctx.restore();
            }
            
            if (doppelganger) {
                ctx.save();
                ctx.globalAlpha = 0.6; ctx.filter = 'hue-rotate(180deg)';
                ctx.drawImage(playerSprite, doppelganger.x - doppelganger.size / 2, doppelganger.y - doppelganger.size / 2, doppelganger.size, doppelganger.size);
                const gunWidth = doppelganger.size * 0.8; const gunHeight = gunWidth * (sprites.gun.height / sprites.gun.width);
                const gunXOffset = doppelganger.size / 4; const gunYOffset = -gunHeight / 2;
                ctx.translate(doppelganger.x, doppelganger.y); ctx.rotate(doppelganger.rotationAngle);
                if (doppelganger.rotationAngle > Math.PI / 2 || doppelganger.rotationAngle < -Math.PI / 2) { ctx.scale(1, -1); }
                ctx.drawImage(sprites.gun, gunXOffset, gunYOffset, gunWidth, gunHeight);
                ctx.restore();
            }

            if (orbitingPowerUpActive && sprites.spinninglight) {
                const orbitX = player.x + ORBIT_RADIUS * Math.cos(player.orbitAngle);
                const orbitY = player.y + ORBIT_RADIUS * Math.sin(player.orbitAngle);
                orbitingImageAngle -= 0.2;
                ctx.save();
                ctx.translate(orbitX, orbitY);
                ctx.rotate(orbitingImageAngle);
                ctx.drawImage(sprites.spinninglight, -ORBIT_POWER_UP_SIZE / 2, -ORBIT_POWER_UP_SIZE / 2, ORBIT_POWER_UP_SIZE, ORBIT_POWER_UP_SIZE);
                ctx.restore();
            }

            if (player.swordActive && player.currentSwordSwing) {
                const swingProgress = (now - player.currentSwordSwing.startTime) / SWORD_SWING_DURATION;
                let currentOffset = player.size / 2 + (swingProgress >= 0 && swingProgress <= 1 ? SWORD_THRUST_DISTANCE * Math.sin(swingProgress * Math.PI) : 0);
                ctx.save();
                ctx.translate(player.currentSwordSwing.x, player.currentSwordSwing.y);
                ctx.rotate(player.currentSwordSwing.angle);
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(currentOffset, -2, 20, 4);
                ctx.restore();
            }

            if (dogCompanionActive) {
                const preRendered = preRenderedEntities['🐶'];
                if(preRendered) ctx.drawImage(preRendered, dog.x - preRendered.width/2, dog.y - preRendered.height/2);
            }
            
            if (player2 && player2.active) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.beginPath(); ctx.arc(player2.x, player2.y, player2.size / 2, 0, Math.PI * 2); ctx.fill();
                let p2Sprite;
                switch (player2.facing) {
                    case 'up': p2Sprite = sprites.playerUp; break;
                    case 'down': p2Sprite = sprites.playerDown; break;
                    case 'left': p2Sprite = sprites.playerLeft; break;
                    case 'right': p2Sprite = sprites.playerRight; break;
                    default: p2Sprite = sprites.playerDown;
                }

                const isP2Spinning = player2.spinStartTime && now < player2.spinStartTime + spinDuration;
                
                ctx.save();
                ctx.translate(player2.x, player2.y);
                if(isP2Spinning) {
                    const spinProgress = (now - player2.spinStartTime) / spinDuration;
                    const rotation = spinProgress * 2 * Math.PI * player2.spinDirection;
                    ctx.rotate(rotation);
                }
                ctx.drawImage(p2Sprite, -player2.size / 2, -player2.size / 2, player2.size, player2.size);
                ctx.restore();
                
                ctx.save();
                ctx.translate(player2.x, player2.y);
                ctx.rotate(player2.gunAngle);
                if (player2.gunAngle > Math.PI / 2 || player2.gunAngle < -Math.PI / 2) { ctx.scale(1, -1); }
                const gunWidth = player2.size * 0.8; const gunHeight = gunWidth * (sprites.gun.height / sprites.gun.width);
                ctx.drawImage(sprites.gun, player2.size / 4, -gunHeight / 2, gunWidth, gunHeight);
                ctx.restore();
                 // P2 Dash Cooldown Bar
                const p2DashCharge = Math.min(1, (now - player2.lastDashTime) / player2.dashCooldown);
                if (p2DashCharge < 1) {
                    const barWidth = player2.size * 0.8;
                    const barX = player2.x - barWidth / 2;
                    const barY = player2.y + player2.size / 2 + 4;
                    ctx.fillStyle = '#444';
                    ctx.fillRect(barX, barY, barWidth, 4);
                    ctx.fillStyle = '#00FFFF';
                    ctx.fillRect(barX, barY, barWidth * p2DashCharge, 4);
                }
            }
            flies.forEach(fly => {
                const color = Math.floor(now / 100) % 2 === 0 ? 'red' : 'black';
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(fly.x, fly.y, FLY_SIZE / 2, 0, Math.PI * 2);
                ctx.fill();
            });
            if (nightOwlActive && owl) {
                const preRendered = preRenderedEntities['🦉'];
                if(preRendered) ctx.drawImage(preRendered, owl.x - preRendered.width/2, owl.y - preRendered.height/2);
                
                owlProjectiles.forEach(proj => {
                    ctx.save();
                    ctx.translate(proj.x, proj.y); ctx.rotate(proj.angle);
                    ctx.fillStyle = '#FFFACD';
                    ctx.beginPath(); ctx.arc(0, 0, proj.size / 2, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                });
            }
            if (whirlwindAxeActive) {
                const axeX = player.x + WHIRLWIND_AXE_RADIUS * Math.cos(whirlwindAxeAngle);
                const axeY = player.y + WHIRLWIND_AXE_RADIUS * Math.sin(whirlwindAxeAngle);
                ctx.save();
                ctx.translate(axeX, axeY);
                ctx.rotate(whirlwindAxeAngle + Math.PI / 2);
                const preRendered = preRenderedEntities['🪓'];
                if(preRendered) ctx.drawImage(preRendered, -preRendered.width/2, -preRendered.height/2);
                ctx.restore();
            }
            lightningStrikes.forEach(strike => {
                const age = now - strike.startTime;
                const lifeRatio = age / strike.duration;
                const alpha = Math.sin(lifeRatio * Math.PI);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = 'yellow';
                ctx.fillRect(strike.x - 5, 0, 10, WORLD_HEIGHT);
                ctx.font = `40px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('⚡', strike.x, strike.y);
                ctx.restore();
            });


            floatingTexts.forEach(ft => {
                const elapsed = now - ft.startTime;
                const alpha = 1.0 - (elapsed / ft.duration);
                const yOffset = (elapsed / ft.duration) * 20; 
                ctx.save();
                ctx.globalAlpha = Math.max(0, alpha);
                ctx.font = 'bold 14px "Press Start 2P"';
                ctx.fillStyle = ft.color || '#FFFFFF';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.textAlign = 'center';
                ctx.strokeText(ft.text, ft.x, ft.y - yOffset);
                ctx.fillText(ft.text, ft.x, ft.y - yOffset);
                ctx.restore();
            });

            ctx.restore();
            ctx.restore();
            
            if (isTimeStopped) {
                const timeLeft = timeStopEndTime - now;
                const duration = 2000;
                let alpha = 0;
                if (timeLeft > duration - 250) { alpha = 1 - (timeLeft - (duration - 250)) / 250; } 
                else if (timeLeft < 500) { alpha = timeLeft / 500; } 
                else { alpha = 1; }
                alpha = Math.max(0, Math.min(alpha, 1)); 
                ctx.save();
                ctx.fillStyle = `rgba(0, 100, 255, ${alpha * 0.4})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }

            if (isMouseInCanvas && gameActive && sprites.crosshair) {
                const reticleSize = 16;
                ctx.drawImage(sprites.crosshair, mouseX - reticleSize / 2, mouseY - reticleSize / 2, reticleSize, reticleSize);
            }
        }





        function gameLoop() {
            update();
            handleGamepadInput();
            draw();
            updateUIStats();
            if (!gameOver && gameActive) animationFrameId = requestAnimationFrame(gameLoop);
        }

        let playerData = {};
        const PERMANENT_UPGRADES = {
            playerDamage: { name: "Weapon Power", desc: "Permanently increase base damage by 2%.", baseCost: 100, costIncrease: 1.2, effect: 0.02, maxLevel: 10, icon: '💥' },
            playerSpeed: { name: "Movement Speed", desc: "Permanently increase base movement speed by 1.5%.", baseCost: 80, costIncrease: 1.2, effect: 0.015, maxLevel: 10, icon: '🏃' },
            xpGain: { name: "XP Gain", desc: "Gain 3% more experience from all sources.", baseCost: 90, costIncrease: 1.2, effect: 0.03, maxLevel: 10, icon: '📈' },
            enemyHealth: { name: "Weaken Foes", desc: "Enemies spawn with 2% less health.", baseCost: 150, costIncrease: 1.25, effect: -0.02, maxLevel: 5, icon: '💔' },
            magnetRadius: { name: "Pickup Radius", desc: "Increase pickup attraction radius by 4%.", baseCost: 60, costIncrease: 1.2, effect: 0.04, maxLevel: 10, icon: '🧲' },
            luck: { name: "Luck", desc: "Increase the chance for better drops by 0.1%.", baseCost: 200, costIncrease: 1.3, effect: 0.001, maxLevel: 5, icon: '🍀' }
        };
        
        const ALWAYS_AVAILABLE_PICKUPS = {
            v_shape_projectile: { id:'v_shape_projectile', name: 'V-Shape Shots'}, magnetic_projectile: { id:'magnetic_projectile', name: 'Magnetic Shots'},
            ice_projectile: { id:'ice_projectile', name: 'Ice Projectiles'}, ricochet: { id:'ricochet', name: 'Ricochet Shots'},
            explosive_bullets: { id: 'explosive_bullets', name: 'Explosive Bullets'}, puddle_trail: { id:'puddle_trail', name: 'Slime Trail'},
            sword: { id:'sword', name: 'Auto-Sword'}, laser_pointer: { id: 'laser_pointer', name: 'Laser Pointer'},
            auto_aim: { id: 'auto_aim', name: 'Auto Aim'}, dual_gun: { id: 'dual_gun', name: 'Dual Gun'},
            bomb: { id:'bomb', name: 'Bomb Emitter'}, orbiter: { id:'orbiter', name: 'Spinning Orbiter'},
            lightning_projectile: { id:'lightning_projectile', name: 'Lightning Projectile'}
        };

        const UNLOCKABLE_PICKUPS = {
            map_select: { name: "Map Select", desc: "Unlocks the ability to choose your map.", cost: 1500, icon: '🗺️' },
            night_owl: { name: "Night Owl", desc: "Unlocks a companion that snipes enemies.", cost: 1300, icon: '🦉' },
            whirlwind_axe: { name: "Whirlwind Axe", desc: "Unlocks a large, damaging orbiting axe.", cost: 1000, icon: '🪓' },
            doppelganger: { name: "Doppelganger", desc: "Unlocks the doppelganger pickup.", cost: 1200, icon: '👯' },
            dog_companion: { name: "Dog Companion", desc: "Unlocks the loyal dog companion pickup.", cost: 500, icon: '🐶' },
            anti_gravity: { name: "Anti-Gravity", desc: "Unlocks the enemy-repelling pulse pickup.", cost: 600, icon: '💨' },
            temporal_ward: { name: "Temporal Ward", desc: "Unlocks the time-freezing defensive pickup.", cost: 800, icon: '⏱️' },
            rocket_launcher: { name: "Heavy Shells", desc: "Unlocks the powerful heavy shells pickup.", cost: 1100, icon: '🚀' },
            circle: { name: "Damaging Circle", desc: "Unlocks the persistent damaging aura pickup.", cost: 900, icon: '⭕' },
            flaming_bullets: { name: "Flaming Bullets", desc: "Unlocks bullets that ignite enemies.", cost: 1150, icon: '🔥' },
            black_hole: { name: "Black Hole", desc: "Unlocks the enemy-vortex pickup.", cost: 1180, icon: '⚫' },
            vengeance_nova: { name: "Vengeance Nova", desc: "Unlocks the defensive blast pickup.", cost: 700, icon: '🛡️' }
        };





function showCharacterSelectScreen() {
            difficultyContainer.style.display = 'none';
            characterSelectContainer.style.display = 'block';
            characterTilesContainer.innerHTML = ''; // Clear previous tiles

            // Loop through each character in the CHARACTERS object
            Object.values(CHARACTERS).forEach(character => {
                let isUnlocked = false;

                // Determine if the character is unlocked
                if (character.unlockCondition.type === 'start') {
                    isUnlocked = true;
                } else if (character.unlockCondition.type === 'achievement') {
                    // Check if the required achievement has been unlocked in playerStats
                    if (ACHIEVEMENTS[character.unlockCondition.id] && ACHIEVEMENTS[character.unlockCondition.id].unlocked) {
                        isUnlocked = true;
                    }
                }

                const tile = document.createElement('div');
                tile.className = 'character-tile';
                if (!isUnlocked) {
                    tile.classList.add('locked');
                }
                 if (equippedCharacterID === character.id) {
                    tile.classList.add('selected');
                }

                // Create the content for the tile
                tile.innerHTML = `
                    <p class="char-emoji">${character.emoji}</p>
                    <h4 class="char-name">${character.name}</h4>
                    <p class="char-perk">${isUnlocked ? character.perk : 'LOCKED'}</p>
                `;

                // Add a click event listener only if the character is unlocked
                if (isUnlocked) {
                    tile.addEventListener('click', () => {
                        playUISound('levelUpSelect');
                        vibrate(10);
                        equippedCharacterID = character.id;
                        
                        // Go back to the main menu after selecting
                        characterSelectContainer.style.display = 'none';
                        difficultyContainer.style.display = 'block';
                    });
                }

                characterTilesContainer.appendChild(tile);
            });
        }
        window.onload = function() {
            if (isMobileDevice) { document.body.classList.add('is-mobile'); }
            
            loadPlayerData();
            loadPlayerStats();
            loadCheats();
            displayHighScores();

            resizeCanvas();
            gameContainer.style.display = 'none'; 
            difficultyContainer.style.display = 'none';
            mapSelectContainer.style.display = 'none'; 
            characterSelectContainer.style.display = 'none';
            movementStickBase.style.display = 'none';
            firestickBase.style.display = 'none'; 
            upgradeMenu.style.display = 'none';
            gameOverlay.style.display = 'none'; 
            gameGuideModal.style.display = 'none';
            achievementsModal.style.display = 'none'; 
            cheatsModal.style.display = 'none';
            pauseButton.style.display = 'none';

            startButton.addEventListener('click', () => {
                Tone.start().then(() => {
                    console.log("AudioContext started by user.");
                    showInitialScreen();
                });
            }, { once: true });
            
            [gameGuideModal, achievementsModal, cheatsModal, merchantShop].forEach(modal => {
                if(modal){
                    const content = modal.querySelector('.content-wrapper') || modal.querySelector('.merchant-options-container');
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) { 
                            if(modal.id === 'merchantShop') closeMerchantShop();
                            else modal.style.display = 'none';
                        }
                    });
                    if(content) {
                        content.addEventListener('click', (e) => e.stopPropagation());
                        content.addEventListener('touchstart', (e) => e.stopPropagation());
                    }
                }
            });

            difficultyButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    vibrate(10);
                    playUISound('uiClick');
                    currentDifficulty = e.target.dataset.difficulty;
                    if (playerData.unlockedPickups.map_select) {
                        showMapSelectScreen();
                    } else {
                        selectedMapIndex = -1;
                        startGame();
                    }
                });
                button.addEventListener('mouseover', () => playUISound('uiClick'));
            });
            if (howToPlayButton) {
                howToPlayButton.addEventListener('click', async () => { 
                    vibrate(10);
                    if (difficultyContainer) difficultyContainer.style.display = 'none';
                    if (gameGuideModal) gameGuideModal.style.display = 'flex';
                });
                howToPlayButton.addEventListener('mouseover', () => playUISound('uiClick'));
            }
            if (backToDifficultyButton) {
                backToDifficultyButton.addEventListener('click', () => {
                    vibrate(10);
                    if (gameGuideModal) gameGuideModal.style.display = 'none';
                    if (difficultyContainer) difficultyContainer.style.display = 'block';
                });
            }
            
            backToDifficultySelectButton.addEventListener('click', () => {
                vibrate(10); playUISound('uiClick');
                selectedMapIndex = -1;
                mapSelectContainer.style.display = 'none'; difficultyContainer.style.display = 'block';
            });
            
            characterSelectButton.addEventListener('click', () => {
                vibrate(10); playUISound('uiClick');
                showCharacterSelectScreen();
            });

             backToMenuFromCharsButton.addEventListener('click', () => {
                vibrate(10); playUISound('uiClick');
                characterSelectContainer.style.display = 'none';
                difficultyContainer.style.display = 'block';
            });


            const openShopAction = () => { vibrate(10); playUISound('uiClick'); openUpgradeShop(); };
            desktopUpgradesButton.addEventListener('click', openShopAction);
            if (mobileMenuUpgradesButton) mobileMenuUpgradesButton.addEventListener('click', openShopAction);


            backToMenuButton.addEventListener('click', () => { vibrate(10); playUISound('uiClick'); showDifficultyScreen(); });
            
            const resetAction = () => { vibrate(20); resetAllData(); };
            desktopResetButton.addEventListener('click', resetAction);
            mobileResetButton.addEventListener('click', resetAction);
            
            const achievementsAction = () => {
                vibrate(10); playUISound('uiClick');
                difficultyContainer.style.display = 'none';
                displayAchievements();
                achievementsModal.style.display = 'flex';
            };
            desktopAchievementsButton.addEventListener('click', achievementsAction);
            if(mobileMenuTrophiesButton) mobileMenuTrophiesButton.addEventListener('click', achievementsAction);

            
            const cheatsAction = () => {
                vibrate(10); playUISound('uiClick');
                achievementsModal.style.display = 'none';
                displayCheats();
                cheatsModal.style.display = 'flex';
            };
            cheatsMenuButton.addEventListener('click', cheatsAction);
            if(mobileMenuCheatsButton) mobileMenuCheatsButton.addEventListener('click', cheatsAction);
            
            backToMenuFromAchievements.addEventListener('click', () => {
                vibrate(10); playUISound('uiClick');
                achievementsModal.style.display = 'none';
                difficultyContainer.style.display = 'block';
            });
             backToAchievementsButton.addEventListener('click', () => {
                vibrate(10); playUISound('uiClick');
                cheatsModal.style.display = 'none';
                displayAchievements();
                achievementsModal.style.display = 'flex';
            });

            if(pauseButton) {
                pauseButton.addEventListener('click', togglePause);
                pauseButton.addEventListener('touchstart', (e) => { e.preventDefault(); vibrate(10); togglePause(); });
            }

            if(resumeButton) {
                const resumeAction = (e) => { e.preventDefault(); vibrate(10); playUISound('uiClick'); togglePause(); };
                resumeButton.addEventListener('click', resumeAction);
                resumeButton.addEventListener('touchstart', resumeAction);
            }
            
            leaveMerchantButton.addEventListener('click', () => {
                vibrate(10);
                playUISound('uiClick');
                closeMerchantShop();
            });

            musicVolumeSlider.addEventListener('input', (e) => { if (currentBGMPlayer) { currentBGMPlayer.volume.value = e.target.value; } });
            effectsVolumeSlider.addEventListener('input', (e) => {
                const newVolume = parseFloat(e.target.value);
                for (const key in audioPlayers) { if (audioPlayers.hasOwnProperty(key)) { audioPlayers[key].volume.value = newVolume; } }
                swordSwingSynth.volume.value = newVolume; eyeProjectileHitSynth.volume.value = newVolume; bombExplosionSynth.volume.value = newVolume;
            });
            zoomToggle.addEventListener('change', (e) => { cameraZoom = e.target.checked ? 1.4 : 1.0; });
            pauseRestartButton.addEventListener('click', () => {
                playUISound('uiClick'); vibrate(10); togglePause(); endGame(); showDifficultyScreen();
            });
            
        };
