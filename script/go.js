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

  this.vAttri = gl.getAttribLocation(this.program, "position");
  gl.enableVertexAttribArray(this.vAttri);

  if(this.vAttri === -1)
  {
    console.error("Get attribute location error : position");
  }

  if(shaderInfo.normal)
  {
    this.nAttri = gl.getAttribLocation(this.program, "normal");
    gl.enableVertexAttribArray(this.nAttri);
    if(this.nAttri === -1)
    {
      console.error("Get attribute location error : normal!! " +
		    "Please check the shader that contain normal attribute or not.");
    }
  }

  this.uniforms = [];
  this.uniformKey = shaderInfo.uniforms;
  for(var i = 0; i < shaderInfo.uniforms.length; ++i)
  {
    this.uniforms.push(gl.getUniformLocation(this.program,
					     shaderInfo.uniforms[i]));
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

  if(shaderInfo.lineIdx)
  {
    this.lineElementAryBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineElementAryBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		  new Uint16Array(shaderInfo.lineIdx), gl.STATIC_DRAW);

    this.lineIdxNum = shaderInfo.faceIdx.length;
  }

  if(shaderInfo.normal)
  {
    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
		  new Float32Array(shaderInfo.normal), gl.STATIC_DRAW);

    // this.normalElementAryBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.normalElementAryBuffer);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    // 		  new Uint16Array(shaderInfo.normalIdx), gl.STATIC_DRAW);
  }

  // -----Model matrix and color info-----

  // Initialize the model matrix of this object.
  this.mMat = mat4.identity();

  // Get the 3D model's centroid. Otherwise assign original.
  if(shaderInfo.pos)
  {
    this.pos = shaderInfo.pos;
    this.original = shaderInfo.pos;
  }
  else
  {
    this.pos = [0, 0, 0];
  }

  this.color = shaderInfo.color;

  // -----Object's operation-----
  this.setUniforms = function()
  {
    gl.uniformMatrix4fv(this.uniforms[0], false, this.mvMat);
    gl.uniformMatrix4fv(this.uniforms[1], false, pMat);
    gl.uniform4fv(this.uniforms[2], this.color);

    // Temporary
    gl.uniformMatrix4fv(this.uniforms[3], false, this.nMat);
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

  this.clean = function()
  {
    this.mMat = mat4.identity();
  };

  this.draw = function(type)
  {
    this.mvMat = mat4.mult(vMat, this.mMat);

    // Temporary
    this.nMat = mat4.transpose(mat4.affineInv(this.mvMat));
    
    // -----Use Program-----
    gl.useProgram(this.program);
    // -----Bind vertex buffer & normal buffer-----
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.vAttri, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.vAttri);

    if(this.normalBuffer)
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.vertexAttribPointer(this.nAttri, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.nAttri);
    }
    // -----Bind face element array buffer-----
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.faceElementAryBuffer);

    this.setUniforms();

    gl.stencilFunc(gl.ALWAYS, 1, -1);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

    if(type == "POINTS")
      gl.drawElements(gl.POINTS, this.faceIdxNum, gl.UNSIGNED_SHORT, 0);
    else if(type == "TRIANGLES")
      gl.drawElements(gl.TRIANGLES, this.faceIdxNum, gl.UNSIGNED_SHORT, 0);

    this.drawOutline();
  };

  // Render the outline of model.
  this.drawOutline = function()
  {
    gl.stencilFunc(gl.NOTEQUAL, 1, -1);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineElementAryBuffer);
    gl.lineWidth(3);
    this.setUniforms();
    gl.uniform4fv(this.uniforms[2], [1, 1, 1, 0.5]);
    gl.drawElements(gl.LINES, this.lineIdxNum, gl.UNSIGNED_SHORT, 0);   
  };
}
