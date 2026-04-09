        function loadPlayerData() {
            try {
                const savedData = localStorage.getItem('emojiSurvivorData');
                if (savedData) {
                    playerData = JSON.parse(savedData);
                    for (const key in PERMANENT_UPGRADES) { if (!playerData.upgrades.hasOwnProperty(key)) { playerData.upgrades[key] = 0; } }
                    if (!playerData.unlockedPickups) { playerData.unlockedPickups = {}; }
                    for (const key in UNLOCKABLE_PICKUPS) { if (!playerData.unlockedPickups.hasOwnProperty(key)) { playerData.unlockedPickups[key] = false; } }
                } else { initializePlayerData(); }
            } catch (e) { console.error("Failed to load player data", e); initializePlayerData(); }
        }

        function initializePlayerData() {
            playerData = { currency: 0, upgrades: {}, unlockedPickups: {}, hasReducedDashCooldown: false };
            for (const key in PERMANENT_UPGRADES) { playerData.upgrades[key] = 0; }
            for (const key in UNLOCKABLE_PICKUPS) { playerData.unlockedPickups[key] = false; }
        }

        function savePlayerData() { try { localStorage.setItem('emojiSurvivorData', JSON.stringify(playerData)); } catch (e) { console.error("Failed to save player data.", e); } }
        function openUpgradeShop() { difficultyContainer.style.display = 'none'; upgradeShop.style.display = 'flex'; displayUpgrades(); }



        function displayUpgrades() {
            currencyDisplay.textContent = `Coins: ${playerData.currency} 🪙`;
            permanentUpgradesContainer.innerHTML = ''; unlockablePickupsContainer.innerHTML = '';
            for (const key in PERMANENT_UPGRADES) {
                const config = PERMANENT_UPGRADES[key];
                const currentLevel = playerData.upgrades[key] || 0;
                const cost = Math.floor(config.baseCost * Math.pow(config.costIncrease, currentLevel));
                const card = document.createElement('div'); card.className = 'permanent-upgrade-card';
                let buttonHTML = `<button onclick="buyUpgrade('${key}')">Buy (${cost} 🪙)</button>`;
                if (currentLevel >= config.maxLevel) { buttonHTML = `<button disabled>MAX</button>`; } 
                else if (playerData.currency < cost) { buttonHTML = `<button disabled>Buy (${cost} 🪙)</button>`; }
                card.innerHTML = `<h4>${config.icon} ${config.name}</h4><p>${config.desc}</p><div class="upgrade-level">Level: ${currentLevel} / ${config.maxLevel}</div>${buttonHTML}`;
                permanentUpgradesContainer.appendChild(card);
            }
            for (const key in UNLOCKABLE_PICKUPS) {
                const config = UNLOCKABLE_PICKUPS[key];
                const isUnlocked = playerData.unlockedPickups[key];
                const card = document.createElement('div'); card.className = 'permanent-upgrade-card';
                card.style.borderColor = isUnlocked ? '#FFD700' : '#F44336';
                let buttonHTML = `<button onclick="buyUnlockable('${key}')">Unlock (${config.cost} 🪙)</button>`;
                if (isUnlocked) { buttonHTML = `<button disabled>Unlocked</button>`; } 
                else if (playerData.currency < config.cost) { buttonHTML = `<button disabled>Unlock (${config.cost} 🪙)</button>`; }
                card.innerHTML = `<h4>${config.icon} ${config.name}</h4><p>${config.desc}</p>${buttonHTML}`;
                unlockablePickupsContainer.appendChild(card);
            }
        }

        function buyUpgrade(key) {
            const config = PERMANENT_UPGRADES[key];
            const currentLevel = playerData.upgrades[key] || 0;
            const cost = Math.floor(config.baseCost * Math.pow(config.costIncrease, currentLevel));
            if (playerData.currency >= cost && currentLevel < config.maxLevel) {
                playerData.currency -= cost; playerData.upgrades[key]++;
                savePlayerData(); displayUpgrades(); playUISound('levelUpSelect');
            }
        }
        
        function buyUnlockable(key) {
            const config = UNLOCKABLE_PICKUPS[key];
            const isUnlocked = playerData.unlockedPickups[key];
            if (playerData.currency >= config.cost && !isUnlocked) {
                playerData.currency -= config.cost; playerData.unlockedPickups[key] = true;
                savePlayerData(); displayUpgrades(); playUISound('levelUpSelect');
                checkAchievements(); 
            }
        }

        function applyPermanentUpgrades() {
            player.damageMultiplier = 1 + (playerData.upgrades.playerDamage || 0) * PERMANENT_UPGRADES.playerDamage.effect;
            player.speed = 1.4 * (1 + (playerData.upgrades.playerSpeed || 0) * PERMANENT_UPGRADES.playerSpeed.effect);
            baseEnemySpeed = 0.84 * (1 + (playerData.upgrades.enemyHealth || 0) * PERMANENT_UPGRADES.enemyHealth.effect);
            player.magnetRadius = (player.size * 2) * (1 + (playerData.upgrades.magnetRadius || 0) * PERMANENT_UPGRADES.magnetRadius.effect);
            const luckBonus = (playerData.upgrades.luck || 0) * PERMANENT_UPGRADES.luck.effect;
            boxDropChance = 0.01 + luckBonus; appleDropChance = 0.05 + luckBonus;
        }

        function resetAllData() {
            const userConfirmed = window.confirm("Are you sure you want to reset all your progress? This will erase your coins, upgrades, high scores, and ALL achievements permanently.");
            if (userConfirmed) {
                localStorage.removeItem('emojiSurvivorData');
                localStorage.removeItem('highScores');
                localStorage.removeItem('emojiSurvivorStats');
                localStorage.removeItem('emojiSurvivorCheats');
                initializePlayerData();
                initializePlayerStats();
                loadCheats();
                displayHighScores();
                console.log("All player data has been reset.");
            }
        }

        function spawnInitialObstacles() {
            destructibles.length = 0;
            const playerSafeRadius = 200;
            const spawnPos = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };

            const barrelCount = 5;
            for (let i = 0; i < barrelCount; i++) {
                let x, y, dist;
                do {
                    x = Math.random() * WORLD_WIDTH;
                    y = Math.random() * WORLD_HEIGHT;
                    dist = Math.hypot(x - spawnPos.x, y - spawnPos.y);
                } while (dist < playerSafeRadius);
                destructibles.push({ x, y, size: 15, health: 1, maxHealth: 1, emoji: '🛢️' });
            }
             const brickCount = 4;
             for (let i = 0; i < brickCount; i++) {
                let x, y, dist;
                do {
                    x = Math.random() * WORLD_WIDTH;
                    y = Math.random() * WORLD_HEIGHT;
                    dist = Math.hypot(x - spawnPos.x, y - spawnPos.y);
                } while (dist < playerSafeRadius);
                destructibles.push({ x, y, size: 30, health: Infinity, emoji: '🧱' });
            }
        }

        function spawnRandomBarrel() {
            const spawnMargin = 50; let x, y;
            const edge = Math.floor(Math.random() * 4);
            switch(edge) {
                case 0: x = Math.random() * WORLD_WIDTH; y = -spawnMargin; break;
                case 1: x = WORLD_WIDTH + spawnMargin; y = Math.random() * WORLD_HEIGHT; break;
                case 2: x = Math.random() * WORLD_WIDTH; y = WORLD_HEIGHT + spawnMargin; break;
                case 3: x = -spawnMargin; y = Math.random() * WORLD_HEIGHT; break;
            }
             destructibles.push({ x: x, y: y, size: 15, health: 1, maxHealth: 1, emoji: '🛢️' });
        }

        function handleBarrelDestruction(barrel) {
            playSound('enemyDeath');
            const explosionRadius = 54;
            flameAreas.push({ x: barrel.x, y: barrel.y, radius: explosionRadius, startTime: Date.now(), endTime: Date.now() + 3000 });
            enemies.forEach(enemy => {
                if (!enemy.isHit) {
                    const dx = enemy.x - barrel.x;
                    const dy = enemy.y - barrel.y;
                    if (dx*dx + dy*dy < explosionRadius*explosionRadius) {
                        enemy.health -= 2;
                        createBloodSplatter(enemy.x, enemy.y);
                        if (enemy.health <= 0) { handleEnemyDeath(enemy); }
                    }
                }
            });
        }
        
       function showMapSelectScreen() {
        
            difficultyContainer.style.display = 'none';
            mapSelectContainer.style.display = 'block';
            mapTilesContainer.innerHTML = '';

            const mapNames = [
                "Grass Map 1", 
                "Desert Map 1", 
                "Desert Map 2",
                "Lava Map 1",
                "Lava Map 2",
                "Desert Map 2",
                "Ice Map 1",
                "Grass Map 1",
                "Ice Map 2"
            ];
            
            backgroundPaths.forEach((path, index) => {
                const tile = document.createElement('div');
                tile.className = 'map-tile';
                tile.style.backgroundImage = `url('${backgroundImages[index].src}')`;
                tile.dataset.mapIndex = index;
                
                const label = document.createElement('p');
                
                label.textContent = mapNames[index] || `Map ${index + 1}`;
                
                tile.appendChild(label);
                
                tile.addEventListener('click', () => {
                    playUISound('uiClick');
                    vibrate(10);
                    selectedMapIndex = index;
                    startGame();
                });
                mapTilesContainer.appendChild(tile);
            });
        }

        