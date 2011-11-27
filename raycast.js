var gX0 = 3;
var gY0 = 6;
var gA = 0.86;

var SIZE_X = 64;
var SIZE_Y = 64;

var STORE_LIN = SIZE_Y;

var sheet;

function onOpen() {
  spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var subMenus = [
      {name:"Reset",functionName:"onOpen"},
      {name:"Move forward",functionName:"up"},
      {name:"Look left",functionName:"left"},
      {name:"Look right",functionName:"right"},
      {name:"Move backward",functionName:"down"},
  ];
  spreadsheet.addMenu("sheetcaster", subMenus);

  sheet = SpreadsheetApp.getActiveSheet();
  initSheet();
  raycast();
}

function savePlayerToSheet() {
  sheet.getRange(STORE_LIN, 1, 1, 1).setValue(gX0);
  sheet.getRange(STORE_LIN, 2, 1, 1).setValue(gY0);
  sheet.getRange(STORE_LIN, 3, 1, 1).setValue(gA);
}

function initPlayerFromSheet() {
  var sheet = SpreadsheetApp.getActiveSheet();
  gX0 = sheet.getRange(STORE_LIN, 1, 1, 1).getValue();
  gY0 = sheet.getRange(STORE_LIN, 2, 1, 1).getValue();
  gA = sheet.getRange(STORE_LIN, 3, 1, 1).getValue();
}

function right() {
  initPlayerFromSheet();
  gA = gA - 0.25;
  if (gA < 0) {
    gA = gA + (2 * Math.PI);
  }
  raycast();
}

function left() {
  initPlayerFromSheet();
  gA = gA + 0.25;
  if (gA > (2 * Math.PI)) {
    gA = gA - (2 * Math.PI);
  }
  raycast();
}

function up() {
  initPlayerFromSheet();
  gX0 += Math.cos(gA) / 4;
  gY0 += Math.sin(gA) / 4;
  raycast();
}

function down() {
  initPlayerFromSheet();
  gX0 -= Math.cos(gA) / 4;
  gY0 -= Math.sin(gA) / 4;
  raycast();
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

function calcul_wall(vec, x) {
  var cos = Math.cos(gA);
  var sin = Math.sin(gA);
  var y1 = SIZE_X / 2;
  y1 = y1 - x;
  y1 = y1 / SIZE_X;
  vec.x = 0.5 * cos - y1 * sin;
  vec.y = 0.5 * sin + y1 * cos;
}

var tab =
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

function check_map(x, y) {
  return (tab[Math.round(y)][Math.round(x)]);
}

function calc_inter(vec) {
  var x = gX0;
  var y = gY0;
  var k = 0;

  while (Math.round(check_map(y, x)) != 1 && k < 10) {
    x = gX0 + k * vec.x;
    y = gY0 + k * vec.y;
    k = k + 0.01;
  }
  return (k);
}

function getColor(k) {
  Logger.log(k);
    return [
      "#BBBBBB",
      "#AAAAAA",
      "#999999",
      "#888888",
      "#777777",
      "#666666",
      "#555555",
      "#444444",
      "#333333",
      "#222222",
      "#111111",
    ][Math.round(k)];
}

function draw_background(x) {
  sheet.getRange(1, 1, sheet.getMaxRows() / 2, sheet.getMaxColumns()).setBackgroundColor("#DEE6FF");
  sheet.getRange(sheet.getMaxRows() / 2, 1, sheet.getMaxRows() / 2 + ((sheet.getMaxRows() + 1) % 2), sheet.getMaxColumns()).setBackgroundColor("#BBAB9E");
}

function draw_line_wall(x, k) {
  var size;

  if (k <= 0)
    size = SIZE_Y;
  else
    size = SIZE_Y / (4 * k);

  if (size < 0)
    size = 0;
  if (size >= SIZE_Y / 2)
    size = SIZE_Y / 2;

  size = Math.round(size);
  color = getColor(k);
  sheet.getRange((SIZE_Y / 2), x + 1, size, 1).setBackgroundColor(color);
  sheet.getRange((SIZE_Y / 2) - size, x + 1, size, 1).setBackgroundColor(color);
}

function Vector() {
  this.x = 0;
  this.y = 1;
}

function raycast() {
  sheet = SpreadsheetApp.getActiveSheet();
  var vec = new Vector();
  draw_background(x);
  for (var x = 0; x < SIZE_X; x++) {
    calcul_wall(vec, x);
    var k = calc_inter(vec);
    draw_line_wall(x, k);
  }
  savePlayerToSheet();
}
