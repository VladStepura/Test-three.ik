import * as THREE from "three";
import {OrbitControls} from "./utils/OrbitControls";
import MyGLTFLoader from "./loaders/MyGLTFLoader";
import IkObject from "./objects/IkObject";
import {TransformControls} from "./utils/TransformControls";

// App is main class which initialises all object and goes through rendering cycle
class App
{
    constructor()
    {
        this.iKObjects = [];
        console.log( this.iKObjects);
    }
    // Initialize main app
    initialize()
    {
        //#region Three js Initialization
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0.3,0.3,0.3);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
        camera.position.z = 4;
        camera.position.y = 2;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        let directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
        scene.add( directionalLight );
        let ambientLight = new THREE.AmbientLight( 0xffffff, 0.7)
        scene.add( ambientLight );
        //#endregion

        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;

        //#region Moving targets
        const rightHandMovingTarget = this.CreateMovingTarget(new THREE.Vector3(-2, 1.5, 0));
        const leftHandMovingTarget = this.CreateMovingTarget(new THREE.Vector3(2, 1.5, 0));
        const leftLegMovingTarget = this.CreateMovingTarget(new THREE.Vector3(2, -1.5, 0));
        const rightLegMovingTarget = this.CreateMovingTarget(new THREE.Vector3(-2, -1.5, 0));
        const backMovingTarget = this.CreateMovingTarget(new THREE.Vector3(0, 1, -.1));
        //#endregion

        //#region Controls
        this.orbit = new OrbitControls( camera, renderer.domElement );
        this.orbit.target = new THREE.Vector3(0,1,0)
        this.orbit.update()

        this.AddTransformationControl(rightHandMovingTarget);
        this.AddTransformationControl(leftHandMovingTarget);
        this.AddTransformationControl(leftLegMovingTarget);
        this.AddTransformationControl(rightLegMovingTarget);
        this.AddTransformationControl(backMovingTarget);
        //#endregion


        //#region Loader
        let loadedObject = {};
        const gltfLoader = new MyGLTFLoader();
        gltfLoader.loaded = (gltf) =>
        {
            loadedObject = new IkObject();
            loadedObject.initObject(gltf.scene, rightHandMovingTarget, leftHandMovingTarget, leftLegMovingTarget, rightLegMovingTarget, backMovingTarget);
            this.iKObjects.push(loadedObject);
        }
        gltfLoader.loadToScene('./assets/male-adult-testforik.glb', scene);
        //#endregion
    }

    //#region Render loop
    render()
    {
        // Goes through all ik objects, update them and solve their ik
        this.iKObjects.forEach((ikObject) =>
        {
            // Object updates before it's ik solved in order to set pole target
            // This will fix issues this weird angles
            ikObject.update();
            ikObject.ik.solve();
        });
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => this.render());
    }
    //#endregion

    //#region Add ControlTransformation
    AddTransformationControl(target)
    {
        let control = new TransformControls( this.camera, this.renderer.domElement );
        control.size = 0.5
        control.addEventListener('dragging-changed', ( event ) =>
        {
            this.orbit.enabled = ! event.value;
        });
        control.attach(target);
        this.scene.add(control);
    }

    CreateMovingTarget(position)
    {
        const movingTarget = new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.4 }));
        movingTarget.position.z = position.z;
        movingTarget.position.y = position.y;;
        movingTarget.position.x = position.x;
        this.scene.add(movingTarget);
        return movingTarget;
    }
    //#endregion
}
export default App;
