// ================================================================================= //
// ========================== UTILITIES & DATA STRUCTURES ========================== //
// ================================================================================= //

function getSafeToneTime() {
    let now = Tone.now();
    let lastTime = getSafeToneTime.lastTime || 0;
    if (now <= lastTime) {
        now = lastTime + 0.001;
    }
    getSafeToneTime.lastTime = now;
    return now;
}

class Quadtree {
    constructor(bounds, maxObjects = 10, maxLevels = 4, level = 0) {
        this.bounds = bounds;
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        this.objects = [];
        this.nodes = [];
    }
    clear() {
        this.objects = [];
        if (this.nodes.length) {
            for (let i = 0; i < this.nodes.length; i++) {
                this.nodes[i].clear();
            }
        }
        this.nodes = [];
    }
    split() {
        const nextLevel = this.level + 1;
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;

        this.nodes[0] = new Quadtree({ x: x + subWidth, y: y, width: subWidth, height: subHeight }, this.maxObjects, this.maxLevels, nextLevel);
        this.nodes[1] = new Quadtree({ x: x, y: y, width: subWidth, height: subHeight }, this.maxObjects, this.maxLevels, nextLevel);
        this.nodes[2] = new Quadtree({ x: x, y: y + subHeight, width: subWidth, height: subHeight }, this.maxObjects, this.maxLevels, nextLevel);
        this.nodes[3] = new Quadtree({ x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight }, this.maxObjects, this.maxLevels, nextLevel);
    }
    getIndex(pRect) {
        let index = -1;
        const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
        const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

        const topQuadrant = (pRect.y < horizontalMidpoint && pRect.y + pRect.height < horizontalMidpoint);
        const bottomQuadrant = (pRect.y > horizontalMidpoint);

        if (pRect.x < verticalMidpoint && pRect.x + pRect.width < verticalMidpoint) {
            if (topQuadrant) { index = 1; } else if (bottomQuadrant) { index = 2; }
        } else if (pRect.x > verticalMidpoint) {
            if (topQuadrant) { index = 0; } else if (bottomQuadrant) { index = 3; }
        }
        return index;
    }
    insert(pRect) {
        if (this.nodes.length) {
            const index = this.getIndex(pRect);
            if (index !== -1) {
                this.nodes[index].insert(pRect);
                return;
            }
        }
        this.objects.push(pRect);
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (!this.nodes.length) { this.split(); }
            let i = 0;
            while (i < this.objects.length) {
                const index = this.getIndex(this.objects[i]);
                if (index !== -1) {
                    this.nodes[index].insert(this.objects.splice(i, 1)[0]);
                } else {
                    i++;
                }
            }
        }
    }
    retrieve(pRect) {
        let returnObjects = this.objects;
        const index = this.getIndex(pRect);
        if (this.nodes.length && index !== -1) {
            returnObjects = returnObjects.concat(this.nodes[index].retrieve(pRect));
        } else if (this.nodes.length) {
            for(let i=0; i < this.nodes.length; i++) {
                returnObjects = returnObjects.concat(this.nodes[i].retrieve(pRect));
            }
        }
        return returnObjects;
    }
}

// ================================================================================= //
// ============================== DOM ELEMENTS ===================================== //
// ================================================================================= //
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const movementStickBase = document.getElementById('movement-stick-base');
const movementStickCap = document.getElementById('movement-stick-cap');
const firestickBase = document.getElementById('fire-stick-base');
const firestickCap = document.getElementById('fire-stick-cap');

const currentLevelSpan = document.getElementById('currentLevel');
const currentScoreSpan = document.getElementById('currentScore');
const currentXpSpan = document.getElementById('currentXp');
const requiredXpSpan = document.getElementById('requiredXp');
const xpBar = document.getElementById('xpBar');
const playerLivesIcon = document.getElementById('playerLivesIcon');
const appleCounterSpan = document.getElementById('appleCounter');
const coinCounterSpan = document.getElementById('coinCounter');

const upgradeMenu = document.getElementById('upgradeMenu');
const upgradeOptionsContainer = document.getElementById('upgradeOptionsContainer');
const levelUpBoxImage = document.getElementById('levelUpBox');

const merchantShop = document.getElementById('merchantShop');
const merchantOptionsContainer = document.getElementById('merchantOptionsContainer');
const leaveMerchantButton = document.getElementById('leaveMerchantButton');

