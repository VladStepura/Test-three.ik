import * as THREE from "three";
import MyGLTFLoader from "./loaders/MyGLTFLoader";
import {OrbitControls} from "./utils/OrbitControls";
import {TransformControls} from "./utils/TransformControls";
import IkObject from "./objects/IkObject";


function main()
{
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


    //#region moving tragets

    const headMovingTarget = CreateMovingTarget(new THREE.Vector3(-2, 1.5, 0));
    const rightHandMovingTarget = CreateMovingTarget(new THREE.Vector3(-2, 1.5, 0));
    const leftHandMovingTarget = CreateMovingTarget(new THREE.Vector3(2, 1.5, 0));
    const leftLegMovingTarget = CreateMovingTarget(new THREE.Vector3(2, -1.5, 0));
    const rightLegMovingTarget = CreateMovingTarget(new THREE.Vector3(-2, -1.5, 0));
    //#endregion

    //#region Controls
    let orbit = new OrbitControls( camera, renderer.domElement );

    AddTransformationControl(rightHandMovingTarget);
    AddTransformationControl(leftHandMovingTarget);
    AddTransformationControl(leftLegMovingTarget);
    AddTransformationControl(rightLegMovingTarget);
    //#endregion


    //#region Loader
    let loadedObject = {};
    const gltfLoader = new MyGLTFLoader();
    gltfLoader.loaded = (gltf) =>
    {
        loadedObject = new IkObject();
        loadedObject.initObject(gltf.scene, rightHandMovingTarget, leftHandMovingTarget, leftLegMovingTarget, rightLegMovingTarget);
        console.log(gltf.scene);
    };

    gltfLoader.loadToScene('./assets/adult-male.glb', scene);
    //#endregion

    //#region Raycasting
/*    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let onClickPosition = new THREE.Vector2();
    let intersected = false;
    let intersectedObject = null;
    function onMouseMove( evt )
    {
        evt.preventDefault();
        let array = getMousePosition( renderer.domElement, evt.clientX, evt.clientY );
        onClickPosition.fromArray( array );
        let intersects = getIntersects( onClickPosition, scene.children);
        console.log(intersects.length);
        if ( intersects.length > 0 && intersects[ 0 ].uv )
        {
            intersected = true;
            intersectedObject = intersects[0];
           // var uv = intersects[ 0 ].uv;
            //intersects[ 0 ].object.material.map.transformUv( uv );
           // canvas.setCrossPosition( uv.x, uv.y );
            console.log(intersectedObject);
        }
        else
        {
            intersected = false;
        }
        //console.log(scene.children);

    }
    let getMousePosition = function ( dom, x, y )
    {
        let rect = dom.getBoundingClientRect();
        return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];
    };

    let getIntersects = function ( point, objects )
    {
        mouse.set((point.x * 2) - 1, -(point.y * 2) + 1);
        raycaster.setFromCamera(mouse, camera);

        return raycaster.intersectObjects(objects);
    }*/
    //#endregion

    //#region Render loop
    function animate()
    {

        if(loadedObject.ik !== undefined)
        {
            loadedObject.ik.solve();
        }
        renderer.render(scene, camera);

        requestAnimationFrame(animate);
    }
   // window.addEventListener( 'mousemove', onMouseMove, false );
   /* window.addEventListener( 'click', () =>
    {
        if(intersected)
        {
            let control = new TransformControls( camera, renderer.domElement );
            control.addEventListener('dragging-changed', function ( event ) {
                orbit.enabled = ! event.value;
            });
            control.attach(intersectedObject.object.parent);
            scene.add(control);
        }
        //console.log(scene.children[3].children[0].children[1].skeleton.bones);
      //  console.log("mouse.x: " + mouse.x + " " + "mouse.y: " + mouse.y);
    }, false );*/
    animate();
    //#endregion

    //#region Add ControlTransformation
    function AddTransformationControl(target)
    {
        let control = new TransformControls( camera, renderer.domElement );
        control.addEventListener('dragging-changed', function ( event )
        {
            orbit.enabled = ! event.value;
        });
        control.attach(target);
        scene.add(control);
    }

    function CreateMovingTarget(position)
    {
        const movingTarget = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        movingTarget.position.z = position.z;
        movingTarget.position.y = position.y;;
        movingTarget.position.x = position.x;
        scene.add(movingTarget);
        return movingTarget;
    }
    //#endregion
}

main();
