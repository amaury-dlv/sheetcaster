var SIZE_X = 128;
var SIZE_Y = 64;
var K_FOV = 2; // Increase to widen the view

var gX0 = 3.2;
var gY0 = 7.9;
var gA = 5.6; // Direction the player is facing

var STORE_LIN = SIZE_Y; // Where we store the player state between each frame
var MID = Math.floor(SIZE_Y / 2);

var UPPER_BG_COLOR = 0xDEE6FF;
var LOWER_BG_COLOR = 0x33CC00;

var colors = new Array(SIZE_X);
var sizes = new Array(SIZE_X);

var sheet;
var side;

// 10x10 map
var S = 10
var map =
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];

var screen;

function Vector_(x, y) {
  this.x = x;
  this.y = y;
}

function readMap_(y, x) {
  return (map[Math.floor(y)][Math.floor(x)]);
}

function initScreen_() {
  screen = new Array(SIZE_Y);
  for (var lin = 0; lin < SIZE_Y; lin++) {
    screen[lin] = new Array(SIZE_X);
    for (var col = 0; col < SIZE_X; col++) {
      screen[lin][col] = "#" + ((lin < MID) ? UPPER_BG_COLOR
                                : LOWER_BG_COLOR).toString(16);
    }
  }
}

// Retrieve the map from the upper-left corner
function getMapFromSheet_() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var tmp;

  for (var line = 1; line <= S; line++) {
    for (var col = 1; col <= S; col++) {
      tmp = sheet.getRange(line, col, 1, 1).getValue();
      if (tmp)
	map[line - 1][col - 1] = tmp;
    }
  }
}

// The player state has to be saved between each frame
function savePlayerToSheet_() {
  sheet.getRange(STORE_LIN, 1, 1, 1).setValue(gX0);
  sheet.getRange(STORE_LIN, 2, 1, 1).setValue(gY0);
  sheet.getRange(STORE_LIN, 3, 1, 1).setValue(gA);
}

function initMapFromSheet_() {
  getMapFromSheet_();
  initPlayerFromSheet_();
}

function initPlayerFromSheet_() {
  var sheet = SpreadsheetApp.getActiveSheet();
  gX0 = sheet.getRange(STORE_LIN, 1, 1, 1).getValue();
  gY0 = sheet.getRange(STORE_LIN, 2, 1, 1).getValue();
  gA = sheet.getRange(STORE_LIN, 3, 1, 1).getValue();
}

function refresh_() {
  initMapFromSheet_();
  raycast_();
}

function right() {
  initMapFromSheet_();
  gA = gA - 0.25;
  if (gA < 0) {
    gA += (2 * Math.PI);
  }
  raycast_();
}

function left() {
  initMapFromSheet_();
  gA = gA + 0.25;
  if (gA > (2 * Math.PI)) {
    gA -= (2 * Math.PI);
  }
  raycast_();
}

function isValidPos() { return Math.floor(gX0) >= 0 && Math.floor(gX0) < S
                            && Math.floor(gY0) >= 0 && Math.floor(gY0) < S
                            && !readMap_(gX0, gY0); }

function up() {
  initMapFromSheet_();
  gX0 += Math.cos(gA) / 2;
  gY0 += Math.sin(gA) / 2;
  if (isValidPos()) raycast_();
}

function down() {
  initMapFromSheet_();
  gX0 -= Math.cos(gA) / 2;
  gY0 -= Math.sin(gA) / 2;
  if (isValidPos()) raycast_();
}

function initSheet() {
  var sheet = sheet = SpreadsheetApp.getActiveSheet();

  if(SIZE_X > sheet.getMaxColumns()) {
    sheet.insertColumns(1, SIZE_X - sheet.getMaxColumns());
  }

  if(SIZE_X < sheet.getMaxColumns()) {
    sheet.deleteColumns(1, sheet.getMaxColumns() - SIZE_X);
  }

  if(SIZE_Y > sheet.getMaxRows()) {
    sheet.insertRows(2, SIZE_Y - sheet.getMaxRows());
  }

  if(SIZE_Y < sheet.getMaxRows()) {
    sheet.deleteRows(2, sheet.getMaxRows() - SIZE_Y + 1);
  }

  for(var row = 1; row <= SIZE_Y; row++) {
    sheet.setRowHeight(row, 10);
  }

  for(var col = 1; col <= SIZE_X; col++) {
    sheet.setColumnWidth(col, 10);
  }

  sheet.clear();
}

