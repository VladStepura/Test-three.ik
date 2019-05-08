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
        // Adds gui elements to control objects
        let leftArmPoleTarget = new PoleTarget(new THREE.Vector3(.35, 1.6, .35));
        let leftLegPoleTarget = new PoleTarget(new THREE.Vector3(.09, .8, 1.6));

        let rightArmPoleTarget = new PoleTarget(new THREE.Vector3(-.35, 1.6, .35));
        let rightLegPoleTarget = new PoleTarget(new THREE.Vector3(-.09, .8, 1.6));

        let backPoleTarget = new PoleTarget(new THREE.Vector3(0, 1.6, 1));

        this.poleConstraints.push(new PoleConstraint(this.ik.chains[0], backPoleTarget));
        this.poleConstraints.push(new PoleConstraint(this.ik.chains[1], leftArmPoleTarget));
        this.poleConstraints.push(new PoleConstraint(this.ik.chains[2], rightArmPoleTarget));
        this.poleConstraints.push(new PoleConstraint(this.ik.chains[3], leftLegPoleTarget));
        this.poleConstraints.push(new PoleConstraint(this.ik.chains[4], rightLegPoleTarget));

        this.poleConstraints[1].poleAngle = -40;
        this.poleConstraints[2].poleAngle = -40;

        this.poleConstraints[3].poleAngle = 56;
        this.poleConstraints[3].needStraightening = true;
        this.poleConstraints[4].poleAngle = 56;
        this.poleConstraints[4].needStraightening = true;
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
        // Applies blender's pole constraint to left arm
        this.poleConstraints.forEach((poleConstraint) =>
        {
            poleConstraint.apply();
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
        let rightLegChainTarget = this.chainObjects[4].controlTarget.target;
        rightFootBone.rotation.copy(rightLegChainTarget.rotation);
        this.rotateBoneQuaternion(rightFootBone, new THREE.Euler(0.5, 0,0  ));
        // Makes right foot follow the rotation of target
        let leftFootBone = this.ik.chains[3].joints[2].bone;
        let leftLegChainTarget = this.chainObjects[3].controlTarget.target;
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
            let neck = this.chainObjects[0].chain.joints[3].bone;
            neck.rotation.copy(this.neckRotation);

            let head = this.chainObjects[0].chain.joints[4].bone;
            this.rotateBoneQuaternion(head, new THREE.Euler(-1.3, 0, 0));
        }
    }

}
export default RagDoll;
