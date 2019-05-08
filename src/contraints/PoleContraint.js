import * as THREE from "three";

class PoleConstraint
{
    constructor(poleChain, poleTarget)
    {
        this.poleChain = poleChain;
        this.poleTarget = poleTarget;
        this.poleAngle = 90;
        this.addPoleTargetToScene();
        this.firstRun = true;
        this.needStraightening = false;
        this.neutralStatePosition = poleChain.target.position.clone();
        this.neutralOffset = .35;
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

        let angleBetween = polePose.angleTo(rootPose);
        let angleDiff = this.degToRad(this.poleAngle) - angleBetween;

        // Blending is needed only for leg right now
        if(this.needStraightening)
        {
            this.blending(goalPose, polePose);
            let worldPosition = new THREE.Vector3();
            joints[0].bone.getWorldPosition(worldPosition)
            this.showOnFirstRun(worldPosition.y);
        }

        let position = new THREE.Vector3();
        let matrix = new THREE.Matrix4();
        this.poleChain.joints.forEach((joint) =>
        {
            // Cloning bone in order to modify it's position and rotation
            let cloneBone = joint.bone.clone();
            joint.bone.lookAt(polePose);
            position.setFromMatrixPosition( cloneBone.matrixWorld );
            matrix.lookAt(polePose, position, cloneBone.up);
            let axis = new THREE.Vector3(1, 1, 0);
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

            let legStartingPosition = 1;
            let maxStartPos = 1.1;
            let minStartPos = .9;
            let currentOffset = legStartingPosition + differenceX / smooth + differenceY + differenceZ / smooth;
            if(goalPose.y <= neutralPose.y)
            {
                currentOffset = legStartingPosition + differenceZ / smooth;
                currentOffset = currentOffset > maxStartPos ? maxStartPos : currentOffset < minStartPos ? currentOffset : currentOffset;
            }
            polePose.z = currentOffset > maxZ ? maxZ : currentOffset < minStartPos ? legStartingPosition : currentOffset;
        }
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
    //#region Blender's constraint
    blendersConstraint()
    {
        let joints = this.poleChain.joints;
        // First bone in chain position
        let rootPose = joints[0].bone.position.clone();
        // Last bone in chain position
        let endPose = joints[joints.length - 1].bone.position.clone();
        // Pole target position
        let polePose = this.poleTarget.mesh.position.clone();
        // Moving target position
        let goalPose = this.poleChain.target.position.clone();

        this.showOnFirstRun(endPose);
        let rootMatrix = joints[0].bone.matrix.clone();

        let rootX = this.matrixUnitX(rootMatrix);
        let rootZ = this.matrixUnitY(rootMatrix);

        this.showOnFirstRun(endPose);
        // Direction of chain
        let dir = endPose.sub(rootPose).normalize();
        // Direction of pole
        let poleDir = goalPose.sub(rootPose).normalize();
        // Pole target up
        let poleUp = polePose.sub(rootPose).normalize();
        // Chain up
        let up = rootX.multiplyScalar(Math.cos(this.poleAngle)).add( rootZ.multiplyScalar(Math.sin(this.poleAngle)));
        // End rotation matrix
        let endrot = new THREE.Matrix4();
        // Pole rotation matrix
        let polerot = new THREE.Matrix4()

        let x = dir.clone();
        x.multiply(up).normalize();
        let unitY = x.clone().multiply(dir).normalize();
        endrot.makeBasis(x, unitY, dir.negate());
        // for the polar target
        x = poleDir.clone().multiply(poleUp).normalize();
        unitY = x.clone().multiply(poleDir).normalize();
        polerot.makeBasis(x, unitY, poleDir.negate());

        let inverse = endrot;

        this.showOnFirstRun("result: ");
        let result = polerot.multiply(inverse);

        let rootBone =  joints[0].bone;
        let oldMatrix = rootBone.matrix;
        let newMatrix = oldMatrix.multiply(result);
        this.showOnFirstRun(newMatrix);
        this.firstRun = false;
    }

    //#region Getting basis from matrix
    matrixUnitX(matrix)
    {
        let unitX = new THREE.Vector3(matrix.elements[0], matrix.elements[3], matrix.elements[6] );
        return unitX;
    }

    matrixUnitY(matrix)
    {
        let unitY = new THREE.Vector3(matrix.elements[1], matrix.elements[4], matrix.elements[7] );
        return unitY;
    }
    //#endregion

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