function blend_(from, to, ratio) {
  var r = ((from >> 16) & 0xFF) * ratio;
  r += (1 - ratio) * ((to >> 16) & 0xFF);
  r &= 0xFF;
  var g = ((from >> 8) & 0xFF) * ratio;
  g += (1 - ratio) * ((to >> 8) & 0xFF);
  g &= 0xFF;
  var b = (from & 0xFF) * ratio;
  b += (1 - ratio) * (to & 0xFF);
  b &= 0xFF;

  return (r << 16) | (g << 8) | b;
}

var wasSizeDecreasing;
var runLength;
function smoothenColors_(x, sizeDecrease) {
  var decrement = 1 / (runLength + 1);

  if (runLength < 5) {
    /*
     * highly subjective "enhancement":
     * This simply makes the AA less noticeable
     * for really short runs, because we do not
     * really want to bolden the jags.
     * [1;5] => [1;0.5]
     */
    decrement *= ((25 + (runLength * runLength)) / 50);
  }

  var blendIntensity = 1 - decrement;

  if (sizeDecrease) {
    decrement = -decrement;
    blendIntensity = -decrement;
  }

  var col = x;
  for (var col = x; col > x - runLength; col--) {
    var size = sizes[col];
    var color = colors[col];

    var upperColor = blend_(color, UPPER_BG_COLOR, blendIntensity);
    var lowerColor = blend_(color, LOWER_BG_COLOR, blendIntensity);

    var upperRange = sheet.getRange(MID - size + 1, col + 1, 1, 1);
    var lowerRange = sheet.getRange(MID + size + 1, col + 1, 1, 1);

    /*
     * Sub-pixel antialiasing hack: unicode!
     * The major problem with this approach is the
     * left-padding inside cells. It does however add
     * an interesting effect.
     */
    var upperFontColor = blend_(upperColor, UPPER_BG_COLOR, 0.5);
    var lowerFontColor = blend_(lowerColor, LOWER_BG_COLOR, 0.5);

    upperRange.setValue("▄");
    upperRange.setFontSize(5);
    upperRange.setFontColor("#" + upperColor.toString(16));

    lowerRange.setValue("▀");
    lowerRange.setFontSize(5);
    lowerRange.setFontColor("#" + lowerColor.toString(16));

    upperColor = blend_(upperColor, UPPER_BG_COLOR, 0.3);
    lowerColor = blend_(lowerColor, LOWER_BG_COLOR, 0.3);

    screen[MID - size][col] = "#" + upperColor.toString(16);
    screen[MID + size][col] = "#" + lowerColor.toString(16);

    blendIntensity -= decrement;
    if (blendIntensity < 0) {
      blendIntensity = 0;
    }

  }
}

function getColor_(k) {
  k = 1 - (k / 12);
  var r,g,b, color;
  if (side) r=0xff, g=0x99, b=0x66;
  else      r=0xff, g=0x66, b=0x66;
  r = Math.round(r * k);
  g = Math.round(g * k);
  b = Math.round(b * k);
  color = (r << 16) | (g << 8) | (b);
  return color;
}

