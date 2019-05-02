import {IK, IKBallConstraint, IKChain, IKHelper, IKHingeConstraint, IKJoint} from "../core/three-ik";
import * as THREE from "three";
import setZForward from "../utils/axisUtils";
import ChainObject from "./ChainObject";
import Gui from "./Gui";

// IKObject is class which applies ik onto skeleton
class IkObject
{
    constructor()
    {
        this.applyingOffset = false;
        this.magicNumberToMoveObject = 1;
        this.poleTargets = {};
        this.headRotation = null;
        this.neckRotaion = null;
        this.enableIk = true;
        this.needsRecalculation = false;
        this.controlTargets = [];
    }

    // Takes skeleton and target for it;s limbs
    initObject(scene, ...controlTarget)
    {
        this.ik = new IK();
        let chains = [];
        let rigMesh = scene.children[1];
        let skeleton = null;
        this.rigMesh = rigMesh;
        this.controlTargets = controlTarget[0];

        let chainObjects = [];
        this.chainObjects = chainObjects;
        this.hipsControlTarget = this.controlTargets[5];
        this.hipsControlTarget.target.position.z += this.magicNumberToMoveObject;

        //this.initializePoleTarget();


        chainObjects.push(new ChainObject("RightArm", "RightHand", this.controlTargets[0]));
        chainObjects.push(new ChainObject("LeftArm", "LeftHand", this.controlTargets[1]));
        chainObjects.push(new ChainObject("LeftUpLeg", "LeftFoot", this.controlTargets[2]));
        chainObjects.push(new ChainObject("RightUpLeg", "RightFoot", this.controlTargets[3]));

        chainObjects.push(new ChainObject("Spine", "Head", this.controlTargets[4]));

        // Adds events to Back control
        this.applyEventsToBackControl(controlTarget[0][4].control);

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
                            target.position.z += this.magicNumberToMoveObject;
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
                let spineRotation = this.chainObjects[4].chain.joints[0].bone.rotation.clone();
                this.headRotation = this.chainObjects[4].chain.joints[4].bone.rotation.clone();
                this.neckRotaion = this.chainObjects[4].chain.joints[3].bone.rotation.clone();
                this.headRotation.y = -spineRotation.y * 0.5;
                this.neckRotaion.y = -spineRotation.y * 0.5;
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

    // Calculates back's offset in order to move with hips
    calculteBackOffset()
    {
        let backPosition = this.chainObjects[4].controlTarget.target.position.clone();
        let hipsPosition = this.hipsControlTarget.target.position.clone();
        this.backOffset = backPosition.sub(hipsPosition);
    }

    // Updates chains
    // Only done this left limbs in order to see difference
    update()
    {
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
        let backChain = this.ik.chains[0];
        let backPoleTarget = this.poleTargets.backPoleTarget;

        let rightArmChain = this.ik.chains[1];
        let rightArmPoleTarget = this.poleTargets.rightArmPoleTarget;

        let leftArmChain = this.ik.chains[2];
        let leftArmPoleTarget = this.poleTargets.leftArmPoleTarget;

        let leftLegChain = this.ik.chains[3];
        let leftLegPoleTarget = this.poleTargets.leftLegPoleTarget;

        let rightLegChain = this.ik.chains[4];
        let rightLegPoleTarget = this.poleTargets.rightLegPoleTarget;

        this.chainRotate(backChain, backPoleTarget);
        this.chainRotate(leftArmChain, leftArmPoleTarget);
        this.chainRotate(rightArmChain, rightArmPoleTarget);
        this.chainRotate(leftLegChain, leftLegPoleTarget);
        this.chainRotate(rightLegChain, rightLegPoleTarget);
    }

    // Recalculates positions of transform controls
    recalculate()
    {
        let leftHand = this.chainObjects[1].chain.joints[2].bone;
        let leftHandTarget = this.chainObjects[1].controlTarget.target;

        let rightHand = this.chainObjects[0].chain.joints[2].bone;
        let rightHandTarget = this.chainObjects[0].controlTarget.target;

        let leftLeg = this.chainObjects[2].chain.joints[2].bone;
        let leftLegTarget = this.chainObjects[2].controlTarget.target;

        let rightLeg = this.chainObjects[3].chain.joints[2].bone;
        let rightLegTarget = this.chainObjects[3].controlTarget.target;

        let back = this.chainObjects[4].chain.joints[4].bone;
        let backTarget = this.chainObjects[4].controlTarget.target;

        leftHand.getWorldPosition(leftHandTarget.position);
        rightHand.getWorldPosition(rightHandTarget.position);
        leftLeg.getWorldPosition(leftLegTarget.position);
        rightLeg.getWorldPosition(rightLegTarget.position);
        back.getWorldPosition(backTarget.position);
        this.calculteBackOffset();
    }

    // Rotates whole chain towards position
    chainRotate(chain, poleTarget)
    {
        chain.joints.forEach((joint) =>
        {
            joint.bone.lookAt(poleTarget);
        });
    }

    // Updates which is called last after all stuff in loop has been done
    // Fires after ik solver in order to apply custom changes to models
    // Ik solver overrides all changes if applied before it's fired
    lateUpdate()
    {
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
        this.hips.position.copy(hipsTarget.position);
        // Cause ik solver is overriding any changes to rotation need to be applied in late update
    }
    
}
export default IkObject;
