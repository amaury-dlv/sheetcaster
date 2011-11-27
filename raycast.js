var gX0 = 3;
var gY0 = 6;
var gA = 0.86;

var SIZE_X = 64;
var SIZE_Y = 64;
var MID = Math.floor(SIZE_Y / 2);

var STORE_LIN = SIZE_Y;

var sheet;

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

function readMap_(x, y) {
  return (map[Math.round(y)][Math.round(x)]);
}

function Sheetcast() {
  spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var subMenus = [
      {name:"Reset",functionName:"Sheetcast"},
      {name:"Move forward",functionName:"up_"},
      {name:"Look left",functionName:"left_"},
      {name:"Look right",functionName:"right_"},
      {name:"Move backward",functionName:"down_"},
  ];
  spreadsheet.addMenu("Sheetcaster", subMenus);

  sheet = SpreadsheetApp.getActiveSheet();
  initSheet_();
  raycast_();
}

function savePlayerToSheet_() {
  sheet.getRange(STORE_LIN, 1, 1, 1).setValue(gX0);
  sheet.getRange(STORE_LIN, 2, 1, 1).setValue(gY0);
  sheet.getRange(STORE_LIN, 3, 1, 1).setValue(gA);
}

function initPlayerFromSheet_() {
  var sheet = SpreadsheetApp.getActiveSheet();
  gX0 = sheet.getRange(STORE_LIN, 1, 1, 1).getValue();
  gY0 = sheet.getRange(STORE_LIN, 2, 1, 1).getValue();
  gA = sheet.getRange(STORE_LIN, 3, 1, 1).getValue();
}

function right_() {
  initPlayerFromSheet_();
  gA = gA - 0.25;
  if (gA < 0) {
    gA += (2 * Math.PI);
  }
  raycast_();
}

function left_() {
  initPlayerFromSheet_();
  gA = gA + 0.25;
  if (gA > (2 * Math.PI)) {
    gA -= (2 * Math.PI);
  }
  raycast_();
}

function up_() {
  initPlayerFromSheet_();
  gX0 += Math.cos(gA) / 4;
  gY0 += Math.sin(gA) / 4;
  raycast_();
}

function down_() {
  initPlayerFromSheet_();
  gX0 -= Math.cos(gA) / 4;
  gY0 -= Math.sin(gA) / 4;
  raycast_();
}

function initSheet_() {
  var sheet = sheet = SpreadsheetApp.getActiveSheet();

  if(SIZE_X > sheet.getMaxColumns()) {
    sheet.insertColumns(1, SIZE_X - sheet.getMaxColumns());
  }

  if(SIZE_X < sheet.getMaxColumns()) {
    sheet.deleteColumns(1, sheet.getMaxColumns() - SIZE_X);
  }

  if(SIZE_Y > sheet.getMaxRows()) {
    sheet.insertRows(1, SIZE_Y - sheet.getMaxRows());
  }

  if(SIZE_Y < sheet.getMaxRows()) {
    sheet.deleteRows(1, sheet.getMaxRows() - SIZE_Y);
  }

  for(var row = 1; row <= SIZE_Y; row++) {
    sheet.setRowHeight(row, 10);
  }

  for(var col = 1; col <= SIZE_X; col++) {
    sheet.setColumnWidth(col, 10);
  }

  sheet.clear();
}

function computeWall_(vec, x) {
  var cos = Math.cos(gA);
  var sin = Math.sin(gA);
  var y1 = SIZE_X / 2;
  y1 = y1 - x;
  y1 = y1 / SIZE_X;
  vec.x = 0.5 * cos - y1 * sin;
  vec.y = 0.5 * sin + y1 * cos;
}

var side;
function getWallDist_(vec) {
  var x = gX0;
  var y = gY0;
  var k = 0;

  while (Math.round(readMap_(y, x)) != 1 && k < 10) {
    x = gX0 + k * vec.x;
    y = gY0 + k * vec.y;
    k = k + 0.01;
  }

  side = 0;
  if (Math.min(Math.abs(x - Math.floor(x)), Math.abs(x - Math.ceil(x))) <
      Math.min(Math.abs(y - Math.floor(y)), Math.abs(y - Math.ceil(y))))
  side = 1;

  return (k);
}

function drawBackground_() {
  sheet.getRange(1, 1, MID, SIZE_X).setBackgroundColor("#DEE6FF");
  sheet.getRange(MID, 1, MID + !(SIZE_Y % 2), SIZE_X).setBackgroundColor("#33CC00");
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
  return "#" + color.toString(16);
}

function drawWallX_(x, k) {
  var size;

  size = (k <= 0 ? MID : SIZE_Y / (4*k));
  size = Math.min(MID, Math.max(1, size));

  size = Math.round(size);
  color = getColor_(k);
  sheet.getRange(MID, x + 1, size, 1).setBackgroundColor(color);
  sheet.getRange(Math.max(1, MID - size), x + 1, size, 1).setBackgroundColor(color);
}

function Vector_() {
  this.x = 0;
  this.y = 1;
}

function raycast_() {
  sheet = SpreadsheetApp.getActiveSheet();
  var vec = new Vector_();
  drawBackground_();
  for (var x = 0; x < SIZE_X; x++) {
    computeWall_(vec, x);
    var k = getWallDist_(vec);
    drawWallX_(x, k);
  }
  savePlayerToSheet_();
}
