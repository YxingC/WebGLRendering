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
  if(this.responseText)
  { // Using XMLHttpRequest.
    text = this.responseText.split('\n');
  }
  else if(this.result)
  { // Using Input Tag.
    text = this.result.split('\n');
  }
  else
  {
    console.error("Can't identify the text that you want to process.");
    return;
  }

  // Initialize the object arrays that may use it, to empty array.
  var obj = {vertices:[], normal:[], uv:[],
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
	  obj.vertices.push(parseFloat(data[i]));

	for(; i < 6; ++i)
	  obj.colour.push(parseFloat(data[i]));	
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
  var mX = 0;
  var mY = 0;
  var mZ = 0;
  for(i = 0; i < obj.vertices.length; i += 3)
  {
    mX += obj.vertices[i];
    mY += obj.vertices[i+1];
    mZ += obj.vertices[i+2];
  }

  mX /= obj.vertexNum;
  mY /= obj.vertexNum;
  mZ /= obj.vertexNum;
  
  var shaderInfo = {vertices:obj.vertices,
		    faceIdx:obj.faceIdx,
		    lineIdx:obj.lineIdx,
		    vertexShader:vs_with_lighting,
		    fragmentShader:fs_with_lighting,
		    uniforms:["mv", "p", "color", "normalMatrix"],
		    pos:[mX, mY, mZ]};
  
  if(obj.normal)
  {
    shaderInfo.normal = obj.normal;
    shaderInfo.normalIdx = obj.normalIdx;
  }
  
  if(obj.color)
  {
    shaderInfo.color = color;
  }
  else
  {
    shaderInfo.color = [0.3, 0.55, 0.5, 1];
  }

  
  go.push(new gObj(gl, shaderInfo));
  
  rendering();
}

function stringToFloat(s)
{
  return parseFloat(s);
}
