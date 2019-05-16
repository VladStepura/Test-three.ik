import {TransformControls} from "../utils/TransformControls";
import * as THREE from "three";

class TargetControl
{
    constructor(camera, domElement, orbitControl)
    {
        this.control = new TransformControls( camera, domElement );
        this.control.size = 0.5
        this.control.addEventListener('dragging-changed', ( event ) =>
        {
            orbitControl.enabled = ! event.value;
        });
    }

    initialize(position, scene)
    {
        let movingTarget = new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.4 }));
        movingTarget.position.z = position.z;
        movingTarget.position.y = position.y;
        movingTarget.position.x = position.x;
        scene.add(movingTarget);

        this.control.attach(movingTarget);
        scene.add(this.control);
        this.target = movingTarget;
    }

    intializeWithMesh(mesh, scene)
    {
        this.control.attach(mesh);
        scene.add(this.control);
        this.target = mesh;
    }
}
export default TargetControl;
