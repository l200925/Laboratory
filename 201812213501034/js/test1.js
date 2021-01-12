// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform vec3 d;'+
  'uniform vec3 s;'+
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  'mat4 dt = mat4( 1.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,1.0,0.0,d.x,d.y,d.z,1.0);'+
  'mat4 ss = mat4( s.x,0.0,0.0,0.0,0.0,s.y,0.0,0.0,0.0,0.0,s.z,0.0,0.0,0.0,0.0,1.0);'+
  '  gl_Position = ss * dt * u_MvpMatrix * a_Position;\n' +
  // Shading calculation to make the arm look three-dimensional
  '  vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.7));\n' + // Light direction////normalize():归一化函数
  '  vec4 color = vec4(1.0, 0.4, 0.0, 1.0);\n' +
  '  vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
  '  v_Color = vec4(color.rgb * nDotL + vec3(0.1), color.a);\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';
var step = 10;
var views = 30;
var canvas;
var gl;
var taxis=0;
var d = [0,0,0];
var dLoc;
var saxis = 0
var s = [1.0,1.0, 1.0];
var sLoc;
var xs,ys,zs;
function main() {
	//画布
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 设置顶点信息
  var n = initVertexBuffers(gl);

  // 背景颜色
  gl.clearColor(0.0, 0.0, 0.0, 0.5);
  gl.enable(gl.DEPTH_TEST);

  // 
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

  // 计算视图投影矩阵
  
  var viewProjMatrix = new Matrix4();
  viewProjMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 100.0);
  viewProjMatrix.lookAt(20.0, 10.0, 30, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
  dLoc = gl.getUniformLocation(gl.program,"d");
  gl.uniform3fv(dLoc,d);
  sLoc = gl.getUniformLocation(gl.program, "s");
  gl.uniform3fv(sLoc, s);

  //平移
  document.getElementById("xtbutton").onclick = function () {
      taxis = 0;
  }
  
  document.getElementById("ytbutton").onclick = function () {
      taxis = 1;
  }
  
  document.getElementById("ztbutton").onclick = function () {
      taxis = 2;
  }
console.log(taxis);
  // 注册键盘事件响应函数
  document.onkeydown = function(ev){ keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); };
  //ev：按键的事件 
  //n：顶点数
  //viewProjMatrix：投影矩阵
  //u_MvpMatrix：旋转矩阵
  //u_NormalMatrix：光照变换，颜色变换
  draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);  // Draw the robot arm
}
function cal_viewProjMatrix(){
	var viewProjMatrix = new Matrix4();
	viewProjMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 100.0);
	console.log(views);
	viewProjMatrix.lookAt(20.0, 10.0, views, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
}
var ANGLE_STEP = 3.0;    // 每次按键转动的角度
var g_arm1Angle = -90.0; // arm1的当前角度
var g_arm2Angle = 0.0; // joint1d的当前角度(即arm2的角度)

function keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  switch (ev.keyCode) {//  ev.keyCode:获取按键
    case 38: //  key -> 绕z轴正方向旋转
      if (g_arm2Angle < 30) g_arm2Angle += ANGLE_STEP;
      break;
    case 40: // key -> 绕z轴负方向旋转
      if (g_arm2Angle > 0) g_arm2Angle -= ANGLE_STEP;
      break;
    case 39: // Right arrow key -> 绕y轴正方向
      g_arm1Angle = (g_arm1Angle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> 绕y轴负方向
      g_arm1Angle = (g_arm1Angle - ANGLE_STEP) % 360;
      break;
    default: return; // Skip drawing at no effective action
  }
  // Draw the robot arm
  draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

function initVertexBuffers(gl) {
  // 设置顶点坐标
  var vertices = new Float32Array([
    7, 3, 1.5, -7, 3, 1.5, -7,  0.0, 1.5,  7,  0.0, 1.5, // v0-v1-v2-v3 front
    7, 3, 1.5,  7, 0, 1.5,  7,  0.0,-1.5,  7,  3,  -1.5, // v0-v3-v4-v5 right
    7, 3, 1.5,  7, 3,-1.5, -7,  3,  -1.5, -7,  3,   1.5, // v0-v5-v6-v1 up
   -7, 3, 1.5, -7, 3,-1.5, -7,  0.0,-1.5, -7,  0.0, 1.5, // v1-v6-v7-v2 left
   -7, 0,-1.5,  7, 0,-1.5,  7,  0.0, 1.5, -7,  0.0, 1.5, // v7-v4-v3-v2 down
    7, 0,-1.5, -7, 0,-1.5, -7,  3,  -1.5,  7,  3,  -1.5  // v4-v7-v6-v5 back
  ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Write the vertex property to buffers (coordinates and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, gl.FLOAT, 3)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

// 坐标变换矩阵
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();

function draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Arm1
  var arm1Length = 3; // Length of arm1
  g_modelMatrix.setTranslate(0.0, 1.0, 0.0);
  g_modelMatrix.rotate(g_arm1Angle, 0.0, 1.0, 0.0);    // Rotate around the y-axis
  drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); // Draw

  // Arm2
  g_modelMatrix.translate(0.0, arm1Length, 0.0); 　　　// Move to joint1 这里用到translate，是在之前的基础上向上平移一个arm1的高度
  g_modelMatrix.rotate(g_arm2Angle, 0.0, 0.0, 1.0);  // Rotate around the z-axis
  g_modelMatrix.scale(1.0, 1.0, 1.0); // 让立方体粗一点
  drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); // Draw
}

var g_normalMatrix = new Matrix4(); // Coordinate transformation matrix for normals

// 绘制立方体
function drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
  // Draw
  d[taxis] += 0.01;
  if(d[taxis]>0.5) d[taxis]=-d[taxis];
  gl.uniform3fv(dLoc,d);
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}
function x_suofang() {
		xs = document.getElementById("xs").value;
        saxis = 0;
		s[saxis] = xs;
		gl.uniform3fv(sLoc, s);
    }

	function y_suofang() {
		ys = document.getElementById("ys").value;
	    saxis = 1;
		s[saxis] = ys;
		gl.uniform3fv(sLoc, s);
	}
	
	function z_suofang() {
		zs = document.getElementById("zs").value;
	    saxis = 2;
		s[saxis] = zs;
		gl.uniform3fv(sLoc, s);
	}