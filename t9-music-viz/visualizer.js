const t = THREE;
const PI = Math.PI;
const TWO_PI = 2 * Math.PI;
const FFT_BIN_SIZE = 512 / 2 ; //Data limit (NOT THE ACTUAL BIN SIZE!)
const inc = TWO_PI/FFT_BIN_SIZE; //this is theta
const MAX_POINTS = 100;
const radius = 30;
let drawCount = 2;
let beat = false; //toggled with p5 and three

//bloom pass
var bloomParams = {
    exposure: 1,
    bloomStrength: 1.5,
    bloomThreshold: 0,
    bloomRadius: 1,
};

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function animate(scene, camera, renderer, controls, composer) {
    let p = scene.getObjectByName('particles');
    let c = scene.getObjectByName('circle');
    let g = scene.getObjectByName('group');
    let ico = scene.getObjectByName('ico');
    if(spectrum){
        let index = index2 = 0;
        let audio_index = 0;
        if(beat){
            //changes lightness of purple based on amplitude
            console.log('changing');
            p.material.color.setHSL(.8, 1, Math.random());
            c.material.color.setHSL(.8, 1, Math.random());
            beat = false;
        }
        c.scale.set((level)+ 1, (level) + 1, 1);
        for( let i=0; i< g.children.length; i++){
            for(var j = 0; j <= TWO_PI; j+=inc){
                let R = spectrum[audio_index % 64].map(0,255, 0, 75); //change amplitude
                // the FFT spectrum
                g.children[i].geometry.attributes.position.array[index++] = (R + (i * 2.5)) * Math.cos(j);
                g.children[i].geometry.attributes.position.array[index++] = (R + (i * 2.5 )) * Math.sin(j);
                g.children[i].geometry.attributes.position.array[index++] = 0;
                audio_index++;
            }
            index = 0;
            g.children[i].geometry.attributes.position.needsUpdate = true;
        }
    }
    g.rotation.z += .001;
    p.rotation.y += .01;
    ico.rotation.x += .01;
    ico.rotation.y += .01;
    // controls.update();
    requestAnimationFrame(() => animate(scene, camera, renderer, controls, composer));
    composer.render();
}

function getParticleSystem(){
    let geometry = new t.Geometry();
    var particleMaterial = new t.PointsMaterial({
        color: 'hsl(288, 100%, 50%)', 
        size: 4,
        map: new t.TextureLoader().load('./assets/particle.jpg'),
        transparent: true,
        blending: t.AdditiveBlending,
        depthWrite: false

    });
    for(let i=0; i< 500; i++ ){
        geometry.vertices.push( new t.Vector3(
            Math.random() * 250 - 125,
            Math.random() * 250 - 125,
            Math.random() * 250 - 125
            
        ));
    }
    geometry.vertices.pop(); //remove last one for 126;
    return new t.Points(geometry, particleMaterial);
}

function getFFTLine(){
    var geometry = new t.BufferGeometry();
    var positions = new Float32Array((FFT_BIN_SIZE + 1) * 3); // 3 vertices per point
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, FFT_BIN_SIZE + 1);
    var material = new t.LineBasicMaterial(
        { color: new t.Color(.8, .5, Math.random()), 
        linewidth: 1 });
    return new t.Line(geometry, material);
}

(function () {
    let scene = new t.Scene();
    scene.background = new t.Color(0x000000);
    let camera = new t.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    let renderer = new t.WebGLRenderer({ alpha: true });
    camera.position.set(0, 0, 120);
    camera.lookAt(0, 0, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);

    //particles in the bg
    let particles = getParticleSystem();
    particles.name= "particles";
    console.log(particles);
    scene.add(particles);
    
    let group = new t.Object3D();
    group.name = "group";
    for(let i=0; i< 10; i++){ //number of lines
      group.add( getFFTLine() );
    }
    console.log(group);
    scene.add(group);
    
    //center circle
    var ico = new t.Mesh( 
        new t.IcosahedronGeometry(radius, 0), 
        new t.MeshBasicMaterial( { color: 0xcc00ff, wireframe: true } )
    );
    ico.name = "ico";
    ico.position.set(0,0,0);

    //pulsing circle
    var circle = new t.Mesh( new t.CircleGeometry( radius/2, 50 ) , new t.MeshBasicMaterial( { color: 'hsl(288, 100%, 50%)'} ));
    circle.name = "circle";
    console.log(circle);
    circle.position.set(0,0,0);

    scene.add( ico );
    scene.add( circle);

    //add the Effect Composer 
    let composer = new t.EffectComposer(renderer);
    let renderpass = new t.RenderPass(scene, camera);
    composer.addPass(renderpass);
    let bloom = new t.UnrealBloomPass( new t.Vector2( window.innerWidth, window.innerHeight ), .5, 0, 0);
    bloom.renderToScreen = true;
    composer.addPass(bloom);

    document.body.appendChild(renderer.domElement);
    //let controls = new t.OrbitControls(camera, renderer.domElement);
    animate(scene, camera, renderer, controls =  null, composer);
})();