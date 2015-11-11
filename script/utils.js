//
// utils.js
// Use WebGL to rendering 3D model. For testing only.
// Created by Yxing.c on 2015.11.01
//

// ----------------------------------------------------------------------
// Inplement for WebGL
// ----------------------------------------------------------------------

var gl;
var shaderProgram;
var model = [];

var cam = {};

var vec3 = {};
var mat3 = {};
var mat4 = {};
var mMatrix;
var vMatrix;
var pMatrix;
var mvMat;

var lastPosX;
var lastPosY;
var isMouseDown = false;


function start()
{
  // File input initialize (Read obj file).
  fileInput = document.getElementById('fileInput');
  fileDisplayArea = document.getElementById('fileDisplayArea');
  fileInput.onchange = readObjFile;

  // WebGL initialize.
  var canvas = document.getElementById("canvas");
  initGL(canvas);
  initShaders();
  initMat();

  // Mouse event.
  canvas.onmousedown = handleMouseDown;
  document.onmouseup = handleMouseUp;
  document.onmousemove = handleMouseMove;

  if(gl)
  {
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.STENCIL_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
}

function initGL(canvas)
{
  try
  {
    gl = canvas.getContext("webgl", {stencil:true});
    gl.viewportWidth  = canvas.width;
    gl.viewportHeight = canvas.height;
  }
  catch(e)
  {
    alert("GL initialize failed!!");
  }

  if(!gl)
  {
    alert("Browser not support webGL");
  }

}

function initShaders()
{
  var vertexShader = loadShader("vertexShader");
  var fragmentShader = loadShader("fragmentShader");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
  {
    alert("Shader program link ERROR!!!");
  }

  gl.useProgram(shaderProgram);

  // Get variable location.
  shaderProgram.vAttri = gl.getAttribLocation(shaderProgram, "position");
  gl.enableVertexAttribArray(shaderProgram.vAttri);

  shaderProgram.nAttri = gl.getAttribLocation(shaderProgram, "normal");
  //console.log(shaderProgram.nAttri);
  //gl.enableVertexAttribArray(shaderProgram.nAttri);
  
  shaderProgram.mvUniform = gl.getUniformLocation(shaderProgram, "mv");
  shaderProgram.pUniform  = gl.getUniformLocation(shaderProgram, "p");
  shaderProgram.ptUniform = gl.getUniformLocation(shaderProgram, "ptSize");
  shaderProgram.colorUniform= gl.getUniformLocation(shaderProgram, "color");
}

var vertexBuffer; // Vertex array buffer.
var normalBuffer; // Normal array buffer.
var fElementAryBuffer; // Triangle element array buffer.
var lElementAryBuffer; // line element array buffer.

function initBuffer()
{
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(model[0].vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderProgram.vAttri, 3, gl.FLOAT, false, 0, 0);

  normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(model[0].normal), gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderProgram.nAttri, 3, gl.FLOAT, false, 0, 0);
  
  fElementAryBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fElementAryBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(model[0].faceIdx), gl.STATIC_DRAW);

  lElementAryBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lElementAryBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(model[0].lineIdx), gl.STATIC_DRAW);
}

function initMat()
{
  mMatrix = mat4.identity();
  vMatrix = mat4.lookatMat([0, 0, 10], [0, 0, 0], [0, 1, 0]);
  pMatrix = mat4.perspectiveMat(45, gl.viewportWidth/gl.viewportHeight, 0.1, 1000);
}

function update()
{
  //requestAnimFrame(update);
  rendering();
}

function rendering()
{
  var fIdxNum = model[0].faceIdx.length;
  var lIdxNum = model[0].lineIdx.length;
  
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clearStencil(0);
  gl.clear(gl.COLOR_BUFFER_BIT |
	   gl.DEPTH_BUFFER_BIT |
	   gl.STENCIL_BUFFER_BIT);

  //gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  //setMatUniforms();
  //gl.drawArrays(gl.POINTS, 0, model[0].vertices/3);

  // Render the mesh into stencil buffer.
  mvMat = mat4.mult(vMatrix, mMatrix);

  var cp = vec3.extrackCamPos_NoScale(mvMat);
  
  gl.stencilFunc(gl.ALWAYS, 1, -1);
  gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fElementAryBuffer);
  //mMatrix = mat4.identity();
  setMatUniforms();
  gl.uniform4f(shaderProgram.colorUniform, 0.5, 0.5, 0.6, 1);
  gl.drawElements(gl.TRIANGLES, fIdxNum, gl.UNSIGNED_SHORT, 0);

  // Render the thick wireframe version.
  gl.stencilFunc(gl.NOTEQUAL, 1, -1);
  gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lElementAryBuffer);
  gl.lineWidth(3);
  setMatUniforms();
  gl.uniform4f(shaderProgram.colorUniform, 1, 0, 0, 0.75);
  gl.drawElements(gl.LINES, lIdxNum, gl.UNSIGNED_SHORT, 0);
}

