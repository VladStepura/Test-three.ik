import {IKChain, IKHingeConstraint} from "../core/three-ik";

class ChainObject
{

    constructor(baseObjectName, lastObjectName, movingTarget = null, rootJointName = null)
    {
        this.movingTarget = movingTarget;
        this.chain = new IKChain();

        this.isChainObjectStarted = false;
        this.baseObjectName = baseObjectName;
        this.lastObjectName = lastObjectName;
        this.rootJointName = rootJointName;
        this.currentJoint = 0;
        this.constraints = [];
        this.defaultConstraint = [new IKHingeConstraint(120)];
    }

    getCurrentConstraint()
    {
        let constraintForCurrentJoint = this.constraints[this.currentJoint];
        return constraintForCurrentJoint === undefined ? this.defaultConstraint : constraintForCurrentJoint;
    }

    setConstraints(...args)
    {
        this.constraints = args;
    }

}
export default ChainObject;
