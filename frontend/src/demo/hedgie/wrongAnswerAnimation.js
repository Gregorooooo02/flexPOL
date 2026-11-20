import { MathUtils } from 'three';

const smooth = MathUtils.smoothstep;
const pulse = (time, peak, width) => 1 - smooth(Math.abs(time - peak), 0, width);

export const WRONG_ANSWER_DURATION = 2.85;
export const WRONG_ANSWER_STILL_FRAME = 1.05;

export function isWrongAnswerSpeaking(time) {
  return time >= .9 && time < 2.15;
}

export function poseWrongAnswer(model, time, edge, gesture) {
  const { root, body, head, arms, eyes, ears, feet, neutralMouth, openMouth, frown } = model;
  const approach = smooth(time, 0, .58);
  const retreat = smooth(time, 2.12, WRONG_ANSWER_DURATION);
  const reach = approach * (1 - retreat);
  const grip = smooth(time, .06, .43) * (1 - smooth(time, 2.12, 2.48));
  const lean = smooth(time, .26, .82) * (1 - smooth(time, 2.04, 2.55));
  const catchEdge = pulse(time, .58, .17);
  const react = smooth(time, .73, 1.03) * (1 - smooth(time, 1.91, 2.21));
  const shake = gesture === 'shake' ? Math.sin((time - 1.02) * 18) * pulse(time, 1.33, .43) : 0;
  const glance = gesture === 'glance' ? react : 0;
  const huff = gesture === 'huff' ? pulse(time, 1.23, .34) : 0;
  const blink = pulse(time, .74, .085) + pulse(time, 1.88, .09);

  // Reach for the edge during the approach, then settle into the lean.
  root.position.set(edge + 2.25 - 1.93 * reach + .09 * catchEdge, -.29 + .23 * reach, 0);
  root.rotation.set(0, -.17 - .09 * lean, -.18 + .74 * lean);
  body.scale.set(1 + .13 * catchEdge + .08 * huff, 1 - .11 * catchEdge - .10 * huff, 1 + .12 * huff);
  head.rotation.set(.06 + .11 * lean + .23 * huff, -.10 * lean + .31 * shake - .16 * glance, .11 * shake - .10 * glance);
  arms[0].rotation.set(-.47 - .28 * reach, -.28 + .10 * lean, .33 + 1.07 * reach - .28 * lean);
  arms[1].rotation.set(-.36 - .29 * grip - .17 * huff, .35, -.32 - 1.60 * grip);

  for (const [i, eye] of eyes.entries()) {
    const raisedBrow = i === 0 ? glance : 0;
    eye.open.visible = true;
    eye.smile.visible = false;
    eye.open.scale.y = Math.max(.05, 1 - .45 * react - .91 * blink + .17 * raisedBrow);
    eye.pupil.position.set(-.02 * lean - .027 * glance + .017 * shake, -.012 * huff, 0);
    eye.brow.rotation.z = eye.side * (.24 + .59 * react - .37 * raisedBrow);
    eye.brow.position.y = .37 + .043 * raisedBrow;
    eye.brow.scale.set(1.35, 1.18, 1.22);
    ears[i].rotation.z = -eye.side * (.49 + .18 * lean + .18 * huff) + .16 * shake;
    feet[i].rotation.x = 0;
  }

  neutralMouth.visible = false;
  openMouth.visible = false;
  frown.visible = true;
}
