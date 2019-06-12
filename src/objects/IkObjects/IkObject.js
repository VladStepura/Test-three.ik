import {IK, IKJoint} from "../../core/three-ik";
import * as THREE from "three";
import {setZForward, setReverseZ} from "../../utils/axisUtils";
import ChainObject from "./ChainObject";

// IKObject is class which applies ik onto skeleton
class IkObject
{
    constructor()
    {
        this.applyingOffset = false;
        this.neckRotation = null;
        this.enableIk = true;
        this.controlTargets = [];
    }

    // Takes skeleton and target for it's limbs
    initObject(scene, ...controlTarget)
    {
        this.ik = new IK();
        let chains = [];
        let rigMesh = scene.children[0].children[1];

        /*let clonedSkeleton = SkeletonUtils.clone(objectSkeleton);
        console.log(objectSkeleton.children[0].clone());
        console.log(clonedSkeleton.children[0].clone());*/

    /*    this.originalObject = objectSkeleton;
        this.clonedObject = clonedSkeleton;*/

        let skeleton = null;
        console.log(scene);
        this.controlTargets = controlTarget[0];

        let chainObjects = [];
        this.chainObjects = chainObjects;
        this.hipsControlTarget = this.controlTargets[5];

        chainObjects.push(new ChainObject("Spine", "Head", this.controlTargets[0]));

        chainObjects.push(new ChainObject("LeftArm", "LeftHand", this.controlTargets[1]));
        chainObjects.push(new ChainObject("RightArm", "RightHand", this.controlTargets[2]));
        chainObjects.push(new ChainObject("LeftUpLeg", "LeftFoot", this.controlTargets[3]));
        chainObjects.push(new ChainObject("RightUpLeg", "RightFoot", this.controlTargets[4]));



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
                   //skeleton.scale.copy(new THREE.Vector3(94, 94, 94));
                   // rigMesh.updateMatrixWorld();
                }
                // Flips a model's forward from -Z to +Z
                // By default Models axis is -Z while Three ik works with +Z
                if(object.name === "Hips")
                {
                    this.hips = object;
                    console.log("Before", object.clone());
                    setZForward(object);

                    console.log("After", object.clone());
                    //setReverseZ(object);
                    console.log("Reversed", object.clone());

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
                            console.log(object.position);
                            console.log(target.position);

                            chainObject.isChainObjectStarted = false
                        }
                        // Creates joint by passing current bone and its constraint
                        let joint = new IKJoint(object, {});
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
        if(this.enableIk)
        {
            // Solves the inverse kinematic of object
            this.ik.solve();
        }
        this.lateUpdate();
    }

    reinitialize()
    {
        let chainObjects = this.chainObjects;

        for(let i = 0; i < chainObjects.length; i++)
        {
            let chain = chainObjects[i].chain;
            console.log("reinit");
            chain.joints[chain.joints.length - 1].bone.getWorldPosition(chainObjects[i].controlTarget.target.position);
            chain.reinitializeJoints();
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
        this.hips.position.copy(hipsTarget.position);
    }

}
export default IkObject;
