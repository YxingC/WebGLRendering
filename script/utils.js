// ----------------------------------------------------------------------
// Inplement for WebGL
// ----------------------------------------------------------------------

var gl;
var shaderProgram;
var model = [];

var mat4 = {};
var mMatrix;
var vMatrix;
var pMatrix;


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
  //initBuffer();

  if(gl)
  {
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  //rendering();

}

function initGL(canvas)
{
  try
  {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight= canvas.height;
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

  shaderProgram.vAttri = gl.getAttribLocation(shaderProgram, "position");
  gl.enableVertexAttribArray(shaderProgram.vAttri);
  
  shaderProgram.projUniform = gl.getUniformLocation(shaderProgram, "proj");
  shaderProgram.viewUniform = gl.getUniformLocation(shaderProgram, "view");
  shaderProgram.modelUniform= gl.getUniformLocation(shaderProgram, "model");
  shaderProgram.ptUniform = gl.getUniformLocation(shaderProgram, "ptSize");
}

function setMatUniforms()
{
  gl.uniformMatrix4fv(shaderProgram.projUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.viewUniform, false, vMatrix);
  gl.uniformMatrix4fv(shaderProgram.modelUniform, false, mMatrix);
  gl.uniform1f(shaderProgram.ptUniform, 2.0);
}

var vertexBuffer;
var elementAryBuffer;
function initBuffer()
{
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(model[0].vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(shaderProgram.vAttri, 3, gl.FLOAT, false, 0, 0);
  
  elementAryBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementAryBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(model[0].faceIdx), gl.STATIC_DRAW);
  //alert("initBuffer Done");
}

function rendering()
{
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mMatrix = mat4.identity();
  vMatrix = mat4.lookupMat();
  pMatrix = mat4.perspectiveMat(45, gl.viewportWidth/gl.viewportHeight, 0.1, 100);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  setMatUniforms();
  alert("face num:" + model[0].faceIdx[0] + model[0].faceIdx[1]);
  gl.drawArrays(gl.POINTS, 0, 10000);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementAryBuffer);
  setMatUniforms();
  //alert(model[0].faceIdx.length);
  //gl.drawElements(gl.TRIANGLES, 30000, gl.UNSIGNED_SHORT, 0);
    //alert("Render Done");
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


mat4.identity = function()
{
  // out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
  // out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
  // out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
  // out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
  return [1, 0, 0, 0,
	  0, 1, 0, 0,
	  0, 0, 1, 0,
	  0, 0, 0, 1];
};


mat4.mult = function(a, b)
{
  var m1 = a[0]*b[0] + a[4]*b[1] + a[8]*b[2] + a[12]*b[3];
  var m2 = a[1]*b[0] + a[5]*b[1] + a[9]*b[2] + a[13]*b[3];
  var m3 = a[2]*b[0] + a[6]*b[1] + a[10]*b[2] + a[14]*b[3];
  var m4 = a[3]*b[0] + a[7]*b[1] + a[11]*b[2] + a[15]*b[3];
  
  var m5 = a[0]*b[4] + a[4]*b[5] + a[8]*b[6] + a[12]*b[7];
  var m6 = a[1]*b[4] + a[5]*b[5] + a[9]*b[6] + a[13]*b[7];
  var m7 = a[2]*b[4] + a[6]*b[5] + a[10]*b[6] + a[14]*b[7];
  var m8 = a[3]*b[4] + a[7]*b[5] + a[11]*b[6] + a[15]*b[7];

  var m9 = a[0]*b[8] + a[4]*b[9] + a[8]*b[10] + a[12]*b[11];
  var m10= a[1]*b[8] + a[5]*b[9] + a[9]*b[10] + a[13]*b[11];
  var m11= a[2]*b[8] + a[6]*b[9] + a[10]*b[10] + a[14]*b[11];
  var m12= a[3]*b[8] + a[7]*b[9] + a[11]*b[10] + a[15]*b[11];

  var m13= a[0]*b[12] + a[4]*b[13] + a[8]*b[14] + a[12]*b[15];
  var m14= a[1]*b[12] + a[5]*b[13] + a[9]*b[14] + a[13]*b[15];
  var m15= a[2]*b[12] + a[6]*b[13] + a[10]*b[14] + a[14]*b[15];
  var m16= a[3]*b[12] + a[7]*b[13] + a[11]*b[14] + a[15]*b[15];

  return [m1,   m2,  m3,  m4,
	  m5,   m6,  m7,  m8,
	  m9,  m10, m11, m12,
	  m13, m14, m15, m16];
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

mat4.lookupMat = function()
{
  return [1, 0, 0, 0,
	  0, 1, 0, 0,
	  0, 0, 1, 0,
	  0, 0, -10,1];
};
  

mat4.translateMat = function(x, y, z)
{
  return [1, 0, 0 ,0,
	  0 ,1, 0, 0,
	  0, 0, 1, 0,
	  x, y, z, 1];
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
	       faceIdx:[], uvIdx:[], normalIdx:[]};
    
    obj.vertexNum = 0;
    obj.faceNum = 0;
    
    objText.forEach(function(line) {
      line = line.replace(/\s+/g, ' ');
      line = line.replace(/\s+$/g, '');
      var data = line.split(' ');
      if(data[0] === "v")
      {
	data.shift();
	data = data.map(function(vt) {
	  vt = parseFloat(vt);
	  obj.vertices.push(vt);
	});
	//obj.vertices.push(data);
	obj.vertexNum++;
      }
      else if(data[0] === "vn")
      {
	data.shift();
	data = data.map(stringToFloat);
	obj.normal.push(data);
      }
      else if(data[0] === "vt")
      {
	data.shift();
	data = data.map(stringToFloat);
	obj.uv.push(data);
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
	    
	    obj.faceIdx.push(parseInt(indices[0]));
	    obj.uvIdx.push(parseInt(indices[1]));
	    obj.normalIdx.push(parseInt(indices[2]));
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
	    
	    obj.faceIdx.push(parseInt(indices[0])-1);
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


    model.push(obj);
//    var fileDpa = document.getElementById("fileDisplayArea");
//    fileDpa.innerText = model[0].vertices;
    initBuffer();
    rendering();;
    //fileDisplayArea.innerText = verticex[4941][0];
    //alert(obj.vertices.length);
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
