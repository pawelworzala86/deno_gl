import * as Wm from "../deno_win32-main/api/UI/WindowsAndMessaging.ts";
import * as gfx from "../deno_win32-main/api/Graphics/Opengl.ts";
import * as Gdi from "../deno_win32-main/api/Graphics/Gdi.ts";

import { display, init } from './engine.ts'



const ps = Gdi.allocPAINTSTRUCT();

let clicks1 = 0, clicks2 = 0;

const cb = new Deno.UnsafeCallback(
  {
    parameters: ["pointer", "u32", "pointer", "pointer"],
    result: "pointer",
  } as const,
  (hWnd, msg, wParam, lParam) => {
    switch (msg) {
      case Wm.WM_PAINT: {
        Gdi.BeginPaint(hWnd, ps);
        Gdi.EndPaint(hWnd, ps);
        return null;
      }

      case Wm.WM_SIZE: {
        const lParamInt = Number(Deno.UnsafePointer.value(lParam));
        gfx.glViewport(0, 0, lParamInt & 0xffff, lParamInt >> 16);
        Wm.PostMessageA(hWnd, Wm.WM_PAINT, null, null);
        return null;
      }

      case Wm.WM_COMMAND: {
        const wParamInt = Number(Deno.UnsafePointer.value(wParam));
        if ((wParamInt & 0xffff) === Wm.BN_CLICKED) {
          if (Deno.UnsafePointer.equals(lParam, button1)) {
            Wm.SendMessageA(
              staticText1,
              Wm.WM_SETTEXT,
              null,
              new TextEncoder().encode(`Clicks: ${++clicks1}\0`),
            );
          } else if (Deno.UnsafePointer.equals(lParam, button2)) {
            Wm.SendMessageA(
              staticText2,
              Wm.WM_SETTEXT,
              null,
              new TextEncoder().encode(`Clicks: ${++clicks2}\0`),
            );
          }
        }
        return null;
      }

      case Wm.WM_CLOSE: {
        Deno.exit(0);
      }
    }
    return Wm.DefWindowProcA(
      hWnd,
      msg,
      wParam,
      lParam,
    );
  },
);

const wc = Wm.allocWNDCLASSA({
  style: Wm.CS_OWNDC,
  lpfnWndProc: cb.pointer,
  lpszClassName: "OpenGL",
});

if (!Wm.RegisterClassA(wc)) {
  Wm.MessageBoxA(
    null,
    "RegisterClass() failed: Cannot register window class.",
    "Error",
    0,
  );
  Deno.exit(1);
}

function createOpenGLWindow(
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
  type: number,
  flags: number,
) {
  const hWnd = Wm.CreateWindowExA(
    Wm.WS_EX_OVERLAPPEDWINDOW,
    "OpenGL",
    title,
    Wm.WS_OVERLAPPEDWINDOW | Wm.WS_CLIPSIBLINGS | Wm.WS_CLIPCHILDREN,
    x,
    y,
    width,
    height,
    null,
    null,
    null,
    null,
  );

  if (!hWnd) {
    Wm.MessageBoxA(
      null,
      "CreateWindowEx() failed: Cannot create a window.",
      "Error",
      0,
    );
    return;
  }

  const hdc = Gdi.GetDC(hWnd);

  const pfd = gfx.allocPIXELFORMATDESCRIPTOR({
    nSize: 40,
    nVersion: 1,
    dwFlags: gfx.PFD_DRAW_TO_WINDOW | gfx.PFD_SUPPORT_OPENGL | flags,
    iPixelType: type,
    cColorBits: 32,
  });

  const pf = gfx.ChoosePixelFormat(hdc, pfd);
  if (!pf) {
    Wm.MessageBoxA(
      null,
      "ChoosePixelFormat() failed: Cannot find a suitable pixel format.",
      "Error",
      0,
    );
    return;
  }

  if (!gfx.SetPixelFormat(hdc, pf, pfd)) {
    Wm.MessageBoxA(
      null,
      "SetPixelFormat() failed: Cannot set format specified.",
      "Error",
      0,
    );
    return;
  }

  gfx.DescribePixelFormat(hdc, pf, pfd.byteLength, pfd);

  Gdi.ReleaseDC(hWnd, hdc);

  return hWnd;
}

const msg = Wm.allocMSG();

const hWnd = createOpenGLWindow(
  "Deno Win32 OpenGL",
  0,
  0,
  800,
  600,
  gfx.PFD_TYPE_RGBA,
  0,
);
if (!hWnd) {
  Deno.exit(1);
}
/*
const button1 = Wm.CreateWindowExA(
  0,
  "Button",
  "button1",
  Wm.WS_CHILD | Wm.WS_VISIBLE,
  50,
  50,
  200,
  25,
  hWnd,
  null,
  null,
  null,
);
const button2 = Wm.CreateWindowExA(
  0,
  "Button",
  "button2",
  Wm.WS_CHILD | Wm.WS_VISIBLE,
  50,
  100,
  200,
  75,
  hWnd,
  null,
  null,
  null,
);
const staticText1 = Wm.CreateWindowExA(
  0,
  "Static",
  "Clicks: 0",
  Wm.WS_CHILD | Wm.WS_VISIBLE,
  50,
  200,
  200,
  23,
  hWnd,
  null,
  null,
  null,
);
const staticText2 = Wm.CreateWindowExA(
  0,
  "Static",
  "Clicks: 0",
  Wm.WS_CHILD | Wm.WS_VISIBLE,
  50,
  230,
  200,
  23,
  hWnd,
  null,
  null,
  null,
);*/

const hDC = Gdi.GetDC(hWnd);
const hRC = gfx.wglCreateContext(hDC);
gfx.wglMakeCurrent(hDC, hRC);

Wm.ShowWindow(hWnd, 1);

addEventListener("unload", () => {
  gfx.wglMakeCurrent(null, null);
  Gdi.ReleaseDC(hWnd, hDC);
  gfx.wglDeleteContext(hRC);
  Wm.DestroyWindow(hWnd);
});

init()

while (true) {
  display();
  gfx.SwapBuffers(hDC);

  while (Wm.PeekMessageA(msg, null, 0, 0, Wm.PM_REMOVE)) {
    Wm.TranslateMessage(msg);
    Wm.DispatchMessageA(msg);
  }
}
