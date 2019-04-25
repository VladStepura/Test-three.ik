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
        this.ik = new IK();
        let chains = [];
        let rigMesh = scene.children[1];
        let skeleton = null;
        this.rigMesh = rigMesh;
        console.log(rigMesh);
        let chainObjects = [];
        this.chainObjects = chainObjects;
        this.hipsTarget = movingTarget[5].target;

        console.log(this.backOffset);
        chainObjects.push(new ChainObject("RightArm", "RightHand", movingTarget[0].target));
        chainObjects.push(new ChainObject("LeftArm", "LeftHand", movingTarget[1].target));
        chainObjects.push(new ChainObject("LeftUpLeg", "LeftFoot", movingTarget[2].target));
        chainObjects.push(new ChainObject("RightUpLeg", "RightFoot", movingTarget[3].target));

        chainObjects.push(new ChainObject("Spine", "Neck", movingTarget[4].target));

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
                    this.hips = object;
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
    // Updates chains
    // Only done this left limbs in order to see difference
    update()
    {
        let backPosition = this.chainObjects[4].movingTarget.position.clone();
        this.backOffset = backPosition.sub(this.hipsTarget.position);
        console.log(this.backOffset.y);
        let backChain = this.ik.chains[0];
        let backPoleTarget = new THREE.Vector3( 0, 0, 0);

        let rightArmChain = this.ik.chains[1];
        let rightArmPoleTarget = new THREE.Vector3( 90, 45, -90);

        let leftArmChain = this.ik.chains[2];
        let leftArmPoleTarget = new THREE.Vector3( -90, 45, -90);

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

    lateUpdate()
    {
        let rightFootBone = this.ik.chains[4].joints[2].bone;
        let rightLegChainTarget = this.chainObjects[3].movingTarget;
        rightFootBone.rotation.x = rightLegChainTarget.rotation.x;
        rightFootBone.rotation.y = rightLegChainTarget.rotation.y;
        rightFootBone.rotation.z = rightLegChainTarget.rotation.z;
      //  let target = rightLegChainTarget.clone();
       // target.position.x *= -1;
     //   target.position.y *= -1;
        //target.position.z = 0;

      //  rightFootBone.lookAt(target.position);
      //  console.log(rightFootBone);
       // let backChain = this.ik.chains[0];
        //let backBone = backChain.joints[0].bone;
       // .lookAt(this.hipsTarget.position);
        let backTarget = this.chainObjects[4].movingTarget;
        let hipsPosition = this.hipsTarget.position.clone();
        backTarget.position.copy(hipsPosition.add(this.backOffset));

        this.hips.position.x = this.hipsTarget.position.x;
        this.hips.position.y = this.hipsTarget.position.y;
        this.hips.position.z = this.hipsTarget.position.z;
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
