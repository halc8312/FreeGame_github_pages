const TILE_SIZE = 16;
const MAP_COLS = 20;
const MAP_ROWS = 13;
const HUD_HEIGHT = 32;
const GAME_HEIGHT = MAP_ROWS * TILE_SIZE;
const CANVAS_WIDTH = MAP_COLS * TILE_SIZE;
const CANVAS_HEIGHT = GAME_HEIGHT + HUD_HEIGHT;
const PLAYER_SIZE = 12;
const ENEMY_SIZE = 12;
const STORAGE_KEY = 'byte-breach-hi-score';

const TILE = {
  FLOOR_A: 0,
  FLOOR_B: 1,
  WALL: 2,
  INNER_CORNER: 3,
  OUTER_CORNER: 4,
  DOOR: 5,
  TERMINAL: 6,
  PIPE: 7,
  PILLAR: 8,
  HAZARD: 9,
  SPAWN: 10,
};

const LABEL_ROW = {
  SCORE: 0,
  HI_SCORE: 1,
  START: 2,
  GAME_OVER: 3,
  RETRY: 4,
};

const DIRECTION = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

const MAP_LAYOUT = [
  '####################',
  '#........T......D..#',
  '#.####......####...#',
  '#....#..........#..#',
  '#.P..#....OO....#^.#',
  '#....#..........#..#',
  '#....D...S.......^.#',
  '#.####......####...#',
  '#....#..........#..#',
  '#.^..#....OO....#..#',
  '#....####....####..#',
  '#..D......T........#',
  '####################',
];

const ITEM_SPAWN_TILES = [
  { x: 2, y: 1 },
  { x: 7, y: 1 },
  { x: 11, y: 1 },
  { x: 16, y: 1 },
  { x: 3, y: 3 },
  { x: 9, y: 3 },
  { x: 14, y: 3 },
  { x: 2, y: 5 },
  { x: 11, y: 5 },
  { x: 16, y: 6 },
  { x: 3, y: 8 },
  { x: 8, y: 8 },
  { x: 14, y: 8 },
  { x: 17, y: 10 },
  { x: 4, y: 11 },
  { x: 12, y: 11 },
];

const PATROL_PATHS = [
  [
    { x: 3, y: 2 },
    { x: 8, y: 2 },
    { x: 8, y: 5 },
    { x: 3, y: 5 },
  ],
  [
    { x: 12, y: 7 },
    { x: 17, y: 7 },
    { x: 17, y: 10 },
    { x: 12, y: 10 },
  ],
];

const CHASE_SPAWNS = [
  { x: 17, y: 1, time: 12 },
  { x: 2, y: 10, time: 28 },
  { x: 17, y: 11, time: 46 },
];

const assetFiles = {
  playerIdle: '../player_idle_sheet_native.png',
  playerMove: '../player_move_sheet_native.png',
  playerDown: '../player_down_sheet_native.png',
  datachip: '../item_datachip_sheet.png',
  energycell: '../item_energycell_sheet.png',
  patrol: '../enemy_drone_patrol_sheet.png',
  chase: '../enemy_drone_chase_sheet.png',
  tileset: '../tileset_facility_base.png',
  digits: '../ui_digits_8x8.png',
  labels: '../ui_labels_minimal.png',
  iconLife: '../ui_icon_life_8x8.png',
  panel: '../ui_panel_3slice_16x16.png',
  pickup: '../fx_pickup_sheet.png',
  hitSpark: '../fx_hit_spark_sheet.png',
  explosion: '../fx_explosion_sheet.png',
  spawn: '../fx_spawn_sheet.png',
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

document.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
});

const keys = new Set();
window.addEventListener('keydown', (event) => keys.add(event.code));
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());

const assets = await loadAssets(assetFiles);
const game = createGame();
let lastTime = performance.now();
requestAnimationFrame(frame);

function frame(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;
  update(game, delta);
  render(game, ctx);
  requestAnimationFrame(frame);
}

