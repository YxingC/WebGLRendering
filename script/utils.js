var gl;
var shaderProgram;
var model = [];

var cam = {};

var vMat;
var pMat;

var lastPosX;
var lastPosY;
var isMouseDown = false;

var fileInput, fileDisplayArea, uploadBtn;

var vs =
      "attribute vec3 aPosition;"+
      "uniform mat4 uMV;"+
      "uniform mat4 uP;"+
      "void main(void) {"+
      "  gl_Position = uP * uMV * vec4(uPosition, 1.0);"+
      "}";
var fs =
      "precision highp float;"+
      "uniform vec4 uColor;"+
      "void main(void) {"+
      "  gl_FragColor = uColor;" +
      "}";

var vs_with_lighting =
      "attribute vec3 aPosition;" +
      "attribute vec3 aNormal;" +
      "uniform mat4 uMV;" +
      "uniform mat4 uP;" +
      "uniform mat4 uNormalMatrix;" +
      "varying vec3 vVertexPosition;"+
      "varying vec3 vNormalTransform;" +
      "void main(void)" +
      "{" +
      "  gl_Position = uP * uMV * vec4(aPosition, 1.0);" +
      "  vNormalTransform = vec3(uNormalMatrix * vec4(aNormal, 1.0));" +
      "  vVertexPosition = vec3(uMV * vec4(aPosition, 0.0));" +
      "}";

var fs_with_lighting =
      "precision highp float;"+
      "uniform vec4 uColor;"+
      "varying vec3 vVertexPosition;" +
      "varying vec3 vNormalTransform;" +
      "const vec3 lightPosition = vec3(10, 10, 10);" +
      "void main(void) {" +
      "  vec3 lightDir = normalize(lightPosition - vVertexPosition);" +
      "  vec3 normal = normalize(vNormalTransform);" +
      "  float dIntansity = dot(normal, lightDir);" +
      "  gl_FragColor = vec4(uColor.rgb * dIntansity, uColor.a);" +
      "}";

var vs_with_lightingAndPointColor =
      "attribute vec3 aPosition;" +
      "attribute vec3 aNormal;" +
      "attribute vec3 aColor;" +
      "uniform mat4 uMV;" +
      "uniform mat4 uP;" +
      "uniform mat4 uNormalMatrix;" +
      "varying vec3 vVertexPosition;"+
      "varying vec3 vNormalTransform;" +
      "varying vec4 vColor;" +
      "void main(void)" +
      "{" +
      "  gl_Position = uP * uMV * vec4(aPosition, 1.0);" +
      "  vNormalTransform = vec3(uNormalMatrix * vec4(aNormal, 1.0));" +
      "  vVertexPosition = vec3(uMV * vec4(aPosition, 0.0));" +
      "  vColor = vec4(aColor, 1.0);" +
      "}";

var fs_with_lightingAndPointColor =
      "precision highp float;"+
      "uniform vec4 uColor;" +
      "uniform bool uIsOutline;" +
      "varying vec3 vVertexPosition;" +
      "varying vec3 vNormalTransform;" +
      "varying vec4 vColor;" +
      "const vec3 lightPosition = vec3(10, 10, 10);" +
      "void main(void) {" +
      "  vec3 lightDir = normalize(lightPosition - vVertexPosition);" +
      "  vec3 normal = normalize(vNormalTransform);" +
      "  float dIntansity = dot(normal, lightDir);" +
      "  if(uIsOutline)" +
      "    gl_FragColor = uColor;" +
      "  else" +
      "    gl_FragColor = vec4(vColor.rgb * dIntansity, vColor.a);" +
      "}";

var go = [];
var fps = 60;

