import {IK, IKJoint, IKBallConstraint, IKHingeConstraint} from "../../core/three-ik";
import * as THREE from "three";
import {setZDirecion, setReverseZ, setZBack} from "../../utils/axisUtils";
import ChainObject from "./ChainObject";
import SkeletonUtils from "../../utils/SkeletonUtils";
import "../../utils/Object3dExtension";

// IKObject is class which applies ik onto skeleton
class IkObject
{
    constructor()
    {
        if(new.target === IkObject)
        {
            throw new TypeError("Cannot construct abstract IkObject directly");
        }
        this.applyingOffset = false;
        this.isEnabledIk = false;
        this.controlTargets = [];
        this.originalObject = null;
        this.clonedObject = null;
        this.ikBonesName = [];
        this.originalRotationDiffrenceOfBones = [];
        this.zForwardDifference = [];
        this.prevRotation = [];

        this.originalObjectMatrix = {};
        this.cloneObjectMatrix = {};
        this.bonesDelta = {};
        this.hipsMouseDown = false;
    }

    // Takes skeleton and target for it's limbs
    initObject(scene, objectSkeleton, skinnedMesh, ...controlTarget)
    {
        this.ik = new IK();
        let chains = [];

        let clonedSkeleton = SkeletonUtils.clone(objectSkeleton);
        console.log(objectSkeleton.children[0].clone());
        console.log(clonedSkeleton.children[0].clone());

        this.originalObject = objectSkeleton;
        this.clonedObject = clonedSkeleton;

        this.rigMesh = clonedSkeleton.children[1];
        let rigMesh = this.rigMesh;
        let rigMeshOriginal = objectSkeleton.children[1];

        let skeleton = null;
        this.controlTargets = controlTarget[0];
        this.addParentToControl(objectSkeleton.uuid);
        let chainObjects = [];
        this.chainObjects = chainObjects;
        this.hipsControlTarget = this.controlTargets[5];

        chainObjects.push(new ChainObject("Spine", "Head", this.controlTargets[0]));
        chainObjects.push(new ChainObject("LeftArm", "LeftHand", this.controlTargets[1]));
        chainObjects.push(new ChainObject("RightArm", "RightHand", this.controlTargets[2]));
        chainObjects.push(new ChainObject("LeftUpLeg", "LeftFoot", this.controlTargets[3]));
        chainObjects.push(new ChainObject("RightUpLeg", "RightFoot", this.controlTargets[4]));
       
        scene.add(clonedSkeleton);
        // Goes through all scene objects
        clonedSkeleton.traverse((object) =>
        {
            // Searches only bones object
            if(object instanceof THREE.Bone)
            {
                object.matrixAutoUpdate = false;
                object.matrixWorldNeedsUpdate = false;
                // Finds skeleton for skeletonHelper
                if(skeleton === null)
                {
                    let parent = object.parent;
                    // Goes up the parent list to find out not a bone
                    // If parent of Bone not a Bone than it's skeleton
                    while (parent instanceof THREE.Bone)
                    {
                        parent = parent.parent;
                    }
                    skeleton = parent;
                }
                // Flips a model's forward from -Z to +Z
                // By default Models axis is -Z while Three ik works with +Z
                if(object.name === "Hips")
                {
                    this.hips = object;
                    setZDirecion(object, new THREE.Vector3(0, 0, 1));

                    rigMesh.bind(rigMesh.skeleton);

                    this.originalObject.children[1].bind(this.originalObject.children[1].skeleton);
                    object.updateWorldMatrix(true, true);
                    let objectWorld = new THREE.Vector3();
                    object.getWorldPosition(objectWorld);
                    this.hipsControlTarget.target.position.copy(objectWorld);
                }
                let originBone = objectSkeleton.getObjectByName(object.name);
                let difference = new THREE.Euler(0, 0, 0);
                difference.x = object.rotation.x - originBone.rotation.x;
                difference.y = object.rotation.y - originBone.rotation.y;
                difference.z = object.rotation.z - originBone.rotation.z;
                this.zForwardDifference.push(difference);
                this.originalRotationDiffrenceOfBones.push(difference);
                // Goes through all chain objects to find with which we are working
                chainObjects.forEach((chainObject) =>
                {
                    // Finds base Object Name or an object from which chain starting
                    // Also checks if chain is started
                    if(object.name == chainObject.baseObjectName || chainObject.isChainObjectStarted)
                    {
                        let chain = chainObject.chain;

                        // Checks if root object
                        if(object.name === chainObject.baseObjectName)
                        {
                            chainObject.isChainObjectStarted = true;
                            chains.push(chain);
                        }
                        // Declares target
                        // Target(Effector) is object to which chain is trying to get
                        let target =  null;
                        // Checks if object is last
                        if(object.name === chainObject.lastObjectName)
                        {
                            target = chainObject.controlTarget.target;
                            let objectWorld = new THREE.Vector3();
                            object.getWorldPosition(objectWorld);
                            target.position.copy(objectWorld);

                            chainObject.isChainObjectStarted = false;
                        }
                        this.ikBonesName.push(object.name);
                        // Creates joint by passing current bone and its constraint
                        let constraints = chainObject.constraints;
                        let joint = new IKJoint(object, {constraints});
                        let globaPose = new THREE.Vector3();
                        // Adds joint to chain and sets target
                        chain.add(joint, {target});
                    }
                });


            }
        });
        this.ikBonesName.push("Hips");
        scene.remove(clonedSkeleton);
        // Goes through list of constraints and adds it to IK
        chains.forEach((chain) =>
        {
            this.ik.add(chain);
        }); 
        // Sets skeleton helper for showing bones
        this.skeletonHelper = new THREE.SkeletonHelper( skeleton );
        // Sets line width of skeleton helper
        this.skeletonHelper.material.linewidth = 7;

        // Adds skeleton helper to scene
        scene.add( this.skeletonHelper );
        console.log("Rotation", this.originalRotationDiffrenceOfBones);
        console.log("Cloned object", this.clonedObject);
        console.log("Original object", this.originalObject);
        this.initializeAxisAngle();
        //this.recalculateDifference();
    }