function setMatUniforms()
{
  gl.uniformMatrix4fv(shaderProgram.mvUniform, false, mvMat);
  gl.uniformMatrix4fv(shaderProgram.pUniform, false, pMatrix);
  gl.uniform1f(shaderProgram.ptUniform, 1.0);
}

function handleMouseDown(event)
{
  isMouseDown = true;
  lastPosX = event.clientX;
  lastPosY = event.clientY;
}

function handleMouseUp(event)
{
  isMouseDown = false;
  //rendering();
    //alert(vMatrix);
}

function handleMouseMove(event)
{
  if(!isMouseDown)
    return;

  var newPosX = event.clientX;
  var newPosY = event.clientY;

  var deltaX = lastPosX - newPosX;
  var deltaY = lastPosY - newPosY;
  var rotMatX = mat4.rotateMat(deltaX/10, 0, 1, 0);
  var rotMatY = mat4.rotateMat(deg2Rad(deltaY/10), 1, 0, 0);

  vMatrix = mat4.mult(vMatrix, rotMatX);

  rendering();

  lastPosX = newPosX;
  lastPosY = newPosY;
}

function loadShader(scriptID)
{
  var shaderScript = document.getElementById(scriptID);
  if(!shaderScript)
    return null;
  
  var src = "";
  var currentChild = shaderScript.firstChild;
  while(currentChild)
  {
    if(currentChild.nodeType == currentChild.TEXT_NODE)
      src += currentChild.textContent;

    currentChild = currentChild.nextSibling;
  }
  
  var shader;
  if(shaderScript.type == "x-shader/x-vertex")
    shader = gl.createShader(gl.VERTEX_SHADER);
  else if(shaderScript.type == "x-shader/x-fragment")
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  else
    return null;

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
  {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  
  return shader;
}

// ----------------------------------------------------------------------
// Implement for gl math
// ----------------------------------------------------------------------
vec3.create = function()
{
  return [0, 0, 0];
};

vec3.create = function(a)
{
  return [a[0], a[1], a[2]];
};

vec3.normalize = function(a)
{
  var length = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
  return [a[0] /= length, a[1] /= length, a[2] /= length];
};

vec3.sub = function(a, b)
{
  return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
};

vec3.dot = function(a, b)
{
  return (a[0]*b[0] + a[1]*b[1] + a[2]*b[2]);
};

vec3.cross = function(a, b)
{
  return [a[1]*b[2] - a[2]*b[1],
	  a[2]*b[0] - a[0]*b[2],
	  a[0]*b[1] - a[1]*b[0]];
};

vec3.multMat3 = function(a, b)
{
  return [a[0]*b[0] + a[1]*b[1] + a[2]*b[2],
	  a[0]*b[3] + a[1]*b[4] + a[2]*b[5],
	  a[0]*b[6] + a[1]*b[7] + a[2]*b[8]];
};

vec3.extrackCamPos_NoScale = function(a)
{
  var rotateMat = mat3.create([a[0], a[1], a[2],
			       a[4], a[5], a[6],
			       a[8], a[9], a[10]]);
  var md = vec3.create([-a[12], -a[13], -a[14]]);
  var retVec = vec3.multMat3(md, rotateMat);
  console.log(retVec);
  return retVec;
};

mat3.create = function(a)
{
  return [a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]];
};

mat3.identity = function()
{
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
};

mat3.multVec3 = function(a, b)
{
  return [a[0]*b[0] + a[3]*b[1] + a[6]*b[2],
	  a[1]*b[0] + a[4]*b[1] + a[7]*b[2],
	  a[2]*b[0] + a[5]*b[1] + a[8]*b[2]];
};

mat3.determinant = function(a)
{
  // 0 1 2  0 3 6
  // 3 4 5  1 4 7
  // 6 7 8  2 5 8
  return (a[0] * (a[4]*a[8] - a[7]*a[5]) -
	  a[1] * (a[3]*a[8] - a[5]*a[6]) +
	  a[2] * (a[3]*a[7] - a[4]*a[6]));
};

mat3.transpose = function(a)
{
  return [a[0], a[3], a[6],
	  a[1], a[4], a[7],
	  a[2], a[5], a[8]];
};
  
