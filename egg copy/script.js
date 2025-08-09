// Egg Symmetry Analyzer - playful / fake analyzer
// Features:
// - image upload & camera capture preview
// - fake progress animation with sections
// - random but repeatable score + silly verdicts
// - downloadable text report

const fileInput = document.getElementById("fileInput");
const cameraBtn = document.getElementById("cameraBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const previewCanvas = document.getElementById("previewCanvas");
const ctx = previewCanvas.getContext("2d");
const overlay = document.getElementById("overlay");
const spinner = document.getElementById("spinner");
const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");
const resultBox = document.getElementById("result");
const scoreEl = document.getElementById("score");
const verdictEl = document.getElementById("verdict");
const explanationEl = document.getElementById("explanation");
const downloadBtn = document.getElementById("downloadBtn");
const rerunBtn = document.getElementById("rerunBtn");

let lastImageData = null;
let currentSeed = null;
let stream = null;

// UTILS
function rand(seed) {
  // simple seeded pseudo-random (LCG) for reproducible results per image
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

// Draw placeholder
ctx.fillStyle = "#061026";
ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
ctx.fillStyle = "#2a3948";
ctx.font = "20px Orbitron, sans-serif";
ctx.textAlign = "center";
ctx.fillText(
  "No egg uploaded yet — drop an egg here!",
  previewCanvas.width / 2,
  previewCanvas.height / 2
);

// ===== IMAGE UPLOAD =====
fileInput.addEventListener("change", async (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  await drawImageToCanvas(url);
  analyzeBtn.disabled = false;
  downloadBtn.disabled = true;
  currentSeed = generateSeedFromImage();
});

// ===== CAMERA CAPTURE =====
cameraBtn.addEventListener("click", async () => {
  if (stream) {
    // stop camera
    stopCamera();
    cameraBtn.textContent = "📷 Use Camera";
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    const video = document.createElement("video");
    video.autoplay = true;
    video.srcObject = stream;
    await video.play();
    // draw one frame when user clicks canvas area
    const clickFn = async () => {
      ctx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
      lastImageData = ctx.getImageData(
        0,
        0,
        previewCanvas.width,
        previewCanvas.height
      );
      analyzeBtn.disabled = false;
      downloadBtn.disabled = true;
      currentSeed = generateSeedFromImage();
      // stop and cleanup
      stopCamera();
      cameraBtn.textContent = "📷 Use Camera";
      previewCanvas.removeEventListener("click", clickFn);
    };
    previewCanvas.addEventListener("click", clickFn);
    cameraBtn.textContent = "✖ Stop Camera (click canvas to capture)";
  } catch (err) {
    alert("Camera not available or permission denied.");
  }
});

function stopCamera() {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
  stream = null;
}

// Draw an image URL centered & scaled on canvas
async function drawImageToCanvas(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  // clear
  ctx.fillStyle = "#061026";
  ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

  // compute fit
  const ratio = Math.min(
    previewCanvas.width / img.width,
    previewCanvas.height / img.height
  );
  const w = img.width * ratio,
    h = img.height * ratio;
  const x = (previewCanvas.width - w) / 2,
    y = (previewCanvas.height - h) / 2;
  ctx.drawImage(img, x, y, w, h);

  // subtle vignette & guide overlay
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(img, x, y, w, h);

  // save image data
  lastImageData = ctx.getImageData(
    0,
    0,
    previewCanvas.width,
    previewCanvas.height
  );
}

// create a small seed from the image pixels (simple)
function generateSeedFromImage() {
  if (!lastImageData) return Math.floor(Math.random() * 1e9);
  const d = lastImageData.data;
  let s = 0;
  // sample some pixels to not be too slow
  for (let i = 0; i < d.length; i += 500) {
    s = (s + d[i] + d[i + 1] + d[i + 2]) % 4294967296;
  }
  return s || Math.floor(Math.random() * 1e9);
}

// ===== ANALYSIS SEQUENCE (fake but dramatic) =====
analyzeBtn.addEventListener("click", async () => {
  if (!lastImageData) {
    alert("Please upload or capture an egg first.");
    return;
  }
  // reset UI
  resultBox.classList.add("hidden");
  spinner.classList.remove("hidden");
  progressWrap.classList.remove("hidden");
  progressBar.style.width = "0%";
  overlay.classList.remove("hidden");
  analyzeBtn.disabled = true;
  downloadBtn.disabled = true;

  // simulated multi-phase analysis
  const phases = [
    { name: "Contour extraction", time: 800 + Math.random() * 800 },
    { name: "Axis alignment", time: 600 + Math.random() * 900 },
    { name: "Curvature scanning", time: 900 + Math.random() * 900 },
    { name: "Symmetry correlation", time: 1000 + Math.random() * 1000 },
    { name: "Quality assurance", time: 700 + Math.random() * 700 },
  ];

  let total = phases.reduce((a, b) => a + b.time, 0);
  let done = 0;

  for (let p of phases) {
    // show small progress tick
    await runPhase(p, (pct) => {
      const overall = Math.min(
        100,
        ((done + (pct / 100) * p.time) / total) * 100
      );
      progressBar.style.width = overall + "%";
    });
    done += p.time;
  }

  // finish animation
  spinner.classList.add("hidden");
  progressWrap.classList.add("hidden");

  // seed-based "random" score so same image produces similar output
  let seed = currentSeed || Date.now();
  // scramble seed a little
  seed = (seed ^ 0x5f3759df) >>> 0;
  // apply LCG to get a reproducible pseudo random number
  for (let i = 0; i < 6; i++) seed = (seed * 1664525 + 1013904223) >>> 0;
  const r = (seed % 10000) / 100; // 0.00 - 100.00
  const symmetryScore = clampToRange(
    r + (Math.random() - 0.5) * 6,
    0,
    100
  ).toFixed(2);

  // verdict logic (silly)
  const verdict = pickVerdict(parseFloat(symmetryScore));
  const explanation = makeExplanation(parseFloat(symmetryScore));

  // show result
  scoreEl.textContent = symmetryScore + "%";
  verdictEl.textContent = verdict;
  explanationEl.textContent = explanation;
  resultBox.classList.remove("hidden");
  overlay.classList.add("hidden");
  analyzeBtn.disabled = false;
  downloadBtn.disabled = false;
  currentSeed = seed; // store for repeat download
});

// helper: run a fake phase
function runPhase(phase, progressCb) {
  return new Promise((resolve) => {
    const start = performance.now();
    const total = phase.time;
    const tick = () => {
      const now = performance.now();
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / total) * 100);
      progressCb(pct);
      if (pct < 100) requestAnimationFrame(tick);
      else setTimeout(resolve, 180); // small pause
    };
    tick();
  });
}