    // Calculates back's offset in order to move with hips
    calculteBackOffset()
    {
        let backPosition = this.chainObjects[0].controlTarget.target.position.clone();
        let hipsPosition = this.hipsControlTarget.target.position.clone();
        this.backOffset = backPosition.sub(hipsPosition);
    }

    // Updates chains
    // Only done this left limbs in order to see difference
    update()
    {
        if(this.isEnabledIk)
        {
            //this.lateUpdate();
            // Solves the inverse kinematic of object
            this.ik.solve();
            this.lateUpdate();

            if(IK.firstRun)
            {
                //this.initializeAxisAngle();
                this.recalculateDifference();
            }
        }
    }

    // Updates which is called last after all stuff in loop has been done
    // Fires after ik solver in order to apply custom changes to models
    // Ik solver overrides all changes if applied before it's fired
    lateUpdate()
    {
        let hipsTarget = this.hipsControlTarget.target;
        // Sets back position when offset is not changing
        // When we are changing back position offset between hips and back shouldn't be applied
        if(!this.applyingOffset)
        {
            let backTarget = this.chainObjects[0].controlTarget.target;
            let hipsPosition = hipsTarget.position.clone();
            let result = hipsPosition.add(this.backOffset);
            backTarget.position.copy(result);
        }
        // Follows hips target
        let targetPosition = hipsTarget.position.clone();
        this.hips.parent.worldToLocal(targetPosition);
        this.hips.position.copy(targetPosition);
        this.hips.updateMatrix();
    }

    // Removes ikObject's all elements from scene
    // Control target consists of two things: mesh and control
    // before removed mesh should be detached from control
    removeFromScene(scene)
    {
        this.chainObjects.forEach((chainObject) =>
        {
            let control = chainObject.controlTarget.control;
            let target = chainObject.controlTarget.target;
            control.detach(target);
            scene.remove(target);
            scene.remove(control);
        });
        this.hipsControlTarget.control.detach(this.hipsControlTarget.target);
        scene.remove(this.hipsControlTarget.target);
        scene.remove(this.hipsControlTarget.control);
        scene.remove(this.skeletonHelper);
    }

    // Resets targets position
    // After IK has been turned off and on
    resetTargets()
    {
        let chainObjects = this.chainObjects;
        this.hips.getWorldPosition(this.hipsControlTarget.target.position);
        for(let i = 0; i < chainObjects.length; i++)
        {
            let chain = chainObjects[i].chain;
            let jointBone = chain.joints[chain.joints.length - 1].bone;
            if(jointBone.name === "LeftFoot" || jointBone.name === "RightFoot" ||
                jointBone.name === "LeftHand" || jointBone.name === "RightHand" ||
                jointBone.name === "Head" || jointBone.name === "Hips")
            {
                let targetPosition = chainObjects[i].controlTarget.target.position;
                jointBone.getWorldPosition(targetPosition);
            }
            else
            {
                let bone =  this.originalObject.getObjectByName(jointBone.name);
                let targetPosition = chainObjects[i].controlTarget.target.position;
                bone.getWorldPosition(targetPosition);
            }

        }
        this.calculteBackOffset();
    }

