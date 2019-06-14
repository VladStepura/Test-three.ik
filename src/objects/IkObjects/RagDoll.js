import IkObject from "./IkObject";
import * as THREE from "three";
import PoleConstraint from "../../contraints/PoleConstraint";
import PoleTarget from "../PoleTarget";
import CopyRotation from "../../contraints/CopyRotation";
import {Quaternion} from "three";
import {setZDirecion, setReverseZ, setZBack} from "../../utils/axisUtils";

class Ragdoll extends IkObject
{
    constructor()
    {
        super();
        this.poleConstraints = [];
        this.poleTargetOffsets = {};
        this.hipsMouseDown = false;
        this.vectorPos = 1;
    }

    initObject(scene, object, skinnedMesh, ...controlTarget )
    {
        super.initObject(scene, object, skinnedMesh, controlTarget );

        // Adds events to Back control
        this.applyEventsToBackControl(this.controlTargets[0].control);

        let backChain = this.ik.chains[0];
        let leftArmChain = this.ik.chains[1];
        let rightArmChain = this.ik.chains[2];
        let leftLegChain = this.ik.chains[3];
        let rightLegChain = this.ik.chains[4];

        let leftArmPoleTarget = this.initPoleTargets(leftArmChain, new THREE.Vector3(0, 0, -0.5), "leftArmPole");
        let leftLegPoleTarget = this.initPoleTargets(leftLegChain, new THREE.Vector3(0, 0.3, 0.8), "leftLegPole");

        let rightArmPoleTarget = this.initPoleTargets(rightArmChain, new THREE.Vector3(0, 0, -0.5), "rightArmPole");
        let rightLegPoleTarget = this.initPoleTargets(rightLegChain, new THREE.Vector3(0, 0.3, 0.8), "rightLegPole");

        let backPoleTarget =  this.initPoleTargets(backChain, new THREE.Vector3(0, 0, 0), "backPole");

        scene.add(leftArmPoleTarget.mesh);
        scene.add(leftLegPoleTarget.mesh);
        scene.add(rightArmPoleTarget.mesh);
        scene.add(rightLegPoleTarget.mesh);
        scene.add(backPoleTarget.mesh);

        this.addPoleConstraintToRootJoint(backChain, backPoleTarget);
        this.addPoleConstraintToRootJoint(leftArmChain, leftArmPoleTarget);
        this.addPoleConstraintToRootJoint(rightArmChain, rightArmPoleTarget);
        this.addPoleConstraintToRootJoint(leftLegChain, leftLegPoleTarget);
        this.addPoleConstraintToRootJoint(rightLegChain, rightLegPoleTarget);

        let copyRotation = new CopyRotation(backChain, backChain.joints[4]);
        copyRotation.influence = 50;
        backChain.joints[3].addIkConstraint(copyRotation);

        this.poleConstraints[0].poleAngle = 128;
        this.poleConstraints[0].chainLength = 6;
        this.poleConstraints[1].testing = true;
        this.resetTargets();
        this.addHipsEvent();
        this.setUpControlEvents();
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

    initPoleTargets(chain, offset, name)
    {
        let position = new THREE.Vector3();
        chain.joints[chain.joints.length - 2].bone.getWorldPosition(position);
        let poleTarget = new PoleTarget(new THREE.Vector3(position.x + offset.x, position.y + offset.y, position.z + offset.z));
        poleTarget.poleOffset = offset;
        poleTarget.name = name;
        poleTarget.mesh.visible = false;
        return poleTarget;
    }

    addPoleConstraintToRootJoint(chain, poleTarget)
    {
        let poleConstraint = new PoleConstraint(chain, poleTarget);
        chain.joints[0].addIkConstraint(poleConstraint);
        this.poleConstraints.push(poleConstraint);
    }

    // Adds events to hips
    // Mainly is for controlling poleTarget position so it will follow hips
    // With taking offset between them into account
    addHipsEvent()
    {
        let hipsControl = this.hipsControlTarget.control;
        let hipsTarget = this.hipsControlTarget.target;

        let backConstraint = this.poleConstraints[0].poleTarget.mesh.position;
        let leftArmConstraint = this.poleConstraints[1].poleTarget.mesh.position;
        let rightArmConstraint = this.poleConstraints[2].poleTarget.mesh.position;
        let leftLegConstraint = this.poleConstraints[3].poleTarget.mesh.position;
        let rightLegConstraint = this.poleConstraints[4].poleTarget.mesh.position;

        hipsControl.addEventListener("mouseDown", (event) =>
        {
            this.hipsMouseDown = true;

            this.poleTargetOffsets.back = backConstraint.clone().sub(hipsTarget.position);
            this.poleTargetOffsets.leftArm = leftArmConstraint.clone().sub(hipsTarget.position);
            this.poleTargetOffsets.rightArm = rightArmConstraint.clone().sub(hipsTarget.position);
            this.poleTargetOffsets.leftLeg = leftLegConstraint.clone().sub(hipsTarget.position);
            this.poleTargetOffsets.rightLeg = rightLegConstraint.clone().sub(hipsTarget.position);

        });
        hipsControl.addEventListener("change", (event) =>
        {
            if(this.hipsMouseDown)
            {
                let hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.back);
                backConstraint.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.leftArm);
                leftArmConstraint.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.rightArm);
                rightArmConstraint.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.leftLeg);
                leftLegConstraint.copy(hipsPosition);

                hipsPosition = hipsTarget.position.clone();
                hipsPosition.add(this.poleTargetOffsets.rightLeg);
                rightLegConstraint.copy(hipsPosition);

                this.originalObject.position.copy(this.clonedObject.position);
            }
        });
        hipsControl.addEventListener("dragging-changed", (event) =>
        {
            this.calculteBackOffset();
        });
        hipsControl.addEventListener("mouseUp", (event) =>
        {
            this.applyingOffset = false;
            this.hipsMouseDown = false;
        });
    }

    setUpControlEvents()
    {
        let chainObject = this.chainObjects;
        for (let i = 0; i < chainObject.length; i++)
        {
            let control = chainObject[i].controlTarget.control;
            control.addEventListener("mouseDown", (event) =>
            {
                console.log("Ik enabled");
                this.isEnabledIk = true;
            });

            control.addEventListener("mouseUp", (event) =>
            {
                console.log("Ik disabled");
                this.isEnabledIk = false;
            });
        }
    }

    update()
    {
        super.update();
        if(!this.isEnabledIk)
        {
            this.resetTargets();
        }
        else
        {
            this.applyChangesToOriginal();
        }
    }

    lateUpdate()
    {
        this.legsFollowTargetRotation();
        super.lateUpdate();
        this.applyHeadRotation();
    }

    // Follows moving target rotation which applied to feet
    // Default position is facing flat to Earth
    legsFollowTargetRotation()
    {
        // Makes right foot follow the rotation of target
        let rightFootBone = this.ik.chains[4].joints[2].bone;
        let rightLegChainTarget = this.chainObjects[4].controlTarget.target;
        rightFootBone.rotation.copy(rightLegChainTarget.rotation);
        this.rotateBoneQuaternion(rightFootBone, new THREE.Euler(1.5, 0, 0));
        // Makes left foot follow the rotation of target
        let leftFootBone = this.ik.chains[3].joints[2].bone;
        let leftLegChainTarget = this.chainObjects[3].controlTarget.target;
        leftFootBone.rotation.copy(leftLegChainTarget.rotation);
        this.rotateBoneQuaternion(leftFootBone, new THREE.Euler(1.5, 0, 0));
    }

     // Sets and quaternion angle for bones
    // Give the result of bone always faces direction set by euler
    // Effect like flat foot to earth can be achieved
    rotateBoneQuaternion(bone, euler)
    {
        let quaternion = new THREE.Quaternion();
        bone.getWorldQuaternion(quaternion);
        quaternion.inverse();
        let angle = new THREE.Quaternion().setFromEuler(euler);
        quaternion.multiply(angle);
        bone.quaternion.copy(quaternion);
    }

    reinitialize()
    {
        let chainObjects = this.chainObjects;

        this.clonedObject.scale.copy(this.originalObject.scale);
        this.clonedObject.position.copy(this.originalObject.position);
        this.clonedObject.updateMatrixWorld(true);
        for(let i = 0; i < chainObjects.length; i++)
        {
            let chain = chainObjects[i].chain;
            let poleConstraints = this.poleConstraints[i];

            chain.joints[chain.joints.length - 1].bone.getWorldPosition(chainObjects[i].controlTarget.target.position);

            let targetPosition = new THREE.Vector3();
            chain.joints[chain.joints.length - 2].bone.getWorldPosition(targetPosition);
            let polePosition = poleConstraints.poleTarget.mesh.position;
            poleConstraints.poleTarget.mesh.position.set(targetPosition.x + polePosition.x, targetPosition.y + polePosition.y, targetPosition.z + polePosition.z);
            chain.reinitializeJoints();
            // Clean this
            if(chain.joints[0].bone.name === "LeftArm")
            {
                console.log(chain.joints[0].bone.quaternion.clone());
                let firstBoneWorld = new THREE.Vector3();
                let secondBoneWorld = new THREE.Vector3();
                chain.joints[0].bone.getWorldPosition(firstBoneWorld);

                chain.joints[1].bone.getWorldPosition(secondBoneWorld);

                console.log(firstBoneWorld)
                console.log(secondBoneWorld)
                let direction = new THREE.Vector3().subVectors(secondBoneWorld, firstBoneWorld).normalize();
                console.log(direction);
            }
            // Clean this
        }
        console.log(this.originalObject);
        console.log(this.clonedObject);
        this.hips.getWorldPosition(this.hipsControlTarget.target.position);
        this.calculteBackOffset();
        this.recalculateDifference();
    }

    // Resets targets position
    // After ik has been turned off and on resets
    // pole position with consideration of offset
    resetTargets()
    {
        super.resetTargets();
        let chainObjects = this.chainObjects;
        for(let i = 0; i < chainObjects.length; i++)
        {
            let constraint = this.poleConstraints[i];
            let chain = this.chainObjects[i].chain;
            let targetPosition = new THREE.Vector3();
            chain.joints[chain.joints.length - 2].bone.getWorldPosition(targetPosition);
            let poleOffset = constraint.poleTarget.poleOffset;
            constraint.poleTarget.mesh.position.set(targetPosition.x + poleOffset.x, targetPosition.y + poleOffset.y, targetPosition.z + poleOffset.z);
        }

    }

    // Applies neck rotation and applies head rotation that head stay upward
    applyHeadRotation()
    {
        let head = this.chainObjects[0].chain.joints[4].bone;
        this.rotateBoneQuaternion(head, new THREE.Euler(-1, 0, 0));
    }

    removeFromScene(scene)
    {
        super.removeFromScene(scene);
        this.poleConstraints.forEach((constraint)=>
        {
            scene.remove(constraint.poleTarget.mesh);
        });
    }

    selectedSkeleton(selected)
    {
        let visible = selected;
        let chainObjects = this.chainObjects;
        for (let i = 0; i < chainObjects.length; i++)
        {
            let chain = chainObjects[i];
            chain.controlTarget.disable(!visible);
        }
        this.hipsControlTarget.disable(!visible);
        this.skeletonHelper.visible = visible;
    }

    applyChangesToOriginal()
    {
        let clonedSkin = this.clonedObject.children[1];
        let originalSkin = this.originalObject.children[1];
        let clonedBones = clonedSkin.skeleton.bones;
        let originalBones = originalSkin.skeleton.bones;

        let originalHips = originalBones[0];
        let clonedHips = clonedBones[0];
        let matrix = originalHips.matrixWorld.clone();
        let inverseMatrix = new THREE.Matrix4().getInverse(matrix);

        let transformationMatrix = new THREE.Matrix4();
        let cloneMatrix = new THREE.Matrix4();
        let originalMatrix = new THREE.Matrix4();
        let cloneMatrixInverse = new THREE.Matrix4();
        let originalMatrixInverse = new THREE.Matrix4();
        let inverseTransformation = new THREE.Matrix4();
        let rootCloneObject = null;
        let rootOriginalObject = null;

       /* console.log("Original bones", originalBones);
        console.log("Clone bones", clonedBones);*/
        let chainObjects = this.chainObjects;
        for (let i = 1; i < clonedBones.length; i++)
        {
            let cloneBone = clonedBones[i];
            let originalBone = originalBones[i];
            let prevRotation =  this.prevRotation[originalBone.name];
            if(!this.ikBonesName.some((boneName) => originalBone.name === boneName || boneName === "Hips"))
            {
                continue;
            }
            let difference = this.originalRotationDiffrenceOfBones[i];
            let current = new THREE.Euler(  cloneBone.rotation.x - originalBone.rotation.x,
                                            cloneBone.rotation.y - originalBone.rotation.y,
                                            cloneBone.rotation.z - originalBone.rotation.z)

            let newAngle = new THREE.Euler( difference.x - current.x,
                                            difference.y - current.y,
                                            difference.z - current.z);

            let newOrigin = new THREE.Euler(originalBone.rotation.x - newAngle.x,
                                            originalBone.rotation.y - newAngle.y,
                                            originalBone.rotation.z - newAngle.z)
            this.basisSwitchin(originalBone, cloneBone);
           if(this.chainContainsBone(chainObjects[0].chain, originalBone))
           {



               let joints = chainObjects[0].chain.joints;
               if(originalBone.name === joints[0].bone.name)
               {
                   cloneMatrix = this.cloneObjectMatrix[originalBone.name];
                   originalMatrix = this.originalObjectMatrix[originalBone.name];
                   cloneMatrixInverse = new THREE.Matrix4().getInverse(cloneMatrix);
                   originalMatrixInverse = new THREE.Matrix4().getInverse(originalMatrix);
                   transformationMatrix = new THREE.Matrix4();
                   transformationMatrix.multiply(originalMatrix.clone());
                   transformationMatrix.multiply(cloneMatrixInverse.clone());

                   inverseTransformation.getInverse(transformationMatrix.clone());

                   rootCloneObject = cloneBone;
                   rootOriginalObject = originalBone;
                   rootCloneObject.applyMatrix(transformationMatrix);
                   //originalBone.rotation.copy(cloneBone.rotation);
                   chainObjects[0].updateMatrix();
               }
               else
               {
                  // originalBone.rotation.copy(cloneBone.rotation);
               }
               if(originalBone.name === joints[joints.length-1].bone.name)
               {
                   rootCloneObject.applyMatrix(inverseTransformation);
                   chainObjects[0].updateMatrix();
               }
           }
           else if(this.chainContainsBone(chainObjects[3].chain, originalBone) ||
               this.chainContainsBone(chainObjects[4].chain, originalBone) )
           {
               if(originalBone.name === "LeftUpLeg" || originalBone.name === "RightUpLeg")
               {
                   cloneMatrix = this.cloneObjectMatrix[originalBone.name];
                   originalMatrix = this.originalObjectMatrix[originalBone.name];
                   cloneMatrixInverse = new THREE.Matrix4().getInverse(cloneMatrix);
                   originalMatrixInverse = new THREE.Matrix4().getInverse(originalMatrix);
                   transformationMatrix = new THREE.Matrix4();
                   transformationMatrix.multiply(originalMatrix);
                   transformationMatrix.multiply(cloneMatrixInverse);

                   inverseTransformation.getInverse(transformationMatrix);

                   rootCloneObject = cloneBone;
                   rootOriginalObject = originalBone;
                   //rootCloneObject.applyMatrix(transformationMatrix);
                   chainObjects[3].updateMatrix();
                   chainObjects[4].updateMatrix();
               }

               //originalBone.rotation.set(cloneBone.rotation.x, cloneBone.rotation.y, cloneBone.rotation.z);
               if(originalBone.name === "LeftFoot" || originalBone.name === "RightFoot")
               {
                  // rootCloneObject.applyMatrix(inverseTransformation);
                   chainObjects[3].updateMatrix();
                   chainObjects[4].updateMatrix();
               }
           }
           else if(this.chainContainsBone(chainObjects[1].chain, originalBone) ||
               this.chainContainsBone(chainObjects[2].chain, originalBone))
           {
               if(this.chainContainsBone(chainObjects[1].chain, originalBone)/*originalBone.name === "LeftArm" */)
               {
                   //this.basisSwitchin(originalBone, cloneBone);
                   this.originalObjectMatrix[originalBone.name] = originalBone.matrix.clone();
                   this.cloneObjectMatrix[cloneBone.name] = cloneBone.matrix.clone();
               }

               let joints = chainObjects[0].chain.joints;
               if(originalBone.name === "LeftArm" || originalBone.name === "RightArm")
               {
                   cloneMatrix = this.cloneObjectMatrix[originalBone.name];
                   originalMatrix = this.originalObjectMatrix[originalBone.name];
                   cloneMatrixInverse = new THREE.Matrix4().getInverse(cloneMatrix);
                   originalMatrixInverse = new THREE.Matrix4().getInverse(originalMatrix);
                   transformationMatrix = new THREE.Matrix4();
                   transformationMatrix.multiply(cloneMatrix);
                   transformationMatrix.multiply(originalMatrixInverse);

                   inverseTransformation.getInverse(transformationMatrix.clone());

                   rootCloneObject = cloneBone;
                   rootOriginalObject = originalBone;
                   //rootOriginalObject.applyMatrix(transformationMatrix);
                   rootOriginalObject.updateWorldMatrix(false, true);
                   chainObjects[1].updateMatrixExceptRoot();
                   chainObjects[2].updateMatrixExceptRoot();
               }
               if(originalBone.name === "LeftArm" )
               {
                   console.log("Original bone" + originalBone.name + " rotation ", originalBone.rotation.clone());
                   console.log("Clone bone " + originalBone.name + " rotation ", cloneBone.rotation.clone());

               }
               //originalBone.position.set(cloneBone.position.x, cloneBone.position.z, cloneBone.position.y);
               //originalBone.rotation.set(cloneBone.rotation.x, cloneBone.rotation.y, cloneBone.rotation.z);
               if(originalBone.name === "LeftHand" || originalBone.name === "RightHand")
               {
                   //rootOriginalObject.applyMatrix(inverseTransformation);
                   chainObjects[1].updateMatrixExceptRoot();
                   chainObjects[2].updateMatrixExceptRoot();
                   rootOriginalObject.updateWorldMatrix(false, true);
               }
           }

        }
        this.recalculateDifference();
        //this.cloneObjectMatrix[originalBones[10].name] = clonedBones[10].matrix.clone();
    }

    applyChangesToIK()
    {
        this.isEnabledIk = false;
        let clonedSkin = this.clonedObject.children[1];
        let originalSkin = this.originalObject.children[1];
        let clonedBones = clonedSkin.skeleton.bones;
        let originalBones = originalSkin.skeleton.bones;
        let chainObjects = this.chainObjects;

        let originalHips = originalBones[0];
        let clonedHips = clonedBones[0];
        let matrix = originalHips.matrixWorld.clone();
        let inverseMatrix = new THREE.Matrix4().getInverse(matrix);

        let transformationMatrix = new THREE.Matrix4();
        let cloneMatrix     = new THREE.Matrix4();
        let originalMatrix  = new THREE.Matrix4();
        let cloneMatrixInverse     = new THREE.Matrix4();
        let originalMatrixInverse  = new THREE.Matrix4();
        //transformationMatrix.multiply(cloneMatrix.clone());
        //transformationMatrix.multiply(originalMatrixInverse.clone());
        let inverseTransformation = new THREE.Matrix4();
        let rootCloneObject = null;
        //console.log("object in clone space", cloneObject.clone());
        let rootOriginalObject = null;

        for (let i = 0; i < clonedBones.length; i++)
        {
            let cloneBone = clonedBones[i];
            let originalBone = originalBones[i];
            let prevRotation =  this.prevRotation[originalBone.name];
            if(!this.ikBonesName.some((boneName) => originalBone.name === boneName || boneName === "Hips"))
            {
                continue;
            }
            let differenceRotation = this.originalRotationDiffrenceOfBones[i];

            let current = new THREE.Euler(cloneBone.rotation.x - originalBone.rotation.x,
                                          cloneBone.rotation.y - originalBone.rotation.y,
                                          cloneBone.rotation.z - originalBone.rotation.z)
            let newAngle = new THREE.Euler(differenceRotation.x - current.x,
                                           differenceRotation.y - current.y,
                                           differenceRotation.z - current.z);
            let newClone = new THREE.Euler(cloneBone.rotation.x + newAngle.x,
                                           cloneBone.rotation.y + newAngle.y,
                                           cloneBone.rotation.z + newAngle.z);

           /* if(this.chainContainsBone(chainObjects[0].chain, originalBone))
            {
                let joints = chainObjects[0].chain.joints;
                if(originalBone.name === joints[0].bone.name)
                {
                    cloneMatrix = cloneBone.matrix;
                    originalMatrix = originalBone.matrix;
                    cloneMatrixInverse = new THREE.Matrix4().getInverse(cloneMatrix);
                    originalMatrixInverse = new THREE.Matrix4().getInverse(originalMatrix);
                    transformationMatrix = new THREE.Matrix4();
                    transformationMatrix.multiply(originalMatrix.clone());
                    transformationMatrix.multiply(cloneMatrixInverse.clone());

                    inverseTransformation.getInverse(transformationMatrix.clone());

                    rootCloneObject = cloneBone;
                    rootOriginalObject = originalBone;
                    rootCloneObject.applyMatrix(transformationMatrix);
                    rootCloneObject.updateWorldMatrix(false, true);
                }
                originalBone.rotation.copy(cloneBone.rotation);
                if(originalBone.name === joints[joints.length-1].bone.name)
                {
                    rootCloneObject.applyMatrix(inverseTransformation);
                    rootCloneObject.updateWorldMatrix(false, true);
                }
            }
            else if(this.chainContainsBone(chainObjects[3].chain, originalBone) ||
                this.chainContainsBone(chainObjects[4].chain, originalBone) )
            {
                //let yRotation = prevRotation === undefined ? newOrigin.y : prevRotation.rotation.y;
                //originalBone.rotation.set(newOrigin.x, newOrigin.y, newOrigin.z);

                if(originalBone.name === "LeftUpLeg" || originalBone.name === "RightUpLeg")
                {
                    cloneMatrix = cloneBone.matrix.clone();
                    originalMatrix = originalBone.matrix.clone();
                    cloneMatrixInverse = new THREE.Matrix4().getInverse(cloneMatrix);
                    originalMatrixInverse = new THREE.Matrix4().getInverse(originalMatrix);
                    transformationMatrix = new THREE.Matrix4();
                    transformationMatrix.multiply(originalMatrix);
                    transformationMatrix.multiply(cloneMatrixInverse);

                    inverseTransformation.getInverse(transformationMatrix.clone());

                    rootCloneObject = cloneBone;
                    rootOriginalObject = originalBone;
                    rootCloneObject.applyMatrix(transformationMatrix);
                    //console.log("Translated object from original space", rootCloneObject.clone());
                    rootCloneObject.updateWorldMatrix(false, true);
                    //console.log("Translated object from original space", rootCloneObject.clone());
                }
                originalBone.rotation.set(cloneBone.rotation.x, cloneBone.rotation.y, cloneBone.rotation.z);
                if(originalBone.name === "LeftFoot" || originalBone.name === "RightFoot")
                {
                    //originalBone.rotation.set(cloneBone.rotation.x, cloneBone.rotation.y, cloneBone.rotation.z);
                    rootCloneObject.applyMatrix(inverseTransformation);
                    //console.log("Inversed object to original space", rootOriginalObject.clone());
                    rootCloneObject.updateWorldMatrix(false, true);
                }
            }
            else if(this.chainContainsBone(chainObjects[1].chain, originalBone) ||
                this.chainContainsBone(chainObjects[2].chain, originalBone))
            {
                if(originalBone.name === "LeftArm" )
                {
                    //this.basisSwitchin(originalBone, cloneBone);
                }

                let joints = chainObjects[0].chain.joints;
                if(originalBone.name === "LeftArm" || originalBone.name === "RightArm")
                {
                    cloneMatrix = cloneBone.matrix.clone();
                    originalMatrix = originalBone.matrix.clone();
                    cloneMatrixInverse = new THREE.Matrix4().getInverse(cloneMatrix);
                    originalMatrixInverse = new THREE.Matrix4().getInverse(originalMatrix);
                    transformationMatrix = new THREE.Matrix4();
                    transformationMatrix.multiply(originalMatrix);
                    transformationMatrix.multiply(cloneMatrixInverse);

                    inverseTransformation.getInverse(transformationMatrix.clone());

                    rootCloneObject = cloneBone;
                    rootOriginalObject = originalBone;
                    rootCloneObject.applyMatrix(transformationMatrix);
                    //console.log("Translated object from original space", rootCloneObject.clone());
                    rootCloneObject.updateWorldMatrix(false, true);
                    //console.log("Translated object from original space", rootCloneObject.clone());
                }
                originalBone.rotation.set(cloneBone.rotation.x, cloneBone.rotation.y, cloneBone.rotation.z);
                if(originalBone.name === "LeftHand" || originalBone.name === "RightHand")
                {
                    //originalBone.rotation.set(cloneBone.rotation.x, cloneBone.rotation.y, cloneBone.rotation.z);
                    rootCloneObject.applyMatrix(inverseTransformation);
                    //console.log("Inversed object to original space", rootOriginalObject.clone());
                    rootCloneObject.updateWorldMatrix(false, true);
                }
            }*/
        }
    }

    moveRagdoll()
    {
        this.clonedObject.position.copy(this.originalObject.position);
        this.clonedObject.updateMatrixWorld(true, true);
    }

    chainContainsBone(chain, bone)
    {
        if(chain.joints.some((joint) => joint.bone.name === bone.name  ))
        {
            return true;
        }
        return false;
    }

    createMatrixFromBasis(matrix)
    {
        let x = new THREE.Vector3();
        let y = new THREE.Quaternion();
        let z = new THREE.Vector3();
        let newMatrix = new THREE.Matrix4();
        matrix.decompose(x, y, z);
        console.log("Position", x);
        console.log("Rotation", y);
        console.log("Scale", z);
        newMatrix.setPosition(x);
        return newMatrix;
    }

    basisSwitchin(originalBone, cloneBone)
    {
        console.log("Switching basis of ", originalBone.name );
        let basicMatrix = this.createBasicMatrix();
        let basicMatrixInverse = new THREE.Matrix4().getInverse(basicMatrix);
        let tMatrixFromOriginToClone = new THREE.Matrix4();
        let tMatrixFromCloneToOrigin = new THREE.Matrix4();
        let cloneMatrix     = new THREE.Matrix4();
        let originalMatrix  = new THREE.Matrix4();
        let basixMatrixInverse  = new THREE.Matrix4();
        let cloneMatrixInverse     = new THREE.Matrix4();
        let originalMatrixInverse  = new THREE.Matrix4();
        //transformationMatrix.multiply(cloneMatrix.clone());
        //transformationMatrix.multiply(originalMatrixInverse.clone());
        let inverseTransformationOrigin = new THREE.Matrix4();
        let inverseTransformationClone = new THREE.Matrix4();
        let rootCloneObject = null;
        //console.log("object in clone space", cloneObject.clone());
        let rootOriginalObject = null;
        let vector = new THREE.Vector3(this.vectorPos,0 ,0 );
        let vectorOrigin = new THREE.Vector3(this.vectorPos,0 ,0 );

        cloneBone.updateMatrix();
        originalBone.updateMatrix();
        cloneMatrix = cloneBone.matrix
        originalMatrix = originalBone.matrix;
        cloneBone.updateMatrixWorld(true);
        originalBone.updateMatrixWorld(true);
        let worldCloneMatrix = cloneBone.matrixWorld.clone();
        let worldOriginalMatrix = originalBone.matrixWorld.clone();

        let inverseWorldOriginalMatrix = new THREE.Matrix4().getInverse(worldOriginalMatrix);
        let inverseWorldCloneMatrix = new THREE.Matrix4().getInverse(worldCloneMatrix);

        vector.applyMatrix4(cloneMatrix);
        vectorOrigin.applyMatrix4(originalMatrix);
        cloneMatrixInverse = new THREE.Matrix4().getInverse(cloneMatrix);
        originalMatrixInverse = new THREE.Matrix4().getInverse(originalMatrix);



        let clonePrevMatrix = this.cloneObjectMatrix[cloneBone.name].clone();
        let cloneCurrentMatrix = cloneBone.matrix.clone();
        let cloneInversePrevMatrix = new THREE.Matrix4().getInverse(clonePrevMatrix);
        let cloneInverseCurrentMatrix = new THREE.Matrix4().getInverse(cloneCurrentMatrix);

        let tMatrixPrevClone = new THREE.Matrix4();
        let tMatrixCurrentClone = new THREE.Matrix4();

        tMatrixPrevClone.multiply(originalMatrix);
        tMatrixPrevClone.multiply(cloneInversePrevMatrix);

        tMatrixCurrentClone.multiply(originalMatrix);
        tMatrixCurrentClone.multiply(cloneInverseCurrentMatrix);

        let inverseTMatrixPreClone = new THREE.Matrix4().getInverse(tMatrixPrevClone);

        //transformationMatrix.multiply(originalMatrix);
        tMatrixFromOriginToClone.multiply(cloneMatrix);
        tMatrixFromOriginToClone.multiply(originalMatrixInverse.clone());
        tMatrixFromCloneToOrigin.multiply(originalMatrix);
        tMatrixFromCloneToOrigin.multiply(cloneMatrixInverse.clone());
        //transformationMatrix.multiplyMatrices(originalMatrix, cloneMatrix);
        //transformationMatrix.multiplyMatrices(transformationMatrix.clone(), cloneMatrixInverse);
        inverseTransformationOrigin.getInverse(tMatrixFromOriginToClone);
        inverseTransformationClone.getInverse(tMatrixFromCloneToOrigin);

        //console.log("Matrices before change");
        //console.log("Prev Clone");
       // this.showMatrixComponents(clonePrevMatrix);
        //console.log("Current Clone");
        //this.showMatrixComponents(cloneCurrentMatrix);
        //console.log("Clone");
        //console.log(cloneBone);
        //console.log("Original");
        //console.log(originalBone);

        clonePrevMatrix.premultiply(tMatrixPrevClone);
        cloneCurrentMatrix.premultiply(tMatrixPrevClone);
        //console.log("Before");
        //this.showMatrixComponents(tMatrixPrevClone);
        //this.showMatrixComponents(tMatrixPrevClone);
        //cloneCurrentMatrix.premultiply(inverseTMatrixPreClone);
        //cloneCurrentMatrix.premultiply(tMatrixCurrentClone);
        //console.log("After");
        //this.showMatrixComponents(cloneCurrentMatrix);
        this.setObjectFromMatrixElements(cloneCurrentMatrix, originalBone);
        //console.log("Original", originalBone.clone());
        //console.log("Matrices after change");
        //console.log("Prev Clone");

        //console.log("Current Clone");
        //this.showMatrixComponents(cloneCurrentMatrix);
        //let transformMatrixBasisToOrigin = new THREE.Matrix4();

        rootCloneObject = cloneBone;
        rootOriginalObject = originalBone;
        //console.log("RootClone", rootCloneObject.clone());
        //console.log("RootOriginal", rootOriginalObject.clone());
        ////rootCloneObject.matrix.copy(new THREE.Matrix4());
        //console.log("Start Vector clone", vector.clone());
        //console.log("Start Vector Origin", vectorOrigin.clone());
////
        //vectorOrigin.applyMatrix4(tMatrixFromOriginToClone);
        //vector.applyMatrix4(tMatrixFromCloneToOrigin);
        //console.log("Basis Vector clone in origin space", vector.clone());
        //console.log("Basis Vector Origin in clone space", vectorOrigin.clone());
        ////let temp = vector.clone()
        ////vector.copy(vectorOrigin);
        ////vectorOrigin.copy(temp);
        //console.log("Changed Vector clone", vector.clone());
        //console.log("Changed Vector Origin", vectorOrigin.clone());
//
        //vectorOrigin.applyMatrix4(inverseTransformationOrigin);
        //vector.applyMatrix4(tMatrixFromCloneToOrigin);
        //console.log("Origin Vector clone", vector.clone());
        //console.log("Clone Vector Origin", vectorOrigin.clone());

        //console.log("Origin object", rootOriginalObject.clone());
        //console.log("Clone object", rootCloneObject.clone());
        //rootOriginalObject.applyMatrix(worldOriginalMatrix);
        //rootCloneObject.applyMatrix(worldCloneMatrix);
        //rootCloneObject.applyMatrix(tMatrixFromCloneToOrigin);
        //rootOriginalObject.updateMatrixWorld(true);
        //rootCloneObject.updateMatrix();
        //rootOriginalObject.updateMatrix();

        //console.log("Changed Origin object", rootOriginalObject.clone());
        //console.log("Changed Clone  object", rootCloneObject.clone());
        //rootOriginalObject.children[0].applyMatrix(tMatrixFromOriginToClone);
        //console.log("Parent transform Origin forearm object", rootOriginalObject.children[0].clone());
        //rootOriginalObject.children[0].applyMatrix(inverseTransformationOrigin);
        ////rootCloneObject.position.applyMatrix4(transformationMatrix)
        //rootCloneObject.matrix.premultiply(originalMatrix);
        //rootCloneObject.matrix.premultiply(cloneMatrixInverse);
        //rootCloneObject.matrix.decompose(rootCloneObject.position, rootCloneObject.quaternion, rootCloneObject.scale);
        //rootCloneObject.applyMatrix(originalMatrix);
        //rootCloneObject.applyMatrix(cloneMatrixInverse);

        //
        //rootOriginalObject.updateMatrix();

        //rootOriginalObject.applyMatrix(originalMatrixInverse);


        //originalBone.rotation.set(cloneBone.rotation.x, cloneBone.rotation.y, cloneBone.rotation.z);
        ////originalBone.position.set(cloneBone.position.x, cloneBone.position.y, cloneBone.position.z);
        //originalBone.updateMatrix();
       //console.log("Translated Original object to basis space", rootOriginalObject.clone());
       //console.log("Translated clone object to basis space", rootCloneObject.clone());
       //////rootCloneObject.updateWorldMatrix(false, true);
       ////console.log("Updated", rootOriginalObject.clone());

       //rootOriginalObject.matrix.copy(rootCloneObject.matrix);//
       //console.log("Copied clone object to original space", rootCloneObject.clone());
       //console.log("Copied original object to original space", rootOriginalObject.clone());
       ////rootOriginalObject.position.copy(rootCloneObject.position);
       ////rootOriginalObject.rotation.copy(rootCloneObject.rotation);
       ////originalBone.rotation.copy(cloneBone.rotation.clone());
       ////rootOriginalObject.updateMatrix();
       ////rootOriginalObject.updateMatrixWorld(true);
       ////rootOriginalObject.updateWorldMatrix(false, true);
       //let result = rootCloneObject.matrix.clone().premultiply(inverseTransformationOrigin);
       //let resulto = rootOriginalObject.matrix.clone().premultiply(inverseTransformationClone);
        //rootOriginalObject.applyMatrix(inverseWorldOriginalMatrix);
//
        //rootCloneObject.applyMatrix(inverseWorldCloneMatrix);
      //// rootCloneObject.applyMatrix(inverseTransformationClone);
        ////ootOriginalObject.updateWorldMatrix(false, true);
        //rootOriginalObject.updateMatrix();
        //rootCloneObject.updateMatrix();
        //rootOriginalObject.updateMatrixWorld(true);
        //rootCloneObject.updateMatrixWorld(true);
        //console.log("Reversed Origin object", rootOriginalObject.clone());
        //console.log("Reversed Clone object", rootCloneObject.clone());
       ////rootCloneObject.position.applyMatrix4(inverseTransformation);

       //console.log("Inversed original object to clone space", rootOriginalObject.clone());
       //console.log("Inversed clone object to original space", rootCloneObject.clone());
       //console.log("clone result", result);
       //console.log("origin result", resulto);
        ////rootCloneObject.updateWorldMatrix(false, true);
        //console.log("Finished Switching basis");
    }

    createBasicMatrix()
    {
        let x = new THREE.Vector3(1,0,0);
        let y = new THREE.Vector3(0,1,0);
        let z = new THREE.Vector3(0,0,1);
        let matrix = new THREE.Matrix4();
        matrix.makeBasis(x, y, z);
        return matrix;
    }

    showMatrixComponents(matrix)
    {
        let position = new THREE.Vector3();
        let rotation = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        matrix.decompose(position, rotation, scale);
        console.log("Position ", position);
        console.log("Rotation ", rotation);
        //console.log("Scale ", scale);

    }

    setObjectFromMatrixElements(matrix, object)
    {
        let position = new THREE.Vector3();
        let rotation = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        matrix.decompose(position, rotation, scale);
        let quatVec1 = object.quaternion.toAngleAxis();
        let euler = new THREE.Euler().setFromQuaternion(rotation);
        console.log(euler);
        object.rotation.set(euler.x, euler.y, euler.z);
        let quatVec2 = rotation.toAngleAxis();
        console.log(object.rotation);
        let axis = quatVec1.axis.sub(quatVec2.axis);
        let angle = quatVec1.angle - quatVec2.angle;

       // console.log("axis", axis);
       // console.log("Angle", angle);
        //object.rotateOnAxis(axis, angle)
        //object.position.copy(position);
        //object.quaternion.copy(rotation);
        //object.scale.copy(scale);
        object.updateMatrix();
    }


}
export default Ragdoll;
