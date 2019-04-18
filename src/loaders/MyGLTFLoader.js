import {GLTFLoader} from "./GLTFLoader";

// MyGLTFLoader is loader for .gltf and .glb models
class MyGLTFLoader
{
    constructor()
    {
        this.loader = new GLTFLoader();
        this.loaded = (gltf) => {};
    }

    // Loading model to scene
    loadToScene(src, scene)
    {
        this.loader.load(
            // Resource URL
            src,
            // Called when the resource is loaded
            ( gltf ) =>
            {
                console.log(gltf.scene.children[0].position );
                gltf.scene.children[0].position.set(0, 0,0 );
                scene.add( gltf.scene );
                gltf.scene.children[0].updateMatrixWorld();
                this.loaded(gltf);
            },
            // Loading progress
            function ( xhr )
            {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // Throwing Error
            function ( error )
            {
                console.log( 'An error happened: ' + error );
            }
        );
    }
}
export default MyGLTFLoader;
