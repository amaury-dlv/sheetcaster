var gX0 = 3;
var gY0 = 6;
var gA = 0.86;

var SIZE_X = 64;
var SIZE_Y = 64;

var sheet;

function onOpen() {
  spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var subMenus = [
      {name:"Begin",functionName:"raycast"},
      {name:"Stop",functionName:"stop"},
      {name:"Left",functionName:"left"},
      {name:"Right",functionName:"right"},
      {name:"Up",functionName:"up"},
      {name:"Down",functionName:"down"}
  ];
  spreadsheet.addMenu("sheetcaster", subMenus);
  
  sheet = SpreadsheetApp.getActiveSheet();
  start();
}

function right() {
  gA = gA - 0.25;
  if (gA < 0) {
    gA = gA + 6.28;
  }
  raycast();
}

function left() {
  gA = gA + 0.25;
  if (gA > 6.28) {
    gA = gA + 6.28;
  } 
  raycast();
}

function up() {
  gX0  = gX0 + 1;
  raycast();
}

function down() {
  gY0  = gY0 - 1;
  raycast();
}


function start() {
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
    sheet.setRowHeight(row, 20);
  }

  for(var col = 1; col <= SIZE_X; col++) {
    sheet.setColumnWidth(col, 20);
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
    var color;
    if (k < 1) {
      color = "DDDDDD";
    } else if (k < 2) {
      color = "BBBBBB";
    } else if (k < 4) {
      color = "999999";
    } else if (k < 6) {
      color = "777777";
    } else if (k < 8) {
      color = "555555";
    } else {
      color = "000000";
    }
  return color;
}

function draw_line_wall(x, k) {
  var size;

  if (k == 0)
    size = SIZE_Y;
  else
    size = SIZE_Y / (4 * k);
  if (size < 0)
    size = 0;
  if (size > SIZE_Y)
    size = SIZE_Y;
  var a = SIZE_Y / 2;
  var j = a;
  var i = a;
  for (var lin = 0; lin < SIZE_Y; lin++) {
    sheet.getRange(lin + 1,x + 1,1,1).setBackgroundColor("#FFFFFF");
  }

  while ((size--) > 0)
  {
    var color = getColor(k);
    sheet.getRange(i, x + 1, 1, 1).setBackgroundColor("#" + color);
    sheet.getRange(j, x + 1, 1, 1).setBackgroundColor("#" + color);
    i++;
    j--;
  }
}

function Vector() {
  this.x = -0.7;
  this.y = -0.7;
}

function raycast() {
  onOpen();
  var vec = new Vector();
  for (var x = 0; x < SIZE_X; x++) {
    calcul_wall(vec, x);
    var k = calc_inter(vec);
    draw_line_wall(x, k);
    Logger.log("TEST " + x + " - " + k);
  }
}

