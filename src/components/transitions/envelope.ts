let active = false;

function createPart(className: string) {
  const el = document.createElement("div");
  el.className = className;
  return el;
}

function styleSealHalf(el: HTMLDivElement, side: "left" | "right") {
  el.style.position = "absolute";
  el.style.inset = "0";
  el.style.borderRadius = "999px";
  el.style.background =
    "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12), rgba(122,11,21,0.62) 55%, rgba(0,0,0,0.72) 100%)";
  el.style.border = "1px solid rgba(255,255,255,0.14)";
  el.style.boxShadow = "0 12px 40px rgba(0,0,0,0.6)";
  el.style.clipPath =
    side === "left" ? "polygon(0 0, 52% 0, 48% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 48% 100%)";
}

export async function playEnvelopeTransition() {
  if (active) return;
  if (typeof document === "undefined") return;

  active = true;

  const overlay = document.createElement("div");
  overlay.className = "ua-envelope-overlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "10000";
  overlay.style.display = "grid";
  overlay.style.placeItems = "center";
  overlay.style.background = "rgba(0,0,0,0.66)";

  const overlayNoise = createPart("ua-envelope-noise");
  overlayNoise.style.position = "absolute";
  overlayNoise.style.inset = "0";
  overlayNoise.style.pointerEvents = "none";
  overlayNoise.style.opacity = "0.2";
  overlayNoise.style.mixBlendMode = "overlay";
  overlayNoise.style.backgroundImage =
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 2px, transparent 5px)";

  const overlayFlash = createPart("ua-envelope-flash");
  overlayFlash.style.position = "absolute";
  overlayFlash.style.inset = "0";
  overlayFlash.style.pointerEvents = "none";
  overlayFlash.style.opacity = "0";
  overlayFlash.style.backgroundImage =
    "radial-gradient(500px 260px at 40% 50%, rgba(122,11,21,0.35), transparent 60%)";

  const frame = createPart("ua-envelope-frame");
  frame.style.position = "relative";
  frame.style.width = "min(360px, 80vw)";
  frame.style.height = "min(240px, 60vh)";
  frame.style.display = "grid";
  frame.style.placeItems = "center";
  frame.style.perspective = "900px";

  const envelope = createPart("ua-envelope");
  envelope.style.width = "260px";
  envelope.style.height = "170px";
  envelope.style.transform = "translateZ(0)";

  const body = createPart("ua-envelope-body");
  body.style.position = "relative";
  body.style.width = "100%";
  body.style.height = "100%";
  body.style.borderRadius = "18px";
  body.style.background =
    "radial-gradient(520px 240px at 15% 25%, rgba(122,11,21,0.22), transparent 55%), radial-gradient(420px 260px at 82% 18%, rgba(255,255,255,0.05), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.52))";
  body.style.border = "1px solid rgba(255,255,255,0.12)";
  body.style.boxShadow = "0 30px 80px rgba(0,0,0,0.7)";
  body.style.overflow = "hidden";

  const bodyCrack = createPart("ua-envelope-body-crack");
  bodyCrack.style.position = "absolute";
  bodyCrack.style.inset = "0";
  bodyCrack.style.pointerEvents = "none";
  bodyCrack.style.opacity = "0.22";
  bodyCrack.style.backgroundImage =
    "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.08) 38%, transparent 44%), linear-gradient(65deg, transparent 0%, rgba(255,255,255,0.06) 45%, transparent 52%), radial-gradient(650px 420px at 20% 20%, rgba(122,11,21,0.18), transparent 60%)";
  bodyCrack.style.maskImage =
    "radial-gradient(260px 120px at 25% 15%, rgba(0,0,0,0.9) 0%, transparent 75%), radial-gradient(320px 160px at 85% 30%, rgba(0,0,0,0.8) 0%, transparent 75%), radial-gradient(420px 180px at 55% 85%, rgba(0,0,0,0.85) 0%, transparent 70%)";

  const letter = createPart("ua-envelope-letter");
  letter.style.position = "absolute";
  letter.style.left = "16px";
  letter.style.right = "16px";
  letter.style.bottom = "16px";
  letter.style.height = "74%";
  letter.style.borderRadius = "14px";
  letter.style.border = "1px solid rgba(255,255,255,0.12)";
  letter.style.background =
    "radial-gradient(240px 160px at 30% 20%, rgba(255,255,255,0.08), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
  letter.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.35)";
  letter.style.transform = "translateY(56px)";

  const letterInk = createPart("ua-envelope-letter-ink");
  letterInk.style.position = "absolute";
  letterInk.style.inset = "14px 18px";
  letterInk.style.borderRadius = "10px";
  letterInk.style.opacity = "0.7";
  letterInk.style.backgroundImage =
    "linear-gradient(180deg, rgba(255,255,255,0.06), transparent), radial-gradient(260px 160px at 30% 40%, rgba(122,11,21,0.16), transparent 70%)";

  const flap = createPart("ua-envelope-flap");
  flap.style.position = "absolute";
  flap.style.left = "-1px";
  flap.style.right = "-1px";
  flap.style.top = "-1px";
  flap.style.height = "58%";
  flap.style.background = "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(0,0,0,0))";
  flap.style.borderBottom = "1px solid rgba(255,255,255,0.08)";
  flap.style.transformOrigin = "top";
  flap.style.transform = "rotateX(0deg)";

  const sealWrap = createPart("ua-envelope-seal-wrap");
  sealWrap.style.position = "absolute";
  sealWrap.style.left = "50%";
  sealWrap.style.top = "56%";
  sealWrap.style.width = "52px";
  sealWrap.style.height = "52px";
  sealWrap.style.transform = "translate(-50%, -50%)";
  sealWrap.style.borderRadius = "999px";
  sealWrap.style.transformStyle = "preserve-3d";

  const sealLeft = createPart("ua-envelope-seal-left");
  const sealRight = createPart("ua-envelope-seal-right");
  styleSealHalf(sealLeft, "left");
  styleSealHalf(sealRight, "right");

  const sealMark = createPart("ua-envelope-seal-mark");
  sealMark.style.position = "absolute";
  sealMark.style.inset = "10px";
  sealMark.style.borderRadius = "999px";
  sealMark.style.border = "1px solid rgba(255,255,255,0.14)";
  sealMark.style.display = "grid";
  sealMark.style.placeItems = "center";
  sealMark.style.color = "rgba(255,255,255,0.75)";
  sealMark.style.fontSize = "16px";
  sealMark.style.fontWeight = "700";
  sealMark.style.letterSpacing = "0.22em";
  sealMark.style.paddingLeft = "0.22em";
  sealMark.textContent = "N";

  const sealCrack = createPart("ua-envelope-seal-crack");
  sealCrack.style.position = "absolute";
  sealCrack.style.inset = "-6px";
  sealCrack.style.opacity = "0";
  sealCrack.style.backgroundImage =
    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.32) 40%, rgba(122,11,21,0.55) 52%, rgba(255,255,255,0.22) 60%, transparent 100%)";
  sealCrack.style.transform = "rotate(16deg)";
  sealCrack.style.filter = "blur(0.2px)";

  sealWrap.appendChild(sealLeft);
  sealWrap.appendChild(sealRight);
  sealWrap.appendChild(sealMark);
  sealWrap.appendChild(sealCrack);

  const brand = createPart("ua-envelope-brand");
  brand.style.position = "absolute";
  brand.style.left = "18px";
  brand.style.bottom = "18px";
  brand.style.display = "grid";
  brand.style.gap = "4px";
  brand.style.pointerEvents = "none";

  const brandZh = document.createElement("div");
  brandZh.textContent = "未知事務所";
  brandZh.style.fontSize = "12px";
  brandZh.style.fontWeight = "700";
  brandZh.style.letterSpacing = "0.32em";
  brandZh.style.color = "rgba(255,255,255,0.78)";
  brandZh.style.textShadow = "0 1px 0 rgba(0,0,0,0.4)";
  brandZh.style.paddingLeft = "0.32em";

  const brandEn = document.createElement("div");
  brandEn.textContent = "UNIDENTIFIED AFFAIRS";
  brandEn.style.fontSize = "10px";
  brandEn.style.letterSpacing = "0.22em";
  brandEn.style.color = "rgba(255,255,255,0.38)";
  brandEn.style.paddingLeft = "0.22em";

  brand.appendChild(brandZh);
  brand.appendChild(brandEn);

  const chips = Array.from({ length: 7 }).map(() => {
    const chip = createPart("ua-wax-chip");
    const size = 4 + Math.random() * 4;
    chip.style.position = "absolute";
    chip.style.left = "50%";
    chip.style.top = "56%";
    chip.style.width = `${size}px`;
    chip.style.height = `${size}px`;
    chip.style.borderRadius = "2px";
    chip.style.background = "rgba(122,11,21,0.85)";
    chip.style.boxShadow = "0 6px 18px rgba(0,0,0,0.55)";
    chip.style.opacity = "0";
    return chip;
  });

  overlay.appendChild(overlayNoise);
  overlay.appendChild(overlayFlash);
  body.appendChild(letter);
  letter.appendChild(letterInk);
  body.appendChild(flap);
  body.appendChild(sealWrap);
  body.appendChild(bodyCrack);
  body.appendChild(brand);
  for (const chip of chips) body.appendChild(chip);
  envelope.appendChild(body);
  frame.appendChild(envelope);
  overlay.appendChild(frame);

  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  document.body.appendChild(overlay);

  const finish = () => {
    overlay.remove();
    document.body.style.overflow = prevOverflow;
    active = false;
  };

  const ms = 1380;
  const overlayAnim = overlay.animate(
    [
      { opacity: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, offset: 0.86 },
      { opacity: 0 },
    ],
    { duration: ms, easing: "ease", fill: "forwards" },
  );

  overlayNoise.animate(
    [
      { transform: "translate3d(0,0,0)", opacity: 0.0 },
      { transform: "translate3d(-1px,2px,0)", opacity: 0.2, offset: 0.2 },
      { transform: "translate3d(1px,-1px,0)", opacity: 0.2 },
    ],
    { duration: 220, iterations: Infinity, easing: "steps(2, end)" },
  );

  overlayFlash.animate(
    [
      { opacity: 0 },
      { opacity: 0, offset: 0.34 },
      { opacity: 1, offset: 0.42 },
      { opacity: 0, offset: 0.55 },
      { opacity: 0 },
    ],
    { duration: ms, easing: "ease", fill: "forwards" },
  );

  const envelopeAnim = envelope.animate(
    [
      { transform: "scale(0.98) translateY(6px)", filter: "blur(1px)" },
      { transform: "scale(1) translateY(0px)", filter: "blur(0px)", offset: 0.18 },
      { transform: "scale(1) translateY(0px)", filter: "blur(0px)" },
    ],
    { duration: ms, easing: "ease", fill: "forwards" },
  );

  envelope.animate(
    [
      { transform: "translateX(0px)" },
      { transform: "translateX(0px)", offset: 0.32 },
      { transform: "translateX(-2px)", offset: 0.38 },
      { transform: "translateX(3px)", offset: 0.42 },
      { transform: "translateX(-1px)", offset: 0.46 },
      { transform: "translateX(0px)", offset: 0.52 },
      { transform: "translateX(0px)" },
    ],
    { duration: ms, easing: "ease", fill: "forwards" },
  );

  const flapAnim = flap.animate(
    [
      { transform: "rotateX(0deg)" },
      { transform: "rotateX(0deg)", offset: 0.58 },
      { transform: "rotateX(-70deg)", offset: 0.78 },
      { transform: "rotateX(-115deg)" },
    ],
    { duration: ms, easing: "ease", fill: "forwards" },
  );

  const letterAnim = letter.animate(
    [
      { transform: "translateY(56px)", opacity: 0.85 },
      { transform: "translateY(56px)", opacity: 0.85, offset: 0.64 },
      { transform: "translateY(-6px)", opacity: 1, offset: 0.84 },
      { transform: "translateY(-16px)", opacity: 0 },
    ],
    { duration: ms, easing: "ease", fill: "forwards" },
  );

  const sealCrackAnim = sealCrack.animate(
    [
      { opacity: 0 },
      { opacity: 0, offset: 0.28 },
      { opacity: 1, offset: 0.36 },
      { opacity: 0.25, offset: 0.48 },
      { opacity: 0, offset: 0.64 },
      { opacity: 0 },
    ],
    { duration: ms, easing: "ease", fill: "forwards" },
  );

  const sealLeftAnim = sealLeft.animate(
    [
      { transform: "translateX(0px) rotate(0deg)", filter: "saturate(1.05)" },
      { transform: "translateX(0px) rotate(0deg)", offset: 0.36 },
      { transform: "translateX(-10px) rotate(-9deg)", offset: 0.54 },
      { transform: "translateX(-18px) rotate(-16deg)", opacity: 0.0, offset: 0.76 },
      { transform: "translateX(-18px) rotate(-16deg)", opacity: 0.0 },
    ],
    { duration: ms, easing: "ease", fill: "forwards" },
  );

  const sealRightAnim = sealRight.animate(
    [
      { transform: "translateX(0px) rotate(0deg)", filter: "saturate(1.05)" },
      { transform: "translateX(0px) rotate(0deg)", offset: 0.36 },
      { transform: "translateX(10px) rotate(9deg)", offset: 0.54 },
      { transform: "translateX(18px) rotate(16deg)", opacity: 0.0, offset: 0.76 },
      { transform: "translateX(18px) rotate(16deg)", opacity: 0.0 },
    ],
    { duration: ms, easing: "ease", fill: "forwards" },
  );

  const sealMarkAnim = sealMark.animate(
    [
      { transform: "scale(1)", opacity: 0.9 },
      { transform: "scale(1.05)", opacity: 1, offset: 0.44 },
      { transform: "scale(0.92)", opacity: 0, offset: 0.70 },
      { transform: "scale(0.92)", opacity: 0 },
    ],
    { duration: ms, easing: "ease", fill: "forwards" },
  );

  const chipAnims = chips.map((chip) => {
    const dx = (-24 + Math.random() * 48).toFixed(1);
    const dy = (-26 - Math.random() * 26).toFixed(1);
    const rot = (-160 + Math.random() * 320).toFixed(0);
    return chip.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.9)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(0.9)", opacity: 0, offset: 0.30 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg) scale(1)`, opacity: 1, offset: 0.42 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${Number(dy) - 14}px)) rotate(${rot}deg) scale(0.9)`, opacity: 0, offset: 0.72 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${Number(dy) - 14}px)) rotate(${rot}deg) scale(0.9)`, opacity: 0 },
      ],
      { duration: ms, easing: "ease", fill: "forwards" },
    );
  });

  await Promise.race([
    Promise.allSettled([
      overlayAnim.finished,
      envelopeAnim.finished,
      flapAnim.finished,
      letterAnim.finished,
      sealCrackAnim.finished,
      sealLeftAnim.finished,
      sealRightAnim.finished,
      sealMarkAnim.finished,
      ...chipAnims.map((a) => a.finished),
    ]).then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, ms + 40)),
  ]);

  finish();
}
