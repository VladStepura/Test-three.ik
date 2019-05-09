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
        let rootBone = new THREE.Vector3();
        poleChain.joints[0].bone.getWorldPosition(rootBone);
        console.log(poleChain.joints[0].bone);
        console.log(rootBone);
        this.startingPositionZ = 1;//Math.round(rootBone.z);
        console.log(this.startingPositionZ);
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
        // First bone in chain position
        let rootPose = joints[0].bone.position.clone();
        // Last bone in chain position
        let endBone = joints[joints.length - 1].bone.position.clone();
        // Pole target position
        let polePose = this.poleTarget.mesh.position.clone();
        // Moving target position
        let goalPose = this.poleChain.target.position.clone();

        let disabledPole = false;
        // Blending is needed only for leg right now
        if(this.needStraightening)
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

            //this.blending(goalPose, polePose);
            //#endregion
        }

        let position = new THREE.Vector3();
        let matrix = new THREE.Matrix4();
        let angleBetween = polePose.angleTo(rootPose);
        let angleDiff = this.degToRad(this.poleAngle) - angleBetween;

        this.poleChain.joints.forEach((joint) =>
        {
            // Cloning bone in order to modify it's position and rotation
            let cloneBone = joint.bone.clone();
            if(!disabledPole)
            {
                joint.bone.lookAt(polePose);
            }

            position.setFromMatrixPosition( cloneBone.matrixWorld );
            matrix.lookAt(polePose, position, cloneBone.up);
            let axis = new THREE.Vector3(1, 0, 0);
            matrix.makeRotationAxis(axis, angleDiff);

            joint.bone.updateWorldMatrix( true, false );
            let parent = cloneBone.parent;
            if ( parent )
            {
                matrix.extractRotation( parent.matrixWorld );
                cloneBone.quaternion.setFromRotationMatrix( matrix );
                joint.bone.quaternion.premultiply( cloneBone.quaternion.inverse() );
            }
        });
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
            let minStartPos = startingPositionZ - startingOffset;
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
        if(this.poleChain.totalLengths > targetLength )
        {
            return false;
        }
        return true;
    }

    degToRad(degree)
    {
        return degree * Math.PI/180;
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
    //#endregion
}
export default PoleConstraint;
