function gObj(gl, shaderInfo)
{
  if(!gl)
  {
    console.warn("GL not initialize yet!!!");
    return;
  }
  
  this.mMat = mat4.identity();
  
  if(shaderInfo.pos)
    this.pos = shaderInfo.pos;
  else
    this.pos = [0, 0, 0];

  if(shaderInfo.vertexShader)
  {
    this.vertexShader = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(this.vertexShader, shaderInfo.vertexShader);
    gl.compileShader(this.vertexShader);
    if(!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS))
    {
      console.error(gl.getShaderInfoLog(this.vertexShader));
    }
  }

  if(shaderInfo.fragmentShader)
  {
    this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fragmentShader, shaderInfo.fragmentShader);
    gl.compileShader(this.fragmentShader);
    if(!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS))
    {
      console.error(gl.getShaderInfoLog(this.fragmentShader));
    }
    
  }

  // Create shader program
  this.program = gl.createProgram();
  gl.attachShader(this.program, this.vertexShader);
  gl.attachShader(this.program, this.fragmentShader);
  gl.linkProgram(this.program);

  if(!gl.getProgramParameter(this.program, gl.LINK_STATUS))
  {
    var lastError = gl.getProgramInfoLog(this.program);
    console.warn("Error in program linking:" + lastError);
    //console.warn("Shader program link ERROR!!!");
  }

  gl.useProgram(this.program);

  this.vAttri = gl.getAttribLocation(this.program, "position");
  gl.enableVertexAttribArray(this.vAttri);

  if(this.vAttri === -1)
  {
    console.error("Get attribute location error : position");
  }

  this.uniforms = [];
  for(var i = 0; i < shaderInfo.uniforms.length; ++i)
  {
    this.uniforms.push(gl.getUniformLocation(this.program,
					     shaderInfo.uniforms[i]));
  }

  this.color = shaderInfo.color;

  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(shaderInfo.vertices), gl.STATIC_DRAW);
  //gl.vertexAttribPointer(this.vAttri, 3, gl.FLOAT, false, 0, 0);

  this.faceElementAryBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.faceElementAryBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(shaderInfo.faceIdx), gl.STATIC_DRAW);

  this.faceIdxNum = shaderInfo.faceIdx.length;

  this.setUniforms = function()
  {
    gl.uniformMatrix4fv(this.uniforms[0], false, this.mvMat);
    gl.uniformMatrix4fv(this.uniforms[1], false, pMat);
    gl.uniform4fv(this.uniforms[2], this.color);
  };

  this.translate = function(x, y, z)
  {
    // var dx = x - this.pos[0];
    // var dy = y - this.pos[1];
    // var dz = z - this.pos[2];
    this.mMat[12] += x - this.pos[0];
    this.mMat[13] += y - this.pos[1];
    this.mMat[14] += z - this.pos[2];
    //this.mMat = mat4.mult(mat4.translateMat(dx, dy, dz), this.mMat);
    this.pos = [x, y, z];
  };

  this.rotateX = function(angle)
  {
    this.mMat[12] -= this.pos[0];
    this.mMat[13] -= this.pos[1];
    this.mMat[14] -= this.pos[2];
    this.mMat = mat4.mult(mat4.rotateX(angle), this.mMat);
    this.mMat[12] += this.pos[0];
    this.mMat[13] += this.pos[1];
    this.mMat[14] += this.pos[2];
  };

  this.rotateY = function(angle)
  {
    this.mMat[12] -= this.pos[0];
    this.mMat[13] -= this.pos[1];
    this.mMat[14] -= this.pos[2];
    this.mMat = mat4.mult(mat4.rotateMat(angle, 0, 1, 0), this.mMat);
    this.mMat[12] += this.pos[0];
    this.mMat[13] += this.pos[1];
    this.mMat[14] += this.pos[2];
  };
  
  this.rotateZ = function(angle)
  {
    this.mMat[12] -= this.pos[0];
    this.mMat[13] -= this.pos[1];
    this.mMat[14] -= this.pos[2];
    this.mMat = mat4.mult(mat4.rotateMat(angle, 0, 0, 1), this.mMat);
    this.mMat[12] += this.pos[0];
    this.mMat[13] += this.pos[1];
    this.mMat[14] += this.pos[2];
  };

  this.rotateWithMat = function(mat)
  {
    this.mMat[12] -= this.pos[0];
    this.mMat[13] -= this.pos[1];
    this.mMat[14] -= this.pos[2];
    this.mMat = mat4.mult(mat, this.mMat);
    this.mMat[12] += this.pos[0];
    this.mMat[13] += this.pos[1];
    this.mMat[14] += this.pos[2];
  };

  this.draw = function(type)
  {
    this.mvMat = mat4.mult(vMat, this.mMat);
    
    // -----Use Program-----
    gl.useProgram(this.program);
    // -----Bind vertex buffer-----
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.vAttri, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.vAttri);
    // -----Bind face element array buffer-----
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.faceElementAryBuffer);

    this.setUniforms();

    if(type == "POINTS")
      gl.drawElements(gl.POINTS, this.faceIdxNum, gl.UNSIGNED_SHORT, 0);
    else if(type == "TRIANGLES")
      gl.drawElements(gl.TRIANGLES, this.faceIdxNum, gl.UNSIGNED_SHORT, 0);
  };
}
