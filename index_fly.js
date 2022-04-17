
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
    this.TextureImage = './Textures/' + this.name + '.jpg';
    this.texture = null;
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
let TextureBuffer = null;

/////  Shader Programs //////////////////////////////////////////////////////////////////////
let ORBIT_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  
  'uniform mat4 u_modelMatrix;\n' +
  'uniform mat4 u_VPmatrix;\n' +
  
  'void main() {\n' +
    'vec4 color = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    ' gl_Position = u_VPmatrix * u_modelMatrix * a_Position;'  +
    'vec4 vertexPosition = u_modelMatrix * a_Position;\n' +
  '}\n';

let ORBIT_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'void main(){\n' +
    ' gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';




let PLANET_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoord;\n' + //Textures

  'uniform mat4 u_modelMatrix;\n' +
  'uniform mat4 u_VPmatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +
  'uniform vec3 u_LightPosition;\n' +
  'uniform vec3 u_AmbientLight;\n' +

  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' + //Textures


  'void main() {\n' +
    //'vec4 color = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    'gl_Position = u_VPmatrix * u_modelMatrix * a_Position;\n'  +
    'vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    'vec4 vertexPosition = u_modelMatrix * a_Position;\n' +
    'vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
    'float nDotL = max(dot(lightDirection,normal), 0.0);\n' +
    //'vec3 diffuse = u_LightColor * color.rgb * nDotL;\n' +
    'vec3 diffuse = u_LightColor * nDotL;\n' +
    //'vec3 ambient = u_AmbientLight * color.rgb;\n' +
    'v_Color = vec4(diffuse + u_AmbientLight, 1.0);\n' +
    'v_TexCoord = a_TexCoord;\n' + //Textures
  '}\n';

let PLANET_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying float v_NdotL;\n' +
  'void main(){\n' +
    //' gl_FragColor = v_Color;\n' +
    ' vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
    ' gl_FragColor = vec4(color.rgb * v_Color.rgb, v_Color.a);\n' +
  '}\n';
///////////////////////////////////////////////////////////////////////////////////////////////////

let canvas = document.getElementById('canvas');
if(!canvas){
    console.log('Failed to retrieve that <canvas> element')
}

//Get the rendering context
gl = getWebGLContext(canvas);
if(!gl){
  console.log('Failed to get the rendering context for WebGL');
  
}

orbits = create_ORBITS(data);
planets = create_PLANETS(data);


let camera = new Camera([0,2,0],0,0);

flythrough(canvas, camera)

var orbitShader = createProgram(gl, ORBIT_VSHADER_SOURCE, ORBIT_FSHADER_SOURCE);
var planetShader = createProgram(gl, PLANET_VSHADER_SOURCE, PLANET_FSHADER_SOURCE);

if(!orbitShader || !planetShader){
    console.log('Failed to initialize shaders.');
}

orbitShader.a_Position = gl.getAttribLocation(orbitShader,'a_Position');
orbitShader.u_modelMatrix = gl.getUniformLocation(orbitShader,'u_modelMatrix');
orbitShader.u_VPmatrix = gl.getUniformLocation(orbitShader,'u_VPmatrix');


planetShader.a_Position = gl.getAttribLocation(planetShader,'a_Position');
planetShader.a_Normal = gl.getAttribLocation(planetShader,'a_Normal');
planetShader.a_TexCoord = gl.getAttribLocation(planetShader, 'a_TexCoord');
planetShader.u_Sampler = gl.getUniformLocation(planetShader, 'u_Sampler');
planetShader.u_modelMatrix = gl.getUniformLocation(planetShader,'u_modelMatrix');
planetShader.u_VPmatrix = gl.getUniformLocation(planetShader,'u_VPmatrix');
planetShader.u_NormalMatrix = gl.getUniformLocation(planetShader, 'u_NormalMatrix');
planetShader.u_LightColor = gl.getUniformLocation(planetShader, 'u_LightColor');
planetShader.u_LightPosition = gl.getUniformLocation(planetShader, 'u_LightPosition');
planetShader.u_AmbientLight = gl.getUniformLocation(planetShader, 'u_AmbientLight');

if(orbitShader.a_Position < 0 || !orbitShader.u_modelMatrix){
    console.log('Failed to get the storage location of attribute or uniform variable of Orbit Shader');
}

if(planetShader.a_Position < 0 || 
planetShader.a_Normal < 0 || 
planetShader.a_TexCoord < 0 || 
!planetShader.u_Sampler || 
!planetShader.u_modelMatrix ||
!planetShader.u_VPmatrix ||
!planetShader.u_NormalMatrix ||
!planetShader.u_LightColor ||
!planetShader.u_LightPosition ||
!planetShader.u_AmbientLight){
    console.log('Failed to get the storage location of attribute or uniform variable of Planet Shader');
}


