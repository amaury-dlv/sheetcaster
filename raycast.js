var SIZE_X = 128;
var SIZE_Y = 64;
var K_FOV = 2; // Increase to widen the view

var CAMERA_X = 3.2;
var CAMERA_Y = 4.5;
var CAMERA_THETA = 5.6; // Direction the player is facing

var STORE_LIN = SIZE_Y + 1; // Where we store the player state between each frame
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

function Vector(_x, _y) {
  this.x = _x;
  this.y = _y;
}

function Camera() {
  this.x = CAMERA_X;
  this.y = CAMERA_Y;
  this.theta = CAMERA_THETA;
  
  this.saveToSheet = function(sheet) {
    // The player state has to be saved between each frame
    sheet.getRange(STORE_LIN, 1, 1, 1).setValue(this.x);
    sheet.getRange(STORE_LIN, 2, 1, 1).setValue(this.y);
    sheet.getRange(STORE_LIN, 3, 1, 1).setValue(this.theta);
  };
  
  this.readFromSheet = function(sheet) {
    this.x = sheet.getRange(STORE_LIN, 1, 1, 1).getValue();
    this.y = sheet.getRange(STORE_LIN, 2, 1, 1).getValue();
    this.theta = sheet.getRange(STORE_LIN, 3, 1, 1).getValue();
  };
  
  // return whether valid move or not
  this.move = function(distance) {
    x = this.x + Math.cos(this.theta) * distance;
    y = this.y + Math.sin(this.theta) * distance;
    if (isValidPos(x, y)) {
      this.x = x;
      this.y = y;
      return true;
    }
    return false;
  };

  this.rotate = function(alpha) {
    this.theta = (this.theta + alpha + 2 * Math.PI) % (2 * Math.PI);
  };
}

function isValidPos(x, y) { return Math.floor(x) >= 0 && Math.floor(x) < S
                            && Math.floor(y) >= 0 && Math.floor(y) < S
                            && !readMap(x, y); }

function readMap(x, y) {
  return (map[Math.floor(y)][Math.floor(x)]);
}

