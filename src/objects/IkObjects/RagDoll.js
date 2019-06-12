import IkObject from "./IkObject";
import * as THREE from "three";
import PoleConstraint from "../../contraints/PoleConstraint";
import PoleTarget from "../PoleTarget";
import CopyRotation from "../../contraints/CopyRotation";

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
        // Adds events to Back control
        this.applyEventsToBackControl(this.controlTargets[0].control);

        // Adds gui elements to control objects
        let leftArmPoleTarget = new PoleTarget(new THREE.Vector3(.35, 1.6, -.35));
        let leftLegPoleTarget = new PoleTarget(new THREE.Vector3(.09, 1.2, 1));

        let rightArmPoleTarget = new PoleTarget(new THREE.Vector3(-.35, 1.6, -.35));
        let rightLegPoleTarget = new PoleTarget(new THREE.Vector3(-.09, 1.2, 1));

        let backPoleTarget = new PoleTarget(new THREE.Vector3(0, 1.6, 0));

        scene.add(leftArmPoleTarget.mesh);
        scene.add(leftLegPoleTarget.mesh);
        scene.add(rightArmPoleTarget.mesh);
        scene.add(rightLegPoleTarget.mesh);
        scene.add(backPoleTarget.mesh);

        let backChain = this.ik.chains[0];
        let leftArmChain = this.ik.chains[1];
        let rightArmChain = this.ik.chains[2];
        let leftLegChain = this.ik.chains[3];
        let rightLegChain = this.ik.chains[4];

        this.addPoleConstraintToRootJoint(backChain, backPoleTarget);
        this.addPoleConstraintToRootJoint(leftArmChain, leftArmPoleTarget);
        this.addPoleConstraintToRootJoint(rightArmChain, rightArmPoleTarget);
        this.addPoleConstraintToRootJoint(leftLegChain, leftLegPoleTarget);
        this.addPoleConstraintToRootJoint(rightLegChain, rightLegPoleTarget);
        let copyRotation = new CopyRotation(backChain, backChain.joints[4]);
        copyRotation.influence = 50;
        backChain.joints[3].addIkConstraint(copyRotation);

        this.poleConstraints[0].poleAngle = 128;
        this.poleConstraints[0].chainLength = 6;
        this.poleConstraints[1].testing = true;

        this.addHipsEvent();
    }

    addPoleConstraintToRootJoint(chain, poleTarget)
    {
        let poleConstraint = new PoleConstraint(chain, poleTarget);
        chain.joints[0].addIkConstraint(poleConstraint);
        this.poleConstraints.push(poleConstraint);
    }

    // Applies events to back control
    applyEventsToBackControl(backControl)
    {
        backControl.addEventListener("mouseDown", (event) =>
        {
            this.applyingOffset = true;
        });
        backControl.addEventListener("change", (event) =>
        {
        });
        backControl.addEventListener("dragging-changed", (event) =>
        {
            this.calculteBackOffset();
        });
        backControl.addEventListener("mouseUp", (event) =>
        {
            this.applyingOffset = false;
        });
    }

    update()
    {
        super.update();
        if(this.enableIk)
        {
            // Solves the inverse kinematic of object
            this.ik.solve();
        }
       // this.lateUpdate();
    }

    lateUpdate()
    {
       // this.legsFollowTargetRotation();
        super.lateUpdate();
        //this.applyHeadRotation();
    }

    // Follows moving target rotation which applied to feet
    // Default position is facing flat to Earth
    legsFollowTargetRotation()
    {
        // Makes right foot follow the rotation of target
        //let rightFootBone = this.ik.chains[4].joints[2].bone;
        //let rightLegChainTarget = this.chainObjects[4].controlTarget.target;
        //rightFootBone.rotation.copy(rightLegChainTarget.rotation);
        //this.rotateBoneQuaternion(rightFootBone, new THREE.Euler(0.5, 0,0  ));
        //// Makes left foot follow the rotation of target
        //let leftFootBone = this.ik.chains[3].joints[2].bone;
        //let leftLegChainTarget = this.chainObjects[3].controlTarget.target;
        //leftFootBone.rotation.copy(leftLegChainTarget.rotation);
        //this.rotateBoneQuaternion(leftFootBone, new THREE.Euler(0.5, 0,0  ));
    }

    // Sets and quaternion angle for bones
    // Give the result of bone always faces direction set by euler
    // Effect like flat foot to earth can be achieved
    rotateBoneQuaternion(bone, euler)
    {
        //let quaternion = new THREE.Quaternion();
        //bone.getWorldQuaternion(quaternion);
        //quaternion.inverse();
        //let angle = new THREE.Quaternion().setFromEuler(euler);
        //quaternion.multiply(angle);
        //bone.quaternion.copy(quaternion);
    }

    addHipsEvent()
    {
        let hipsControl = this.hipsControlTarget.control;
        let hipsTarget = this.hipsControlTarget.target;

        let backConstraint = this.poleConstraints[0].poleTarget.mesh.position;
        let leftArmConstraint = this.poleConstraints[1].poleTarget.mesh.position;
        let rightArmConstraint = this.poleConstraints[2].poleTarget.mesh.position;
        let leftLegConstraint = this.poleConstraints[3].poleTarget.mesh.position;
        let rightLegConstraint = this.poleConstraints[4].poleTarget.mesh.position;

        hipsControl.addEventListener("mouseDown", (event) =>
        {
            this.hipsMouseDown = true;

            this.poleTargetOffsets.back = backConstraint.clone().sub(hipsTarget.position);
            this.poleTargetOffsets.leftArm = leftArmConstraint.clone().sub(hipsTarget.position);
            this.poleTargetOffsets.rightArm = rightArmConstraint.clone().sub(hipsTarget.position);
            this.poleTargetOffsets.leftLeg = leftLegConstraint.clone().sub(hipsTarget.position);
            this.poleTargetOffsets.rightLeg = rightLegConstraint.clone().sub(hipsTarget.position);

        });
        hipsControl.addEventListener("change", (event) =>
        {
            if(this.hipsMouseDown)
            {
                let hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.back);
                backConstraint.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.leftArm);
                leftArmConstraint.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.rightArm);
                rightArmConstraint.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.leftLeg);
                leftLegConstraint.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.rightLeg);
                rightLegConstraint.copy(hipsPosition);
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

    // Applies neck rotation and applies head rotation that head stay upward
    applyHeadRotation()
    {
        let head = this.chainObjects[0].chain.joints[4].bone;
        this.rotateBoneQuaternion(head, new THREE.Euler(-1, 0, 0));
    }

    applyChangesToOriginal()
    {
        let clonedSkin = this.clonedObject.children[1];
        let originalSkin = this.originalObject.children[1];
        let clonedBones = clonedSkin.skeleton.bones;
        let originalBones = originalSkin.skeleton.bones;

        let chainObjects = this.chainObjects;
        for (let i = 0; i < clonedBones.length; i++)
        {
            let cloneBone = clonedBones[i];
            let originalBone = originalBones[i];
            let prevRotation =  this.prevRotation[originalBone.name];
            //if(!this.ikBonesName.some((boneName) => originalBone.name === boneName || boneName !== "Hips"))
            //{
            //    continue;
            //}
            let difference = this.originalRotationDiffrenceOfBones[i];
            let positionDiff = this.originalPositionDifferenceOfBones[i];
            let current = new THREE.Euler(cloneBone.rotation.x  - originalBone.rotation.x,
                cloneBone.rotation.y - originalBone.rotation.y,
                cloneBone.rotation.z - originalBone.rotation.z)

            let newAngle = new THREE.Euler(difference.x - current.x ,
                difference.y - current.y ,
                difference.z - current.z );

            let newOrigin = new THREE.Euler(originalBone.rotation.x - newAngle.x,
                originalBone.rotation.y - newAngle.y,
                originalBone.rotation.z - newAngle.z)

            if(this.chainContainsBone(chainObjects[0].chain, originalBone))
            {

                let yRotation = prevRotation === undefined ? newOrigin.z : prevRotation.rotation.z;
                //originalBone.rotation.set(cloneBone.rotation.x, cloneBone.rotation.y, cloneBone.rotation.z);
                originalBone.rotation.set(newOrigin.x, yRotation, -newOrigin.y);
            }
            else if(this.chainContainsBone(chainObjects[3].chain, originalBone) ||
                this.chainContainsBone(chainObjects[4].chain, originalBone) )
            {
                let yRotation = prevRotation === undefined ? newOrigin.y : prevRotation.rotation.y;
                originalBone.rotation.set(newOrigin.x, yRotation, newOrigin.y);
                if(originalBone.name === "LeftUpLeg" || originalBone.name === "RightUpLeg")
                {
                    originalBone.rotateX(-Math.PI);
                    originalBone.rotateY(-Math.PI);
                }
            }
            else if(this.chainContainsBone(chainObjects[1].chain, originalBone) ||
                this.chainContainsBone(chainObjects[2].chain, originalBone))
            {
                if(originalBone.name === "LeftArm" || originalBone.name === "RightArm")
                {
                    originalBone.rotation.set( -(newOrigin.x),
                        -(newOrigin.y),
                        -(newOrigin.z));
                    //originalBone.rotateX(Math.PI);
                    //originalBone.rotateY(Math.PI/2);
                    //originalBone.rotateZ (Math.PI/2);
                }
                else {

                    originalBone.rotation.set(newOrigin.x, newOrigin.z, newOrigin.y);
                }
                let yRotation = prevRotation === undefined ? newOrigin.z : prevRotation.rotation.z;
                originalBone.rotation.set(newOrigin.x, yRotation, newOrigin.y);
                //newOrigin.z = 0;
            }
            else
            {
                let yRotation = prevRotation === undefined ? newOrigin.z : prevRotation.rotation.z;
                originalBone.rotation.set(newOrigin.x, newOrigin.y, newOrigin.z);
            }
        }
    }

    applyChangesToIK()
    {
        this.isEnabledIk = false;
        let clonedSkin = this.clonedObject.children[1];
        let originalSkin = this.originalObject.children[1];
        let clonedBones = clonedSkin.skeleton.bones;
        let originalBones = originalSkin.skeleton.bones;

        let chainObjects = this.chainObjects;
        for (let i = 0; i < clonedBones.length; i++)
        {
            let cloneBone = clonedBones[i];
            let originalBone = originalBones[i];
            let prevRotation =  this.prevRotation[originalBone.name];
            //if(!this.ikBonesName.some((boneName) => originalBone.name === boneName || boneName === "Hips"))
            //{
            //    continue;
            //}
            let differenceRotation = this.originalRotationDiffrenceOfBones[i];

            let current = new THREE.Euler(cloneBone.rotation.x - originalBone.rotation.x,
                cloneBone.rotation.y - originalBone.rotation.y,
                cloneBone.rotation.z - originalBone.rotation.z)

            let newAngle = new THREE.Euler( differenceRotation.x - current.x,
                differenceRotation.y - current.y,
                differenceRotation.z - current.z);
            let newClone = new THREE.Euler(cloneBone.rotation.x + newAngle.x,
                cloneBone.rotation.y + newAngle.y,
                cloneBone.rotation.z + newAngle.z);

            if(this.chainContainsBone(chainObjects[3].chain, originalBone) ||
                this.chainContainsBone(chainObjects[4].chain, originalBone))
            {
                let yRotation = prevRotation === undefined ? newClone.z : prevRotation.rotation.z;
                cloneBone.rotation.set(newClone.x, yRotation, newClone.y);
                // cloneBone.position.set(newClonePos.x, newClonePos.y, newClonePos.z);

            }
            else if(this.chainContainsBone(chainObjects[1].chain, originalBone) ||
                this.chainContainsBone(chainObjects[2].chain, originalBone))
            {
                let yRotation = prevRotation === undefined ? newClone.z : prevRotation.rotation.z;
                cloneBone.rotation.set(newClone.x, yRotation, newClone.y);
                // cloneBone.position.set(newClonePos.x, newClonePos.y, newClonePos.z);
            }
            else
            {
                let yRotation = prevRotation === undefined ? newClone.z : prevRotation.rotation.z;
                //originalBone.rotation.set(newOrigin.x, yRotation, -newOrigin.y);
                cloneBone.rotation.set(newClone.x, newClone.y, newClone.z);
                // cloneBone.position.set(newClonePos.x, newClonePos.y, newClonePos.z);
            }
        }
    }

}
export default RagDoll;
