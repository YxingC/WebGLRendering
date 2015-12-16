// ----------------------------------------------------------------------
// This javascript is for load the .obj file.
// ----------------------------------------------------------------------

// Using input tag to choose file you want to load.
// inputTag: The element id of input tag.
// callback: What you want to do for the file you choose.
//           It's a callback function
function chooseFile(inputTag, callback)
{
  var file = inputTag.files[0];
  var reader = new FileReader();

  reader.arguments = Array.prototype.slice.call(arguments, 2);

  reader.onload = function(event)
  {
    // meshVolume(obj);
    callback.apply(this, this.arguments);
  };

  reader.readAsText(file);
}


// Using HTTP request the file what you want to load.
// file    : Give the absolute or relative path of the file.
// callback: Give the function you want to callback, when file loaded.
function readTextFile(file, callback)
{
  var rawFile = new XMLHttpRequest();
  // rawFile.timeout = 4000;
  rawFile.arguments = Array.prototype.slice.call(arguments, 2);
  rawFile.open("GET", file, false);
  rawFile.onreadystatechange = function ()
  {
    if(rawFile.readyState === 4)
    {
      if(rawFile.status === 200 || rawFile.status == 0)
      {	
	callback.apply(this, rawFile.arguments);
      }
    }
    return null;
  };
  rawFile.send(null);
}

// The function for reading the text file.
function textLoader()
{
  var text = this.responseText.split("\n");
  text.forEach(function(line) {
    line = line.replace(/\s+/g, ' ');
    line = line.replace(/\t+/g, ' ');
    line = line.replace(/\s+$/g, '');
    var data = line.split(' ');

    for(var index in data)
    {
      var f = stringToFloat(data[index]);
      movePosition.push(f);
    }
  });
}

// The wrapper of file reader. When you load the obj file.
// 
// May use different method to call this function when reading the obj file,
// like XMLHttpRequest or input tag.
//
// Main processing is read the obj file like v, vn, vt, f...
function objLoader()
{
  var text = null;
  // Using XMLHttpRequest.
  if(this.responseText)
  { text = this.responseText.split('\n'); }
  // Using Input Tag.
  else if(this.result)
  { text = this.result.split('\n'); }
  else
  {
    console.error("Can't identify the text that you want to process.");
    return;
  }

  // Initialize the object arrays that may use it, to empty array.
  var obj = {vertices:[], normal:[], uv:[], color:[],
	     faceIdx:[], uvIdx:[], normalIdx:[], lineIdx:[]};
  
  obj.vertexNum = 0; obj.faceNum = 0;   
  
  text.forEach(function(line) {
    // For some non-regular file format. To prevent unexcepect condition
    // happen. First one replace multiple space to one space. And the
    // seconed one replace the line of end to nothing.
    line = line.replace(/\s+/g, ' ');
    line = line.replace(/\s+$/g, '');
    
    var data = line.split(' ');

    switch (data[0])
    {
    case "v":
      data.shift();
      if(data.length == 3)
      {
	data = data.map(function(v) {obj.vertices.push(parseFloat(v));});
      }
      else if(data.length == 6)
      {
	var i = 0;
	for(; i < 3; ++i)
	{ obj.vertices.push(parseFloat(data[i])); }
	for(; i < 6; ++i)
	{ obj.color.push(parseFloat(data[i])); }
      }
      obj.vertexNum++;
      break;
    case "vn":
      data.shift();
      data = data.map(function(vn) {obj.normal.push(parseFloat(vn));});
      break;
    case "vt":
      data.shift();
      data = data.map(function(vt) {obj.uv.push(parseFloat(vt));});
      break;
    case "f":
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
	  obj.faceIdx.push(parseInt(d-1));
	});
      }
      
      obj.faceNum++;
      break;
    }
    
  });

  // Generate line indices from face indices.
  for(var i = 0; i < obj.faceIdx.length; i += 3)
  {
    obj.lineIdx.push(obj.faceIdx[i]);
    obj.lineIdx.push(obj.faceIdx[i+1]);
    obj.lineIdx.push(obj.faceIdx[i+1]);
    obj.lineIdx.push(obj.faceIdx[i+2]);
    obj.lineIdx.push(obj.faceIdx[i+2]);
    obj.lineIdx.push(obj.faceIdx[i]);
  }

  // Findout the centroid of model.
  var minX = obj.vertices[0],
      minY = obj.vertices[1],
      minZ = obj.vertices[2],
      maxX = obj.vertices[0],
      maxY = obj.vertices[1],
      maxZ = obj.vertices[2];

  for(i = 3; i < obj.vertices.length; i += 3)
  {
    if(obj.vertices[i] < minX)
    { minX = obj.vertices[i]; }
    if(obj.vertices[i] > maxX)
    { maxX = obj.vertices[i]; }
    if(obj.vertices[i+1] < minY)
    { minY = obj.vertices[i+1]; }
    if(obj.vertices[i+1] > maxY)
    { maxY = obj.vertices[i+1]; }
    if(obj.vertices[i+2] < minZ)
    { minZ = obj.vertices[i+2]; }
    if(obj.vertices[i+2] > maxZ)
    { maxZ = obj.vertices[i+2]; }
  }
  
  var mX = (minX + maxX)/2, mY = (minY + maxY)/2, mZ = (minZ + maxZ)/2;
  
  var shaderInfo = {data:{vertices: obj.vertices,
			  faceIdx: obj.faceIdx,
			  lineIdx: obj.lineIdx},
		    uniformCallback:uCallback,
		    vertexShader: vs_with_lightingAndPointColor,
		    fragmentShader: fs_with_lightingAndPointColor,
		    pos: [mX, mY, mZ],
		    idx: go.length
		   };

  if(obj.normal.length > 0)
  { shaderInfo.data.normal = obj.normal; }
  else
  { shaderInfo.data.normal = generateVertexNormal(obj.vertices, obj.faceIdx); }
  
  if(obj.color.length > 0)
  { shaderInfo.data.color = obj.color; }
  
  go.push(new gObj(gl, shaderInfo));
  go[go.length-1].translateN(-mX, -mY, -mZ);
  rendering();
}

