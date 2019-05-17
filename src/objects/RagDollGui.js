import Gui from "./Gui";
// RagDollGUi is class which is defines all gui elements for Ragdoll
// It's purpose to separate Gui logic from Ragdoll logic
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
                this.recalculate();
            }
        });

        gui.datGui.add(this, "poleConstraintsVisible").onChange(()=>
        {
            this.changePoleContraintVisbility(this.poleConstraintsVisible);
        });
        gui.datGui.add(ragDoll.poleConstraints[1], "influence", 0, 100).name("Left arm influence");
        gui.datGui.add(ragDoll.poleConstraints[2], "influence", 0, 100).name("Right armI influence");
        gui.datGui.add(ragDoll.poleConstraints[3], "influence", 0, 100).name("Left leg Influence");
        gui.datGui.add(ragDoll.poleConstraints[4], "influence", 0, 100).name("Right leg Influence");

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

    // Recalculates positions of transform controls
    // It works when ik is disable and when enabled in order to recalculate all position
    // Which have been changed while ik was turned off
    recalculate()
    {
        let ragdoll = this.ragDoll;
        let back = ragdoll.chainObjects[0].chain.joints[4].bone;
        let backTarget = ragdoll.chainObjects[0].controlTarget.target;

        let leftHand = ragdoll.chainObjects[1].chain.joints[2].bone;
        let leftHandTarget = ragdoll.chainObjects[1].controlTarget.target;

        let rightHand = ragdoll.chainObjects[2].chain.joints[2].bone;
        let rightHandTarget = ragdoll.chainObjects[2].controlTarget.target;

        let leftLeg = ragdoll.chainObjects[3].chain.joints[2].bone;
        let leftLegTarget = ragdoll.chainObjects[3].controlTarget.target;

        let rightLeg = ragdoll.chainObjects[4].chain.joints[2].bone;
        let rightLegTarget = ragdoll.chainObjects[4].controlTarget.target;

        back.getWorldPosition(backTarget.position);
        leftHand.getWorldPosition(leftHandTarget.position);
        rightHand.getWorldPosition(rightHandTarget.position);
        leftLeg.getWorldPosition(leftLegTarget.position);
        rightLeg.getWorldPosition(rightLegTarget.position);
        ragdoll.calculteBackOffset();
    }
}
export default RagDollGui;
