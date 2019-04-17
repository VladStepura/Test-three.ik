import * as THREE from "three";
import {GLTFLoader} from "./GLTFLoader";
/*
Loader for GLTF Models
*/
class MyGLTFLoader
{
    constructor()
    {
        this.loader = new GLTFLoader();
        this.loaded = (gltf) => {};
    }

    //Loading model to scene
    loadToScene(src, scene)
    {
        this.loader.load(
            // resource URL
            src,
            // called when the resource is loaded
            ( gltf ) =>
            {
                console.log(gltf.scene.children[0].position );
                gltf.scene.children[0].position.set(0, 0,0 );
                scene.add( gltf.scene );
                gltf.scene.children[0].updateMatrixWorld();
                this.loaded(gltf);
            },
            function ( xhr )
            {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            //Throwing Error
            function ( error )
            {
                console.log( 'An error happened: ' + error );
            }
        );
    }
}
export default MyGLTFLoader;
