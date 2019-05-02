import IkObject from "./IkObject";
import * as THREE from "three";
import Gui from "./Gui";

class RagDoll extends IkObject
{
    constructor()
    {
        super();
    }

    initObject(scene, ...controlTarget)
    {
        super.initObject(scene, controlTarget);
        this.initializePoleTarget();
        // Adds gui elements to control objects
        this.addGuiElements();
    }

    // Sets pole targets position
    initializePoleTarget()
    {
        console.log(this.poleTargets);
        this.poleTargets.backPoleTarget = new THREE.Vector3( 0, 0, 0);
        this.poleTargets.rightArmPoleTarget = new THREE.Vector3( -90, 45, -90);
        this.poleTargets.leftArmPoleTarget = new THREE.Vector3( 90, 45, -90);
        this.poleTargets.leftLegPoleTarget = new THREE.Vector3( 0, 45, 90);
        this.poleTargets.rightLegPoleTarget = new THREE.Vector3( 0, 45, 90);
    }

    // Adds gui elements to scene
    // With adding its parameters
    addGuiElements()
    {
        console.log(this.chainObjects[3].controlTarget);
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
        gui.datGui.open();
    }

    lateUpdate()
    {
        this.legsFollowTargetRotation();
        super.lateUpdate();
        this.applyHeadRotation();
    }

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
        if(this.headRotation)
        {
            let neck = this.chainObjects[4].chain.joints[3].bone;
            neck.rotation.copy(this.neckRotaion);

            let head = this.chainObjects[4].chain.joints[4].bone;
            this.rotateBoneQuaternion(head, new THREE.Euler(-1.3, 0, 0));
        }
    }

}
export default RagDoll;