function clampToRange(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// verdicts
function pickVerdict(score) {
  if (score >= 90) return "Exemplary Ellipse — Museum Material 🏛️";
  if (score >= 75) return "Very Symmetrical — Frame it.";
  if (score >= 50) return "Passably Egg-shaped — safe for breakfast.";
  if (score >= 30) return "Asymmetrical — consider flipping to the other side.";
  return "Dangerously Lopsided — emergency omelette recommended 🍳";
}

function makeExplanation(score) {
  if (score >= 90)
    return "Your egg exhibits near-perfect bilateral symmetry. Consider entering it into the World Egg Exhibit.";
  if (score >= 75)
    return "Minor surface irregularities detected but axis alignment is excellent. Good job, humble egg.";
  if (score >= 50)
    return "Slight wobble detected; may roll off curved surfaces. Avoid sloped countertops.";
  if (score >= 30)
    return "Significant asymmetries found — recommend gentle massage (just kidding). Might crack unevenly.";
  return "Severe asymmetry: This egg is probably a mutant. Use for scrambled renaissance art only.";
}

// ===== DOWNLOAD REPORT =====
downloadBtn.addEventListener("click", () => {
  const scoreText = scoreEl.textContent || "N/A";
  const verdict = verdictEl.textContent || "";
  const explanation = explanationEl.textContent || "";
  const now = new Date().toLocaleString();
  const report = [
    "Egg Symmetry Analyzer Report",
    "Generated: " + now,
    "Score: " + scoreText,
    "Verdict: " + verdict,
    "",
    "Notes: " + explanation,
    "",
    "--- This report is intended for fun only ---",
  ].join("\n");

  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "egg_report.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// rerun resets explanation and hides result
rerunBtn.addEventListener("click", () => {
  resultBox.classList.add("hidden");
  explanationEl.textContent = "";
  scoreEl.textContent = "0.0%";
  downloadBtn.disabled = true;
});

// small UX: allow drag and drop on canvas
previewCanvas.addEventListener("dragover", (e) => {
  e.preventDefault();
  previewCanvas.style.opacity = 0.9;
});
previewCanvas.addEventListener("dragleave", (e) => {
  previewCanvas.style.opacity = 1;
});
previewCanvas.addEventListener("drop", async (e) => {
  e.preventDefault();
  previewCanvas.style.opacity = 1;
  const f = e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) {
    const url = URL.createObjectURL(f);
    await drawImageToCanvas(url);
    analyzeBtn.disabled = false;
    downloadBtn.disabled = true;
    currentSeed = generateSeedFromImage();
  }
});

// clicking canvas triggers capture if camera active (handled earlier) OR shows simple zoom
previewCanvas.addEventListener("click", () => {
  // tiny pop to show user
  previewCanvas.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.02)" },
      { transform: "scale(1)" },
    ],
    { duration: 220 }
  );
});

// accessibility fallback: press Enter on analyze button
analyzeBtn.addEventListener("keyup", (e) => {
  if (e.key === "Enter") analyzeBtn.click();
});
