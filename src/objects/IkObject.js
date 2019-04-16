import {IK, IKBallConstraint, IKChain, IKHelper, IKJoint} from "three-ik";
import * as THREE from "three";
import setZForward from "../utils/axisUtils";
import ChainObject from "./ChainObject";

class IkObject
{
    constructor()
    {

    }

    initObject(scene, movingTarget)
    {
        this.ik = new IK();
        let bones = [];
        let chains = [];
        let joints = {};
        let chain = new IKChain();
        let rigMesh = scene.children[0].children[1];
        console.log(rigMesh);
        let skeleton = null;
        this.rigMesh = rigMesh;
        let chainObjects = [];
      //  chainObjects.push(new ChainObject("Hips", "Head"));
        chainObjects.push(new ChainObject("RightShoulder", "RightHandThumb1", movingTarget, "Spine2"));
        chainObjects.push(new ChainObject("LeftShoulder", "LeftHandThumb1", movingTarget, "Spine2" ));
        chainObjects.push(new ChainObject("LeftUpLeg", "LeftToeBase", movingTarget, "Hips" ));
        chainObjects.push(new ChainObject("RightUpLeg", "RightToeBase", movingTarget, "Hips" ));

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

                chainObjects.forEach((chainObject) =>
                {
                    if(object.name == chainObject.baseObjectName || chainObject.isChainObjectStarted)
                    {
                        let chain = chainObject.chain;

                        let constraints = [new IKBallConstraint(120)];
                        if(object.name === chainObject.baseObjectName)
                        {
                            let rootName = chainObject.rootJointName;

                            if(rootName !== null && joints[rootName] !== undefined)
                            {
                                console.log(rootName);
                                chain.add(joints[rootName]);
                            }

                            console.log("Chain started");
                            chainObject.isChainObjectStarted = true;
                            chains.push(chain);
                            constraints = [new IKBallConstraint(90)];


                            setZForward(object);
                            rigMesh.bind(rigMesh.skeleton)
                        }
                        console.log("Chain element name = " + object.name);
                        let target =  null;
                        if(object.name === chainObject.lastObjectName)
                        {


                            target = chainObject.movingTarget;
                            console.log("Chain finished");
                            chainObject.isChainObjectStarted = false
                        }

                        let joint = new IKJoint(object, {constraints});

                        joints[object.name] = joint;
                        chain.add(joint, {target});
                    }
                });

            }
        });
     /*   for (let i = 1; i < chainObjects.length; i++)
        {
            chainObjects[0].chain.connect( chainObjects[i].chain);
        }*/
        chains.forEach((chain) =>
        {
            this.ik.add(chain);
        });


        let skeletonHelper = new THREE.SkeletonHelper( skeleton );
        skeletonHelper.material.linewidth = 3;
        scene.add( skeletonHelper );
    }

}
export default IkObject;
