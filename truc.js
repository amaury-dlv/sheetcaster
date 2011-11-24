var gColor = 0;
var gX0 = 1;
var gY0 = 1;
var gA = 1;

var SIZE_X = 24;
var SIZE_Y = 18;

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
  gColor = 90;
  for (var lin = 0; lin < SIZE_Y; lin++)
    sheet.getRange(x,lin,1,1).setBackgroundColor("#000000");
  while (Math.round(size--) > 0)
  {
    sheet.getRange(x, Math.round(i++), 1, 1).setBackgroundColor("#ffffff");
    sheet.getRange(x, Math.round(j--), 1, 1).setBackgroundColor("#ffffff");
    //put_pixel_to_img(param, x, i++, COLOR_WALL);
    //put_pixel_to_img(param, x, j--, COLOR_WALL);
  }
  //my_put_top_line_wall(param, &x, &j);
}

function Vector() {
  this.x = 1;
  this.y = 1;
}

function raycast() {
  var vec = new Vector();
  var x = 0;
  for (var x = 0; x < SIZE_Y; x++) {
    calcul_wall(vec, x);
    var k = calc_inter(vec);
    draw_line_wall(x, k);
    Logger.log("TEST " + x + " - " + k);
  }
}

