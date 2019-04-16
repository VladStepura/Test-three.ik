import {IKChain} from "three-ik";

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
    }

}
export default ChainObject;