function createGame() {
  const map = buildMap(MAP_LAYOUT);
  const spawnTile = findSpawnTile(map) ?? { x: 9, y: 6 };
  return {
    map,
    highScore: readHighScore(),
    scene: 'title',
    sceneTime: 0,
    dangerLevel: 0,
    elapsed: 0,
    itemSpawnTimer: 0,
    items: [],
    effects: [],
    enemies: [],
    nextChaseIndex: 0,
    flashTimer: 0,
    player: createPlayer(tileToWorld(spawnTile.x, spawnTile.y)),
  };
}

function startGame(game) {
  game.scene = 'playing';
  game.sceneTime = 0;
  game.elapsed = 0;
  game.dangerLevel = 0;
  game.itemSpawnTimer = 0;
  game.items = [];
  game.effects = [];
  game.enemies = createPatrolEnemies();
  game.nextChaseIndex = 0;
  game.flashTimer = 0;
  const spawn = findSpawnTile(game.map) ?? { x: 9, y: 6 };
  game.player = createPlayer(tileToWorld(spawn.x, spawn.y));
  spawnEffect(game, 'spawn', game.player.x, game.player.y, 12);
  spawnInitialItems(game);
}

function gameOver(game) {
  if (game.scene === 'gameover') {
    return;
  }
  game.scene = 'gameover';
  game.sceneTime = 0;
  game.flashTimer = 0.3;
  game.player.alive = false;
  game.player.animTime = 0;
  game.highScore = Math.max(game.highScore, game.player.score);
  writeHighScore(game.highScore);
  spawnEffect(game, 'hitSpark', game.player.x, game.player.y, 14);
  spawnEffect(game, 'explosion', game.player.x, game.player.y, 12);
}

function createPlayer(position) {
  return {
    x: position.x,
    y: position.y,
    vx: 0,
    vy: 0,
    speed: 74,
    direction: DIRECTION.DOWN,
    state: 'idle',
    score: 0,
    alive: true,
    animTime: 0,
  };
}

function createPatrolEnemies() {
  return PATROL_PATHS.map((path, index) => ({
    type: 'patrol',
    x: tileToWorld(path[0].x, path[0].y).x,
    y: tileToWorld(path[0].x, path[0].y).y,
    speed: 38 + index * 4,
    animTime: Math.random(),
    path: path.map((point) => tileToWorld(point.x, point.y)),
    pathIndex: 1,
    size: ENEMY_SIZE,
  }));
}

function spawnInitialItems(game) {
  for (let index = 0; index < 4; index += 1) {
    spawnCollectible(game, index === 3 ? 'energycell' : 'datachip');
  }
}

function update(game, delta) {
  game.sceneTime += delta;
  game.flashTimer = Math.max(0, game.flashTimer - delta);
  updateEffects(game, delta);

  if (game.scene === 'title') {
    if (consumeStartInput()) {
      startGame(game);
    }
    return;
  }

  if (game.scene === 'gameover') {
    game.player.animTime += delta;
    if (consumeStartInput()) {
      startGame(game);
    }
    return;
  }

  game.elapsed += delta;
  game.dangerLevel = 1 + Math.floor(game.elapsed / 18);
  game.itemSpawnTimer -= delta;
  if (game.itemSpawnTimer <= 0 && game.items.length < 6) {
    const type = Math.random() < Math.min(0.2 + game.elapsed * 0.004, 0.45) ? 'energycell' : 'datachip';
    spawnCollectible(game, type);
    game.itemSpawnTimer = 2.4;
  }

  while (game.nextChaseIndex < CHASE_SPAWNS.length && game.elapsed >= CHASE_SPAWNS[game.nextChaseIndex].time) {
    const chaseSpawn = CHASE_SPAWNS[game.nextChaseIndex];
    spawnChaseDrone(game, chaseSpawn);
    game.nextChaseIndex += 1;
  }

  updatePlayer(game, delta);
  updateEnemies(game, delta);
  updateItems(game, delta);
  checkHazards(game);
  checkEnemyHits(game);
}

