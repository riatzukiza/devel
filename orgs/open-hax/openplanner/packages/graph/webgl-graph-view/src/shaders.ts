export const LINE_VS = `
  attribute vec2 aPos;
  attribute vec4 aColor;
  attribute float aPhase;

  uniform vec2 uResolution;
  uniform vec2 uPan;
  uniform float uScale;

  varying vec4 vColor;
  varying float vPhase;

  void main() {
    vec2 posPx = aPos * uScale + uPan + 0.5 * uResolution;
    vec2 clip = vec2(
      (posPx.x / max(1.0, uResolution.x)) * 2.0 - 1.0,
1.0 - (posPx.y / max(1.0, uResolution.y)) * 2.0
    );

    gl_Position = vec4(clip, 0.0, 1.0);
    vColor = aColor;
    vPhase = aPhase;
  }
`;

export const LINE_FS = `
  precision mediump float;

  varying vec4 vColor;
  varying float vPhase;

  uniform float uTime;
  uniform float uPulseSpeed;
  uniform float uPulseAmplitude;

  void main() {
    float wave = sin(uTime * uPulseSpeed + vPhase);
    float alpha = clamp(vColor.a * (1.0 + wave * uPulseAmplitude), 0.0, 1.0);
    gl_FragColor = vec4(vColor.rgb, alpha);
  }
`;

export const POINT_VS = `
  attribute vec2 aPos;
  attribute float aSize;
  attribute vec4 aColor;

  uniform vec2 uResolution;
  uniform vec2 uPan;
  uniform float uScale;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  uniform float uAlphaScale;

  varying vec4 vColor;

  void main() {
    vec2 posPx = aPos * uScale + uPan + 0.5 * uResolution;
    vec2 clip = vec2(
      (posPx.x / max(1.0, uResolution.x)) * 2.0 - 1.0,
1.0 - (posPx.y / max(1.0, uResolution.y)) * 2.0
    );

    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio * uSizeScale;
    vColor = vec4(aColor.rgb, aColor.a * uAlphaScale);
  }
`;

export const POINT_FS = `
  precision mediump float;
  varying vec4 vColor;

  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float d2 = dot(p, p);
    if (d2 > 1.0) discard;

    float alpha = (1.0 - d2) * vColor.a;
    gl_FragColor = vec4(vColor.rgb, alpha);
  }
`;
