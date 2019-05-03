import * as THREE from "three";

class PoleTarget
{
    constructor(position)
    {
        this.bone = new THREE.Bone();
        this.bone.position.copy(position);
        this.bone.name = "PoleTarget";
        let geometry = new THREE.BoxGeometry(0.1,0.1, 0.1);
        let material = new THREE.MeshBasicMaterial({color: 0xffff00});
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.name = "PoleTarget";
    }

    set name(value)
    {
        this.mesh.name = value;
    }

}
export default PoleTarget;
