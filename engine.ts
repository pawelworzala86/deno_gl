import * as gl from "../deno_win32-main/api/Graphics/OpenGL.ts";


var glUniform1i: Deno.PointerValue

export function init(){
    glUniform1i = gl.wglGetProcAddress('glUniform1i')
}

export function display(){
    gl.glClear(gl.GL_COLOR_BUFFER_BIT);
    gl.glBegin(gl.GL_TRIANGLES);
    gl.glColor3f(1.0, 0.0, 0.0);
    gl.glVertex2i(0, 1);
    gl.glColor3f(0.0, 1.0, 0.0);
    gl.glVertex2i(-1, -1);
    gl.glColor3f(0.0, 0.0, 1.0);
    gl.glVertex2i(1, -1);
    gl.glEnd();
    gl.glFlush();
}