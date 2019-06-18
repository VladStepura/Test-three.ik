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
        //this.recalculateDifference();
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
           //if(!this.ikBonesName.some((boneName) => originalBone.name === boneName || boneName === "Hips"))
           //{
           //    continue;
           //}
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
            if(chainObjects[0].chain.joints.some(joint => joint.bone.name === cloneBone.name))
                //cloneBone.name === "LeftUpLeg" ||// cloneBone.name === "RightUpLeg" ||
               // cloneBone.name === "LeftArm" ) // || cloneBone.name === "RightArm" ||
                 //cloneBone.name === "Spine" )
            {
                this.basisSwitchin(originalBone, cloneBone);
           //
            }
            //this.basisSwitchin(originalBone, cloneBone);
        }
        this.recalculateDifference();
        this.initializeAxisAngle();
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

    basisSwitchin(originalBone, cloneBone) {
        //console.log("Switching basis of ", originalBone.name );
        let basicMatrix = this.createBasicMatrix();
        let basicMatrixInverse = new THREE.Matrix4().getInverse(basicMatrix);
        let tMatrixFromOriginToClone = new THREE.Matrix4();
        let tMatrixFromCloneToOrigin = new THREE.Matrix4();
        let cloneMatrix = new THREE.Matrix4();
        let originalPrevMatrix = new THREE.Matrix4();
        let originalCurrentMatrix = new THREE.Matrix4();
        let basixMatrixInverse = new THREE.Matrix4();
        let cloneMatrixInverse = new THREE.Matrix4();
        let originalMatrixInverse = new THREE.Matrix4();
        //transformationMatrix.multiply(cloneMatrix.clone());
        //transformationMatrix.multiply(originalMatrixInverse.clone());
        let inverseTransformationOrigin = new THREE.Matrix4();
        let inverseTransformationClone = new THREE.Matrix4();
        let rootCloneObject = null;
        //console.log("object in clone space", cloneObject.clone());
        let rootOriginalObject = null;
        let vector = new THREE.Vector3(this.vectorPos, 0, 0);
        let vectorOrigin = new THREE.Vector3(this.vectorPos, 0, 0);

        cloneBone.updateMatrix();
        originalBone.updateMatrix();
        cloneMatrix = cloneBone.matrix.clone();
        originalPrevMatrix = this.originalObjectMatrix[originalBone.name].clone()
        originalCurrentMatrix = originalBone.matrix.clone();
        cloneBone.updateMatrixWorld(true);
        originalBone.updateMatrixWorld(true);
        let worldCloneMatrix = cloneBone.matrixWorld.clone();
        let worldOriginalMatrix = originalBone.matrixWorld.clone();

        let inverseWorldOriginalMatrix = new THREE.Matrix4().getInverse(worldOriginalMatrix);
        let inverseWorldCloneMatrix = new THREE.Matrix4().getInverse(worldCloneMatrix);

        ///vector.applyMatrix4(cloneMatrix);
        ///vectorOrigin.applyMatrix4(originalPrevMatrix);
        cloneMatrixInverse = new THREE.Matrix4().getInverse(cloneMatrix);
        originalMatrixInverse = new THREE.Matrix4().getInverse(originalCurrentMatrix);

        let clonePrevMatrix = this.cloneObjectMatrix[cloneBone.name].clone();
        let cloneCurrentMatrix = cloneBone.matrix.clone();
        let cloneInversePrevMatrix = new THREE.Matrix4().getInverse(clonePrevMatrix);
        let cloneInverseCurrentMatrix = new THREE.Matrix4().getInverse(cloneCurrentMatrix);

        let tMatrixPrevClone = new THREE.Matrix4();
        let tMatrixCurrentClone = new THREE.Matrix4();
        let tMatrixPreOrigin = new THREE.Matrix4();


        tMatrixPreOrigin.multiply(basicMatrix);
        tMatrixPreOrigin.multiply(originalMatrixInverse);

        tMatrixPrevClone.multiply(originalCurrentMatrix);
        tMatrixPrevClone.multiply(cloneInversePrevMatrix);

        tMatrixCurrentClone.multiply(originalPrevMatrix);
        tMatrixCurrentClone.multiply(cloneInverseCurrentMatrix);

        let inverseTMatrixPreClone = new THREE.Matrix4().getInverse(tMatrixPrevClone);


        //tMatrixPrevClone = this.createTransformationalMatrixFromPos(originalCurrentMatrix, cloneInversePrevMatrix);
        // let rotationMatrix = this.subMatrixRotation(clonePrevMatrix, cloneCurrentMatrix);

        //rotationMatrix.premultiply(tMatrixCurrentClone);
        //let transformation = new THREE.Matrix4().multiplyMatrices(originalCurrentMatrix, inverseWorldCloneMatrix);
        //console.log("Projection");
        clonePrevMatrix.premultiply(tMatrixPrevClone);
        cloneCurrentMatrix.premultiply(tMatrixPrevClone);
        //this.showMatrixComponents( cloneCurrentMatrix, "CLone projected onto basic");
        //cloneCurrentMatrix.premultiply(originalCurrentMatrix)
        //originalCurrentMatrix.premultiply(tMatrixPreOrigin);
        //this.showMatrixComponents( originalCurrentMatrix, "original projected onto basic");
        //console.log("Projection");

        //cloneMatrixWorld.premultiply(inverseWorldCloneMatrix);
        //cloneMatrixWorld.premultiply(originalCurrentMatrix);
        //originalBone.premultiply(originalMatrixInverse);
        let changedRotationMatrix = this.subMatrixRotation(clonePrevMatrix, cloneCurrentMatrix);
        //console.log("Switching");
        //this.showMatrixComponents( rotationMatrix, "rotationMatrix");
        // this.showMatrixComponents( changedRotationMatrix, "changedRotationMatrix");
        //this.showMatrixComponents( clonePrevMatrix, "PrevCloneMatrix");
        ////this.showMatrixComponents( cloneMatrixWorld, "CloneWorldMatrix");
        //this.showMatrixComponents( originalPrevMatrix, "OriginalWorldMatrix");
        //this.showMatrixComponents( originalCurrentMatrix, "OriginalMatrix");
        //this.showMatrixComponents( cloneCurrentMatrix, "CurrentCloneMatrix");
        //this.showMatrixComponents( originalPrevMatrix, "OriginalPrevMatrix");
        //this.showMatrixComponents( originalCurrentMatrix, "OriginalCurrentMatrix");
        //console.log("Switched");
        //this.setObjectFromMatrixElements(cloneCurrentMatrix, originalBone);

        let cloneMatrixWorld = cloneBone.matrix.clone();
        let originMatrixWorld = originalBone.matrix.clone();
        let cloneWorldQuaternion = new THREE.Quaternion();
        let originWorldQuaternion = new THREE.Quaternion();
        cloneBone.getWorldQuaternion(cloneWorldQuaternion);
        originalBone.getWorldQuaternion(originWorldQuaternion);
        cloneWorldQuaternion = cloneBone.quaternion.clone();
        originWorldQuaternion = originalBone.quaternion.clone();
        let oldCloneToOrigin = this.startAxisAngle[cloneBone.name].cloneQuat.clone();

        let oldDelta = this.startAxisAngle[cloneBone.name].deltaQuat.clone();
        let newDelta = new THREE.Quaternion();
        newDelta.multiply(this.startAxisAngle[cloneBone.name].cloneQuat.clone().conjugate());
        newDelta.multiply(originWorldQuaternion);
        let oldToOld = oldCloneToOrigin.clone();
        let oldToNew = oldCloneToOrigin.clone()
        oldToOld.multiply(oldDelta)
        oldToNew.multiply(newDelta)
        //oldCloneToOrigin.multiply();
        //let cloneQuat = cloneWorldQuaternion.clone();
        // this.startAxisAngle[originalBone.name].cloneQuat = new THREE.Quaternion().set(cloneQuat.x, cloneQuat.y, cloneQuat.z, cloneQuat.w);
        let relativeToOld = cloneWorldQuaternion.clone().multiply(oldDelta);
        let relativeToNew = cloneWorldQuaternion.clone().multiply(newDelta);
        cloneWorldQuaternion.multiply(oldDelta);
        console.log("new relative to old", relativeToOld);
        console.log("new relative to new", relativeToNew);
        console.log("old to old", oldToOld);
        console.log("old to new", oldToNew);
        //let axis = this.showAxisAngleOfBone(cloneBone, "clone");
        //this.showAxisAngleOfBone(originalBone, "original");
        originalBone.quaternion.copy(cloneWorldQuaternion);

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

    showMatrixComponents(matrix, name)
    {
        let position = new THREE.Vector3();
        let rotation = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        matrix.decompose(position, rotation, scale);
        let euler = new THREE.Euler().setFromQuaternion(rotation);
        console.log(name);
        console.log("Position ", position);
        console.log("Rotation ", euler);
        //console.log("Scale ", scale);
        return rotation;
    }

    subMatrixRotation(prevMatrix, currentMatrix)
    {
        let prevPosition = new THREE.Vector3();
        let prevRotation = new THREE.Quaternion();
        let prevScale = new THREE.Vector3();
        prevMatrix.decompose(prevPosition, prevRotation, prevScale);
        let currentPosition = new THREE.Vector3();
        let currentRotation = new THREE.Quaternion();
        let currentScale = new THREE.Vector3();
        currentMatrix.decompose(currentPosition, currentRotation, currentScale);

        let prevEuler = new THREE.Euler().setFromQuaternion(prevRotation);
        let currentEuler = new THREE.Euler().setFromQuaternion(currentRotation);
        let result = new THREE.Euler();
        result.x = prevEuler.x - currentEuler.x;
        result.y = prevEuler.y - currentEuler.y;
        result.z = prevEuler.z - currentEuler.z;
        let rotation = new THREE.Quaternion().setFromEuler(result);
       // let rotationalDifMatrix = new THREE.Matrix4().compose(currentPosition, rotation, currentScale);
        return result;
    }

    setObjectFromMatrixElements(matrix, object)
    {
        let position = new THREE.Vector3();
        let rotation = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        matrix.decompose(position, rotation, scale);
        let quatVec1 = object.quaternion.toAngleAxis();
        let euler = new THREE.Euler().setFromQuaternion(rotation);

        let quatVec2 = rotation.toAngleAxis();

        let axis = quatVec1.axis.sub(quatVec2.axis);
        let angle = quatVec1.angle - quatVec2.angle;

        // console.log("axis", axis);
        // console.log("Angle", angle);
        //object.rotateOnAxis(axis, angle)
        object.position.copy(position);
        object.rotation.set(euler.x, euler.y, euler.z);
        //object.rotation.x = euler.x;
        //object.rotation.y = euler.y + additional.y;
        //object.rotation.z = euler.z + additional.z;
        //object.quaternion.copy(rotation);
        //object.scale.copy(scale);
        object.updateMatrix();
    }

    createTransformationalMatrixFromPos(originalMatrix, inverseClone)
    {
        let rotation = new THREE.Quaternion();
        let prevPosition = new THREE.Vector3();
        let prevRotation = new THREE.Quaternion();
        let prevScale = new THREE.Vector3();
        originalMatrix.decompose(prevPosition, prevRotation, prevScale);
        let currentPosition = new THREE.Vector3();
        let currentRotation = new THREE.Quaternion();
        let currentScale = new THREE.Vector3();
        inverseClone.decompose(currentPosition, currentRotation, currentScale);
        let originTranslationMatrix = new THREE.Matrix4().compose(prevPosition, rotation, prevScale);
        let inverseCloneTranslationMatrix = new THREE.Matrix4().compose(currentPosition, rotation, currentScale);
        let result = new THREE.Matrix4().multiplyMatrices(originTranslationMatrix, inverseCloneTranslationMatrix);
        return result;
    }

    quaternionDifference(cloneBone, originalBone)
    {
        let from = cloneBone;
        let to = originalBone;
        let delta = to.clone().multiply(from.clone().inverse());
        let result = delta.clone().multiply(to);
        let euler = new THREE.Euler().setFromQuaternion(delta);
        console.log("Result", euler);
        return result;

    }

    showAxisAngleOfBone(bone, name)
    {
        let globalQuaternion = new THREE.Quaternion();
        bone.getWorldQuaternion(globalQuaternion);
        globalQuaternion = bone.quaternion;
        let {axis, angle} = globalQuaternion.toAngleAxis();
        console.log(name);
        console.log("Axis", axis);
        console.log("Angle", angle);
        return axis;
    }
    showAxisAngleOfQuaternion(quat, name)
    {
        let {axis, angle} = quat.toAngleAxis();
        console.log(name);
        console.log("Axis", axis);
        console.log("Angle", angle);
        return axis;
    }
}
export default Ragdoll;