function updatePlayer(game, delta) {
  const player = game.player;
  const input = getMovementInput();
  player.vx = input.x * player.speed;
  player.vy = input.y * player.speed;
  if (input.x !== 0 || input.y !== 0) {
    player.state = 'move';
    if (Math.abs(input.x) > Math.abs(input.y)) {
      player.direction = input.x > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      player.direction = input.y > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }
  } else {
    player.state = 'idle';
  }
  moveEntityWithCollisions(game.map, player, player.vx * delta, player.vy * delta, PLAYER_SIZE);
  player.animTime += delta;
}

function updateEnemies(game, delta) {
  for (const enemy of game.enemies) {
    if (enemy.type === 'patrol') {
      const target = enemy.path[enemy.pathIndex];
      const vector = normalize(target.x - enemy.x, target.y - enemy.y);
      moveEntityWithCollisions(game.map, enemy, vector.x * enemy.speed * delta, vector.y * enemy.speed * delta, enemy.size);
      if (distance(enemy.x, enemy.y, target.x, target.y) < 4) {
        enemy.pathIndex = (enemy.pathIndex + 1) % enemy.path.length;
      }
    } else {
      const player = game.player;
      const chaseVector = normalize(player.x - enemy.x, player.y - enemy.y);
      const speedBoost = Math.min(18, game.elapsed * 0.35);
      moveEntityWithCollisions(game.map, enemy, chaseVector.x * (enemy.speed + speedBoost) * delta, chaseVector.y * (enemy.speed + speedBoost) * delta, enemy.size);
    }
    enemy.animTime += delta;
  }
}

function updateItems(game, delta) {
  for (const item of game.items) {
    item.animTime += delta;
    if (distance(game.player.x, game.player.y, item.x, item.y) < 12) {
      const value = item.type === 'energycell' ? 350 : 100;
      game.player.score += value;
      game.highScore = Math.max(game.highScore, game.player.score, game.highScore);
      spawnEffect(game, 'pickup', item.x, item.y, 12);
      game.items = game.items.filter((entry) => entry !== item);
      break;
    }
  }
}

function spawnCollectible(game, type) {
  const openSpawns = ITEM_SPAWN_TILES.filter((tile) => {
    const pos = tileToWorld(tile.x, tile.y);
    const occupiedByItem = game.items.some((item) => distance(item.x, item.y, pos.x, pos.y) < 4);
    const occupiedByEnemy = game.enemies.some((enemy) => distance(enemy.x, enemy.y, pos.x, pos.y) < 10);
    const tooCloseToPlayer = distance(game.player.x, game.player.y, pos.x, pos.y) < 32;
    return !occupiedByItem && !occupiedByEnemy && !tooCloseToPlayer;
  });
  const pool = openSpawns.length > 0 ? openSpawns : ITEM_SPAWN_TILES;
  const tile = pool[Math.floor(Math.random() * pool.length)];
  const pos = tileToWorld(tile.x, tile.y);
  game.items.push({ type, x: pos.x, y: pos.y, animTime: Math.random() });
  spawnEffect(game, 'spawn', pos.x, pos.y, 10);
}

function spawnChaseDrone(game, spawn) {
  const pos = tileToWorld(spawn.x, spawn.y);
  game.enemies.push({
    type: 'chase',
    x: pos.x,
    y: pos.y,
    speed: 40,
    animTime: 0,
    size: ENEMY_SIZE,
  });
  spawnEffect(game, 'spawn', pos.x, pos.y, 10);
}

function checkHazards(game) {
  const tileX = Math.floor(game.player.x / TILE_SIZE);
  const tileY = Math.floor(game.player.y / TILE_SIZE);
  if (game.map[tileY]?.[tileX] === TILE.HAZARD) {
    gameOver(game);
  }
}

function checkEnemyHits(game) {
  for (const enemy of game.enemies) {
    if (distance(game.player.x, game.player.y, enemy.x, enemy.y) < 11) {
      gameOver(game);
      return;
    }
  }
}

function updateEffects(game, delta) {
  game.effects = game.effects.filter((effect) => {
    effect.time += delta;
    return effect.time < effect.duration;
  });
}

function spawnEffect(game, type, x, y, fps) {
  const totalFrames = type === 'explosion' ? 5 : 4;
  game.effects.push({
    type,
    x,
    y,
    fps,
    totalFrames,
    time: 0,
    duration: totalFrames / fps,
  });
}