const gameOverlay = document.getElementById('gameOverlay');
const finalScoreSpan = document.getElementById('finalScore');
const coinsEarnedSpan = document.getElementById('coinsEarned');
const finalTimeSpan = document.getElementById('finalTime');
const restartButton = document.getElementById('restartButton');
const loadingStoryDiv = document.getElementById('loadingStory');
const storytellerOutputDiv = document.getElementById('storytellerOutput');

const difficultyContainer = document.getElementById('difficultyContainer');
const difficultyScreen = document.getElementById('difficultyScreen');
const difficultyButtons = document.querySelectorAll('.difficulty-buttons button:not(#howToPlayButton):not(#desktopUpgradesButton):not(#characterSelectButton)');
const howToPlayButton = document.getElementById('howToPlayButton');
const gameGuideModal = document.getElementById('gameGuideModal');
const backToDifficultyButton = document.getElementById('backToDifficultyButton');

const pauseButton = document.getElementById('pauseButton');
const pauseOverlay = document.getElementById('pauseOverlay');
const powerupIconsDiv = document.getElementById('powerupIcons');
const upgradeStatsDiv = document.getElementById('upgradeStats'); 
const musicVolumeSlider = document.getElementById('musicVolume');
const effectsVolumeSlider = document.getElementById('effectsVolume');
const pauseRestartButton = document.getElementById('pauseRestartButton');
const resumeButton = document.getElementById('resumeButton');
const startButton = document.getElementById('startButton');
const gameStats = document.getElementById('gameStats');
const gameStartOverlay = document.getElementById('gameStartOverlay');
const gameStartText = document.getElementById('gameStartText');
const gameStartDifficulty = document.getElementById('gameStartDifficulty');
const zoomToggle = document.getElementById('zoomToggle');

const upgradeShop = document.getElementById('upgradeShop');
const desktopUpgradesButton = document.getElementById('desktopUpgradesButton');
const backToMenuButton = document.getElementById('backToMenuButton');
const currencyDisplay = document.getElementById('currencyDisplay');
const permanentUpgradesContainer = document.getElementById('permanentUpgradesContainer');
const unlockablePickupsContainer = document.getElementById('unlockablePickupsContainer');

const mapSelectContainer = document.getElementById('mapSelectContainer');
const mapTilesContainer = document.getElementById('mapTilesContainer');
const backToDifficultySelectButton = document.getElementById('backToDifficultySelectButton');

const characterSelectContainer = document.getElementById('characterSelectContainer');
const characterSelectButton = document.getElementById('characterSelectButton');
const characterTilesContainer = document.getElementById('characterTilesContainer');
const backToMenuFromCharsButton = document.getElementById('backToMenuFromCharsButton');

// Achievement & Cheat UI
const desktopAchievementsButton = document.getElementById('desktopAchievementsButton');
const desktopResetButton = document.getElementById('desktopResetButton');
const achievementsModal = document.getElementById('achievementsModal');
const backToMenuFromAchievements = document.getElementById('backToMenuFromAchievements');
const achievementsContainer = document.getElementById('achievementsContainer');
const achievementBanner = document.getElementById('achievement-banner');
const cheatsMenuButton = document.getElementById('cheatsMenuButton');
const cheatsModal = document.getElementById('cheatsModal');
const backToAchievementsButton = document.getElementById('backToAchievementsButton');
const cheatsContainer = document.getElementById('cheatsContainer');
const mobileResetButton = document.getElementById('mobileResetButton');

// New Mobile Menu Buttons
const mobileMenuUpgradesButton = document.getElementById('mobileMenuUpgradesButton');
const mobileMenuTrophiesButton = document.getElementById('mobileMenuTrophiesButton');
const mobileMenuCheatsButton = document.getElementById('mobileMenuCheatsButton');

// ================================================================================= //
// ======================== STATE & CONSTANTS VARIABLES ============================ //
// ================================================================================= //
let quadtree; 
let currentDifficulty = 'easy';
let cameraZoom = 1.0;
let currentBackgroundIndex = 0;
let selectedMapIndex = -1;
let equippedCharacterID = 'cowboy';

const joystickRadius = 51;
const WORLD_WIDTH = 1125 * 1.5;
const WORLD_HEIGHT = 845 * 1.5;

let cameraOffsetX = 0;
let cameraOffsetY = 0;
let cameraAimOffsetX = 0;
let cameraAimOffsetY = 0;
const CAMERA_PULL_STRENGTH = 35;
const CAMERA_LERP_FACTOR = 0.05;

