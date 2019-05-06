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
        //this.angleThroughRoot();
        //this.blendersConstraint();
        this.poleAngleRotation();
        this.firstRun = false;
    }

    angleThroughRoot()
    {
        let joints = this.poleChain.joints;
        // First bone in chain position
        let rootPose = joints[0].bone.position.clone();
        // Last bone in chain position
        let endPose = joints[joints.length - 1].bone.position.clone();
        // Pole target position
        let polePose = this.poleTarget.mesh.position.clone();

        let rootEndSide = Math.sqrt(Math.pow(endPose.x - rootPose.x, 2)
                                    + Math.pow(endPose.y - rootPose.y, 2)
                                    + Math.pow(endPose.z - rootPose.z, 2));
        let endPoseX = rootEndSide * Math.cos(this.poleAngle);
        let endPoseY = rootEndSide * Math.sin(this.poleAngle);
        let endPoseZ = rootEndSide * Math.cos(this.poleAngle);
        this.showOnFirstRun(polePose);

        polePose.x = endPoseX;
        polePose.y = endPoseY;
        polePose.z = endPoseZ;

        let a2 = this.lengthSquare(rootPose, endPose);
    //   let b2 = this.lengthSquare(endPose, rootPose);

        this.showOnFirstRun(a2);
        //this.showOnFirstRun(b2);
        this.showOnFirstRun(polePose);
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

        let angleBetween = polePose.angleTo(rootPose);
        let angleDiff = this.degToRad(this.poleAngle) - angleBetween;
        polePose.z = -polePose.z;

        this.poleChain.joints.forEach((joint) =>
        {
            joint.bone.lookAt(polePose);
            joint.bone.rotateX(angleDiff);

        });
    }

    lengthSquare(first, second)
    {
        let xDiff = first.x - second.x;
        let yDiff = first.y - second.y;
        let zDiff = first.z - second.z;
        return Math.pow(xDiff, 2) + Math.pow(yDiff, 2) + Math.pow(zDiff, 2);
    }

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

    degToRad(degree)
    {
        return degree * Math.PI/180;
    }
}
export default PoleConstraint;