function render(game, ctx) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.save();
  ctx.translate(0, HUD_HEIGHT);
  drawMap(ctx, game.map, game.elapsed);
  drawEffects(ctx, game.effects, ['spawn']);
  drawItems(ctx, game.items);
  drawEnemies(ctx, game.enemies);
  drawPlayer(ctx, game.player, game.scene);
  drawEffects(ctx, game.effects, ['pickup', 'hitSpark', 'explosion']);
  drawOverlay(ctx, game);
  ctx.restore();
  drawHud(ctx, game);
}

function drawMap(ctx, map, elapsed) {
  const floorVariant = Math.floor(elapsed * 3) % 2;
  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      const tile = map[y][x];
      if (tile === TILE.FLOOR_A || tile === TILE.FLOOR_B || tile === TILE.HAZARD || tile === TILE.SPAWN || tile === TILE.DOOR || tile === TILE.PIPE || tile === TILE.TERMINAL || tile === TILE.PILLAR) {
        const floorTile = (x + y + floorVariant) % 2 === 0 ? TILE.FLOOR_A : TILE.FLOOR_B;
        drawTile(ctx, floorTile, x * TILE_SIZE, y * TILE_SIZE);
      }
      drawTile(ctx, tile, x * TILE_SIZE, y * TILE_SIZE);
    }
  }
}

function drawItems(ctx, items) {
  for (const item of items) {
    const sprite = assets[item.type];
    const frame = Math.floor(item.animTime * 8) % 4;
    const bob = Math.sin(item.animTime * 4) * 1.5;
    drawFrame(ctx, sprite, frame, 16, Math.round(item.x - 8), Math.round(item.y - 8 + bob));
  }
}

function drawEnemies(ctx, enemies) {
  for (const enemy of enemies) {
    const sprite = enemy.type === 'patrol' ? assets.patrol : assets.chase;
    const frame = Math.floor(enemy.animTime * 8) % 4;
    drawFrame(ctx, sprite, frame, 16, Math.round(enemy.x - 8), Math.round(enemy.y - 8));
  }
}

function drawPlayer(ctx, player, scene) {
  if (!player.alive || scene === 'gameover') {
    const frame = Math.min(3, Math.floor(player.animTime * 12));
    drawFrame(ctx, assets.playerDown, frame, 16, Math.round(player.x - 8), Math.round(player.y - 8));
    return;
  }

  const directionIndex = {
    [DIRECTION.UP]: 0,
    [DIRECTION.DOWN]: 1,
    [DIRECTION.LEFT]: 2,
    [DIRECTION.RIGHT]: 3,
  }[player.direction];

  if (player.state === 'move') {
    const frame = directionIndex * 4 + (Math.floor(player.animTime * 10) % 4);
    drawFrame(ctx, assets.playerMove, frame, 16, Math.round(player.x - 8), Math.round(player.y - 8));
  } else {
    const frame = directionIndex * 2 + (Math.floor(player.animTime * 6) % 2);
    drawFrame(ctx, assets.playerIdle, frame, 16, Math.round(player.x - 8), Math.round(player.y - 8));
  }
}

function drawEffects(ctx, effects, allowedTypes) {
  for (const effect of effects) {
    if (!allowedTypes.includes(effect.type)) {
      continue;
    }
    const sheet = assets[effect.type];
    const frame = Math.min(effect.totalFrames - 1, Math.floor(effect.time * effect.fps));
    drawFrame(ctx, sheet, frame, 16, Math.round(effect.x - 8), Math.round(effect.y - 8));
  }
}

