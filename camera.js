class Camera{
    constructor(location, pitch, yaw){
      this.location = location;
      this.pitch = pitch;
      this.yaw = yaw;
  
      var ProjMatrix = new Matrix4();
      var viewMatrix = new Matrix4();
      var viewProjMatrix = new Matrix4();
      ProjMatrix.setPerspective(30.0, canvas.width / canvas.height, 0.1, 10000.0);
      
      this.vm = viewMatrix;
      this.pm = ProjMatrix;
      this.vp = viewProjMatrix;
      this.compute_vm();
      this.compute_vp();
    }
    compute_vm(){
      this.vm.setRotate(this.pitch, 1,0,0);
      this.vm.rotate(this.yaw, 0,1,0);
      this.vm.translate(-this.location[0],-this.location[1],-this.location[2]);
    }
    compute_vp(){
      this.vp.set(this.pm).multiply(this.vm);
    }
  }

// function flythrough(camera) {
//     console.log("dh");

//   document.onkeydown = (ev) => {
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
//   };
// }