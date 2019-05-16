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
        this.poleTargetOffsets = {};
        this.hipsMouseDown = false;
    }

    initObject(scene, ...controlTarget)
    {
        super.initObject(scene, controlTarget);
        // Adds gui elements to control objects
        let leftArmPoleTarget = new PoleTarget(new THREE.Vector3(.35, 1.6, .35));
        let leftLegPoleTarget = new PoleTarget(new THREE.Vector3(.09, 1.2, 2));

        let rightArmPoleTarget = new PoleTarget(new THREE.Vector3(-.35, 1.6, .35));
        let rightLegPoleTarget = new PoleTarget(new THREE.Vector3(-.09, 1.2, 2));

        let backPoleTarget = new PoleTarget(new THREE.Vector3(0, 1.6, 1));

        this.poleConstraints.push(new PoleConstraint(this.ik.chains[0], backPoleTarget));
        this.poleConstraints.push(new PoleConstraint(this.ik.chains[1], leftArmPoleTarget));
        this.poleConstraints.push(new PoleConstraint(this.ik.chains[2], rightArmPoleTarget));
        this.poleConstraints.push(new PoleConstraint(this.ik.chains[3], leftLegPoleTarget));
        this.poleConstraints.push(new PoleConstraint(this.ik.chains[4], rightLegPoleTarget));

        this.poleConstraints[0].poleAngle = 128;

        this.poleConstraints[1].applyPoleConstraint = true;
        this.poleConstraints[2].applyPoleConstraint = true;
        this.poleConstraints[3].applyPoleConstraint = true;
        this.poleConstraints[4].applyPoleConstraint = true;
        this.addHipsEvent();
    }

    update()
    {
        super.update();
        if(this.enableIk)
        {
            // Solves the inverse kinematic of object
            this.ik.solve();
        }
        this.lateUpdate();
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

    addHipsEvent()
    {
        let hipsControl = this.hipsControlTarget.control;
        let hipsTarget = this.hipsControlTarget.target;

        hipsControl.addEventListener("mouseDown", (event) =>
        {
            this.hipsMouseDown = true;

            let backConstraint = this.poleConstraints[0].poleTarget.mesh.position.clone();
            this.poleTargetOffsets.back = backConstraint.sub(hipsTarget.position);

            let leftArmConstraint = this.poleConstraints[1].poleTarget.mesh.position.clone();
            this.poleTargetOffsets.leftArm = leftArmConstraint.sub(hipsTarget.position);

            let rightArmConstraint = this.poleConstraints[2].poleTarget.mesh.position.clone();
            this.poleTargetOffsets.rightArm = rightArmConstraint.sub(hipsTarget.position);

            let leftLegConstraint = this.poleConstraints[3].poleTarget.mesh.position.clone();
            this.poleTargetOffsets.leftLeg = leftLegConstraint.sub(hipsTarget.position);

            let rightLegConstraint = this.poleConstraints[4].poleTarget.mesh.position.clone();
            this.poleTargetOffsets.rightLeg = rightLegConstraint.sub(hipsTarget.position);

        });
        hipsControl.addEventListener("change", (event) =>
        {
            if(this.hipsMouseDown)
            {
                let hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.back);
                this.poleConstraints[0].poleTarget.mesh.position.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.leftArm);
                this.poleConstraints[1].poleTarget.mesh.position.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.rightArm);
                this.poleConstraints[2].poleTarget.mesh.position.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.leftLeg);
                this.poleConstraints[3].poleTarget.mesh.position.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.rightLeg);
                this.poleConstraints[4].poleTarget.mesh.position.copy(hipsPosition);
            }
        });
        hipsControl.addEventListener("dragging-changed", (event) =>
        {
            this.calculteBackOffset();
        });
        hipsControl.addEventListener("mouseUp", (event) =>
        {
            this.applyingOffset = false;
            this.hipsMouseDown = false;
        });
    }

    // Applies head rotation
    applyHeadRotation()
    {
        if(this.neckRotation)
        {
            let neck = this.chainObjects[0].chain.joints[3].bone;
            neck.rotation.copy(this.neckRotation);
            let neckQuanternion = new THREE.Quaternion();
            neck.getWorldQuaternion(neckQuanternion);

            let head = this.chainObjects[0].chain.joints[4].bone;
            this.rotateBoneQuaternion(head, new THREE.Euler(-1, 0, 0));
        }
    }

}
export default RagDoll;
