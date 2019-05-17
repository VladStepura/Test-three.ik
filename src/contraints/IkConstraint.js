class IkConstraint
{
    constructor(poleChain, ikTarget)
    {
        if(new.target === IkConstraint)
        {
            throw new TypeError("Cannot construct abstract IkConstraint directly");
        }
        if(this.applyConstraint === undefined)
        {
            throw new TypeError("Must override method applyConstraint(joint)");
        }
        this.poleChain = poleChain;
        this.ikTarget = ikTarget;
        this.influence = 100;
        this.name = "DefaultConstraint";
    }

    set influence(value)
    {
        this._influence = value > 100 ? 100 : value < 0 ? 0 : value;
    }

    get influence()
    {
        return this.influence;
    }
}
export default IkConstraint;
