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
        let poleDir = goalPose.sub(rootPose).normalize();
        let poleUp = polePose.sub(rootPose).normalize();
        let up = rootX.multiplyScalar(Math.cos(this.poleAngle)).add( rootZ.multiplyScalar(Math.sin(this.poleAngle)));
        let endrot = new THREE.Matrix4();
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
}
export default PoleConstraint;
