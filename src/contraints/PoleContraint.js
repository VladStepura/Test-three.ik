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
        console.log(this.poleChain);
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

    apply()
    {
        let joints = this.poleChain.joints;
        let rootPose = joints[0].bone.position.clone();
        let endPose = joints[joints.length - 1].bone.position.clone();
        let polePose = this.poleTarget.mesh.position.clone();
        let goalPose = this.poleChain.target.position.clone();

        // this.poleTarget.mesh.getWorldPosition(polePose);
        // joints[joints.length - 1].bone.getWorldPosition(endPose);
        // joints[0].bone.getWorldPosition(rootPose);
        // this.poleChain.target.getWorldPosition(goalPose);


        this.showOnFirstRun(endPose);
        let rootMatrix = joints[0].bone.matrix.clone();

        let rootX = this.matrixUnitX(rootMatrix);
        let rootZ = this.matrixUnitY(rootMatrix);

        this.showOnFirstRun(endPose);

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

        let inverse = endrot; //new THREE.Matrix4();
      //  inverse.getInverse(endrot);

        this.showOnFirstRun("result: ");
        let result = polerot.multiply(inverse);
        //this.showOnFirstRun(result.elements);
   /*     this.poleChain.joints.forEach((joint) =>
        {

        });*/
        let rootBone =  joints[0].bone;
        let oldMatrix = rootBone.matrix.clone();
        let newMatrix = oldMatrix.multiply(result);
        this.showOnFirstRun(newMatrix);
        if(this.firstRun)
        {
           // rootBone.applyMatrix(newMatrix);
        }

        //joints[2].bone.matrix.multiply(result);
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

    //#region Setting basis to matrix
    unitX(matrix, value)
    {
        matrix.elements[0] = value.x;
        matrix.elements[3] = value.y;
        matrix.elements[6] = value.z;
    }

    unitY(matrix, value)
    {
        matrix.elements[1] = value.x;
        matrix.elements[4] = value.y;
        matrix.elements[7] = value.z;
    }

    unitZ(matrix, value)
    {
        matrix.elements[2] = value.x;
        matrix.elements[5] = value.y;
        matrix.elements[8] = value.z;
    }
    //#endregion

    showOnFirstRun(value)
    {
        if(this.firstRun)
        {
            console.log(value);
        }
    }
}
export default PoleConstraint;