    // Recalculates positions of transform controls
    // It works when ik is disable and when enabled in order to recalculate all position
    // Which have been changed while ik was turned off
    recalculate()
    {
        let back = this.chainObjects[0].chain.joints[4].bone;
        let backTarget = this.chainObjects[0].controlTarget.target;

        let leftHand = this.chainObjects[1].chain.joints[2].bone;
        let leftHandTarget = this.chainObjects[1].controlTarget.target;

        let rightHand = this.chainObjects[2].chain.joints[2].bone;
        let rightHandTarget = this.chainObjects[2].controlTarget.target;

        let leftLeg = this.chainObjects[3].chain.joints[2].bone;
        let leftLegTarget = this.chainObjects[3].controlTarget.target;

        let rightLeg = this.chainObjects[4].chain.joints[2].bone;
        let rightLegTarget = this.chainObjects[4].controlTarget.target;

        back.getWorldPosition(backTarget.position);
        leftHand.getWorldPosition(leftHandTarget.position);
        rightHand.getWorldPosition(rightHandTarget.position);
        leftLeg.getWorldPosition(leftLegTarget.position);
        rightLeg.getWorldPosition(rightLegTarget.position);
        this.calculteBackOffset();
    }

    addParentToControl(parentId)
    {
        let controlTarget = this.controlTargets;
        for (let i = 0; i < controlTarget.length; i++)
        {
            let control = controlTarget[i].control;
            control.characterId = parentId;
        }
    }

    recalculateDifference()
    {
        let clonedSkin = this.clonedObject.children[1];
        let originalSkin = this.originalObject.children[1];
        let clonedBones = clonedSkin.skeleton.bones;
        let originalBones = originalSkin.skeleton.bones;
        for (let i = 0; i < 1; i++)
        {
            let originalBone = originalBones[i];
            let cloneBone = clonedBones[i];
            this.originalObjectMatrix[originalBone.name] = originalBone.matrix.clone();
            this.cloneObjectMatrix[cloneBone.name] = cloneBone.matrix.clone();
        }
    }

    initializeAxisAngle()
    {
        let clonedSkin = this.clonedObject.children[1];
        let originalSkin = this.originalObject.children[1];
        let clonedBones = clonedSkin.skeleton.bones;
        let originalBones = originalSkin.skeleton.bones;
        for (let i = 0; i < clonedBones.length; i++)
        {
            let cloneBone = clonedBones[i];
            let originalBone = originalBones[i];
            let deltaQuat = new THREE.Quaternion();
            deltaQuat.multiply(cloneBone.quaternion.clone().conjugate());
            deltaQuat.multiply(originalBone.quaternion);
            let globalDeltaQuat = new THREE.Quaternion();
            globalDeltaQuat.multiply(cloneBone.worldQuaternion().clone().conjugate());
            globalDeltaQuat.multiply(originalBone.worldQuaternion());
            if(cloneBone.name === "LeftArm")
            {
                console.log("Clone", globalDeltaQuat);
            }
            let cloneToOriginDelta = new THREE.Quaternion();
            cloneToOriginDelta.multiply(cloneBone.worldQuaternion().inverse());
            cloneToOriginDelta.multiply(originalBone.worldQuaternion());

            let originToCloneDelta = new THREE.Quaternion();
            originToCloneDelta.multiply(originalBone.worldQuaternion().inverse());
            originToCloneDelta.multiply(cloneBone.worldQuaternion());
            this.originalObjectMatrix[originalBone.name] = originalBone.matrix.clone();
            this.cloneObjectMatrix[cloneBone.name] = cloneBone.matrix.clone();

            this.bonesDelta[cloneBone.name] = {};
            this.bonesDelta[originalBone.name].cloneQuat = cloneBone.worldQuaternion().clone();
            this.bonesDelta[originalBone.name].originQuat = originalBone.worldQuaternion().clone();
            this.bonesDelta[originalBone.name].cloneToOriginDelta = cloneToOriginDelta;
            this.bonesDelta[originalBone.name].originToCloneDelta = originToCloneDelta;
        }
    }

    reinitializeConstaraint()
    {

    }

}
export default IkObject;
