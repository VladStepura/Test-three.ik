import {IK, IKBallConstraint, IKChain, IKHelper, IKJoint} from "three-ik";
import * as THREE from "three";
import setZForward from "../utils/axisUtils";

class IkObject
{
    constructor()
    {

    }

    initObject(scene, movingTarget)
    {
        this.ik = new IK();
        let bones = [];
        let chain = new IKChain();
        let rigMesh = scene.children[0].children[1];
        let skeleton = null;
        this.rigMesh = rigMesh;
        scene.traverse((object) =>
        {
            if(object instanceof THREE.Bone)
            {
                bones.push(object);
                if(skeleton === null)
                {
                    let parent = object.parent;
                    while (parent instanceof THREE.Bone)
                    {
                        parent = parent.parent;
                    }
                    skeleton = parent;

                }
                if(this.isRightHandBone(object))
                {
                    let constraints = [new IKBallConstraint(90)];
                    if(object.name === "RightShoulder")
                    {
                        constraints = [new IKBallConstraint(90)];
                        setZForward(object);
                        rigMesh.bind(rigMesh.skeleton)
                    }
                    const target = object.name === "RightHand" ? movingTarget : null;
                    chain.add(new IKJoint(object, {constraints}), {target});
                }
            }
        });
        this.ik.add(chain);
        let skeletonHelper = new THREE.SkeletonHelper( skeleton );
        skeletonHelper.material.linewidth = 3;
        scene.add( skeletonHelper );

        const helper = new IKHelper(this.ik);
        scene.add(helper);
    }

    isRightHandBone(bone)
    {
        if(bone.name === "RightHand"||
            bone.name === "RightForeArm"||
            bone.name === "RightArm"||
            bone.name === "RightShoulder")
        {
            return true;
        }
    }
}
export default IkObject;
