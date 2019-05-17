import * as THREE from "three";

// PoleConstraint is class which is closely interviened with three-ik.js IkChain
// it initializes lambda for IkChain which is executes in backward calculations method
class PoleConstraint
{
    constructor(poleChain, poleTarget)
    {
        this.poleChain = poleChain;
        this.poleTarget = poleTarget;
        this.poleAngle = 0;
        this.addPoleTargetToScene();
        this.applyPoleConstraint = true;
        // Lambda which is execute itself in pole chain backward method
        this.poleChain.chainConstraint = (joint) => this.rotateToward(joint);
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

    // Applies constraint to chain's joint
    // This method is lambda that fires in three-ik.js backward calculations
    rotateToward(joint)
    {
        if (this.applyPoleConstraint && (this.poleChain.joints[0] === joint) )
        {
            let joints = this.poleChain.joints;
            let rootBone = joints[0].bone;
            let endBone = joints[joints.length - 1].bone;
            let rootGlobalPose = new THREE.Vector3();
            let endGlobalPose = new THREE.Vector3();
            rootBone.getWorldPosition(rootGlobalPose);
            endBone.getWorldPosition(endGlobalPose);

            let direction = new THREE.Vector3().copy(joint._getDirection());

            // Taking Ik target position
            let ikTargetPose = endGlobalPose;
            let rootPose = rootGlobalPose;
            let target = this.poleTarget.mesh.position.clone();

            // Projecting pole target on to line between ikTarget and rootPose
            let projectedPole = this.projectPointOnLine(ikTargetPose, rootPose, target);
            // Getting xAxis through PoleTarget and projectPole
            let xAxis = new THREE.Vector3().subVectors(target, projectedPole).normalize();
            // Getting yAxis through IkTargetPose and projectPole
            let yAxis = new THREE.Vector3().subVectors(ikTargetPose, projectedPole).normalize();
            // Getting zAxis through cross vector of y and Y
            let zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis);

            // Setting up projection matrix
            let TBN = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);

            // Inverse projection matrix so our projection facing it's normal direction
            let inversedTBN = new THREE.Matrix4().getInverse(TBN);
            // Project our joint direction on to reversed projection
            let boneDirectionProjected = new THREE.Vector3().copy(direction).applyMatrix4(inversedTBN);
            // Save current radius for cause when direction length changes
            let radius = direction.length();
            // Transformsinto vector 2 space
            // Cause we don't need yAxis for now
            let boneDirectionXZ = new THREE.Vector2(boneDirectionProjected.x, boneDirectionProjected.z);

            // Calculate current direction angle to positive xAxis and adding PoleAngle
            // We making angle negative in order to move our object to xAxis zero
            let angleToPlane = -boneDirectionXZ.angle() + THREE.Math.DEG2RAD * this.poleAngle;
            // Rotate direction around origin by angle
            boneDirectionXZ.rotateAround(new THREE.Vector2(0, 0), angleToPlane);
            // Sets original x to changed direction x
            boneDirectionProjected.x = boneDirectionXZ.x;
            // Sets original y to changed direction y
            boneDirectionProjected.z = boneDirectionXZ.y;

            // Transform back to our space by multiplying by matrix
            boneDirectionProjected = boneDirectionProjected.applyMatrix4(TBN);
            // Sets length to original in cause it's changed
            boneDirectionProjected.setLength(radius);
            // Applies project direction to original
            direction.copy(boneDirectionProjected);
            // Sets bone direction
            joint._setDirection(direction);
        }
    }

    // Projects point from target onto line between p1 and p2
    projectPointOnLine(p1, p2, target)
    {
        let AB = p2.clone().sub(p1);
        let AP = target.clone().sub(p1);

        let dot1 = AP.clone().dot(AB);
        let dot2 = AB.clone().dot(AB);

        let AB2 = AB.clone().multiplyScalar(dot1 / dot2);

        return p1.clone().add(AB2);
    }
}
export default PoleConstraint;