gl.useProgram(planetShader);
// Set the light color (white)
gl.uniform3f(planetShader.u_LightColor, 0.8, 0.8, 0.8);
// Set the light direction (in the world coordinate)
gl.uniform3f(planetShader.u_LightPosition, 0.0, 0.0, 0.0);
// Set the ambient light
gl.uniform3f(planetShader.u_AmbientLight, 0.2, 0.2, 0.2);


let normalMatrix = new Matrix4(); // Transformation matrix for normals

n = initVertexBuffers(gl);

initTextures(gl, planetShader, planets);

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);


function create_ORBITS(data){
    for(let i=0;i<data.length;i++){
      orbits[i] = new Orbit(data[i]);
    }
    return orbits
}
  
function create_PLANETS(data){
    for(let i=0;i<data.length;i++){
      planets[i] = new Planet(data[i]);
    }
    return planets
}

function setCamera(gl){
    gl.useProgram(orbitShader);
    gl.uniformMatrix4fv(orbitShader.u_VPmatrix,false,camera.vp.elements);

    gl.useProgram(planetShader);
    gl.uniformMatrix4fv(planetShader.u_VPmatrix,false,camera.vp.elements);
}


let g_last = Date.now();

let tick = function(){

   
    let now = Date.now();
    let elapsed = (now-g_last)/1000;
    g_last = now;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  

    setCamera(gl);

    //Render Orbits
    orbits.forEach(orbit => {
    //   render_ORBIT(gl,n,orbit,u_modelMatrix,OrbitBuffer,a_Position);
      render_ORBIT(gl,orbitShader,n,orbit,OrbitBuffer);
    })
  
    //Render Planets
    planets.forEach(planet => {
        let d_theta =  parseInt(slider.value)*100*planet.rot_speed*elapsed;
        let d_phi =  parseInt(slider.value)*100*planet.rev_speed*elapsed;
        planet.Update(d_theta,d_phi)
        planet.modelMatrix = planet.Model(planet.rot_theta,planet.rev_phi);
        normalMatrix.setInverseOf(planet.modelMatrix);
        normalMatrix.transpose();
        render_PLANET(gl,planetShader,n,planet,PlanetBuffer,TextureBuffer);  
    })
      
    
    req = requestAnimationFrame(tick); 

}



function render_ORBIT(gl,program,n,orbit,buffer){
    
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.vertexAttribPointer(program.a_Position,buffer.num,buffer.type,false,0,0);
    gl.enableVertexAttribArray(program.a_Position);

    gl.uniformMatrix4fv(program.u_modelMatrix,false, orbit.modelMatrix.elements);
    gl.drawArrays(gl.LINE_LOOP,0,n[0]);
}


function render_PLANET(gl,program,n,planet,vertexBuffer,textureBuffer){

    gl.useProgram(program)

    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
    gl.vertexAttribPointer(program.a_Position,vertexBuffer.num,vertexBuffer.type,false,0,0);
    gl.enableVertexAttribArray(program.a_Position);

    gl.vertexAttribPointer(program.a_Normal,vertexBuffer.num,vertexBuffer.type,false,0,0);
    gl.enableVertexAttribArray(program.a_Normal);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER,textureBuffer);
    gl.vertexAttribPointer(program.a_TexCoord,textureBuffer.num,textureBuffer.type,false,0,0);
    gl.enableVertexAttribArray(program.a_TexCoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.uniformMatrix4fv(program.u_modelMatrix,false,planet.modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);////////////////IMPROVE

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, planet.texture);
    gl.uniform1i(program.u_Sampler, 0);
    
    gl.drawElements(gl.TRIANGLES,n[2],gl.UNSIGNED_SHORT,0);
    //gl.bindTexture(gl.TEXTURE_2D, null);
}

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
  
    /*let SPHERE_DIV = 13;
  
    let i, ai, si, ci;
    let j, aj, sj, cj;
    let p1, p2;
  
    let positions = [];
    let indices = [];
    let textureCoords = [];
  
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
  
        textureCoords[p1*4 + 0] = i/SPHERE_DIV + 1;
        textureCoords[p1*4 + 1] = j/SPHERE_DIV + 1;
  
        textureCoords[p1*4 + 2] = i/SPHERE_DIV;
        textureCoords[p1*4 + 3] = j/SPHERE_DIV;
      }
    }*/

    const N = 50;
    const angleStep = 2*Math.PI / N;

    let positions = [];
    let textureCoords = [];
    let indices = [];

    for (let i=0; i<N+1; i++) {
        const theta = angleStep * i / 2;
        for (let j=0; j<N+1; j++) {
            const phi = angleStep * j;
            const v = [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)];
            positions.push(...v);
            textureCoords.push(j/N, i/N);

            if (i < N && j < N) {
                let firstIndice = i*(N+1) + j;
                let secondIndice = i*(N+1) + j+1
                let thirdIndice = (i+1)*(N+1) + j;
                let fourthIndice = (i+1)*(N+1) + j+1;
                indices.push(secondIndice, firstIndice, thirdIndice, secondIndice, thirdIndice, fourthIndice);
            }
        }
    }
  
  
    n[2] = indices.length;
  
  
    positions = new Float32Array(positions);
    textureCoords = new Float32Array(textureCoords);
  

    OrbitBuffer = initBuffer(gl,vertices,3,gl.FLOAT);
    PlanetBuffer = initBuffer(gl,positions,3,gl.FLOAT);
    TextureBuffer = initBuffer(gl, textureCoords,2,gl.FLOAT);
  
    
    let indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
  
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  
    return n;
    
}


