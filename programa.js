/* Variávei globais */
let { mat4, vec4, vec3, vec2 } = glMatrix;

const mapSize = 10,
    FPS = 20; // Qnt menor, mais rapido o jogo 

let upArrow = 0,
    downArrow = 0,
    leftArrow = 0,
    rightArrow = 0,
    novaPosicao = [0, 0, 0],
    pos = [0, 0, 0],
    /////////////////
    frame = 0,
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
    normalAttr,
    normalBuffer,
    width,
    height,
    projectionUniform,
    projection,
    loc = [0, 0, 0],
    viewUniform,
    view,
    /////////////////
    modelUniform,
    model,
    player = [],
    playerSize = 1,
    desanhou = true,
    score = 0,
    objetivo = 15,
    gameLoop = true,
    /////////////////
    colorUniform,
    vermelho = [1, 0, 0],
    verde = [0, .5, 0];

// Variables for view
let eye = [0, -20, 15],
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

    let n = {
        frente: [0, 0, -1],
        topo: [0, 1, 0],
        baixo: [0, -1, 0],
        esquerda: [-1, 0, 0],
        direita: [1, 0, 0],
        fundo: [0, 0, 1],
    };

    let faceNormals = {
        frente: [...n.frente, ...n.frente, ...n.frente, ...n.frente, ...n.frente, ...n.frente],
        topo: [...n.topo, ...n.topo, ...n.topo, ...n.topo, ...n.topo, ...n.topo],
        baixo: [...n.baixo, ...n.baixo, ...n.baixo, ...n.baixo, ...n.baixo, ...n.baixo],
        esquerda: [...n.esquerda, ...n.esquerda, ...n.esquerda, ...n.esquerda, ...n.esquerda, ...n.esquerda],
        direita: [...n.direita, ...n.direita, ...n.direita, ...n.direita, ...n.direita, ...n.direita],
        fundo: [...n.fundo, ...n.fundo, ...n.fundo, ...n.fundo, ...n.fundo, ...n.fundo],
    };

    let normals = [
        ...faceNormals.frente,
        ...faceNormals.topo,
        ...faceNormals.baixo,
        ...faceNormals.esquerda,
        ...faceNormals.direita,
        ...faceNormals.fundo
    ];

    return { "points": new Float32Array(faces), "normals": new Float32Array(normals) };
}

async function main() {
    // 1 - Carregar tela de desenho
    canvas = getCanvas();

    // 2 - Carregar o contexto (API) WebGL
    gl = getGLContext(canvas);

    // 3 - Ler os arquivos de shader
    vertexShaderSource = await fetch("vertex.glsl").then(r => r.text());
    fragmentShaderSource = await fetch("fragment.glsl").then(r => r.text());

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

    normalAttr = gl.getAttribLocation(shaderProgram, "normal");
    normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalAttr);
    gl.vertexAttribPointer(normalAttr, 3, gl.FLOAT, false, 0, 0);

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
    model = mat4.fromRotationTranslationScale([], [0, 0, 0, 1], [0, 0, -2], [11, 11, 1]);
    apple = mat4.fromTranslation([], [-4, -2, 0]);

    // 7.4 - COLOR UNIFORM
    colorUniform = gl.getUniformLocation(shaderProgram, "color");

    // 8 - Chamar o loop de redesenho
    tick();
}

function tick() {
    if (gameLoop == true) {
        frame++;

        if (frame % FPS > 0) {
            return window.requestAnimationFrame(tick);
        }

        let horizontal = (leftArrow + rightArrow),
            vertical = (upArrow + downArrow);

        novaPosicao[0] += horizontal; // Soma a posicao em X atualizada do Player
        novaPosicao[1] += vertical; // Soma a posicao em Y atualizada do Player

        // Bordas do mapa
        if (novaPosicao[1] > mapSize) { // Y > mapSize
            novaPosicao[1] = -mapSize;
        }
        else if (novaPosicao[1] < -mapSize) { // Y < -mapSize
            novaPosicao[1] = mapSize;
        }
        else if (novaPosicao[0] > mapSize) { // X > mapSize
            novaPosicao[0] = -mapSize;
        }
        else if (novaPosicao[0] < -mapSize) { // X < -mapSize
            novaPosicao[0] = mapSize;
        }

        // Colisão da cabeça com a maçã
        updateSnakePosition(player, novaPosicao);

        let up = [0, 1, 0],
            center = [0, 0, 0];

        view = mat4.lookAt([], eye, center, up);
        gl.uniformMatrix4fv(viewUniform, false, view);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Redraw
        tickGameObjects();

        window.requestAnimationFrame(tick);
    }
}

