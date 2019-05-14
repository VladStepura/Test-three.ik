import * as THREE from "three";

class PoleConstraint
{
    constructor(poleChain, poleTarget)
    {
        this.poleChain = poleChain;
        this.poleTarget = poleTarget;
        this.poleAngle = 0;
        this.addPoleTargetToScene();
        this.firstRun = true;
        this.needStraightening = false;
        this.neutralStatePosition = poleChain.target.position.clone();
        this.neutralOffset = .6;
        this.startingPositionZ = 1;//Math.round(rootBone.z);
        this.poleChain.chainConstraint = (joint) => this.rotateToward(joint);
        this.rotationPlane = new THREE.Plane();
        this.currentRotation = 0;
        this.previousDirection = null;
    }

    addPoleTargetToScene()
    {
        let scene = this.poleChain.joints[0].bone;
        while(!(scene instanceof THREE.Scene))
        {
            scene = scene.parent;
        }
        scene.add(this.poleTarget.mesh);
    }

    // Changes target's matrix in order to correspond to pole target
    apply()
    {
        this.poleAngleRotation();
        this.firstRun = false;
    }

    poleAngleRotation()
    {
        let joints = this.poleChain.joints;
        let rootBone = joints[0].bone;
        let rootPose = rootBone.position.clone();
        // Last bone in chain position
        let endBone = joints[joints.length - 1].bone;
        let poleMesh = this.poleTarget.mesh;
        // Pole target position
        let polePose = poleMesh.position;
        // Moving target position
        let goalPose = this.poleChain.target.position.clone();

        let disabledPole = false;
        let poleAngle = this.poleAngle;

        let rootGlobalPose = new THREE.Vector3();
        rootBone.getWorldPosition(rootGlobalPose);

        let endGlobalPose = new THREE.Vector3();
        endBone.getWorldPosition(endGlobalPose);

        // Blending is needed only for leg right now
        /*       if(this.needStraightening)
               {
                   //#region Straight leg check
                   let rootPosition = new THREE.Vector3();
                   let endPosition = new THREE.Vector3();
                   let goalPosition = new THREE.Vector3();
                   joints[joints.length - 1].bone.getWorldPosition(endPosition);
                   joints[0].bone.getWorldPosition(rootPosition);
                   this.poleChain.target.getWorldPosition(goalPosition);
                   let shouldBeStraight = this.shouldBeStraight(rootPosition, endPosition, goalPosition);
                   if(shouldBeStraight)
                   {
                       disabledPole = true;
                   }
               }*/

        let rootQuaternion = new THREE.Quaternion();
        rootBone.getWorldQuaternion(rootQuaternion);
        let endQuaternion = new THREE.Quaternion();
        endBone.getWorldQuaternion(endQuaternion);

        let angleBetween = poleMesh.quaternion.angleTo(endQuaternion);

        let angleDiff = angleBetween - this.degToRad(poleAngle);

        if(this.needStraightening)
        {
            this.currentPoleAngle();
            //console.log("Angle difference: " + this.radToDeg(angleDiff));
        }
        let rotationAxis = new THREE.Vector3(0,1, 0);
        //rootBone.rotateOnAxis(rotationAxis, angleDiff);

        if(this.needStraightening)
        {
            let radPole = this.degToRad(poleAngle)
            //  rootBone.quaternion.setFromAxisAngle(rotationAxis, radPole);
            // this.rotateAboutPoint(rootBone, rootGlobalPose, rotationAxis, radPole, true);
        }
        for(let i = 0; i < joints.length; i++)
        {
            let joint = joints[i];
            if(this.needStraightening)
            {
                joint._setDirection(new THREE.Vector3(1, 0, 0));
                joint.bone.updateMatrixWorld(true, false);
            }
            // joint.bone.updateWorldMatrix(true, false);
        }
    }


