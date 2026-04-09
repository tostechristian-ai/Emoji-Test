// ================================================================================= //
// ========================= ENEMY CONFIGURATIONS & SPAWNING ======================== //
// ================================================================================= //

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
const BOSSED_ENEMY_TYPES = ['🧟', '💀', '👹', '🧟‍♀️', '🦇', '🦟'];

let lastBossLevelSpawned = 0;

function createEnemy(x_pos, y_pos, type) {
    let x, y, enemyEmoji;
    if (x_pos !== undefined && y_pos !== undefined && type !== undefined) {
        x = x_pos;
        y = y_pos;
        enemyEmoji = type;
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