mat3.invert = function(a)
{
  var det = mat3.determinant(a);

  if (Math.abs(det) <= 0.00001)
    return null;

  det = 1 / det;
  
  return [(a[4] * a[8] - a[5] * a[7]) * det,
	  (a[2] * a[7] - a[1] * a[8]) * det,
	  (a[1] * a[5] - a[2] * a[4]) * det,
	  (a[5] * a[6] - a[3] * a[8]) * det,
	  (a[0] * a[8] - a[2] * a[6]) * det,
	  (a[2] * a[3] - a[0] * a[5]) * det,
	  (a[3] * a[7] - a[4] * a[6]) * det,
	  (a[1] * a[6] - a[0] * a[7]) * det,
	  (a[0] * a[4] - a[1] * a[3]) * det];
};

mat4.identity = function()
{
  // out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
  // out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
  // out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
  // out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};

mat4.transpose = function(a)
{
  return [a[0], a[4], a[8], a[12],
	  a[1], a[5], a[9], a[13],
	  a[2], a[6], a[10],a[14],
	  a[3], a[7], a[11],a[15]];
};

mat4.mult = function(a, b)
{
  var m1  = a[0]*b[0]  + a[4]*b[1]  + a[8]*b[2]   + a[12]*b[3];
  var m2  = a[1]*b[0]  + a[5]*b[1]  + a[9]*b[2]   + a[13]*b[3];
  var m3  = a[2]*b[0]  + a[6]*b[1]  + a[10]*b[2]  + a[14]*b[3];
  var m4  = a[3]*b[0]  + a[7]*b[1]  + a[11]*b[2]  + a[15]*b[3];
  
  var m5  = a[0]*b[4]  + a[4]*b[5]  + a[8]*b[6]   + a[12]*b[7];
  var m6  = a[1]*b[4]  + a[5]*b[5]  + a[9]*b[6]   + a[13]*b[7];
  var m7  = a[2]*b[4]  + a[6]*b[5]  + a[10]*b[6]  + a[14]*b[7];
  var m8  = a[3]*b[4]  + a[7]*b[5]  + a[11]*b[6]  + a[15]*b[7];

  var m9  = a[0]*b[8]  + a[4]*b[9]  + a[8]*b[10]  + a[12]*b[11];
  var m10 = a[1]*b[8]  + a[5]*b[9]  + a[9]*b[10]  + a[13]*b[11];
  var m11 = a[2]*b[8]  + a[6]*b[9]  + a[10]*b[10] + a[14]*b[11];
  var m12 = a[3]*b[8]  + a[7]*b[9]  + a[11]*b[10] + a[15]*b[11];

  var m13 = a[0]*b[12] + a[4]*b[13] + a[8]*b[14]  + a[12]*b[15];
  var m14 = a[1]*b[12] + a[5]*b[13] + a[9]*b[14]  + a[13]*b[15];
  var m15 = a[2]*b[12] + a[6]*b[13] + a[10]*b[14] + a[14]*b[15];
  var m16 = a[3]*b[12] + a[7]*b[13] + a[11]*b[14] + a[15]*b[15];

  return [m1,   m2,  m3,  m4,
	  m5,   m6,  m7,  m8,
	  m9,  m10, m11, m12,
	  m13, m14, m15, m16];
};

mat4.affineInv = function(a)
{
  // Assert Matrix a is affine transform.
  // a = [ M b ]
  //     [ 0 1 ]
  //------------------------------------------------------
  //inv(a)*[x] = [ inv(M) -inv(M)*b ]*[x] = [inv(M)*(x-b)]
  //       [1]   [   0         1    ] [1]   [      1     ]
  
  
  var M = [a[0], a[1], a[2], a[4], a[5], a[6], a[8], a[9], a[10]];
  var det = mat3.determinant(M);
  if (Math.abs(det) <= 0.000001)
    return null;

  var invM = mat3.invert(M);

  return [invM[0], invM[1], invM[2], 0,
	  invM[3], invM[4], invM[5], 0,
	  invM[6], invM[7], invM[8], 0,
	  -invM[0]*a[12] - invM[3]*a[13] - invM[6]*a[14],
	  -invM[1]*a[12] - invM[4]*a[13] - invM[7]*a[14],
	  -invM[2]*a[12] - invM[5]*a[13] - invM[8]*a[14],
	  1];
};

mat4.perspectiveMat = function(fov, aspectRatio, nearPlane, farPlane)
{
  // top    = near*tan(pi/180 * fov/2)
  // bottom = -top
  // right  = top*aspectRatio
  // left   = -right
  var top = nearPlane * Math.tan(fov * Math.PI / 360);
  var right = top * aspectRatio;
  var a = (2 * nearPlane) / (right+right);
  var b = (2 * nearPlane) / (top+top);
  var c = -(farPlane + nearPlane) / (farPlane - nearPlane);
  var d = -2 * (farPlane * nearPlane) / (farPlane - nearPlane);
  return [ a, 0, 0, 0,
	   0, b, 0, 0,
	   0, 0, c,-1,
	   0, 0, d, 0];
};

mat4.lookatMat = function(eye, center, up)
{
  var zAxis = vec3.normalize(vec3.sub(center, eye));
  var xAxis = vec3.normalize(vec3.cross(up, zAxis));
  var yAxis = vec3.cross(zAxis, xAxis);

  var mEye = [-eye[0], -eye[1], -eye[2]];
  var x = vec3.dot(xAxis, mEye);
  var y = vec3.dot(yAxis, mEye);
  var z = vec3.dot(zAxis, mEye);

  var rotMat = [xAxis[0], xAxis[1], xAxis[2], 0,
		yAxis[0], yAxis[1], yAxis[2], 0,
		zAxis[0], zAxis[1], zAxis[2], 0,
		0, 0, 0, 1];

  // Look at Matrix = TranslationMat * RotationMat
  // view Matrix    = inverse(LookAtMat)
  //                = inverse(RotMat) * inverse(TransMat)
  var invR = [xAxis[0], yAxis[0], zAxis[0], 0,
	      xAxis[1], yAxis[1], zAxis[1], 0,
	      xAxis[2], yAxis[2], zAxis[2], 0,
	      0,        0,        0,        1];
  var invT = [1,      0,      0,      0,
	      0,      1,      0,      0,
	      0,      0,      1,      0,
	      eye[0], eye[1], eye[2], 1];
  var viewMat = mat4.mult(mat4.transpose(rotMat), invT);
  return viewMat;
  // return [xAxis[0], yAxis[0], zAxis[0], 0,
  // 	  xAxis[1], yAxis[1], zAxis[1], 0,
  // 	  xAxis[2], yAxis[2], zAxis[2], 0,
  // 	  x,        y,        z,        1];
};

mat4.scaleMat = function(x, y, z)
{
  return [x, 0, 0, 0,
	  0, y, 0, 0,
	  0, 0, z, 0,
	  0, 0, 0, 1];
};

mat4.translateMat = function(x, y, z)
{
  return [1, 0, 0 ,0,
	  0 ,1, 0, 0,
	  0, 0, 1, 0,
	  x, y, z, 1];
};
mat4.rotateX = function(angle)
{
  var a = Math.cos(angle);
  var b = Math.sin(angle);
  var c = -b;
  return [1, 0, 0, 0,
	  0, a, b, 0,
	  0, c, a, 0,
	  0, 0, 0, 1];
};

mat4.rotateMat = function(angle, x, y, z)
{
  var c = Math.cos(angle * Math.PI / 180);
  var s = Math.sin(angle * Math.PI / 180);
  var mc= 1 - c;
  var xx= x * x;
  var xy= x * y;
  var xz= x * z;
  var yy= y * y;
  var yz= y * z;
  var zz= z * z;

  var m1 = xx * mc + c;
  var m2 = xy * mc + z * s;
  var m3 = xz * mc - y * s;

  var m5 = xy * mc - z * s;
  var m6 = yy * mc + c;
  var m7 = yz * mc + x * s;

  var m9 = xz * mc + y * s;
  var m10= yz * mc - x * s;
  var m11= zz * mc + c;
  return [m1,  m2,  m3,   0,
	  m5,  m6,  m7,   0,
	  m9, m10, m11,   0,
	   0,   0,   0 ,  1];
};

function deg2Rad(x)
{
  return x * Math.PI / 180;
}

function signedVolumeOfTriangle(p1, p2, p3) {
    var v321 = p3[0]*p2[1]*p1[2];
    var v231 = p2[0]*p3[1]*p1[2];
    var v312 = p3[0]*p1[1]*p2[2];
    var v132 = p1[0]*p3[1]*p2[2];
    var v213 = p2[0]*p1[1]*p3[2];
    var v123 = p1[0]*p2[1]*p3[2];
    return (1.0/6.0)*(-v321 + v231 + v312 - v132 - v213 + v123);
}

function meshVolume(mesh)
{
  var v = 0;
  for(var i = 0; i < mesh.faceIdx.length; i += 3)
  {
    var idx1 = mesh.faceIdx[i]*3;
    var idx2 = mesh.faceIdx[i+1]*3;
    var idx3 = mesh.faceIdx[i+2]*3;
    var p1 = [mesh.vertices[idx1],
	      mesh.vertices[idx1+1],
	      mesh.vertices[idx1+2]];
    var p2 = [mesh.vertices[idx2],
	      mesh.vertices[idx2+1],
	      mesh.vertices[idx2+2]];
    var p3 = [mesh.vertices[idx3],
	      mesh.vertices[idx3+1],
	      mesh.vertices[idx3+2]];
    
    v += signedVolumeOfTriangle(p1, p2, p3);
  }

  var fileDisplayArea = document.getElementById("fileDisplayArea");
  
  var msg;
  msg = "VertexNum:" + mesh.vertexNum + "\n";
  msg +="FacesNum:" + mesh.faceNum + "\n";
  msg +="Volume:" + v + "\n";
  fileDisplayArea.innerHTML = msg;
}


// ----------------------------------------------------------------------
// Read Obj file
// ----------------------------------------------------------------------

var fileInput, fileDisplayArea;

function readObjFile()
{
  var file = fileInput.files[0];
  var reader = new FileReader();

  reader.onload = function(event)
  {
    var objText = reader.result.split("\n");
    
    var obj = {vertices:[], normal:[], uv:[],
	       faceIdx:[], uvIdx:[], normalIdx:[], lineIdx:[]};
    
    obj.vertexNum = 0;
    obj.faceNum = 0;   
    
    objText.forEach(function(line) {
      line = line.replace(/\s+/g, ' ');
      line = line.replace(/\s+$/g, '');
      
      var data = line.split(' ');
      // var fIdx = [], uvIdx = [], nIdx = [], lIdx;
      
      if(data[0] === "v")
      {
	data.shift();
	data = data.map(function(v) {obj.vertices.push(parseFloat(v));});
	obj.vertexNum++;
      }
      else if(data[0] === "vn")
      {
	data.shift();
	data = data.map(function(vn) {obj.normal.push(parseFloat(vn));});
      }
      else if(data[0] === "vt")
      {
	data.shift();
	data = data.map(function(vt) {obj.uv.push(parseFloat(vt));});
      }
      else if(data[0] === "f")
      {
	data.shift();
	if(obj.normal.length > 0 && obj.uv.length > 0)
	{
	  data.forEach(function(d) {
	    var slashMatches = d.match("//");
	    if(slashMatches)
	      var indices = d.split("//");
	    else
	      indices = d.split("/");
	    
	    obj.faceIdx.push(parseInt(indices[0]-1));
	    obj.uvIdx.push(parseInt(indices[1]-1));
	    obj.normalIdx.push(parseInt(indices[2]-1));
	  });
	}
	else if(obj.normal.length > 0)
	{
	  data.forEach(function(d) {
	    var slashMatches = d.match("//");
	    var indices;
	    if(slashMatches)
	      indices = d.split("//");
	    else
	      indices = d.split("/");
	    
	    obj.faceIdx.push(parseInt(indices[0]-1));
	    obj.normalIdx.push(parseInt(indices[1]-1));
	  });
	}
	else
	{ // Only face
	  data.forEach(function(d) {
	    obj.faceIdx.push(parseInt(d)-1);
	  });
	}
	
	obj.faceNum++;
      }
    });

    for(var i = 0; i < obj.faceIdx.length; i += 3)
    {
      obj.lineIdx.push(obj.faceIdx[i]);
      obj.lineIdx.push(obj.faceIdx[i+1]);
      obj.lineIdx.push(obj.faceIdx[i+1]);
      obj.lineIdx.push(obj.faceIdx[i+2]);
      obj.lineIdx.push(obj.faceIdx[i+2]);
      obj.lineIdx.push(obj.faceIdx[i]);
    }
		       
    meshVolume(obj);
    model[0] = obj;
    initBuffer();
    rendering();
  };

  reader.readAsText(file);
}

function stringToFloat(s)
{
  return parseFloat(s);
}

function readTextFile(file)
{
  var rawFile = new XMLHttpRequest();
  var text;
  rawFile.open("GET", file, false);
  rawFile.onreadystatechange = function ()
  {
    if(rawFile.readyState === 4)
    {
      if(rawFile.status === 200 || rawFile.status == 0)
      {
        text = rawFile.responseText;
	alert(text);
      }
    }
  };
  rawFile.send(null);
  return text;
}