    rotateToward(joint)
    {
        let Z_AXIS = new THREE.Vector3(0, 0, 1);
        let X_AXIS = new THREE.Vector3(1, 0, 0);
        let Y_AXIS = new THREE.Vector3(0, 1, 0);
        let t1$1 = new THREE.Vector3();
        let t2$1 = new THREE.Vector3();
        let RAD2DEG$1 = THREE.Math.RAD2DEG;
        let radPole = this.degToRad(this.poleAngle);
        //this.rotateAboutPoint(joint.bone, joint.bone.position.clone(), rotationAxis, radPole, false);
        if (this.needStraightening && (this.poleChain.joints[0] === joint) )
        {

            let direction = new THREE.Vector3().copy(joint._getDirection());
            let parentDirection = joint._localToWorldDirection(t1$1.copy(X_AXIS)).normalize();
            let rotationPlaneNormal = joint._localToWorldDirection(t2$1.copy(joint._originalHinge)).normalize();
            let originalDirection = new THREE.Vector3().copy(joint._originalDirection);
            this.rotationPlane.normal = rotationPlaneNormal;

            let matrix = new THREE.Matrix4();

            let projectedDir = this.rotationPlane.projectPoint(direction, new THREE.Vector3());
            let offset = new THREE.Vector3();
            if(this.previousDirection === null)
            {
                this.previousDirection = projectedDir.clone();
            }
            else
            {
                offset.subVectors(projectedDir, this.previousDirection);
            }


            let currentAngle = this.radToDeg(direction.angleTo(parentDirection));
            /*         console.log(currentAngle);
                     if (this.poleAngle < currentAngle)
                     {
                         direction.normalize();
                         let correctionAxis = new THREE.Vector3().crossVectors(parentDirection, direction).normalize();
                         parentDirection.applyAxisAngle(correctionAxis, this.poleAngle * THREE.Math.DEG2RAD);
                         joint._setDirection(parentDirection);
                         return true;
                     }*/

            let poleRad = this.degToRad(this.poleAngle);

            let diff = this.currentRotation - poleRad;
            projectedDir.applyAxisAngle(Y_AXIS, diff);
            //matrix.makeRotationAxis(rotationAxis, poleRad);
            //projectedDir.sub(position);
            //projectedDir.applyAxisAngle(rotationAxis, poleRad);
            //projectedDir.add(position);
            //projectedDir.applyMatrix4(matrix);
            //  console.log(projectedDir);
            // joint._setDirection(projectedDir);
            // projectedDir.copy(this.previousDirection);
            //  projectedDir.add(offset);
            joint._setDirection(projectedDir);

            this.currentRotation = this.degToRad(this.poleAngle)
        }
    }


    // Blends between neutral position of element and constrained position
    blending(goalPose, polePose)
    {
        let offset = this.neutralOffset;
        let neutralPose = this.neutralStatePosition;
        if(this.inBetween(goalPose, this.neutralStatePosition, offset) || goalPose.y <= neutralPose.y)
        {
            let maxZ = polePose.z;
            let smooth = 8;
            let differenceX = Math.abs(goalPose.x - neutralPose.x);
            let differenceY = goalPose.y - neutralPose.y;
            let differenceZ = goalPose.z - neutralPose.z;

            let startingOffset = .1;

            let startingPositionZ = this.startingPositionZ;
            let maxStartPos = startingPositionZ + startingOffset;
            let minStartPos = startingPositionZ - startingOffset + 0.03;
            let currentOffset = startingPositionZ + differenceX / smooth + differenceY + differenceZ / smooth;
            if(goalPose.y <= neutralPose.y)
            {
                currentOffset = startingPositionZ + differenceZ / smooth;
                currentOffset = currentOffset > maxStartPos ? maxStartPos : currentOffset < minStartPos ? currentOffset : currentOffset;
            }
            polePose.z = currentOffset > maxZ ? maxZ : currentOffset < minStartPos ? startingPositionZ : currentOffset;
        }
    }

    shouldBeStraight(rootPosition, endPosition, targetPosition)
    {
        let targetLength = rootPosition.distanceTo(targetPosition);
        let totalChainLength = this.poleChain.totalLengths;

        if(totalChainLength > targetLength )
        {
            return false;
        }
        return true;
    }

    degToRad(degree)
    {
        return degree * Math.PI/180;
    }

