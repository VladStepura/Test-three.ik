import {IK, IKBallConstraint, IKChain, IKHelper, IKHingeConstraint, IKJoint} from "../core/three-ik";
import * as THREE from "three";
import setZForward from "../utils/axisUtils";
import ChainObject from "./ChainObject";

class IkObject
{
    constructor()
    {

    }

    initObject(scene, ...movingTarget)
    {
        this.ik = new IK();
        let bones = [];
        let chains = [];
        let joints = {};
        let chain = new IKChain();
        let rigMesh = scene.children[0].children[1];
        console.log(scene.children[0].children[1]);
        let skeleton = null;
        this.rigMesh = rigMesh;
        let chainObjects = [];
        chainObjects.push(new ChainObject("Hips", "Head"));
        chainObjects[0].defaultConstraint = [new IKBallConstraint(0)];
        chainObjects.push(new ChainObject("RightShoulder", "RightHandThumb1", movingTarget[0], "Spine2"));
        chainObjects.push(new ChainObject("LeftShoulder", "LeftHandThumb1", movingTarget[1], "Spine2" ));
        for(let i = 1; i < 3; i++)
        {
            chainObjects[i].setConstraints([new IKHingeConstraint(90)],
                [new IKHingeConstraint(180)],
                [new IKHingeConstraint(180)],
                [new IKHingeConstraint(180)],
                [new IKBallConstraint(90)]);
        }
        chainObjects.push(new ChainObject("LeftUpLeg", "LeftToeBase", movingTarget[2], "Hips"));
        chainObjects.push(new ChainObject("RightUpLeg", "RightToeBase", movingTarget[3], "Hips"));
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

                let hipsOld;
                if(object.name === "Hips")
                {
                    console.log("Hips position: ");
                    console.log(object);
                    setZForward(object);
                    rigMesh.bind(rigMesh.skeleton);
                }
                object.updateMatrixWorld();
                chainObjects.forEach((chainObject) =>
                {
                    if(object.name == chainObject.baseObjectName || chainObject.isChainObjectStarted)
                    {
                        console.log(object.name);
                        let chain = chainObject.chain;

                        let constraints = chainObject.getCurrentConstraint();
                        if(object.name === chainObject.baseObjectName)
                        {
                            let rootName = chainObject.rootJointName;

                            if(rootName !== null && joints[rootName] !== undefined)
                            {
                                console.log(rootName);
                                let baseRoot = joints[rootName];

                                let joint = baseRoot/// new IKJoint(baseRoot.bone, baseRoot.constraints);

                                if(object.name === "RightUpLeg")
                                {
                                    joint._direction = new THREE.Vector3(.0, -1, .0);
                                    joint.distance += 0.097;
                                }
                                chain.add(joint);
                            }

                            chainObject.isChainObjectStarted = true;
                            chains.push(chain);
                            //constraints = [new IKHingeConstraint(120)];

                            console.log(chains);

                        }
                        let target =  null;
                        if(object.name === chainObject.lastObjectName)
                        {
                            target = chainObject.movingTarget;
                            chainObject.isChainObjectStarted = false
                        }
                        let joint = new IKJoint(object, {constraints});


                        joints[object.name] = joint;
                        chain.add(joint, {target});
                        chainObject.currentJoint++;
                        if(object.name === "Hips")
                        {

                            console.log("Hips position: ");
                            console.log(object);
                          //  object.position.y = hipsOldPosition.y;
                        }
                    }
                });

            }
        });
        //for (let i = 1; i < chainObjects.length; i++)
        //{
        //    chainObjects[0].chain.connect( chainObjects[i].chain);
        //}
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