let isPlayerHitShaking = false; 
let playerHitShakeStartTime = 0; 
const PLAYER_HIT_SHAKE_DURATION = 300;
const MAX_PLAYER_HIT_SHAKE_OFFSET = 5;
const BOB_AMPLITUDE = 2.5;

const player = {
    x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, size: 35, speed: 1.4, xp: 0, level: 1, xpToNextLevel: 3, 
    projectileSizeMultiplier: 1, projectileSpeedMultiplier: 1, lives: 3, maxLives: 3, appleCount: 0, 
    coins: 0, magnetRadius: 23 * 2, orbitAngle: 0, boxPickupsCollectedCount: 0, bgmFastModeActive: false, 
    swordActive: false, lastSwordSwingTime: 0, currentSwordSwing: null, isSlowedByMosquitoPuddle: false, 
    originalPlayerSpeed: 1.4, damageMultiplier: 1, knockbackStrength: 0, facing: 'down', stepPhase: 0, 
    rotationAngle: 0, isDashing: false, dashEndTime: 0, lastDashTime: 0, dashCooldown: 6000, 
    isInvincible: false, spinStartTime: null, spinDirection: 0,
    upgradeLevels: { speed: 0, fireRate: 0, magnetRadius: 0, damage: 0, projectileSpeed: 0, knockback: 0, luck: 0 }
};

let player2 = null;
let doppelganger = null;
let doppelgangerActive = false;
let lastDoppelgangerSpawnTime = 0;
const DOPPELGANGER_SPAWN_INTERVAL = 14000;
const DOPPELGANGER_DURATION = 8000; 
const DOPPELGANGER_FIRE_INTERVAL = 500;

const COIN_SIZE = 10; const COIN_EMOJI = '🔸'; const COIN_XP_VALUE = 1;
const DIAMOND_SIZE = 12; const DIAMOND_EMOJI = '🔹'; const DIAMOND_XP_VALUE = 2;
const RING_SYMBOL_SIZE = 11; const RING_SYMBOL_EMOJI = '💍'; const RING_SYMBOL_XP_VALUE = 3;
const DEMON_XP_EMOJI = '♦️'; const DEMON_XP_VALUE = 4;

let orbitingImageAngle = 0;
const ORBIT_POWER_UP_SIZE = 20; const ORBIT_RADIUS = 35; const ORBIT_SPEED = 0.05;

let damagingCircleAngle = 0;
const DAMAGING_CIRCLE_SPIN_SPEED = 0.03; const DAMAGING_CIRCLE_RADIUS = 70; const DAMAGING_CIRCLE_DAMAGE_INTERVAL = 2000;

const LIGHTNING_EMOJI = '⚡️'; const LIGHTNING_SIZE = 10; const LIGHTNING_SPAWN_INTERVAL = 3000;
const V_SHAPE_INCREMENT_ANGLE = Math.PI / 18;

const SWORD_SIZE = player.size * 0.75; const SWORD_SWING_INTERVAL = 2000; const SWORD_SWING_DURATION = 200; const SWORD_THRUST_DISTANCE = player.size * 0.7;

const EYE_EMOJI = '👁️'; const EYE_SIZE = 25 * 0.6; const EYE_HEALTH = 4; const EYE_SPEED_MULTIPLIER = 1.1; 
const EYE_SAFE_DISTANCE = player.size * 6; const EYE_TOO_FAR_DISTANCE = WORLD_WIDTH / 4; 
const EYE_PROJECTILE_EMOJI = '🧿'; const EYE_PROJECTILE_SIZE = EYE_SIZE / 2; const EYE_PROJECTILE_SPEED = 5.6; 
const EYE_PROJECTILE_LIFETIME = 4000; const EYE_PROJECTILE_INTERVAL = 2000;

const VAMPIRE_EMOJI = '🧛‍♀️'; const VAMPIRE_SIZE = 20; const VAMPIRE_HEALTH = 5; const VAMPIRE_SPEED_MULTIPLIER = 1.2; 
const VAMPIRE_DODGE_DETECTION_RADIUS = 200; const VAMPIRE_DODGE_STRENGTH = 1.5;

const FEMALE_ZOMBIE_EMOJI = '🧟‍♀️'; const FEMALE_ZOMBIE_SIZE = 17 * 1.75; const FEMALE_ZOMBIE_HEALTH = 6; const FEMALE_ZOMBIE_SPEED_MULTIPLIER = 0.5;

