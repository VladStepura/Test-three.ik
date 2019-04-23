import {IKChain, IKHingeConstraint} from "../core/three-ik";

// ChainObject is class which contains all info about chain
// From which element chain is starting and ending
// Joints constraints etc.
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
    }

    // Takes constraint for current joint
    getCurrentConstraint()
    {
        let constraintForCurrentJoint = this.constraints[this.currentJoint];
        this.currentJoint++;
        return constraintForCurrentJoint === undefined ? this.defaultConstraint : constraintForCurrentJoint;
    }

    // Sets constraints for joints
    setConstraints(...args)
    {
        this.constraints = args;
    }

}
export default ChainObject;
