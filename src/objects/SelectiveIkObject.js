import {IK, IKBallConstraint, IKChain, IKHelper, IKHingeConstraint, IKJoint} from "../core/three-ik";
import setZForward from "../utils/axisUtils";
import * as THREE from "three";

class SelectiveIkObject
{
    constructor()
    {

    }

    initObject(scene, ...movingTarget)
    {
        this.ik = new IK();
        let hipsJoint = null;
        let rigMesh = scene.children[0].children[1];
        let skeleton = null;
        this.constraints = [new IKHingeConstraint(180)];
        let chains = [];

        console.log(rigMesh.skeleton.bones);
        scene.traverse((object) =>
        {
            if(object instanceof THREE.Bone)
            {
                object.updateMatrixWorld(true);
                if (skeleton === null)
                {
                    let parent = object.parent;
                    while (parent instanceof THREE.Bone)
                    {
                        parent = parent.parent;
                    }
                    skeleton = parent;
                }
                if (object.name === "Hips")
                {
                    setZForward(skeleton);
                    rigMesh.bind(rigMesh.skeleton);
                }


                if (object.name === "Hips" ||
                    object.name === "Spine" ||
                    object.name === "Spine1" ||
                    object.name === "Spine2" ||
                    object.name === "Neck" ||
                    object.name === "Head")
                {

                    if (object.name === "Hips")
                    {
                        setZForward(skeleton);
                        rigMesh.bind(rigMesh.skeleton);
                    }
                    let constraint = [new IKHingeConstraint(180)];
                    let joint = new IKJoint(object, {constraint});
                    if(object.name === "Hips")
                    {
                        hipsJoint = joint
                    }
                }
            }
        });
        for (let i = 0; i < 3; i++)
        {
            chains.push(new IKChain());
        }
        let ikChain = chains[0];
        this.addtoChainThroughBones(ikChain, rigMesh.skeleton.bones[0].children[1], movingTarget[0]);

        ikChain = chains[1];
        this.addtoChainThroughBones(ikChain, rigMesh.skeleton.bones[0].children[2], movingTarget[1]);

        ikChain = chains[2];
        this.addtoChainThroughBones(ikChain, rigMesh.skeleton.bones[0]);

        chains.forEach((chain) =>
        {
            console.log(chain);
            this.ik.add(chain);
        });

        let skeletonHelper = new THREE.SkeletonHelper( skeleton );
        skeletonHelper.material.linewidth = 3;
        scene.add( skeletonHelper );
    }


    addtoChainThroughBones(chain, bone, target = null)
    {
        let constraints =  this.constraints;
        let joint = new IKJoint(bone, {constraints});

        if(bone.children.length === 0)
        {
            chain.add(joint, {target});
        }

        if(bone.children.length !== 0)
        {
            chain.add(joint);
            this.addtoChainThroughBones(chain, bone.children[0]);
        }
    }
}
export default SelectiveIkObject;
