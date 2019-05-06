import IkObject from "./IkObject";
import * as THREE from "three";
import Gui from "./Gui";
import PoleConstraint from "../contraints/PoleContraint";
import PoleTarget from "./PoleTarget";

class RagDoll extends IkObject
{
    constructor()
    {
        super();
        this.poleConstraints = [];
    }

    initObject(scene, ...controlTarget)
    {
        super.initObject(scene, controlTarget);
        this.initializePoleTarget();
        // Adds gui elements to control objects
        let leftArmPoleTarget = new PoleTarget(new THREE.Vector3(-.35, 1.6, .35));
        let leftLegPoleTarget = new PoleTarget(new THREE.Vector3(-.25, .8, 1.6));
        this.poleConstraints.push(new PoleConstraint(this.ik.chains[2], leftArmPoleTarget));
        this.poleConstraints.push(new PoleConstraint(this.ik.chains[4], leftLegPoleTarget));
        this.poleConstraints[0].poleAngle = 8;
        this.poleConstraints[1].poleAngle = 60;
        this.addGuiElements();
    }

    // Sets pole targets position
    initializePoleTarget()
    {
        this.poleTargets.backPoleTarget = new THREE.Vector3( 0, 0, 0);
        this.poleTargets.leftArmPoleTarget = new THREE.Vector3( -90, 45, -90);
        this.poleTargets.leftLegPoleTarget = new THREE.Vector3( 0, 45, 90);
    }

    // Adds gui elements to scene
    // With adding its parameters
    addGuiElements()
    {
        let gui = new Gui();
        let rightLegTarget = this.chainObjects[3].controlTarget.target;
        let leftLegTarget = this.chainObjects[2].controlTarget.target;
        gui.addVectorSlider(rightLegTarget.rotation, "Right target rotation",
            -Math.PI * 1, Math.PI * 1);
        gui.addVectorSlider(leftLegTarget.rotation, "Left target rotation",
            -Math.PI * 1, Math.PI * 1);
        gui.datGui.add(this, "enableIk").onChange(() =>
        {
            if(this.enableIk)
            {
                this.recalculate();
            }
        });
        let leftArmPole = this.poleConstraints[0].poleTarget.mesh;
        gui.addVectorSlider(leftArmPole.position, "Left Arm Pole Position", -2, 2);

        let leftLegPole = this.poleConstraints[1].poleTarget.mesh;
        gui.addVectorSlider(leftLegPole.position, "Left Leg Pole Position", -2, 2);

        let armFolder = gui.datGui.addFolder("LeftArmPole");
        armFolder.add(this.poleConstraints[0], "poleAngle", -360, 360);
        let legFolder = gui.datGui.addFolder("LeftLegPole");
        legFolder.add(this.poleConstraints[1], "poleAngle", -360, 360);
        gui.datGui.open();
    }

    update()
    {
        super.update();
        if(this.enableIk)
        {
            // Pole target needs to be applied before ik
            // in order to changer figure parameters
            this.setPoleTargets();
            // Solves the inverse kinematic of object
            this.ik.solve();
        }
        this.lateUpdate();
    }

    // Applies pole target to models
    setPoleTargets()
    {
        let backChain = this.ik.chains[0];
        let backPoleTarget = this.poleTargets.backPoleTarget;

        let leftArmChain = this.ik.chains[1];
        let leftArmPoleTarget = this.poleTargets.leftArmPoleTarget;

        let leftLegChain = this.ik.chains[3];
        let leftLegPoleTarget = this.poleTargets.leftLegPoleTarget;

        this.chainRotate(backChain, backPoleTarget);
        this.chainRotate(leftArmChain, leftArmPoleTarget);
        this.chainRotate(leftLegChain, leftLegPoleTarget);

        // Applies blender's pole constraint to left arm
        this.poleConstraints.forEach((poleConstraint) =>
        {
            poleConstraint.apply();
        });
    }

    // Rotates whole chain towards position
    chainRotate(chain, poleTarget)
    {
        chain.joints.forEach((joint) =>
        {
            joint.bone.lookAt(poleTarget);
        });
    }

    lateUpdate()
    {
        this.legsFollowTargetRotation();
        super.lateUpdate();
        this.applyHeadRotation();
    }
    // Follows moving target rotation which applied to feet
    legsFollowTargetRotation()
    {
        // Makes right foot follow the rotation of target
        let rightFootBone = this.ik.chains[4].joints[2].bone;
        let rightLegChainTarget = this.chainObjects[3].controlTarget.target;
        rightFootBone.rotation.copy(rightLegChainTarget.rotation);
        this.rotateBoneQuaternion(rightFootBone, new THREE.Euler(0.5, 0,0  ));
        // Makes right foot follow the rotation of target
        let leftFootBone = this.ik.chains[3].joints[2].bone;
        let leftLegChainTarget = this.chainObjects[2].controlTarget.target;
        leftFootBone.rotation.copy(leftLegChainTarget.rotation);
        this.rotateBoneQuaternion(leftFootBone, new THREE.Euler(0.5, 0,0  ));
    }

    // Sets and quaternion angle for bones
    rotateBoneQuaternion(bone, euler)
    {
        let quaternion = new THREE.Quaternion();
        bone.getWorldQuaternion(quaternion);
        quaternion.inverse();
        let angle = new THREE.Quaternion().setFromEuler(euler);
        quaternion.multiply(angle);
        bone.quaternion.copy(quaternion);
    }

    // Applies head rotation
    applyHeadRotation()
    {
        if(this.neckRotation)
        {
            let neck = this.chainObjects[4].chain.joints[3].bone;
            neck.rotation.copy(this.neckRotation);

            let head = this.chainObjects[4].chain.joints[4].bone;
            this.rotateBoneQuaternion(head, new THREE.Euler(-1.3, 0, 0));
        }
    }

}
export default RagDoll;
