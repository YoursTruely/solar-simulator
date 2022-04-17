/////////// DATA //////////////////////
//orbit_data = [["earth",3,0.7],["mars",4,0.5]];
//planet_data = [["sun",0,0,0.1]];

let PSF = 0.01;
let PAUSE = null;
let iter = 0;
let req;


//INITIAL_STATE = [[0.0,0.0],[0.0,Math.random()*360],[0.0,Math.random()*360],[0.0,Math.random()*360],[0.0,Math.random()*360],[0.0,Math.random()*360],[0.0,Math.random()*360],[0.0,Math.random()*360],[0.0,Math.random()*360]];
let data = [["sun",0.2,0.00,2.84,0.00,36000,100000000,0.0,0.0],["mercury",0.04,10.00,6.67,0.39,84480,88,0.0,0.0],["venus",0.09,25.57,27.74,0.72,351480,225,0.0,0.0],["earth",0.10,41.48,0.11,1.00,1436,365,0.0,0.0],["mars",0.05,78.07,0.12,1.52,1476,687,0.0,0.0],["jupiter",1.10,492.27,0.05,5.20,595,4332,0.0,0.0],["saturn",0.91,1221.14,0.05,9.54,633,10746,0.0,0.0],["uranus",0.40,3476.14,0.08,19.18,1034,30590,0.0,0.0],["neptune",0.39,6795.45,0.08,30.06,960,59800,0.0,0.0]];
let orbits = [];
let planets = [];
let gl = null;
let n = [];
// u_modelMatrix = null;
class Orbit{
  constructor(data){
    this.name = data[0]+"'s orbit";
    this.radius = data[4];
    this.modelMatrix = new Matrix4();
    this.modelMatrix = this.compute_modelMatrix(this.modelMatrix);
  }
  compute_modelMatrix(modelMatrix){  
    modelMatrix.scale(this.radius,this.radius,this.radius);
    return modelMatrix;
  }
}

class Planet{
  constructor(planet_data){
    this.name = planet_data[0];
    this.radius = planet_data[1];
    this.orbit_radius = planet_data[4];
    this.rot_speed = 360/(planet_data[5]*60);
    this.rev_speed = 360/(planet_data[6]*24*60*60);
    this.rot_theta = planet_data[7];
    this.rev_phi = planet_data[8];
    this.modelMatrix = this.Model(this.rot_theta,this.rev_phi);
  }

    Model(theta,phi){
      let rev_phi = theta;
      let rot_theta = phi;
      let modelMatrix = new Matrix4();
      modelMatrix.setRotate(rev_phi,0,1,0);
      modelMatrix.translate(this.orbit_radius,0,0);
      modelMatrix.rotate(rot_theta,0,1,0);
      modelMatrix.scale(this.radius,this.radius,this.radius);
      //this.modelMatrix = modelMatrix
      return modelMatrix
    }
    Update(d_theta,d_phi){
      
      this.rot_theta += d_theta;
      this.rev_phi += d_phi;
    }

}

// let Data = JSON.parse(data);
// console.log(Data);
//////// UI /////////////////////////
let slider = document.getElementById("myRange");

//output.innerHTML = slider.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
//slider.oninput = function() {
  //output.innerHTML = this.value;
//}

let OrbitBuffer = null;
let PlanetBuffer = null;



///////// GL API////////////////////////


let VSHADER_SOUCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +

  'uniform mat4 u_modelMatrix;\n' +
  'uniform mat4 u_VPmatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +

  'uniform vec3 u_LightColor;\n' +
  'uniform vec3 u_LightPosition;\n' +
  'uniform vec3 u_AmbientLight;\n' +
  'varying vec4 v_Color;\n' +


  'void main() {\n' +
    'vec4 color = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    ' gl_Position = u_VPmatrix * u_modelMatrix * a_Position;'  +
    'vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    'vec4 vertexPosition = u_modelMatrix * a_Position;\n' +
    'vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
    'float nDotL = max(dot(lightDirection,normal), 0.0);\n' +
    'vec3 diffuse = u_LightColor * color.rgb * nDotL;\n' +
    'vec3 ambient = u_AmbientLight * color.rgb;\n' +
    'v_Color = vec4(diffuse + ambient, color.a);\n' +
  '}\n';

let FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main(){\n' +
    ' gl_FragColor = v_Color;\n' +
  '}\n';


let canvas = document.getElementById('canvas');
if(!canvas){
    console.log('Failed to retrieve that <canvas> element')
}

//Get the rendering context
gl = getWebGLContext(canvas);
if(!gl){
  console.log('Failed to get the rendering context for WebGL');
  
}

//Initialize Shaders
if (!initShaders(gl, VSHADER_SOUCE, FSHADER_SOURCE)) {
  console.log('Failed to initialize shaders.');
  
}


orbits = create_ORBITS(data);
planets = create_PLANETS(data);
let camera = new Camera([0,2,0],0,0);

flythrough(camera)

//console.log(planets);
/// GL letiable locations ///
let a_Position = gl.getAttribLocation(gl.program,'a_Position');
let a_Normal = gl.getAttribLocation(gl.program,'a_Normal');
let u_modelMatrix = gl.getUniformLocation(gl.program,'u_modelMatrix');
let u_VPmatrix = gl.getUniformLocation(gl.program,'u_VPmatrix');
let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
let u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
if (!u_VPmatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) { 
  console.log('Failed to get the storage location');
}

 // Set the light color (white)
 gl.uniform3f(u_LightColor, 0.8, 0.8, 0.8);
 // Set the light direction (in the world coordinate)
 gl.uniform3f(u_LightPosition, 0.0, 0.0, 0.0);
 // Set the ambient light
 gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);


let normalMatrix = new Matrix4(); // Transformation matrix for normals

n = initVertexBuffers(gl);


//Clear canvas color
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);

// Clear canvas with the above color
//gl.clear(gl.COLOR_BUFFER_BIT);



// setCamera(gl,u_VPmatrix);




//render_PLANETS(gl,n,planets,u_modelMatrix,PlanetBuffer,a_Position);



function initVertexBuffers(gl){

  let n = [];
  let RADIUS = 1.0;
  let ORBIT_SEGMENTS = parseInt(RADIUS*60)
  let vertices = new Float32Array(3*ORBIT_SEGMENTS)
  for(let i=0;i<ORBIT_SEGMENTS;i++){
    let theta = i*2*Math.PI/ORBIT_SEGMENTS;
    vertices[3*i] = RADIUS*Math.cos(theta);
    vertices[3*i+1] = 0.0;
    vertices[3*i+2] = RADIUS*Math.sin(theta);
  }
  n[0] = parseInt(vertices.length/3);

  let SPHERE_DIV = 13;

  let i, ai, si, ci;
  let j, aj, sj, cj;
  let p1, p2;

  let positions = [];
  let indices = [];

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(si * sj);  // X
      positions.push(cj);       // Y
      positions.push(ci * sj);  // Z
    }
  }

  n[1]=parseInt(positions.length/3);

  positions = new Float32Array(positions);

  

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }


  n[2] = indices.length;

  OrbitBuffer = initBuffer(gl,vertices,3,gl.FLOAT);
  PlanetBuffer = initBuffer(gl,positions,3,gl.FLOAT);

  
  let indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return n;
  
}

function initBuffer(gl,data,num,type){
  let buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  buffer.num = num;
  buffer.type = type;
  return buffer;
}

function create_ORBITS(data){
  //let orbits = []
  for(let i=0;i<data.length;i++){
    orbits[i] = new Orbit(data[i]);
  }
  return orbits
}

function create_PLANETS(data){
  //let planets = []
  for(let i=0;i<data.length;i++){
    planets[i] = new Planet(data[i]);
  }
  return planets
}

function render_ORBIT(gl,n,orbit,u_modelMatrix,buffer,a_Position){
  //for(let i=0;i<orbits.length;i++){
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.vertexAttribPointer(a_Position,buffer.num,buffer.type,false,0,0);
    gl.enableVertexAttribArray(a_Position);
    gl.uniformMatrix4fv(u_modelMatrix,false, orbit.modelMatrix.elements);
    gl.drawArrays(gl.LINE_LOOP,0,n[0]);
  //}
}

