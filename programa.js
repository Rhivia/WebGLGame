/* Variávei globais */
let {mat4, vec4, vec3, vec2} = glMatrix;
// let { getCanvas } = render;

const SPEED = 0.1; // Velocidade

const COS_45 = Math.cos(Math.PI * 0.25); // Calculo para distancia de pontos em um plano cartesiano

const mapSize = 10;

const FPS = 60;

let upArrow = 0, 
    downArrow = 0, 
    leftArrow = 0, 
    rightArrow = 0,
    novaPosicao = [0,0,0],
    pos = [0,0,0];

let frame = 0,
    canvas,
    gl,
    vertexShaderSource,
    fragmentShaderSource,
    vertexShader,
    fragmentShader,
    shaderProgram,
    data,
    positionAttr,
    positionBuffer,
    width,
    height,
    projectionUniform,
    projection,
    loc = [0, 0, 0],
    viewUniform,
    view;

let modelUniform,
    model,
    models,
    player = [],
    playerUpdate = [],
    playerSize = 0;

let colorUniform,
    vermelho = [1, 0, 0],
    black = [0, 0, 0],
    azul = [0, 0, 1],
    verde = [0, .5, 0],
    roxo = [.7, 0, .7],
    laranja = [1, .6, 0],
    azulClaro = [0, 1, 1],
    pink = [1, .5, 1],
    laranjaEscuro = [1, .5, 0]
    azulMedio = [0, .5, 1];

// Variables for view
let eye = [0, 0, 15],
    up = [0, 1, 0],
    center = [0, 0, 0];

//======================================================================================================
//======================================================================================================

function resize() {
    if (!gl) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    gl.viewport(0, 0, width, height);
    let aspect = width / height;
    let near = 0.001;
    let far = 1000;
    let fovy = 1.3;
    projectionUniform = gl.getUniformLocation(shaderProgram, "projection");
    projection = mat4.perspective([], fovy, aspect, near, far);
    gl.uniformMatrix4fv(projectionUniform, false, projection);
}

function getCanvas() {
    return document.querySelector("canvas");
}

function getGLContext(canvas) {
    let gl = canvas.getContext("webgl");
    gl.enable(gl.DEPTH_TEST);
    return gl;
}

function compileShader(source, type, gl) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.error("ERRO NA COMPILAÇÃO", gl.getShaderInfoLog(shader));
    return shader;
}

function linkProgram(vertexShader, fragmentShader, gl) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.error("ERRO NA LINKAGEM");
    return program;
}

function getData() {
    let p = {
        a: [-1, 1, -1],
        b: [-1, -1, -1],
        c: [1, 1, -1],
        d: [1, -1, -1],
        e: [-1, 1, 1],
        f: [1, 1, 1],
        g: [-1, -1, 1],
        h: [1, -1, 1]
    };

    let faces = [
        // FRENTE
        ...p.a, ...p.b, ...p.c,
        ...p.d, ...p.c, ...p.b,

        // TOPO
        ...p.e, ...p.a, ...p.f,
        ...p.c, ...p.f, ...p.a,

        // BAIXO
        ...p.b, ...p.g, ...p.d,
        ...p.h, ...p.d, ...p.g,

        // ESQUERDA
        ...p.e, ...p.g, ...p.a,
        ...p.b, ...p.a, ...p.g,

        // DIREITA
        ...p.c, ...p.d, ...p.f,
        ...p.h, ...p.f, ...p.d,

        //FUNDO
        ...p.f, ...p.h, ...p.e,
        ...p.g, ...p.e, ...p.h
    ];

    return { "points": new Float32Array(faces)};
}

async function main() {
    // 1 - Carregar tela de desenho
    canvas = getCanvas();

    // 2 - Carregar o contexto (API) WebGL
    gl = getGLContext(canvas);

    // 3 - Ler os arquivos de shader
    vertexShaderSource = await fetch("vertex.glsl").then(r => r.text());
    // console.log("VERTEX", vertexShaderSource);

    fragmentShaderSource = await fetch("fragment.glsl").then(r => r.text());
    // console.log("FRAGMENT", fragmentShaderSource);

    // 4 - Compilar arquivos de shader
    vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER, gl);
    fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER, gl);

    // 5 - Linkar o programa de shader
    shaderProgram = linkProgram(vertexShader, fragmentShader, gl);
    gl.useProgram(shaderProgram);

    // 6 - Criar dados de parâmetro
    data = getData();

    // 7 - Transferir os dados para GPU
    positionAttr = gl.getAttribLocation(shaderProgram, "position");
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.points, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttr);
    gl.vertexAttribPointer(positionAttr, 3, gl.FLOAT, false, 0, 0);

    // 7.1 - PROJECTION MATRIX UNIFORM
    resize();
    window.addEventListener("resize", resize);

    // 7.2 - VIEW MATRIX UNIFORM
    view = mat4.lookAt([], eye, center, up);
    viewUniform = gl.getUniformLocation(shaderProgram, "view");
    gl.uniformMatrix4fv(viewUniform, false, view);

    // 7.3 - MODEL MATRIX UNIFORM
    modelUniform = gl.getUniformLocation(shaderProgram, "model");
    
    player[0] = mat4.fromTranslation([], [0, 0, 0]);
    model = mat4.fromTranslation([], [-2, +2, 0]);
    apple = mat4.fromTranslation([], [-4, -2, 0]);

    // 7.4 - COLOR UNIFORM
    colorUniform = gl.getUniformLocation(shaderProgram, "color");
    //gl.uniform2f(locationUniform, loc[0], loc[1]);

    // 8 - Chamar o loop de redesenho
    tick();
}

