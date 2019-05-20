import IkConstraint from "./IkConstraint";
import * as THREE from "three";

// CopyRotation is rotation constraint which copy target
// rotation and applies to itself.
class CopyRotation extends IkConstraint
{
    constructor(poleChain, target)
    {
        super(poleChain);
        this.target = target;
        this.rotateX = true;
        this.rotateY = true;
        this.rotateZ = true;
    }

    applyConstraint(joint)
    {
        let direction = new THREE.Vector3().copy(joint._getDirection());
        let targetedJoint = this.target;
        if(this.rotateX)
        {
            joint.bone.rotation.x = targetedJoint.bone.rotation.x;
        }
        if(this.rotateY)
        {
            joint.bone.rotation.y = targetedJoint.bone.rotation.y;
        }
        if(this.rotateZ)
        {
            joint.bone.rotation.z = targetedJoint.bone.rotation.z;
        }

        joint._setDirection(direction);
        this.applyInfluenceToJoint(joint);
    }
}
export default CopyRotation;
