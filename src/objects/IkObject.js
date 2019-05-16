import {IK, IKJoint} from "../core/three-ik";
import * as THREE from "three";
import setZForward from "../utils/axisUtils";
import ChainObject from "./ChainObject";

// IKObject is class which applies ik onto skeleton
class IkObject
{
    constructor()
    {
        this.applyingOffset = false;
        this.magicNumberToMoveObject = 1;
        this.neckRotation = null;
        this.enableIk = true;
        this.controlTargets = [];
    }

    // Takes skeleton and target for it's limbs
    initObject(scene, ...controlTarget)
    {
        this.ik = new IK();
        let chains = [];
        let rigMesh = scene.children[1];
        let skeleton = null;
        this.controlTargets = controlTarget[0];

        let chainObjects = [];
        this.chainObjects = chainObjects;
        this.hipsControlTarget = this.controlTargets[5];

        chainObjects.push(new ChainObject("Spine", "Head", this.controlTargets[0]));

        chainObjects.push(new ChainObject("LeftArm", "LeftHand", this.controlTargets[1]));
        chainObjects.push(new ChainObject("RightArm", "RightHand", this.controlTargets[2]));
        chainObjects.push(new ChainObject("LeftUpLeg", "LeftFoot", this.controlTargets[3]));
        chainObjects.push(new ChainObject("RightUpLeg", "RightFoot", this.controlTargets[4]));

        // Adds events to Back control
        this.applyEventsToBackControl(controlTarget[0][0].control);

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
        this.neckInfluence();
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
            if(this.enableIk)
            {
                this.neckInfluence();
            }
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

    neckInfluence()
    {
        let spineRotation = this.chainObjects[0].chain.joints[0].bone.rotation.clone();
        this.neckRotation = this.chainObjects[0].chain.joints[3].bone.rotation.clone();
        this.neckRotation.y = -spineRotation.y * 0.5 ;
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