function stringToFloat(s)
{
  return parseFloat(s);
}

function generateVertexNormal(vertices, faceIdx)
{
  var vertexFacesRelation = [];

  while(vertexFacesRelation.push([]) < vertices.length/3);
  
  for(var i = 0; i < faceIdx.length; ++i)
  {
    var fIdx = (i/3) | 0;
    vertexFacesRelation[faceIdx[i]].push(fIdx);
  }
  
  var facesNormal = [];
  for(i = 0; i < faceIdx.length; i += 3)
  {
    var idx1 = faceIdx[i]*3;
    var idx2 = faceIdx[i+1]*3;
    var idx3 = faceIdx[i+2]*3;
    var v1 = [vertices[idx1], vertices[idx1+1], vertices[idx1+2]];
    var v2 = [vertices[idx2], vertices[idx2+1], vertices[idx2+2]];
    var v3 = [vertices[idx3], vertices[idx3+1], vertices[idx3+2]];
    var v12 = vec3.normalize(vec3.sub(v2, v1));
    var v13 = vec3.normalize(vec3.sub(v3, v1));
    var n   = vec3.normalize(vec3.cross(v12, v13));
    facesNormal.push(n[0]);
    facesNormal.push(n[1]);
    facesNormal.push(n[2]);
  }

  var verticesNormal = [];
  for(i = 0; i < vertices.length/3; ++i)
  {
    var nx = 0, ny = 0, nz = 0;

    for(var j = 0; j < vertexFacesRelation[i].length; ++j)
    {
      fIdx = vertexFacesRelation[i][j]*3;
      nx += facesNormal[fIdx];
      ny += facesNormal[fIdx+1];
      nz += facesNormal[fIdx+2];
    }

    n = vec3.normalize([nx,ny,nz]);
    verticesNormal.push(n[0]);
    verticesNormal.push(n[1]);
    verticesNormal.push(n[2]);
  }

  return verticesNormal;
}
