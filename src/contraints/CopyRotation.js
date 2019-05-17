import IkConstraint from "./IkConstraint";

class CopyRotation extends IkConstraint
{
    constructor(poleChain, target)
    {
        super(poleChain);
        this.target = target;
    }

    applyConstraint(joint)
    {

    }
}
export default CopyRotation;
