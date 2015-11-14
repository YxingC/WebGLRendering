var gl;
var shaderProgram;
var model = [];

var cam = {};

var mMat;
var vMat;
var pMat;
var nMat;
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
  gl.enableVertexAttribArray(shaderProgram.nAttri);
  
  shaderProgram.mvUniform    = gl.getUniformLocation(shaderProgram, "mv");
  shaderProgram.pUniform     = gl.getUniformLocation(shaderProgram, "p");
  shaderProgram.nUniform     = gl.getUniformLocation(shaderProgram, "normalMat");
  shaderProgram.ptUniform    = gl.getUniformLocation(shaderProgram, "ptSize");
  shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "color");
}

function setMatUniforms()
{
  gl.uniformMatrix4fv(shaderProgram.mvUniform, false, mvMat);
  gl.uniformMatrix4fv(shaderProgram.pUniform, false, pMat);
  gl.uniformMatrix4fv(shaderProgram.nUniform, false, nMat);
  gl.uniform1f(shaderProgram.ptUniform, 1.0);
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
  mMat = mat4.identity();
  vMat = mat4.lookatMat([0, 0, 1], [0, 0, 0], [0, 1, 0]);
  pMat = mat4.perspectiveMat(45, gl.viewportWidth/gl.viewportHeight, 0.1, 1000);
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
  mvMat = mat4.mult(vMat, mMat);
  nMat  = mat4.affineInv(mvMat);
  nMat  = mat4.transpose(nMat);
  var cp = vec3.extrackCamPos_NoScale(mvMat);
  
  gl.stencilFunc(gl.ALWAYS, 1, -1);
  gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fElementAryBuffer);
  setMatUniforms();
  gl.uniform4f(shaderProgram.colorUniform, 1, 0, 0, 1);
  gl.drawElements(gl.TRIANGLES, fIdxNum, gl.UNSIGNED_SHORT, 0);

  // Render the thick wireframe version.

  gl.stencilFunc(gl.NOTEQUAL, 1, -1);
  gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lElementAryBuffer);
  gl.lineWidth(3);
  setMatUniforms();
  gl.uniform4f(shaderProgram.colorUniform, 0.3, 0.3, 0.3, 0.75);
  gl.drawElements(gl.LINES, lIdxNum, gl.UNSIGNED_SHORT, 0);
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
  var rotMatY = mat4.rotateMat(deltaY/10, 1, 0, 0);

  vMat = mat4.mult(vMat, rotMatX);

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
