import Gui from "./Gui";

class RagDollGui
{
    constructor(ragDoll)
    {
        this.ragDoll = ragDoll;
        this.poleConstraintsVisible = true;
    }

    initGui()
    {
        let ragDoll = this.ragDoll;
        let gui = new Gui();
        let rightLegTarget = ragDoll.chainObjects[3].controlTarget.target;
        let leftLegTarget = ragDoll.chainObjects[2].controlTarget.target;
        gui.addVectorSlider(rightLegTarget.rotation, "Right target rotation",
            -Math.PI * 1, Math.PI * 1);
        gui.addVectorSlider(leftLegTarget.rotation, "Left target rotation",
            -Math.PI * 1, Math.PI * 1);
        gui.datGui.add(ragDoll, "enableIk").onChange(() =>
        {
            if(ragDoll.enableIk)
            {
                ragDoll.recalculate();
            }
        });

        gui.datGui.add(this, "poleConstraintsVisible").onChange(()=>
        {
            this.changePoleContraintVisbility(this.poleConstraintsVisible);
        });

        this.createGuiForConstraint(ragDoll.poleConstraints[1], "Left Arm");

        this.createGuiForConstraint(ragDoll.poleConstraints[3], "Left Leg");

        this.createGuiForConstraint(ragDoll.poleConstraints[0], "Spine");

        gui.datGui.open();
    }

    createGuiForConstraint(poleConstraint, name)
    {
        let gui = new Gui();

        let pole = poleConstraint.poleTarget.mesh;
        gui.addVectorSlider(pole.position, name + " Pole Position", -2, 2);

        let folder = gui.datGui.addFolder(name + " Pole");
        folder.add(poleConstraint, "poleAngle", -180, 180);
    }

    changePoleContraintVisbility(state)
    {
        this.ragDoll.poleConstraints.forEach((constraint) =>
        {
            constraint.poleTarget.mesh.visible = state;
        });
    }
}
export default RagDollGui;