const PLAYER_PUDDLE_SIZE = player.size / 1.5; const PLAYER_PUDDLE_SPAWN_INTERVAL = 80; const PLAYER_PUDDLE_LIFETIME = 3000; const PLAYER_PUDDLE_SLOW_FACTOR = 0.5;

const MOSQUITO_EMOJI = '🦟'; const MOSQUITO_SIZE = 15; const MOSQUITO_HEALTH = 2; const MOSQUITO_SPEED_MULTIPLIER = 1.5; const MOSQUITO_DIRECTION_UPDATE_INTERVAL = 3000;
const MOSQUITO_PUDDLE_EMOJI = '♨️'; const MOSQUITO_PUDDLE_SIZE = player.size * 0.7; const MOSQUITO_PUDDLE_SPAWN_INTERVAL = 500; const MOSQUITO_PUDDLE_LIFETIME = 2000; const MOSQUITO_PUDDLE_SLOW_FACTOR = 0.5;

let pickupItems = []; let lightningBolts = []; let eyeProjectiles = []; let playerPuddles = []; let snailPuddles = []; let mosquitoPuddles = []; let floatingTexts = []; let visualWarnings = []; let explosions = []; let blackHoles = []; let bloodSplatters = []; let bloodPuddles = []; let antiGravityPulses = []; let vengeanceNovas = []; let dogHomingShots = []; let destructibles = []; let flameAreas = []; let smokeParticles = []; let pickups = []; let merchants = [];
let lastMerchantSpawnTime = 0; const MERCHANT_SPAWN_INTERVAL = 140000; 

// --- NEW FEATURES ---
let bugSwarmActive = false; let flies = []; let lastBugSwarmSpawnTime = 0; const BUG_SWARM_INTERVAL = 9000; const BUG_SWARM_COUNT = 6; const FLY_DAMAGE = 0.34; const FLY_SPEED = 3.5; const FLY_SIZE = 8;
let nightOwlActive = false; let owl = null; let owlProjectiles = []; const OWL_FIRE_INTERVAL = 1500; const OWL_PROJECTILE_SPEED = 6; const OWL_PROJECTILE_SIZE = 15; const OWL_FOLLOW_DISTANCE = 60;
let whirlwindAxeActive = false; let whirlwindAxeAngle = 0; const WHIRLWIND_AXE_RADIUS = ORBIT_RADIUS * 2; const WHIRLWIND_AXE_SPEED = 0.04; const WHIRLWIND_AXE_SIZE = 30;
let lightningStrikeActive = false; let lightningStrikes = []; let lastLightningStrikeTime = 0; const LIGHTNING_STRIKE_INTERVAL = 7000; const LIGHTNING_STRIKE_DAMAGE = 1; let hasDashInvincibility = false;

const APPLE_ITEM_EMOJI = '🍎'; const APPLE_ITEM_SIZE = 15; let appleDropChance = 0.05; const APPLE_LIFETIME = 5000; let appleItems = [];

const BASE_ZOMBIE_HEALTH = 1; const BASE_SKULL_HEALTH = 2; const BASE_BAT_HEALTH = 3; const BASE_DEMON_HEALTH = 4;
const SKULL_EMOJI = '💀'; const SKULL_SIZE = 20; const SKULL_SPEED_MULTIPLIER = 1.15;
const BAT_EMOJI = '🦇'; const BAT_SIZE = 25 * 0.85; const BAT_SPEED_MULTIPLIER = 2; const BAT_PAUSE_DURATION_FRAMES = 30; const BAT_MOVE_DURATION_FRAMES = 30;
const DEMON_EMOJI = '👹'; const DEMON_SIZE = 28 * 0.7; const DEMON_SPEED_MULTIPLIER = 1.8975;

const MAGNET_STRENGTH = 0.5;

let gamePaused = false; let gameOver = false; let gameActive = false; let gameStartTime = 0; let animationFrameId; let enemiesDefeatedCount = 0; let lastFrameTime = 0; let lastCircleSpawnEventTime = 0; let lastBarrelSpawnTime = 0;

const UPGRADE_BORDER_COLORS = {
    "speed": "#66bb6a", "fireRate": "#8B4513", "magnetRadius": "#800080",
    "damage": "#ff0000", "projectileSpeed": "#007bff", "knockback": "#808080", "luck": "#FFD700"
};

