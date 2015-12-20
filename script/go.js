function gObj(gl, shaderInfo)
{
  // Check the gl was initialized already.
  if(!gl)
  {
    console.warn("GL not initialize yet!!!");
    return;
  }

  // ------------------------------------------------------------
  // First we need to get the source code of vertex shader and
  // fragment shader, then compile two of them, after that we can
  // attach vertex and fragment shader to the shader program.
  // After all we need to get the attribute and uniform location
  // that we want to pass.
  // ------------------------------------------------------------
  
  // Check the vertex shader was existed and compiled successful.
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
  else
  {
    console.error("Missing vertex shader for this object.");
    return;
  }

  // Check the fragment shader was existed and compiled successful.
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
  else
  {
    console.error("Missing fragment shader for this object.");
    return;
  }

  // Create shader program
  this.program = gl.createProgram();
  gl.attachShader(this.program, this.vertexShader);
  gl.attachShader(this.program, this.fragmentShader);
  gl.linkProgram(this.program);

  // Check the shader program was linked successful.
  if(!gl.getProgramParameter(this.program, gl.LINK_STATUS))
  {
    var lastError = gl.getProgramInfoLog(this.program);
    console.warn("Error in program linking:" + lastError);
    //console.warn("Shader program link ERROR!!!");
    return;
  }

  gl.useProgram(this.program);

  this.vAttri = gl.getAttribLocation(this.program, "aPosition");
  
  if(this.vAttri != -1)
    gl.enableVertexAttribArray(this.vAttri);
  else
    console.error("Get attribute location error : aPosition");

  this.nAttri = gl.getAttribLocation(this.program, "aNormal");
  
  if(this.nAttri != -1)
    gl.enableVertexAttribArray(this.nAttri);
  else
    console.warn("Get attribute location error : aNormal!! " +
		 "Please check the shader that contain normal attribute or not.");

  this.cAttri = gl.getAttribLocation(this.program, "aColor");
  if(this.cAttri != -1)
    gl.enableVertexAttribArray(this.cAttri);
  else
    console.warn("Get attribute location error : aColor!! " +
		 "Please check the shader that contain color attribute or not.");


    console.log(this.vAttri + " " + this.nAttri + this.cAttri);
  this.uniforms = {};
  this.uniforms.name = shaderPreprocessing(shaderInfo.vertexShader,
					   shaderInfo.fragmentShader);
  this.uniforms.loc  = [];
  this.uniforms.callback = shaderInfo.uniformCallback;

  for(var i = 0; i < this.uniforms.name.length; ++i)
  {
    var uLoc = gl.getUniformLocation(this.program, this.uniforms.name[i]);

    if(uLoc)
    {
      this.uniforms.loc.push(uLoc);;
    }
  }

  // ------------------------------------------------------------
  // Create the buffers that have to use. I decied to use drawElements
  // to render the object, so there are two buffers must be created.
  //
  // One of them is vertex array buffer which contain every single
  // point of the model. And the ohter one is element array
  // buffer, which contain the face indices.
  //
  // And the others are optional. An element array buffer, which I want
  // to draw the outline of the model, contain the line indices. An array
  // buffer contain every single normal vertor and an element array
  // buffer contain the normal index of each face.
  // ------------------------------------------------------------

  if(shaderInfo.data.vertices && this.vAttri != -1)
  {
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
		  new Float32Array(shaderInfo.data.vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.vAttri, 3, gl.FLOAT, false, 0, 0);
  }
  else
  {
    if(!shaderInfo.data.vertices)
    { console.error("No vertices data for this object."); }
    if(this.vAttri == -1)
    { console.error("No attribut for vertices in vertex shader."); }
    return;
  }

  if(shaderInfo.data.faceIdx)
  {
    this.faceElementAryBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.faceElementAryBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		  new Uint16Array(shaderInfo.data.faceIdx), gl.STATIC_DRAW);
    
    this.faceIdxNum = shaderInfo.data.faceIdx.length;
  }
  else
  { console.error("No face indices for this object."); return; }

  if(shaderInfo.data.lineIdx)
  {
    this.lineElementAryBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineElementAryBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		  new Uint16Array(shaderInfo.data.lineIdx), gl.STATIC_DRAW);

    this.lineIdxNum = shaderInfo.data.lineIdx.length;
  }

  // Not essential.
  if(shaderInfo.data.normal && this.nAttri != -1)
  {
    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
		  new Float32Array(shaderInfo.data.normal), gl.STATIC_DRAW);
  }

  // Not essential.
  if(shaderInfo.data.color && this.cAttri != -1)
  {
    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
  		  new Float32Array(shaderInfo.data.color), gl.STATIC_DRAW);
  }
  else
  { this.defaultColor = [0.3, 0.55, 0.5, 1]; }

  // -----Model matrix and color info-----

  // Initialize the model matrix of this object.
  this.mMat = mat4.identity();
  this.index = shaderInfo.idx;

  // Get the 3D model's centroid. Otherwise assign original.
  if(shaderInfo.pos)
  {
    this.pos = shaderInfo.pos;
    this.original = shaderInfo.pos;
  }
  else
  { this.pos = [0, 0, 0]; }

  // -----Object's operation-----
  this.setUniforms = function()
  { this.uniforms.callback.call(this); };

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

  this.translateN = function(x, y, z)
  {
    // var dx = x - this.pos[0];
    // var dy = y - this.pos[1];
    // var dz = z - this.pos[2];
    this.mMat[12] += x;
    this.mMat[13] += y;
    this.mMat[14] += z;
    //this.mMat = mat4.mult(mat4.translateMat(dx, dy, dz), this.mMat);
    //this.pos = [x, y, z];
  };

  this.translateN = function(m)
  {
    this.mMat[12] += m[0];
    this.mMat[13] += m[1];
    this.mMat[14] += m[2];
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

  this.clean = function()
  {
    this.mMat = mat4.identity();
  };

  this.draw = function(type)
  {
    this.mvMat = mat4.mult(cam.viewMat(), this.mMat);

    // Temporary
    this.nMat = mat4.transpose(mat4.affineInv(this.mvMat));
    
    // -----Use Program-----
    gl.useProgram(this.program);
    // -----Bind vertex buffer & normal buffer-----
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.vAttri, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.vAttri);

    if(this.normalBuffer && this.nAttri != -1)
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.vertexAttribPointer(this.nAttri, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.nAttri);
    }

    if(this.colorBuffer && this.cAttri != -1)
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.vertexAttribPointer(this.cAttri, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.cAttri);
    }
    // -----Bind face element array buffer-----
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.faceElementAryBuffer);

    this.isOutline = false;
    this.defaultColor = [0.3, 0.55, 0.5, 1];
    this.setUniforms();

    gl.stencilFunc(gl.ALWAYS, 1, -1);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

    if(type == "POINTS")
    { gl.drawElements(gl.POINTS, this.faceIdxNum, gl.UNSIGNED_SHORT, 0); }
    else if(type == "TRIANGLES")
    { gl.drawElements(gl.TRIANGLES, this.faceIdxNum, gl.UNSIGNED_SHORT, 0); }

    this.drawOutline();
  };

  // Render the outline of model.
  this.drawOutline = function()
  {
    gl.stencilFunc(gl.NOTEQUAL, 1, -1);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineElementAryBuffer);
    gl.lineWidth(3);

    this.isOutline = true;
    this.defaultColor = [1, 1, 1, 0.5];
    this.setUniforms();

    gl.drawElements(gl.LINES, this.lineIdxNum, gl.UNSIGNED_SHORT, 0);   
  };
}

function shaderPreprocessing(vs, fs)
{
  var vsLines = vs.split(';');
  var fsLines = fs.split(';');
  var attributes = [];
  var uniforms   = [];

  for(var i in vsLines)
  {
    var token = vsLines[i].split(' ');
    if(token[0] == "attribute")
      attributes.push(token[2]);
    else if(token[0] == "uniform")
      uniforms.push(token[2]);
    else if(token[0] == "void")
      break;
  }

  for(i in fsLines)
  {
    token = fsLines[i].split(' ');
    if(token[0] == "uniform")
      uniforms.push(token[2]);
    else if(token[0] == "void")
      break;
  }

  return uniforms;
}

function findObjectByName(array, name)
{
  for(var i = 0; i < array.length; ++i)
  {
    if(array[i] == name)
      return i;
  }

  return -1;
}