function initTextures(gl, program, planets){
    planets.forEach(planet => {
        planet.texture = gl.createTexture();
        if(!planet.texture) {
            console.log('Failed to create the texture object');
        }

        var image = new Image();
        image.crossOrigin = "anonymous";
        if(!image){
            console.log('Failed to create the image object');
        }

        image.onload = function() {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, planet.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.useProgram(program);
            gl.uniform1i(program.u_Sampler, 0);
            gl.bindTexture(gl.TEXTURE_2D, null);
        };

       
        image.src = planet.TextureImage;
       //window.open(image.src, "Image", "width=500,height=450");
    });
}

function initBuffer(gl,data,num,type){
    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    buffer.num = num;
    buffer.type = type;
    return buffer;
}

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
  

// function flythrough(camera){
//     document.onkeydown = (ev) => {
//     keydown(ev);
//     var ivm = new Matrix4();
//     var temp_mat = new Matrix4();
//     ivm.setInverseOf(camera.vm);
//     var transformedEyeDirection;
//     var change;
//     if(ev.key == "w"){
//         console.log("mode")
//       change = [0,0,-0.5,0]
  
//     }
//     else if(ev.key == "s"){
//       change = [0,0,0.5,0]
//     }
//     else if(ev.key == "a"){
//       change = [-0.5,0,0,0]
//     }
//     else if(ev.key == "d"){
//       change = [0.5,0,0,0]
//     }
    
//     transformedEyeDirection = ivm.multiplyVector4(new Vector4(change));
//     camera.location = [camera.location[0] + transformedEyeDirection.elements[0],
//                         camera.location[1] + transformedEyeDirection.elements[1],
//                         camera.location[2] + transformedEyeDirection.elements[2]]
//     temp_mat.setTranslate(-transformedEyeDirection.elements[0],-transformedEyeDirection.elements[1],-transformedEyeDirection.elements[2]);
//     camera.vm.multiply(temp_mat)
//     camera.compute_vp()
//     };
// }

function flythrough(canvas, camera) {
  var dragging = false;         // Dragging or not
  var lastX = -1, lastY = -1;   // Last position of the mouse

  canvas.onmousedown = function(ev) {   // Mouse is pressed
    var x = ev.clientX, y = ev.clientY;
    // Start dragging if a moue is in <canvas>
    var rect = ev.target.getBoundingClientRect();
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      lastX = x; lastY = y;
      dragging = true;
    }
  };

  canvas.onmouseup = function(ev) { dragging = false;  }; // Mouse is released

  canvas.onmousemove = function(ev) { // Mouse is moved
    var x = ev.clientX, y = ev.clientY;
    if (dragging) {
      var factor = 100/canvas.height; // The rotation ratio
      var dx = factor * (x - lastX);
      var dy = factor * (y - lastY);
      // Limit x-axis rotation angle to -90 to 90 degrees
      camera.pitch = Math.max(Math.min(camera.pitch - dy, 90.0), -90.0);
      camera.yaw = (camera.yaw - dx + 360.0) % 360.0;
      camera.compute_vm();
      camera.compute_vp();
    }
    lastX = x, lastY = y;
  };

  document.onkeydown = (ev) => {
    keydown(ev)
    var ivm = new Matrix4();
    var temp_mat = new Matrix4();
    ivm.setInverseOf(camera.vm);
    var transformedEyeDirection;
    var change;
    if(ev.key == "w"){
      change = [0,0,-0.5,0.0]
    }
    else if(ev.key == "s"){
      change = [0,0,0.5,0.0]
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
