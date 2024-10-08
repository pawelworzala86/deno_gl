import {
  createWindow,
  getProcAddress,
  mainloop,
} from "https://deno.land/x/dwm@0.3.4/mod.ts";
import * as gl from "../../gluten-main/api/gles23.2.ts";

const window = createWindow({
  title: 'GL Window',
  width: 800,
  height: 600,
  resizable: true,
  glVersion: [3, 2],
  gles: true,
});

gl.load(getProcAddress);

function loadShader(type: number, src: string) {
  const shader = gl.CreateShader(type);
  gl.ShaderSource(
    shader,
    1,
    new Uint8Array(
      new BigUint64Array([
        BigInt(
          Deno.UnsafePointer.value(
            Deno.UnsafePointer.of(new TextEncoder().encode(src)),
          ),
        ),
      ]).buffer,
    ),
    new Int32Array([src.length]),
  );
  gl.CompileShader(shader);
  const status = new Int32Array(1);
  gl.GetShaderiv(shader, gl.COMPILE_STATUS, status);
  if (status[0] === gl.FALSE) {
    const logLength = new Int32Array(1);
    gl.GetShaderiv(shader, gl.INFO_LOG_LENGTH, logLength);
    const log = new Uint8Array(logLength[0]);
    gl.GetShaderInfoLog(shader, logLength[0], logLength, log);
    console.log(new TextDecoder().decode(log));
    gl.DeleteShader(shader);
    return 0;
  }
  return shader;
}





async function loadFile(path){
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(await Deno.readFile(path));
  return text
}


const vShaderSrc = await loadFile('./shaders/default.vert')
const fShaderSrc = await loadFile('./shaders/default.frag')




const vShader = loadShader(gl.VERTEX_SHADER, vShaderSrc);
const fShader = loadShader(gl.FRAGMENT_SHADER, fShaderSrc);

const program = gl.CreateProgram();
gl.AttachShader(program, vShader);
gl.AttachShader(program, fShader);

gl.BindAttribLocation(program, 0, new TextEncoder().encode("vPosition\0"));

gl.LinkProgram(program);

const status = new Int32Array(1);
gl.GetProgramiv(program, gl.LINK_STATUS, status);
if (status[0] === gl.FALSE) {
  const logLength = new Int32Array(1);
  gl.GetProgramiv(program, gl.INFO_LOG_LENGTH, logLength);
  const log = new Uint8Array(logLength[0]);
  gl.GetProgramInfoLog(program, logLength[0], logLength, log);
  console.log(new TextDecoder().decode(log));
  gl.DeleteProgram(program);
  Deno.exit(1);
}

gl.ClearColor(0.0, 0.0, 0.0, 1.0);

addEventListener("resize", (event) => {
  gl.Viewport(0, 0, event.width, event.height);
});

var vertices = [1.0,0.9,0.0,1.0,-1.0,0.0,-1.0,-1.0,0.0,1.0,1.0,0.0,-1.0,-1.0,0.0,-1.0,1.0,0.0]
var coords = [1.0,1.0,1.0,0.0,0.0,0.0,1.0,1.0,0.0,0.0,0.0,1.0]

var array32 = new Float32Array(vertices)

gl.VertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, array32);
gl.EnableVertexAttribArray(0);

function frame() {
  gl.Clear(gl.COLOR_BUFFER_BIT);
  gl.UseProgram(program);
  // deno-fmt-ignore

  array32[0] = 0.5
  
  gl.DrawArrays(gl.TRIANGLES, 0, vertices.length);
  window.swapBuffers();
}

await mainloop(frame);
