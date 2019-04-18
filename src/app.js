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
        scene.background = new THREE.Color(1.0, 1.0, 1.0);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        let directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
        scene.add( directionalLight );
        //#endregion

        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;

        //#region Moving targets
        const rightHandMovingTarget = this.CreateMovingTarget(new THREE.Vector3(-2, 1.5, 0));
        const leftHandMovingTarget = this.CreateMovingTarget(new THREE.Vector3(2, 1.5, 0));
        const leftLegMovingTarget = this.CreateMovingTarget(new THREE.Vector3(2, -1.5, 0));
        const rightLegMovingTarget = this.CreateMovingTarget(new THREE.Vector3(-2, -1.5, 0));
        //#endregion

        //#region Controls
        this.orbit = new OrbitControls( camera, renderer.domElement );

        this.AddTransformationControl(rightHandMovingTarget);
        this.AddTransformationControl(leftHandMovingTarget);
        this.AddTransformationControl(leftLegMovingTarget);
        this.AddTransformationControl(rightLegMovingTarget);
        //#endregion


        //#region Loader
        let loadedObject = {};
        const gltfLoader = new MyGLTFLoader();
        gltfLoader.loaded = (gltf) =>
        {
            loadedObject = new IkObject();
            loadedObject.initObject(gltf.scene, rightHandMovingTarget, leftHandMovingTarget, leftLegMovingTarget, rightLegMovingTarget);
            this.iKObjects.push(loadedObject);
        }
        gltfLoader.loadToScene('./assets/adult-male.glb', scene);
        //#endregion
    }

    //#region Render loop
    render()
    {
        this.iKObjects.forEach((ikObject) =>
        {
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
        control.addEventListener('dragging-changed', ( event ) =>
        {
            this.orbit.enabled = ! event.value;
        });
        control.attach(target);
        this.scene.add(control);
    }

    CreateMovingTarget(position)
    {
        const movingTarget = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        movingTarget.position.z = position.z;
        movingTarget.position.y = position.y;;
        movingTarget.position.x = position.x;
        this.scene.add(movingTarget);
        return movingTarget;
    }
    //#endregion
}
export default App;