function initScreen() {
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
function readMapFromSheet(sheet) {
  for (var line = 1; line <= S; line++) {
    for (var col = 1; col <= S; col++) {
      if (sheet.getRange(line, col, 1, 1).getValue()) {
	if (!map[line - 1][col - 1])
          map[line - 1][col - 1] = 1;
        else
          map[line - 1][col - 1] = 0;
        sheet.getRange(line, col, 1, 1).setValue("");
      }
    }
  }
}

function initSheet(sheet) {

  var columnCount = sheet.getMaxColumns();
  if (SIZE_X > columnCount) {
    sheet.insertColumns(1, SIZE_X - columnCount);
  } else if (SIZE_X < columnCount) {
    sheet.deleteColumns(1, columnCount - SIZE_X);
  }

  var rowCount = sheet.getMaxRows();
  if (SIZE_Y + 1 > rowCount) {
    sheet.insertRows(2, SIZE_Y + 1 - rowCount);
  } else if (SIZE_Y + 1 < rowCount) {
    sheet.deleteRows(2, rowCount - SIZE_Y - 1);
  }

  for (var row = 1; row <= SIZE_Y; row++) {
    sheet.setRowHeight(row, S);
  }

  for (var col = 1; col <= SIZE_X; col++) {
    sheet.setColumnWidth(col, S);
  }

  sheet.clear();
}

// Display the minimap and the current position
function drawMinimap(camera) {
  var camCoord = new Vector(Math.round(camera.x - 0.5),
                            Math.round(camera.y - 0.5));
  
  // YAUH™ (Yet Another Ugly Hack): where we lookin at
  var dirCoord = new Vector(Math.round(camera.x - 0.5 + Math.cos(camera.theta)),
                            Math.round(camera.y - 0.5 + Math.sin(camera.theta)));
  
  for (var line = 0; line < S; line++) {
    for (var col = 0; col < S; col++) {
      var color = 0xFFFFFF;
      if (line == camCoord.y && col == camCoord.x)
        color = 0xFF0000;
      else if (map[line][col])
        color = 0x000000;
      if (line == dirCoord.y && col == dirCoord.x) {
        color = blend(color, 0xFF0000, 0.4);
      }
      screen[line][col] = colorToString(color);
    }
  }
}


function refresh() {
  var sheet = SpreadsheetApp.getActiveSheet();
  readMapFromSheet(sheet);
  var camera = new Camera();
  camera.readFromSheet(sheet);
  raycast(camera);
}

function right() {
  var sheet = SpreadsheetApp.getActiveSheet();
  readMapFromSheet(sheet);
  var camera = new Camera();
  camera.readFromSheet(sheet);
  camera.rotate(-0.25);
  raycast(camera);
}

function left() {
  var sheet = SpreadsheetApp.getActiveSheet();
  readMapFromSheet(sheet);
  var camera = new Camera();
  camera.readFromSheet(sheet);
  camera.rotate(0.25);
  raycast(camera);
}

function up() {
  var sheet = SpreadsheetApp.getActiveSheet();
  readMapFromSheet(sheet);
  var camera = new Camera();
  camera.readFromSheet(sheet);
  camera.move(0.5);
  raycast(camera);
}

function down() {
  var sheet = SpreadsheetApp.getActiveSheet();
  readMapFromSheet(sheet);
  var camera = new Camera();
  camera.readFromSheet(sheet);
  camera.move(-0.5);
  raycast(camera);
}

function turn() {
  var sheet = SpreadsheetApp.getActiveSheet();
  readMapFromSheet(sheet);
  var camera = new Camera();
  camera.readFromSheet(sheet);
  camera.rotate(Math.PI);
  raycast(camera);
}

function colorToString(color) {
  var s = color.toString(16);
  while (s.length < 6) {
    s = "0" + s; // shameful
  }
  return "#" + s;
}
  
function blend(from, to, ratio) {
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
function smoothenColors(x, sizeDecrease) {
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

    var upperColor = blend(color, UPPER_BG_COLOR, blendIntensity);
    var lowerColor = blend(color, LOWER_BG_COLOR, blendIntensity);
    
    if (size <= MID) {
      screen[MID - size][col] = colorToString(upperColor);
      screen[MID + size - 1][col] = colorToString(lowerColor);
    }
    
    blendIntensity -= decrement;
    if (blendIntensity < 0) {
      blendIntensity = 0;
    }

  }
}

function getColor(k) {
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
function drawWallX(x, k) {
  var size;

  size = (k <= 0 ? MID : SIZE_Y / (4*k));
  size = Math.round(size);
  sizes[x] = size;

  color = getColor(k);
  colors[x] = color;

  if (x > 1) {
    var sizeDecrease = (size < sizes[x - 1]);
    if (size == sizes[x - 1])
      sizeDecrease = wasSizeDecreasing;

    var invalid = (sizeDecrease != wasSizeDecreasing);

    if (!invalid && size == sizes[x - 1]) {
      runLength += 1;
    } else {
      smoothenColors(x - 1, sizeDecrease); // smoothen the last run
      runLength = 1;
    }
    wasSizeDecreasing = sizeDecrease;
  } else {
    runLengh = 1;
    wasSizeDecreasing = false;
  }

  size = Math.min(MID, Math.max(1, size));

  for (var lin = 0; lin < SIZE_Y; lin++)
    if (lin >= MID - size && lin < MID + size)
      screen[lin][x] = colorToString(color);

}

// Given a value on the x axis (screen column), return the ray that will be cast
function getRay(camera, x) {
  var cos = Math.cos(camera.theta);
  var sin = Math.sin(camera.theta);
  var y1 = SIZE_X / 2;

  y1 = y1 - x;
  y1 = y1 / SIZE_X;

  return new Vector(
    cos / 2 - y1 * sin * K_FOV,
    sin / 2 + y1 * cos * K_FOV
  );
}

function castRay(mapCoord, delta, dist, step) {
  var hit = 0;

  while (!hit) {
    if (dist.x < dist.y) { // Next potential wall is on the x axis
      dist.x      += delta.x;
      mapCoord.x  += step.x;
      hit = readMap(mapCoord.x, mapCoord.y) * 1;
    } else { // Next potential wall is on the y axis
      dist.y     += delta.y;
      mapCoord.y += step.y;
      hit = readMap(mapCoord.x, mapCoord.y) * 2;
    }
  }
  return side = hit - 1;
}

// Returns the distance of the first ray/wall intersection
function getWallDist(camera, ray) {

  var mapCoord = new Vector(
      Math.floor(camera.x),
      Math.floor(camera.y)
  );

  // How much to advance per step
  var delta = new Vector(
      Math.sqrt(1. + (ray.y * ray.y) / (ray.x * ray.x)),
      Math.sqrt(1. + (ray.x * ray.x) / (ray.y * ray.y))
  );

  // Distance from next hit on each axis
  var dist = new Vector(
      delta.x * (camera.x - mapCoord.x),
      delta.y * (camera.y - mapCoord.y)
  );

  if (ray.x >= 0) dist.x = delta.x - dist.x;
  if (ray.y >= 0) dist.y = delta.y - dist.y;

  // Direction of the ray (-1 or 1 for each axis)
  var step = new Vector(
      Math.floor(1 - 2 * (ray.x < 0)),
      Math.floor(1 - 2 * (ray.y < 0))
  );

  if (castRay(mapCoord, delta, dist, step)) { // Depending on the axis of the hit
    return Math.abs((mapCoord.y - camera.y + (1. - step.y) / 2.) / ray.y);
  } else {
    return Math.abs((mapCoord.x - camera.x + (1. - step.x) / 2.) / ray.x);
  }
}

function raycast(camera) {

  initScreen();
  sheet = SpreadsheetApp.getActiveSheet();

  for (var x = 0; x < SIZE_X; x++) { // Iterate on each screen column
    ray = getRay(camera, x);
    var k = getWallDist(camera, ray);
    k /= 2; // Hack to get the map look smaller
    drawWallX(x, k);
  }

  drawMinimap(camera);
  sheet.getRange(1, 1, SIZE_Y, SIZE_X).setBackgroundColors(screen);
  camera.saveToSheet(sheet); // So it can be retrieved a the next frame
}

function onOpen() {
  spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var subMenus = [
      {name:"Reset",functionName:"onOpen"},
      {name:"Refresh map",functionName:"refresh"},
      {name:"Move forward",functionName:"up"},
      {name:"Look left",functionName:"left"},
      {name:"Look right",functionName:"right"},
      {name:"Move backward",functionName:"down"},
      {name:"Turn around",functionName:"turn"},
  ];
  spreadsheet.addMenu("Sheetcaster", subMenus);

  sheet = SpreadsheetApp.getActiveSheet();
  initSheet(sheet);
  raycast(new Camera());
}