function tick() {
    frame++;

    if(frame % FPS > 0) {
        return window.requestAnimationFrame(tick);
    }

    let horizontal = (leftArrow + rightArrow);
    let vertical = (upArrow + downArrow);

    novaPosicao[0] += horizontal; // Soma a posicao em X atualizada do Player
    novaPosicao[1] += vertical; // Soma a posicao em Y atualizada do Player

    // Bordas do mapa
    if(novaPosicao[1] > mapSize) { // Y > mapSize
        novaPosicao[1] = -mapSize;
    }
    else if(novaPosicao[1] < -mapSize) { // Y < -mapSize
        novaPosicao[1] = mapSize;
    }
    else if(novaPosicao[0] > mapSize) { // X > mapSize
        novaPosicao[0] = -mapSize;
    }
    else if(novaPosicao[0] < -mapSize) { // X < -mapSize
        novaPosicao[0] = mapSize;
    }

    // Colisão da cabeça com a maçã
    updateSnakePosition(player, novaPosicao);

    // eye  = [Math.sin(time) * 5, 3, Math.cos(time) * 5]; // For movement, use Math.cos and Math.sin with TIME
    let up = [0, 1, 0];
    let center = [0, 0, 0];
    view = mat4.lookAt([], eye, center, up);
    gl.uniformMatrix4fv(viewUniform, false, view);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Redraw
    tickGameObjects();

    window.requestAnimationFrame(tick);
}

function updateSnakePosition(player, novaPosicao) {
    if (novaPosicao[0] == apple[12] && novaPosicao[1] == apple[13]) {
        playerSize++;
        player.push(mat4.fromTranslation([], [apple[12], apple[13], 0]));
        apple = mat4.fromTranslation([], randomApple());
    } else {
        for (let i = 0; i < playerSize; i++) {
            console.log(player[i], playerSize);
            // console.log(novaPosicao);
            playerUpdate[playerSize] = player[i];
            player[i] = mat4.fromTranslation([], novaPosicao);

            if( player.length > 1 ){
                player[i] = playerUpdate[playerSize];
            }
        }
    }
}

function tickGameObjects() {
    // gl.POINTS
    // gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP
    // gl.TRIANGLES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN 
    //gl.drawArrays(gl.TRIANGLES, 0, data.points.length / 2);
    
    for (let i = 0; i < player.length; i++) {
        const element = player[i];
        gl.uniformMatrix4fv(modelUniform, false, element);
        gl.uniform3f(colorUniform, 0, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 36);   
    }
    
    gl.uniformMatrix4fv(modelUniform, false, apple);
    gl.uniform3f(colorUniform, vermelho[0], vermelho[1], vermelho[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    // CUBO 01
    gl.uniformMatrix4fv(modelUniform, false, model);
    gl.uniform3f(colorUniform, verde[0], verde[1], verde[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function randomApple() {
    let X = 1, Y = 1;
    while (X % 2 != 0) {
        X = Math.floor(Math.random() * 20) - 10;
        console.log(X);
    }
    while (Y % 2 != 0) {
        Y = Math.floor(Math.random() * 20) - 10;
        console.log(Y);
    }
    console.log(X, Y);
    return [X, Y, 0];
}

function keyDown(evt){
    if(evt.key === "ArrowDown") {
        rightArrow = 0;
        upArrow = 0;
        leftArrow = 0;
        return downArrow = -2;
    }
    if(evt.key === "ArrowUp") {
        rightArrow = 0;
        downArrow = 0;
        leftArrow = 0;
        return upArrow = 2;
    }
    if(evt.key === "ArrowLeft") {
        rightArrow = 0;
        downArrow = 0;
        upArrow = 0;
        return leftArrow = -2;
    }
    if(evt.key === "ArrowRight") {
        leftArrow = 0;
        downArrow = 0;
        upArrow = 0;
        return rightArrow = 2;
    }
}

// keypress, keydown, keyup
window.addEventListener("load", main);

// function follow(evt) {
//     let locX = evt.x / window.innerWidth * 2 - 1;
//     let locY = evt.y / window.innerHeight * -2 + 1;
//     loc = [locX, locY];
// }
// window.addEventListener("mousemove", follow);

// window.addEventListener("keyup", keyUp);
window.addEventListener("keydown", keyDown);

function createMap(x, y) {
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j++) {
            matriz[i] = [i, j];
        }
    }
}

function renderPlayer(pos) {
    return mat4.fromTranslation([], [pos[0], pos[1], 0]);
}