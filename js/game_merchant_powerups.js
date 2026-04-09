// Merchant UI + powerup activation (kept separate from the main sim/render loop).

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
    name: 'Gain Experience',
    desc: 'A hearty meal to fuel your journey.',
    icon: '📈',
    cost: 3,
    currency: 'apples',
    xpAmount: player.xpToNextLevel, // Give a full level up's worth
    enabled: canAffordXp
  });

  // Options 2 & 3: Buy a random powerup with coins
  const availablePowerups = [];
  if (!magneticProjectileActive) availablePowerups.push({ id: 'magnetic_projectile', name: 'Magnetic Shots', icon: '🧲' });
  if (!explosiveBulletsActive) availablePowerups.push({ id: 'explosive_bullets', name: 'Explosive Bullets', icon: '💥' });
  if (!ricochetActive) availablePowerups.push({ id: 'ricochet', name: 'Ricochet Shots', icon: '🔄' });
  if (!player.swordActive) availablePowerups.push({ id: 'sword', name: 'Auto-Sword', icon: '🗡️' });
  if (!dogCompanionActive && playerData.unlockedPickups.dog_companion) availablePowerups.push({ id: 'dog_companion', name: 'Dog Companion', icon: '🐶' });
  if (!nightOwlActive && playerData.unlockedPickups.night_owl) availablePowerups.push({ id: 'night_owl', name: 'Night Owl', icon: '🦉' });

  for (let i = availablePowerups.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availablePowerups[i], availablePowerups[j]] = [availablePowerups[j], availablePowerups[i]];
  }

  const powerupsToSell = availablePowerups.slice(0, 2);
  powerupsToSell.forEach((powerup) => {
    const coinCost = 50 + Math.floor(player.level * 5);
    options.push({
      type: 'buy_powerup',
      name: powerup.name,
      desc: 'A powerful artifact.',
      icon: powerup.icon,
      cost: coinCost,
      currency: 'coins',
      powerupId: powerup.id,
      enabled: player.coins >= coinCost
    });
  });

  // Create the cards
  options.forEach((option) => {
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
  else if (id === 'dog_companion') { dogCompanionActive = true; dog.x = player.x; dog.y = player.y; dog.state = 'returning'; }
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

  // Achievement tracking for powerups (count + unique).
  if (typeof runStats !== 'undefined') {
    if (typeof runStats.powerupsPickedUp !== 'number' || !Number.isFinite(runStats.powerupsPickedUp)) runStats.powerupsPickedUp = 0;
    runStats.powerupsPickedUp++;
    if (!runStats.uniquePowerupsPickedUp || typeof runStats.uniquePowerupsPickedUp !== 'object') runStats.uniquePowerupsPickedUp = {};
    runStats.uniquePowerupsPickedUp[id] = true;
  }
  checkAchievements();
  updatePowerupIconsUI();
}

