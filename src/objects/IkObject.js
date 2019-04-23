import {IK, IKBallConstraint, IKChain, IKHelper, IKHingeConstraint, IKJoint} from "../core/three-ik";
import * as THREE from "three";
import setZForward from "../utils/axisUtils";
import ChainObject from "./ChainObject";

// IKObject is class which applies ik onto skeleton
class IkObject
{
    constructor()
    {

    }

    // Takes skeleton and target for it;s limbs
    initObject(scene, ...movingTarget)
    {
        console.log(scene)
        this.ik = new IK();
        let chains = [];
        let joints = {};
        let rigMesh = scene.children[1];
        let skeleton = null;
        this.rigMesh = rigMesh;

        let chainObjects = [];


        chainObjects.push(new ChainObject("RightArm", "RightHand", movingTarget[0]));
        chainObjects.push(new ChainObject("LeftArm", "LeftHand", movingTarget[1]));
        chainObjects.push(new ChainObject("LeftUpLeg", "LeftFoot", movingTarget[2]));
        chainObjects.push(new ChainObject("RightUpLeg", "RightFoot", movingTarget[3]));

        chainObjects.push(new ChainObject("Spine", "Neck", movingTarget[4]));

        // Setting up objects Constraints

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
                }

                // Flips a model's forward from -Z to +Z
                // By default Models axis is -Z while Three ik works with +Z
                if(object.name === "Hips")
                {
                    setZForward(object);
                    rigMesh.bind(rigMesh.skeleton);
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
                            target = chainObject.movingTarget;
                            object.getWorldPosition(chainObject.movingTarget.position)

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
    }

    update()
    {
        let leftArmChain = this.ik.chains[2];
        let leftArmPoleTarget = new THREE.Vector3( -90, 45, -90);

        let leftLegChain = this.ik.chains[4];
        let leftLegPoleTarget = new THREE.Vector3( 0, 45, 90);

        this.chainRotate(leftArmChain, leftArmPoleTarget);
        this.chainRotate(leftLegChain, leftLegPoleTarget);
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