function drawHud(ctx, game) {
  drawPanel(ctx, 8, 8, 304);
  drawLabel(ctx, LABEL_ROW.SCORE, 16, 12);
  drawDigits(ctx, game.player.score, 84, 12, 6);
  drawLabel(ctx, LABEL_ROW.HI_SCORE, 168, 12);
  drawDigits(ctx, game.highScore, 248, 12, 6);

  const timeText = Math.min(999, Math.floor(game.elapsed)).toString().padStart(3, '0');
  ctx.drawImage(assets.iconLife, 0, 0, 8, 8, 16, 22, 8, 8);
  drawDigits(ctx, timeText, 28, 22, 3);
  ctx.fillStyle = game.flashTimer > 0 ? 'rgba(255, 94, 94, 0.35)' : 'rgba(83, 245, 255, 0.1)';
  ctx.fillRect(156, 22, Math.min(140, game.dangerLevel * 20), 6);
  ctx.strokeStyle = 'rgba(215, 230, 255, 0.35)';
  ctx.strokeRect(156.5, 22.5, 140, 6);
}

function drawOverlay(ctx, game) {
  if (game.scene === 'title') {
    ctx.fillStyle = 'rgba(3, 6, 12, 0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, GAME_HEIGHT);
    drawCenteredPanel(ctx, 208, 80);
    ctx.fillStyle = '#d7e6ff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BYTE BREACH', CANVAS_WIDTH / 2, 86);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#8eb8db';
    ctx.fillText('Collect chips, dodge drones, survive the breach.', CANVAS_WIDTH / 2, 108);
    drawLabel(ctx, LABEL_ROW.START, 124, 128);
    if (Math.floor(game.sceneTime * 2) % 2 === 0) {
      drawLabel(ctx, LABEL_ROW.RETRY, 124, 150);
    }
    ctx.fillStyle = '#9db5cc';
    ctx.fillText('Press Space / Enter', CANVAS_WIDTH / 2, 175);
    ctx.fillText('Move with WASD or Arrow Keys', CANVAS_WIDTH / 2, 191);
    return;
  }

  if (game.scene === 'gameover') {
    ctx.fillStyle = 'rgba(40, 0, 10, 0.58)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, GAME_HEIGHT);
    drawCenteredPanel(ctx, 208, 72);
    drawLabel(ctx, LABEL_ROW.GAME_OVER, 124, 104);
    if (Math.floor(game.sceneTime * 2.5) % 2 === 0) {
      drawLabel(ctx, LABEL_ROW.RETRY, 124, 128);
    }
    ctx.fillStyle = '#ffd7de';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE ${game.player.score}`, CANVAS_WIDTH / 2, 154);
    ctx.fillText('Press Space / Enter', CANVAS_WIDTH / 2, 172);
  }
}

function drawCenteredPanel(ctx, width, height) {
  const x = Math.round((CANVAS_WIDTH - width) / 2);
  const y = Math.round((GAME_HEIGHT - height) / 2);
  const segments = Math.max(1, Math.round((width - 32) / 16));
  for (let row = 0; row < Math.max(1, Math.round(height / 16)); row += 1) {
    drawPanel(ctx, x, y + row * 16, segments * 16 + 32);
  }
}

function drawPanel(ctx, x, y, width) {
  const middleCount = Math.max(1, Math.round((width - 32) / 16));
  ctx.drawImage(assets.panel, 0, 0, 16, 16, x, y, 16, 16);
  for (let index = 0; index < middleCount; index += 1) {
    ctx.drawImage(assets.panel, 16, 0, 16, 16, x + 16 + index * 16, y, 16, 16);
  }
  ctx.drawImage(assets.panel, 32, 0, 16, 16, x + 16 + middleCount * 16, y, 16, 16);
}

function drawDigits(ctx, value, x, y, minDigits = 1) {
  const text = String(value).padStart(minDigits, '0');
  for (let index = 0; index < text.length; index += 1) {
    const digit = Number(text[index]);
    ctx.drawImage(assets.digits, digit * 8, 0, 8, 8, x + index * 8, y, 8, 8);
  }
}

function drawLabel(ctx, row, x, y) {
  ctx.drawImage(assets.labels, 0, row * 8, 72, 8, x, y, 72, 8);
}

function drawTile(ctx, tileIndex, x, y) {
  ctx.drawImage(assets.tileset, tileIndex * 16, 0, 16, 16, x, y, 16, 16);
}

function drawFrame(ctx, image, frame, frameSize, x, y) {
  ctx.drawImage(image, frame * frameSize, 0, frameSize, frameSize, x, y, frameSize, frameSize);
}

function moveEntityWithCollisions(map, entity, dx, dy, size) {
  entity.x = moveAxis(map, entity.x, entity.y, dx, size, true);
  entity.y = moveAxis(map, entity.x, entity.y, dy, size, false);
}

function moveAxis(map, x, y, amount, size, horizontal) {
  let position = horizontal ? x : y;
  position += amount;
  const half = size / 2;
  const left = (horizontal ? position : x) - half;
  const right = (horizontal ? position : x) + half;
  const top = (horizontal ? y : position) - half;
  const bottom = (horizontal ? y : position) + half;

  const minTileX = Math.floor(left / TILE_SIZE);
  const maxTileX = Math.floor((right - 0.001) / TILE_SIZE);
  const minTileY = Math.floor(top / TILE_SIZE);
  const maxTileY = Math.floor((bottom - 0.001) / TILE_SIZE);

  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      if (!isBlocked(map, tileX, tileY)) {
        continue;
      }
      if (horizontal) {
        if (amount > 0) {
          position = tileX * TILE_SIZE - half;
        } else if (amount < 0) {
          position = tileX * TILE_SIZE + TILE_SIZE + half;
        }
      } else if (amount > 0) {
        position = tileY * TILE_SIZE - half;
      } else if (amount < 0) {
        position = tileY * TILE_SIZE + TILE_SIZE + half;
      }
    }
  }
  return position;
}

function isBlocked(map, tileX, tileY) {
  const tile = map[tileY]?.[tileX];
  return tile == null || [TILE.WALL, TILE.TERMINAL, TILE.PIPE, TILE.PILLAR, TILE.INNER_CORNER, TILE.OUTER_CORNER].includes(tile);
}

function buildMap(layout) {
  return layout.map((row, rowIndex) => {
    if (row.length !== MAP_COLS) {
      throw new Error(`Unexpected row width at ${rowIndex}`);
    }
    return [...row].map((char, columnIndex) => charToTile(char, columnIndex, rowIndex));
  });
}

function charToTile(char, columnIndex, rowIndex) {
  switch (char) {
    case '#':
      return TILE.WALL;
    case 'T':
      return TILE.TERMINAL;
    case 'P':
      return TILE.PIPE;
    case 'O':
      return TILE.PILLAR;
    case 'D':
      return TILE.DOOR;
    case '^':
      return TILE.HAZARD;
    case 'S':
      return TILE.SPAWN;
    default:
      return (columnIndex + rowIndex) % 2 === 0 ? TILE.FLOOR_A : TILE.FLOOR_B;
  }
}

function findSpawnTile(map) {
  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      if (map[y][x] === TILE.SPAWN) {
        return { x, y };
      }
    }
  }
  return null;
}

function tileToWorld(tileX, tileY) {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
  };
}

function getMovementInput() {
  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');
  const up = keys.has('ArrowUp') || keys.has('KeyW');
  const down = keys.has('ArrowDown') || keys.has('KeyS');
  const x = (right ? 1 : 0) - (left ? 1 : 0);
  const y = (down ? 1 : 0) - (up ? 1 : 0);
  return normalize(x, y);
}

function consumeStartInput() {
  if (keys.has('Enter') || keys.has('Space')) {
    keys.delete('Enter');
    keys.delete('Space');
    return true;
  }
  return false;
}

function normalize(x, y) {
  const length = Math.hypot(x, y);
  if (!length) {
    return { x: 0, y: 0 };
  }
  return { x: x / length, y: y / length };
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function readHighScore() {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY) ?? '0') || 0;
  } catch {
    return 0;
  }
}

function writeHighScore(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Ignore storage failures in private or restricted contexts.
  }
}

async function loadAssets(files) {
  const entries = await Promise.all(
    Object.entries(files).map(async ([key, relativePath]) => [key, await loadImage(relativePath)])
  );
  return Object.fromEntries(entries);
}

function loadImage(relativePath) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${relativePath}`));
    image.src = new URL(relativePath, import.meta.url).href;
  });
}