// Given a column and the wall distance, draw the column
function drawWallX_(x, k) {
  var size;

  size = (k <= 0 ? MID : SIZE_Y / (4*k));
  size = Math.min(MID, Math.max(1, size));

  size = Math.round(size);
  sizes[x] = size;

  color = getColor_(k);
  colors[x] = color;

  for (var lin = 0; lin < SIZE_Y; lin++)
    if (lin > MID - size && lin < MID + size)
      screen[lin][x] = "#" + color.toString(16);


  if (x > 1) {
    var sizeDecrease = (size < sizes[x - 1]);
    if (size == sizes[x - 1])
      sizeDecrease = wasSizeDecreasing;

    var invalid = (sizeDecrease != wasSizeDecreasing);

    if (!invalid && size == sizes[x - 1]) {
      runLength += 1;
    } else {
      smoothenColors_(x - 1, sizeDecrease); // smoothen the last run
      runLength = 1;
    }
    wasSizeDecreasing = sizeDecrease;
  } else {
    runLengh = 1;
    wasSizeDecreasing = false;
  }
}

// Given a value on the x axis (screen column), return the ray that will be cast
function getRay_(x) {
  var cos = Math.cos(gA);
  var sin = Math.sin(gA);
  var y1 = SIZE_X / 2;

  y1 = y1 - x;
  y1 = y1 / SIZE_X;

  return new Vector_(
    cos / 2 - y1 * sin * K_FOV,
    sin / 2 + y1 * cos * K_FOV
  );
}

function castRay_(mapCoord, delta, dist, step) {
  var hit = 0;

  while (!hit) {
    if (dist.x < dist.y) { // Next potential wall is on the x axis
      dist.x      += delta.x;
      mapCoord.x  += step.x;
      hit = readMap_(mapCoord.x, mapCoord.y) * 1;
    } else { // Next potential wall is on the y axis
      dist.y     += delta.y;
      mapCoord.y += step.y;
      hit = readMap_(mapCoord.x, mapCoord.y) * 2;
    }
  }
  return side = hit - 1;
}

// Returns the distance of the first ray/wall intersection
function getWallDist_(ray) {

  var mapCoord = new Vector_(
      Math.floor(gX0),
      Math.floor(gY0)
  );

  // How much to advance per step
  var delta = new Vector_(
      Math.sqrt(1. + (ray.y * ray.y) / (ray.x * ray.x)),
      Math.sqrt(1. + (ray.x * ray.x) / (ray.y * ray.y))
  );

  // Distance from next hit on each axis
  var dist = new Vector_(
      delta.x * (gX0 - mapCoord.x),
      delta.y * (gY0 - mapCoord.y)
  );

  if (ray.x >= 0) dist.x = delta.x - dist.x;
  if (ray.y >= 0) dist.y = delta.y - dist.y;

  // Direction of the ray (-1 or 1 for each axis)
  var step = new Vector_(
      Math.floor(1 - 2 * (ray.x < 0)),
      Math.floor(1 - 2 * (ray.y < 0))
  );

  if (castRay_(mapCoord, delta, dist, step)) { // Depending on the axis of the hit
    return Math.abs((mapCoord.y - gY0 + (1. - step.y) / 2.) / ray.y);
  } else {
    return Math.abs((mapCoord.x - gX0 + (1. - step.x) / 2.) / ray.x);
  }
}

function raycast_() {
  initScreen_();
  sheet = SpreadsheetApp.getActiveSheet();
  for (var x = 0; x < SIZE_X; x++) { // Iterate on each screen column
    ray = getRay_(x);
    var k = getWallDist_(ray);
    k /= 2; // Hack to get the map look smaller
    drawWallX_(x, k);
  }
  sheet.getRange(1, 1, SIZE_Y, SIZE_X).setBackgroundColors(screen)
  savePlayerToSheet_(); // So it can be retrieved a the next frame
}

function onOpen() {
  spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var subMenus = [
      {name:"Reset",functionName:"onOpen"},
      {name:"Refresh",functionName:"refresh_"},
      {name:"Move forward",functionName:"up"},
      {name:"Look left",functionName:"left"},
      {name:"Look right",functionName:"right"},
      {name:"Move backward",functionName:"down"},
  ];
  spreadsheet.addMenu("Sheetcaster", subMenus);

  sheet = SpreadsheetApp.getActiveSheet();
  initSheet();
  raycast_();
}
