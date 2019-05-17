import IkConstraint from "./IkConstraint";
import * as THREE from "three";

class InfluenceConstraint extends IkConstraint
{
    constructor(poleChain)
    {
        super(poleChain);
    }

    applyConstraint(joint)
    {
        let direction = new THREE.Vector3().copy(joint._getDirection());
        let originalDirection = joint._originalDirection.clone().negate();

        let blend = this.blendBetweenVectorsByInfluence(originalDirection, direction);
        originalDirection.add(blend);
        direction.copy(originalDirection);
        joint._setDirection(direction);
    }
}
export default InfluenceConstraint;