function render_PLANET(gl,n,planet,u_modelMatrix,u_NormalMatrix,buffer,a_Position){
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.vertexAttribPointer(a_Position,buffer.num,buffer.type,false,0,0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_Normal,buffer.num,buffer.type,false,0,0);
    gl.enableVertexAttribArray(a_Normal);
    gl.uniformMatrix4fv(u_modelMatrix,false,planet.modelMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    
    gl.drawElements(gl.TRIANGLES,n[2],gl.UNSIGNED_SHORT,0);
}



function setCamera(gl,u_VPmatrix){
  // let VPmatrix = new Matrix4();
  // VPmatrix.setPerspective(10,canvas.width/canvas.height,0.1,1000);
  // VPmatrix.lookAt(0,10,0,0,0,0,0,0,1);
  
  gl.uniformMatrix4fv(u_VPmatrix,false,camera.vp.elements)
}


let g_last = Date.now();
// function animate(planets){
//   // let now = Date.now();
//   // let elapsed = (now-g_last)/1000;
//   // g_last = now;

//   // //console.log("BEFORE:",planets);
//   // for (let i=0;i<planets.length;i++){
//   //   //console.log("BEFORE:",planets[i].rot_speed*elapsed);

//   //   planets[i].rot_theta = planets[i].rot_theta + planets[i].rot_speed*elapsed;
//   //   planets[i].rev_phi = planets[i].rev_phi + planets[i].rev_speed*elapsed;
//   //   //console.log("AFTER:",planets[i].state);
//   // }
//   // //console.log("AFTER:",planets);
//   console.log("BEFORE:",planets);
//   planets.forEach(planet => {
//     planet.rot_theta += planet.rot_speed*elapsed;
//     planet.rev_phi += planet.rev_phi + planet.rev_speed*elapsed;
//   })
//   console.log("AFTER:",planets);

// }

//console.log("BEFORE TICK:",planets);
let tick = function(){
  //let newPlanets = [];
 
  
  let now = Date.now();
  let elapsed = (now-g_last)/1000;
  g_last = now;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  setCamera(gl,u_VPmatrix);

  orbits.forEach(orbit => {
    render_ORBIT(gl,n,orbit,u_modelMatrix,OrbitBuffer,a_Position);
  })
  
  //console.log("Hi1")
  //let newList = [];
  //console.log("BEFORE:",planets);
  planets.forEach(planet => {

    
    //console.log("Hi2")
    // planet.name = planet.name + "2";
    
    let d_theta =  parseInt(slider.value)*100*planet.rot_speed*elapsed;
    //console.log(d_theta);
    //let d_theta =  10;
    // // planet.rot_theta += planet.rot_speed*elapsed;
    let d_phi =  parseInt(slider.value)*100*planet.rev_speed*elapsed;

    //let d_phi =  50;
    // // planet.rev_phi += 10*planet.rev_speed*elapsed;
    ///
    planet.Update(d_theta,d_phi)
    //
    //planet.name += "2"; 
    //console.log(planet.rot_theta)
    planet.modelMatrix = planet.Model(planet.rot_theta,planet.rev_phi);
    normalMatrix.setInverseOf(planet.modelMatrix);
    normalMatrix.transpose();
    //newList.push(planet);
    //newPlanets.push(planet);
    render_PLANET(gl,n,planet,u_modelMatrix,u_NormalMatrix,PlanetBuffer,a_Position);
    
  })
  //console.log(iter);
  //console.log("AFTER:",planets);
  //planets = newList;


  //console.log("Hi3")
  //console.log(newPlanets);
  //planets = newPlanets;

  

  // if(PAUSE){
  //   //console.log("Hi5")
  //   console.log("PAUSED");
  //   cancelAnimationFrame(req);
  // }
  // else{
    //console.log("PLAYING");
    //console.log("Hi4")
    req = requestAnimationFrame(tick);
  // }

  //console.log("TICK DONE:",)
}

// function render_SYSTEM(gl,n,planets,u_modelMatrix){
//   for(let i=0;i<planets.length;i++){
//     planets[i].Model(planets[i].rot_theta,planets[i].rev_phi);
//     //console.log(planets[i])
//     render_ORBIT(gl,n,orbits[i],u_modelMatrix,OrbitBuffer,a_Position);
//     render_PLANET(gl,n,planets[i],u_modelMatrix,PlanetBuffer,a_Position);
//   }
  
  
// }

function keydown(ev){
  switch(ev.keyCode){
    case 88:
      //PAUSE = true;
      cancelAnimationFrame(req);
      break;
    case 90:
      //PAUSE = false;
      tick();
      break;
    default: return;
  }
}



// let i = 0
// while (i<10){
//   //tick();
//   i += 1;
// }

function flythrough(camera) {
 

document.onkeydown = (ev) => {
  keydown(ev);
  var ivm = new Matrix4();
  var temp_mat = new Matrix4();
  ivm.setInverseOf(camera.vm);
  var transformedEyeDirection;
  var change;
  if(ev.key == "w"){
      console.log("mode")
    change = [0,0,-0.5,0]

  }
  else if(ev.key == "s"){
    change = [0,0,0.5,0]
  }
  else if(ev.key == "a"){
    change = [-0.5,0,0,0]
  }
  else if(ev.key == "d"){
    change = [0.5,0,0,0]
  }
  
  transformedEyeDirection = ivm.multiplyVector4(new Vector4(change));
  camera.location = [camera.location[0] + transformedEyeDirection.elements[0],
                      camera.location[1] + transformedEyeDirection.elements[1],
                      camera.location[2] + transformedEyeDirection.elements[2]]
  temp_mat.setTranslate(-transformedEyeDirection.elements[0],-transformedEyeDirection.elements[1],-transformedEyeDirection.elements[2]);
  camera.vm.multiply(temp_mat)
  camera.compute_vp()
};
}