    radToDeg(rad)
    {
        return rad * 180/Math.PI;
    }

    // Tells if vector is in between offset of neutral vector
    inBetween(currentPose, neutralPose, offset)
    {
        let currentX = currentPose.x;
        let neutralX = neutralPose.x;
        let currentY = Math.abs(currentPose.y);
        let neutralY = Math.abs(neutralPose.y);
        let currentZ = Math.abs(currentPose.z);
        let neutralZ = Math.abs(neutralPose.z);
        let isX = currentX < neutralX - offset ? false : currentX > neutralX + offset ? false : true;
        let isY = currentY > neutralY + offset ? false : true;
        let isZ = currentZ < neutralZ - offset ? false : currentZ > neutralZ + offset ? false : true;
        return isX || isY || isZ;
    }

    // Runs console.log only once in lifecycle
    showOnFirstRun(value)
    {
        if(this.firstRun)
        {
            console.log(value);
        }
    }

    currentPoleAngle()
    {
        let joints = this.poleChain.joints;
        let baseJoint = joints[0];
        let secondJoint = joints[1];
        let ikJoint = joints[joints.length - 1];

        let baseBoneGlobal = new THREE.Vector3();
        secondJoint.bone.getWorldPosition(baseBoneGlobal);
        let poleTarget = this.poleTarget.mesh;

        let poleBonePosition = poleTarget.position;
        let poleAngleInRadians = this.getPoleAngle(baseJoint.bone, ikJoint.bone, secondJoint.bone, poleBonePosition);
        let angleDegree = this.radToDeg(poleAngleInRadians);
        return poleAngleInRadians;
        //console.log("Angle between pole target and ik chain: ", angleDegree);
    }

    getPoleAngle(baseBone, ikBone, secondBone, poleBoneLocation)
    {
        let poleNormal = new THREE.Vector3();
        let ikBoneGlobal = new THREE.Vector3();
        ikBone.getWorldPosition(ikBoneGlobal);
        let baseBoneGlobal = new THREE.Vector3();
        baseBone.getWorldPosition(baseBoneGlobal);
        let secondBoneGlobal = new THREE.Vector3();
        secondBone.getWorldPosition(secondBoneGlobal);

        let ikBoneToBaseDistance = new THREE.Vector3();
        ikBoneToBaseDistance.subVectors(ikBoneGlobal, baseBoneGlobal);
        let poleBoneToBaseDistance = new THREE.Vector3();
        poleBoneToBaseDistance.subVectors(poleBoneLocation, baseBoneGlobal);

        poleNormal.crossVectors(ikBoneToBaseDistance, poleBoneToBaseDistance);

        let normal = new THREE.Vector3();
        normal.subVectors(secondBoneGlobal, baseBoneGlobal);

        let projectedPoleAxis = new THREE.Vector3();
        projectedPoleAxis.crossVectors(poleNormal,  normal);
        let xAxis = this.getXAxis(baseBone);
        return this.signedAngle(xAxis, projectedPoleAxis, normal);
    }

    signedAngle(vector_u, vector_v, normal)
    {
        let angle = vector_u.angleTo(vector_v);
        let angleBetween = vector_u.cross(vector_v).angleTo(normal);
        // console.log(angleBetween);
        if (angleBetween < 1)
        {
            angle = -angle
        }
        return angle;
    }

    getXAxis(bone)
    {
        let xDirection = new THREE.Vector3(1, 0, 0);
        let matrixWorld = bone.matrixWorld.clone();
        xDirection.applyMatrix4(matrixWorld);
        xDirection.y = 0;
        xDirection.z = 0;
        return xDirection;
    }

    rotateAboutPoint(obj, point, axis, theta, pointIsWorld)
    {
        pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

        if(pointIsWorld)
        {
            obj.parent.localToWorld(obj.position); // compensate for world coordinate
        }
        obj.position.sub(point); // remove the offset
        obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
        obj.position.add(point); // re-add the offset

        if(pointIsWorld)
        {
            obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
        }
        obj.rotateOnAxis(axis, theta); // rotate the OBJECT
    }


    //#endregion
}
export default PoleConstraint;
