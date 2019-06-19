import * as THREE from "three";


THREE.Object3D.prototype.worldToLocalQuaternion = function (quaternion)
{
    let resultQuat = quaternion.clone();
    let rotation = this.matrixWorld.getRotation();
    resultQuat.multiply(rotation.conjugate());
    return resultQuat;
}

THREE.Object3D.prototype.localToWorldQuaternion = function (quaternion)
{
    let resultQuat = quaternion.clone();
    let rotation = this.matrixWorld.getRotation();
    resultQuat.multiply(rotation);
    return resultQuat;
}

THREE.Object3D.prototype.getInverseMatrix = function ()
{
    let matrix = new THREE.Matrix4();
    matrix.getInverse(this.matrix);
    return matrix;
}

THREE.Object3D.prototype.getInverseMatrixWorld = function ()
{
    let matrix = new THREE.Matrix4();

    matrix.getInverse(this.matrixWorld);
    return matrix;
}

THREE.Matrix4.prototype.getRotation = function()
{
    let vector = new THREE.Vector3();
    let matrix = new THREE.Matrix4();
    let quaternion = new THREE.Quaternion();

    let te = this.elements;

    let sx = vector.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
    let sy = vector.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
    let sz = vector.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

    // if determine is negative, we need to invert one scale
    let det = this.determinant();
    if ( det < 0 ) sx = - sx;

    // scale the rotation part
    matrix.copy( this );

    let invSX = 1 / sx;
    let invSY = 1 / sy;
    let invSZ = 1 / sz;

    matrix.elements[ 0 ] *= invSX;
    matrix.elements[ 1 ] *= invSX;
    matrix.elements[ 2 ] *= invSX;

    matrix.elements[ 4 ] *= invSY;
    matrix.elements[ 5 ] *= invSY;
    matrix.elements[ 6 ] *= invSY;

    matrix.elements[ 8 ] *= invSZ;
    matrix.elements[ 9 ] *= invSZ;
    matrix.elements[ 10 ] *= invSZ;

    quaternion.setFromRotationMatrix( matrix );
    return quaternion;
}

THREE.Object3D.prototype.worldQuaternion = function ()
{
    let quaternion = new THREE.Quaternion();
    this.getWorldQuaternion(quaternion);
    return quaternion;
}

// For memes
THREE.Quaternion.prototype.substract = function(quanternion)
{
    let firstQuat = this;
    firstQuat.x -= quanternion.x;
    firstQuat.y -= quanternion.y;
    firstQuat.z -= quanternion.z;
    firstQuat.w -= quanternion.w;
    return firstQuat;
}

THREE.Quaternion.prototype.applyMatrix = function(matrix)
{
    let rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(this);
    rotationMatrix.premultiply(matrix);
    this.copy(rotationMatrix.getRotation());
}