function updateSnakePosition(player, novaPosicao) {

    if (checkHit(novaPosicao[0], novaPosicao[1])) {
        gameLoop = false;
        document.getElementById("score").innerHTML = "Perdeu!";
        document.getElementById("score").style.color = "red";
        window.setTimeout(reseta, 1500);
    }

    if (novaPosicao[0] == apple[12] && novaPosicao[1] == apple[13]) {
        playerSize++;
        score++;
        document.getElementById("score").innerHTML = "Pontuação atual: " + score + "";

        // Condição de vitória
        if (score == objetivo) {
            gameLoop = false;
            document.getElementById("score").innerHTML = "Venceu!";
            document.getElementById("score").style.color = "green";
            window.setTimeout(reseta, 1500);
        }
        player.unshift(mat4.fromTranslation([], [apple[12], apple[13], 0]));

        apple = mat4.fromTranslation([], randomApple());
    } else {
        for (let i = playerSize; i > 0; i--) {
            player[i] = player[i - 1];
        }
        player[0] = mat4.fromTranslation([], novaPosicao);
    }
}

function reseta() {
    location.reload();
}

function tickGameObjects() {
    document.getElementById("objetivo").innerText = `Objetivo: ${objetivo}`;
    for (let i = 0; i < player.length; i++) {
        const element = player[i];
        gl.uniformMatrix4fv(modelUniform, false, element);
        gl.uniform3f(colorUniform, 1, 1, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }

    gl.uniformMatrix4fv(modelUniform, false, apple);
    gl.uniform3f(colorUniform, vermelho[0], vermelho[1], vermelho[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    // CUBO 01
    gl.uniformMatrix4fv(modelUniform, false, model);
    gl.uniform3f(colorUniform, verde[0], verde[1], verde[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    desenhou = true;
}

function randomApple() {
    let X = 1, Y = 1;
    let hit = true;

    while (hit) {
        while (X % 2 != 0) {
            X = Math.floor(Math.random() * 20) - 10;
        }
        while (Y % 2 != 0) {
            Y = Math.floor(Math.random() * 20) - 10;
        }

        hit = checkHit(X, Y);
        if (hit) {
            X = 1;
            Y = 1;
        }
    }
    return [X, Y, 0];
}

function checkHit(X, Y) {
    for (let i = 1; i < playerSize; i++) {
        if (X == player[i][12] && Y == player[i][13]) {
            return true;
        }
    }
    return false;
}

function keyDown(evt) {
    if (desenhou == true) {
        desenhou = false;

        if (evt.key === "ArrowDown" && upArrow === 0) {
            rightArrow = 0;
            upArrow = 0;
            leftArrow = 0;
            return downArrow = -2;

        } else if (evt.key === "ArrowUp" && downArrow === 0) {
            rightArrow = 0;
            downArrow = 0;
            leftArrow = 0;
            return upArrow = 2;

        } else if (evt.key === "ArrowLeft" && rightArrow === 0) {
            rightArrow = 0;
            downArrow = 0;
            upArrow = 0;
            return leftArrow = -2;

        } else if (evt.key === "ArrowRight" && leftArrow === 0) {
            leftArrow = 0;
            downArrow = 0;
            upArrow = 0;
            return rightArrow = 2;
        } else if ( (evt.key === "+" || evt.key === "m") && objetivo > score + 1 && objetivo < 100) {
            objetivo += 1;
        } else if ( (evt.key === "-" || evt.key === "n") && objetivo > score + 1 && objetivo < 100) {
            objetivo -= 1;
        }
    }
}

window.addEventListener("load", main);
window.addEventListener("keydown", keyDown);
