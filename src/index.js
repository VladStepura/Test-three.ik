import * as THREE from "three";
import MyGLTFLoader from "./loaders/MyGLTFLoader";
import "./utils/OrbitControls";
import "./utils/TransformControls";
import IkObject from "./objects/IkObject";


function main()
{
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(1.0, 1.0, 1.0);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    let directionalLight = new THREE.DirectionalLight( 0xffffff, 1);
    scene.add( directionalLight );


    const movingTarget = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    movingTarget.position.z = 2 ;
    const pivot = new THREE.Object3D();
    pivot.add(movingTarget);
    scene.add(pivot);

    //#region Controls
    let orbit = new THREE.OrbitControls( camera, renderer.domElement );
    let control = new THREE.TransformControls( camera, renderer.domElement );
    control.addEventListener('dragging-changed', function ( event ) {
        orbit.enabled = ! event.value;
    });
    control.attach(movingTarget);
    scene.add(control);
    //#endregion


    //#region Loader
    let loadedObject = {};
    const gltfLoader = new MyGLTFLoader();
    gltfLoader.loaded = (gltf) =>
    {
        loadedObject = new IkObject();
        console.log(movingTarget);
        loadedObject.initObject(gltf.scene, movingTarget);
    };

    gltfLoader.loadToScene('./assets/adult-male.glb', scene);
    //#endregion

    //#region Render loop
    function animate() {

        if(loadedObject.ik !== undefined)
        {
            loadedObject.ik.solve();
        }
        renderer.render(scene, camera);

        requestAnimationFrame(animate);
    }
    animate();
    //#endregion
}

main();
