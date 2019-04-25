import {IK, IKBallConstraint, IKChain, IKHelper, IKHingeConstraint, IKJoint} from "../core/three-ik";
import * as THREE from "three";
import setZForward from "../utils/axisUtils";
import ChainObject from "./ChainObject";

// IKObject is class which applies ik onto skeleton
class IkObject
{
    constructor()
    {
        this.applyingOffset = false;
    }

    // Takes skeleton and target for it;s limbs
    initObject(scene, ...controlTarget)
    {
        this.ik = new IK();
        let chains = [];
        let rigMesh = scene.children[1];
        let skeleton = null;
        this.rigMesh = rigMesh;

        let chainObjects = [];
        this.chainObjects = chainObjects;
        this.hipsControlTarget = controlTarget[5];

        chainObjects.push(new ChainObject("RightArm", "RightHand", controlTarget[0]));
        chainObjects.push(new ChainObject("LeftArm", "LeftHand", controlTarget[1]));
        chainObjects.push(new ChainObject("LeftUpLeg", "LeftFoot", controlTarget[2]));
        chainObjects.push(new ChainObject("RightUpLeg", "RightFoot", controlTarget[3]));

        chainObjects.push(new ChainObject("Spine", "Neck", controlTarget[4]));

        // Adds events to Back control
        this.applyEventsToBackControl(controlTarget[4].control);

        // Goes through all scene objects
        scene.traverse((object) =>
        {
            // Searches only bones object
            if(object instanceof THREE.Bone)
            {

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

                   // skeleton.updateMatrixWorld(true);
                }
                // Flips a model's forward from -Z to +Z
                // By default Models axis is -Z while Three ik works with +Z
                if(object.name === "Hips")
                {
                    this.hips = object;
                    setZForward(object);
                    rigMesh.bind(rigMesh.skeleton);
                    skeleton.position.z += 2;
                    console.log(skeleton);
                    //object.position.z += 2;
                }

                // Goes through all chain objects to find with which we are working
                chainObjects.forEach((chainObject) =>
                {
                    // Finds base Object Name or an object from which chain starting
                    // Also checks if chain is started
                    if(object.name == chainObject.baseObjectName || chainObject.isChainObjectStarted)
                    {
                        let chain = chainObject.chain;

                        // Acquires constraint for current object
                        let constraints = chainObject.getCurrentConstraint();
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
                            object.getWorldPosition(target.position)

                            chainObject.isChainObjectStarted = false
                        }
                        // Creates joint by passing current bone and its constraint
                        let joint = new IKJoint(object, {constraints});
                        // Adds joint to chain and sets target
                        chain.add(joint, {target});

                    }
                });
            }
        });
        // Goes through list of constraints and adds it to IK
        chains.forEach((chain) =>
        {
            this.ik.add(chain);
        });

        // Sets skeleton helper for showing bones
        let skeletonHelper = new THREE.SkeletonHelper( skeleton );
        // Sets line width of skeleton helper
        skeletonHelper.material.linewidth = 3;
        // Adds skeleton helper to scene
        scene.add( skeletonHelper );
        this.calculteBackOffset();
    }

    applyEventsToBackControl(backControl)
    {
        backControl.addEventListener("mouseDown", (event) =>
        {
            this.applyingOffset = true;
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

    // Calculates back's offset in order to move with hips
    calculteBackOffset()
    {
        let backPosition = this.chainObjects[4].controlTarget.target.position.clone();
        let hipsPosition = this.hipsControlTarget.target.position.clone();

        this.backOffset = backPosition.sub(this.hipsControlTarget.target.position);
    }

    // Updates chains
    // Only done this left limbs in order to see difference
    update()
    {
        let backChain = this.ik.chains[0];
        let backPoleTarget = new THREE.Vector3( 0, 0, 0);

        let rightArmChain = this.ik.chains[1];
        let rightArmPoleTarget = new THREE.Vector3( 10, 10, 1);

        let leftArmChain = this.ik.chains[2];
        let leftArmPoleTarget = new THREE.Vector3( -10, 10, 1);

        let leftLegChain = this.ik.chains[3];
        let leftLegPoleTarget = new THREE.Vector3( 0, 45, 90);

        let rightLegChain = this.ik.chains[4];
        let rightLegPoleTarget = new THREE.Vector3( 0, 45, 90);

        this.chainRotate(backChain, backPoleTarget);
        this.chainRotate(leftArmChain, leftArmPoleTarget);
        this.chainRotate(rightArmChain, rightArmPoleTarget);
        this.chainRotate(leftLegChain, leftLegPoleTarget);
        this.chainRotate(rightLegChain, rightLegPoleTarget);
    }

    // Updates which is called last after all stuff in loop has been done
    lateUpdate()
    {
        // Makes right fool follow the rotation of target
        let rightFootBone = this.ik.chains[4].joints[2].bone;
        let rightLegChainTarget = this.chainObjects[3].controlTarget.target;
        rightFootBone.rotation.x = rightLegChainTarget.rotation.x;
        rightFootBone.rotation.y = rightLegChainTarget.rotation.y;
        rightFootBone.rotation.z = rightLegChainTarget.rotation.z;

        let hipsTarget = this.hipsControlTarget.target;
        // Sets back position when offset is not changing
        if(!this.applyingOffset)
        {
            let backTarget = this.chainObjects[4].controlTarget.target;
            let hipsPosition = hipsTarget.position.clone();
            let result = hipsPosition.add(this.backOffset);
            backTarget.position.copy(result);
        }
        // Follows hips target
        this.hips.position.x = hipsTarget.position.x;
        this.hips.position.y = hipsTarget.position.y;
        this.hips.position.z = hipsTarget.position.z;
    }

    // Rotates whole chain towards position
    chainRotate(chain, poleTarget)
    {
        chain.joints.forEach((joint) =>
        {
            joint.bone.lookAt(poleTarget);
        });
    }
}
export default IkObject;