function start()
{
  // File input initialize (Read obj file).
  //fileInput = document.getElementById('fileInput');
  uploadBtn = document.getElementById("uploadBtn");
  fileDisplayArea = document.getElementById('fileDisplayArea');
  //fileInput.onchange = readObjFile(objLoader);

  $("[type=file]").on("change", function(){
    // Name of file and placeholder
    var file = this.files[0].name;
    var dflt = $(this).attr("placeholder");
    if($(this).val()!=""){
      $(this).next().text(file);
    } else {
      $(this).next().text(dflt);
    }
  });
  // WebGL initialize.
  var canvas = document.getElementById("canvas");
  initGL(canvas);
  initMat();


  this.requestAnimFrame = (function() {
    return (this.requestAnimationFrame       || 
            this.webkitRequestAnimationFrame || 
            this.mozRequestAnimationFrame    || 
            this.oRequestAnimationFrame      || 
            this.msRequestAnimationFrame       
	   );
  })();

  // Mouse event.
  canvas.onmousedown = handleMouseDown;
  document.onmouseup = handleMouseUp;
  document.onmousemove = handleMouseMove;

  if(gl)
  {
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.STENCIL_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    initObject();
  }

  //renderLoop();
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

function initObject()
{
  //readTextFile("model/bunny.obj", objLoader);
}

function initMat()
{
  mMat = mat4.identity();
  vMat = mat4.lookatMat([0, 0, -50], [0, 0, 0], [0, 1, 0]);
  pMat = mat4.perspectiveMat(45, gl.viewportWidth/gl.viewportHeight, 0.1, 1000);
}

function renderLoop()
{
  setTimeout(function() {
    requestAnimFrame(renderLoop);
    update();
    rendering();
  }, 1000/fps);
}

function update()
{
  
}

function rendering()
{
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clearStencil(0);
  gl.clear(gl.COLOR_BUFFER_BIT |
	   gl.DEPTH_BUFFER_BIT |
	   gl.STENCIL_BUFFER_BIT);

  for(var i = 0; i < go.length; ++i)
  {
    go[i].draw("TRIANGLES");
  }
}

/*
function renderingX()
{
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clearStencil(0);
  gl.clear(gl.COLOR_BUFFER_BIT |
	   gl.DEPTH_BUFFER_BIT |
	   gl.STENCIL_BUFFER_BIT);

  //gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  //setMatUniforms();
  //gl.drawArrays(gl.POINTS, 0, model[0].vertices/3);

  // Render the mesh into stencil buffer.
  //if(mv < 2.0)
  //  mv = 0.1;
  // mMat  = mat4.mult(mat4.translateMat(mv, 0, 0), mMat);
  mvMat = mat4.mult(vMat, mMat);
  nMat  = mat4.affineInv(mvMat);
  nMat  = mat4.transpose(nMat);
  var cp = vec3.extrackCamPos_NoScale(mvMat);
  
  gl.stencilFunc(gl.ALWAYS, 1, -1);
  gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

  console.log(eabArray.length);
  for(var i = 0; i < eabArray.length; ++i)
  {
    var fIdxNum = model[i].faceIdx.length;
    var lIdxNum = model[i].lineIdx.length;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vbArray[i]);
    gl.vertexAttribPointer(shaderProgram.vAttri, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderProgram.vAttri);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eabArray[i]);

    setMatUniforms();
    gl.uniform4f(shaderProgram.colorUniform, 0.6, 0.7, 0.8, 1);
    gl.drawElements(gl.TRIANGLES, fIdxNum, gl.UNSIGNED_SHORT, 0);
  }

  // Render the thick wireframe version.

  // gl.stencilFunc(gl.NOTEQUAL, 1, -1);
  // gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

  // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lElementAryBuffer);
  // gl.lineWidth(3);
  // setMatUniforms();
  // gl.uniform4f(shaderProgram.colorUniform, 0.0, 0.6, 0.2, 0.75);
  // gl.drawElements(gl.LINES, lIdxNum, gl.UNSIGNED_SHORT, 0);
}
*/

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
  var rotMatX = mat4.rotateMat(deltaY/10, 1, 0, 0);
  var rotMatZ = mat4.rotateMat(deltaX/10, 0, 0, 1);

  // for(var i = 0; i < go.length; ++i)
  // {
  //   go[i].rotateWithMat(rotMatX);
  //   go[i].rotateWithMat(rotMatY);
  // }
  
  vMat = mat4.mult(vMat, rotMatX);
  vMat = mat4.mult(vMat, rotMatZ);

  rendering();

  lastPosX = newPosX;
  lastPosY = newPosY;
}

function uCallback()
{
  var i = this.index;
  gl.uniformMatrix4fv(go[i].uniforms.loc[0], false, go[i].mvMat);
  gl.uniformMatrix4fv(go[i].uniforms.loc[1], false, pMat);
  gl.uniformMatrix4fv(go[i].uniforms.loc[2], false, go[i].nMat);
  gl.uniform4fv(go[i].uniforms.loc[3], go[i].defaultColor);
  gl.uniform1i(go[i].uniforms.loc[4], go[i].isOutline);
}