const UPGRADE_OPTIONS = [
    { name: "Fast Runner", desc: "Increase movement speed by 8%", type: "speed", value: 0.08, icon: '🏃' },
    { name: "Rapid Fire", desc: "Increase fire rate by 8%", type: "fireRate", value: 0.08, icon: '🔫' },
    { name: "Magnet Field", desc: "Increase pickup radius by 8%", type: "magnetRadius", value: 0.08, icon: '🧲' },
    { name: "Increased Damage", desc: "Increase projectile damage by 15%", type: "damage", value: 0.15, icon: '💥' },
    { name: "Swift Shots", desc: "Increase projectile speed by 8%", type: "projectileSpeed", value: 0.08, icon: '💨' },
    { name: "Power Shot", desc: "Projectiles knock enemies back by 8%", type: "knockback", value: 0.08, icon: '💪' },
    { name: "Lucky Charm", desc: "Increase pickup drop rate by 0.5%", type: "luck", value: 0.005, icon: '🍀' }
];

let enemies = [];
const MAX_WEAPONS = 500;
const weaponPool = [];
for (let i = 0; i < MAX_WEAPONS; i++) {
    weaponPool.push({ active: false, hitEnemies: [] });
}

let bombs = []; const BOX_SIZE = 25; let boxDropChance = 0.01;
const BOMB_SIZE = 14; const BOMB_LIFETIME_MS = 8000; const BOMB_INTERVAL_MS = 5000;
const ANTI_GRAVITY_INTERVAL = 5000; const ANTI_GRAVITY_RADIUS = 200; const ANTI_GRAVITY_STRENGTH = 60;
const BLACK_HOLE_INTERVAL = 10000; const BLACK_HOLE_PULL_DURATION = 3000; const BLACK_HOLE_DELAY = 3000; const BLACK_HOLE_RADIUS = 167; const BLACK_HOLE_PULL_STRENGTH = 2.5;

let bombEmitterActive = false; let lastBombEmitMs = 0;
let orbitingPowerUpActive = false; let damagingCircleActive = false; let lastDamagingCircleDamageTime = 0; let lightningProjectileActive = false; let lastLightningSpawnTime = 0;
let magneticProjectileActive = false; let vShapeProjectileLevel = 0; let iceProjectileActive = false; let puddleTrailActive = false; let lastPlayerPuddleSpawnTime = 0;
let laserPointerActive = false; let autoAimActive = false; let explosiveBulletsActive = false; let vengeanceNovaActive = false; let dogCompanionActive = false; let antiGravityActive = false; let lastAntiGravityPushTime = 0;
let ricochetActive = false; let rocketLauncherActive = false; let blackHoleActive = false; let lastBlackHoleTime = 0; let dualGunActive = false; let flamingBulletsActive = false; let shotgunBlastActive = false;

let dog = { x: 0, y: 0, size: 25, state: 'returning', target: null, lastHomingShotTime: 0 };
const DOG_HOMING_SHOT_INTERVAL = 3000;

let temporalWardActive = false; let isTimeStopped = false; let timeStopEndTime = 0;
let score = 0; let lastEnemySpawnTime = 0; let enemySpawnInterval = 1000; let baseEnemySpeed = 0.84;
let lastWeaponFireTime = 0; let weaponFireInterval = 400;

const CHARACTERS = {
    cowboy: {
        id: 'cowboy', name: 'The Cowboy', emoji: '🤠', description: 'The original survivor. Balanced and reliable.',
        perk: 'Standard bullets and dash.', unlockCondition: { type: 'start' }, shootLogic: null, dodgeLogic: null,
    },
    skull: {
        id: 'skull', name: 'The Skeleton', emoji: '💀', description: 'A bony warrior who uses its own body as a weapon.',
        perk: 'Shoots bones. Dodge fires a nova of bones.', unlockCondition: { type: 'achievement', id: 'slayer' }, shootLogic: null, dodgeLogic: null, 
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

const BOSS_HEALTH = 20; const BOSS_XP_DROP = 20; const BOSS_XP_EMOJI = '🎇'; const BOSS_SPAWN_INTERVAL_LEVELS = 11;
const BOSSED_ENEMY_TYPES = ['🧟', SKULL_EMOJI, DEMON_EMOJI, FEMALE_ZOMBIE_EMOJI, BAT_EMOJI, MOSQUITO_EMOJI];
let lastBossLevelSpawned = 0;