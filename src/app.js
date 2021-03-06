import * as THREE from "three";
import {OrbitControls} from "./utils/OrbitControls";
import MyGLTFLoader from "./loaders/MyGLTFLoader";
import TargetControl from "./objects/TargetControl";
import Ragdoll from "./objects/IkObjects/Ragdoll";
import Stats from "stats-js/src/Stats";
import RagDollGui from "./objects/RagDollGui";


// App is main class which initialises all object and goes through rendering cycle
class App
{
    constructor()
    {
        this.iKObjects = [];
        this.stats = new Stats();
        this.stats.showPanel( 0 );
    }
    // Initialize main app
    initialize()
    {

        document.body.appendChild( this.stats.dom );

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

        //#region Controls
        this.orbit = new OrbitControls( camera, renderer.domElement );
        this.orbit.target = new THREE.Vector3(0,1,0)
        this.orbit.update()
        //#endregion

        //#region Moving targets
        const rightHandControl = this.AddTransformationControl(new THREE.Vector3(-2, 1.5, 0));
        const leftHandControl = this.AddTransformationControl(new THREE.Vector3(2, 1.5, 0));
        const leftLegControl = this.AddTransformationControl(new THREE.Vector3(2, -1.5, 0));
        const rightLegControl = this.AddTransformationControl(new THREE.Vector3(-2, -1.5, 0));
        const backControl = this.AddTransformationControl(new THREE.Vector3(0, 1, -.1));
        const hipsControl = this.AddTransformationControl(new THREE.Vector3(0, 1, 0));
        //#endregion

        //#region Loader
        let loadedObject = {};
        const gltfLoader = new MyGLTFLoader();
        let moveX = 0;
        gltfLoader.loaded = (gltf) =>
        {
            //object.current, object.current.children[1]
            let object = gltf.scene.children[0];
            object.position.x = moveX;
            moveX += 1.5;

            object.updateMatrixWorld(true);

            loadedObject = new Ragdoll();
            loadedObject.initObject(gltf.scene, object, object.children[1], backControl, leftHandControl,
                                    rightHandControl, leftLegControl, rightLegControl,
                                    hipsControl);
            this.iKObjects.push(loadedObject);
            let ragDollGui = new RagDollGui(loadedObject);
            //ragDollGui.initGui();
            console.log(gltf.scene);
            console.log(loadedObject);
            loadedObject.chainObjects[1].chain.joints[0].bone.rotateX(Math.PI/2);
            //let scale = 20;
            //gltf.scene.children[0].children[0].scale.set(scale, scale, scale);
            //gltf.scene.children[0].children[1].rotation.set(0, 0, 0);
            //gltf.scene.children[0].updateMatrixWorld()
           // gltf.scene.children[0].rotateZ(180);
            loadedObject.reinitialize();

            //loadedObject.applyToIk();
        }
        gltfLoader.loadToScene('./assets/adult-male.glb', scene);

        //#endregion
    }

    //#region Render loop
    render()
    {
        this.stats.begin();
        // Goes through all ik objects, update them and solve their ik
        this.iKObjects.forEach((ikObject) =>
        {
            // Object updates before it's ik solved in order to set pole target
            // This will fix issues this weird angles
            ikObject.update();
        });
        this.renderer.render(this.scene, this.camera);
        this.stats.end();
        requestAnimationFrame(() => this.render());
    }
    //#endregion

    //#region Add ControlTransformation
    AddTransformationControl(position)
    {
        let targetControl = new TargetControl(this.camera, this.renderer.domElement, this.orbit);
        targetControl.initialize(position, this.scene);
        return targetControl;
    }

    //#endregion
}
export default App;
