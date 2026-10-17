(() => {
  "use strict";

  const W = 1080;
  const H = 1920;
  const FRAME_VERSION = "2026-10-17";
  const frameGrid = document.getElementById("frameGrid");
  const canvas = document.getElementById("composition");
  const ctx = canvas.getContext("2d", { alpha: false });
  const video = document.getElementById("liveVideo");
  const loading = document.getElementById("stageLoading");
  const status = document.getElementById("status");
  const caption = document.getElementById("stageCaption");
  const hint = document.getElementById("studioHint");
  const progressText = document.getElementById("progressText");
  const shotList = document.getElementById("shotList");
  const finish = document.getElementById("finish");
  const openCameraButton = document.getElementById("openCamera");
  const captureButton = document.getElementById("capture");
  const switchCameraButton = document.getElementById("switchCamera");
  const uploadButton = document.getElementById("uploadPhoto");
  const uploadHelp = document.getElementById("uploadHelp");
  const languageToggle = document.getElementById("languageToggle");
  const languageLabel = document.getElementById("languageLabel");
  const openCameraLabel = document.getElementById("openCameraLabel");
  const config = window.PHOTOBOOTH_CONFIG || {};
  const endpoint = config.uploadEndpoint || "";
  const uploadReady = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)
    && location.origin === config.siteOrigin;

  const translations = {
    ms: {
      heroEyebrow: "KENANGAN HARI BAHAGIA", heroTitle: "Satu foto, seribu kenangan.", start: "Mula",
      chooseFrame: "Pilih bingkai", all: "Semua", collageShort: "4 foto", portraitShort: "1 foto", fullShort: "Foto penuh",
      takePhoto: "Ambil foto", loading: "Memuatkan…", capture: "Ambil", flip: "Tukar", phoneCamera: "Kamera telefon",
      choosePhoto: "Pilih foto", save: "Simpan", album: "Album", openCamera: "Kamera", restartCamera: "Mula semula kamera",
      switchLanguage: "Switch to English", frameAria: "Bingkai {id}, {type}", frameCaption: "Bingkai {id} · {type}",
      hintCollage: "4 foto, satu demi satu.", hintSingle: "1 foto sahaja.", progressCollage: "4 foto", progressSingle: "1 foto",
      shotEmpty: "Foto {number}", shotDone: "Foto {number} dipilih.",
      initial: "Pilih bingkai.", selected: "Bingkai dipilih.", cameraUnavailable: "Kamera tidak tersedia. Gunakan kamera telefon.",
      cameraError: "Kamera gagal dibuka. Cuba kamera telefon.", cameraReadyCollage: "Ambil foto {number}/4.", cameraReadySingle: "Kamera sedia.",
      complete: "Sedia untuk simpan.", nextShot: "Seterusnya: foto {number}/4.", retake: "Ambil semula foto {number}", frameError: "Bingkai gagal dimuatkan.",
      captureError: "Gagal ambil foto. Cuba lagi.", fileError: "Foto gagal dibaca. Cuba JPG atau PNG.", newSession: "Sesi baharu.",
      saveShared: "Pilih cara simpan dalam menu telefon.", saved: "Muat turun bermula.", saveError: "Gagal simpan foto. Cuba lagi.",
      uploading: "Menghantar ke album…", uploadSuccess: "Foto tersimpan dalam album.", uploadError: "Muat naik gagal. Simpan foto dahulu.",
      uploadHelpInactive: "Drive belum tersedia.", uploadHelpPreview: "Uji album di laman HTTPS.", uploadHelpActive: "Album tersedia.", confirmSwitch: "Tukar bingkai dan kosongkan foto sesi ini?",
      filterAria: "Jenis bingkai", previewAria: "Pratonton foto", progressAria: "Kemajuan foto", shareTitle: "Kenangan Hana & Fiqri"
    },
    en: {
      heroEyebrow: "YOUR BIG DAY", heroTitle: "One photo, a thousand memories.", start: "Start",
      chooseFrame: "Choose a frame", all: "All", collageShort: "4 photos", portraitShort: "1 photo", fullShort: "Full photo",
      takePhoto: "Take a photo", loading: "Loading…", capture: "Capture", flip: "Flip", phoneCamera: "Phone camera",
      choosePhoto: "Choose photo", save: "Save", album: "Album", openCamera: "Camera", restartCamera: "Restart camera",
      switchLanguage: "Tukar ke Bahasa Melayu", frameAria: "Frame {id}, {type}", frameCaption: "Frame {id} · {type}",
      hintCollage: "4 photos, one at a time.", hintSingle: "Just 1 photo.", progressCollage: "4 photos", progressSingle: "1 photo",
      shotEmpty: "Photo {number}", shotDone: "Photo {number} selected.",
      initial: "Choose a frame.", selected: "Frame selected.", cameraUnavailable: "Camera unavailable. Use phone camera.",
      cameraError: "Could not open camera. Try phone camera.", cameraReadyCollage: "Take photo {number}/4.", cameraReadySingle: "Camera ready.",
      complete: "Ready to save.", nextShot: "Next: photo {number}/4.", retake: "Retake photo {number}", frameError: "Could not load frame.",
      captureError: "Could not capture. Try again.", fileError: "Could not read photo. Try JPG or PNG.", newSession: "New session.",
      saveShared: "Choose a save option on your phone.", saved: "Download started.", saveError: "Could not save photo. Try again.",
      uploading: "Sending to album…", uploadSuccess: "Photo saved to album.", uploadError: "Upload failed. Save your photo first.",
      uploadHelpInactive: "Drive not ready.", uploadHelpPreview: "Test album on the HTTPS site.", uploadHelpActive: "Album available.", confirmSwitch: "Change frame and clear this session's photos?",
      filterAria: "Frame types", previewAria: "Photo preview", progressAria: "Photo progress", shareTitle: "Hana & Fiqri Memories"
    }
  };

  function t(key, values = {}) {
    return (translations[state.lang][key] || key).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
  }

  const collageSlots = [
    { x: 143, y: 301, w: 320, h: 531, angle: 0.109 },
    { x: 642, y: 312, w: 327, h: 531, angle: 0 },
    { x: 114, y: 1044, w: 332, h: 531, angle: 0 },
    { x: 639, y: 1044, w: 331, h: 531, angle: 0 }
  ];
  const portraitSlots = [{ x: 194, y: 429, w: 682, h: 1095, angle: 0 }];
  const fullSlots = [{ x: 0, y: 0, w: W, h: H, angle: 0 }];

  const state = {
    frameId: 9,
    lang: "ms",
    statusKey: "initial",
    statusTone: "",
    statusParams: {},
    overlay: null,
    shots: [],
    activeIndex: 0,
    stream: null,
    facingMode: "user",
    rendering: false,
    loadingFrame: false
  };

  function groupFor(id) {
    return id <= 4 ? "collage" : id <= 8 ? "portrait" : "full";
  }

  function slotsFor(id) {
    const group = groupFor(id);
    return group === "collage" ? collageSlots : group === "portrait" ? portraitSlots : fullSlots;
  }

  function labelFor(id) {
    const group = groupFor(id);
    return t(group === "collage" ? "collageShort" : group === "portrait" ? "portraitShort" : "fullShort");
  }

  function renderStatus() {
    status.textContent = t(state.statusKey, state.statusParams);
    status.className = `status${state.statusTone ? ` is-${state.statusTone}` : ""}`;
  }

  function setStatus(key, tone = "", params = {}) {
    state.statusKey = key;
    state.statusTone = tone;
    state.statusParams = params;
    renderStatus();
  }

  function updateFrameText() {
    const id = state.frameId;
    caption.textContent = t("frameCaption", { id: String(id).padStart(2, "0"), type: labelFor(id) });
    hint.textContent = t(id <= 4 ? "hintCollage" : "hintSingle");
    progressText.textContent = t(id <= 4 ? "progressCollage" : "progressSingle");
  }

  function updateCameraLabel() {
    openCameraLabel.textContent = t(state.stream ? "restartCamera" : "openCamera");
  }

  function updateUploadHelp() {
    uploadHelp.textContent = t(!endpoint ? "uploadHelpInactive" : uploadReady ? "uploadHelpActive" : "uploadHelpPreview");
  }

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(element => { element.textContent = t(element.dataset.i18n); });
    languageLabel.textContent = state.lang === "ms" ? "EN" : "BM";
    languageToggle.setAttribute("aria-label", t("switchLanguage"));
    languageToggle.title = t("switchLanguage");
    document.querySelector(".filter-row").setAttribute("aria-label", t("filterAria"));
    canvas.setAttribute("aria-label", t("previewAria"));
    shotList.setAttribute("aria-label", t("progressAria"));
    document.querySelectorAll(".frame-card").forEach(button => {
      const id = Number(button.dataset.frame);
      button.setAttribute("aria-label", t("frameAria", { id, type: labelFor(id) }));
      button.querySelector(".frame-meta small").textContent = labelFor(id);
    });
    updateFrameText();
    updateCameraLabel();
    updateUploadHelp();
    updateShotList();
    renderStatus();
  }

  function switchLanguage() {
    state.lang = state.lang === "ms" ? "en" : "ms";
    try { localStorage.setItem("hf-photobooth-language", state.lang); } catch (_) { /* storage may be unavailable */ }
    applyLanguage();
  }

  function makeGallery() {
    for (let id = 1; id <= 14; id += 1) {
      const button = document.createElement("button");
      button.className = "frame-card";
      button.type = "button";
      button.dataset.frame = String(id);
      button.dataset.group = groupFor(id);
      button.setAttribute("aria-label", t("frameAria", { id, type: labelFor(id) }));
      button.setAttribute("aria-pressed", String(id === state.frameId));
      button.innerHTML = `<img src="frames/${id}.png?v=${FRAME_VERSION}" loading="lazy" alt=""><span class="frame-meta"><strong>${String(id).padStart(2, "0")}</strong><small>${labelFor(id)}</small></span>`;
      button.addEventListener("click", () => selectFrame(id, true));
      frameGrid.append(button);
    }
  }

  function setFilter(filter) {
    document.querySelectorAll(".filter").forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".frame-card").forEach(button => {
      button.hidden = filter !== "all" && button.dataset.group !== filter;
    });
  }

  function inSlot(x, y, slot) {
    const dx = x - slot.x;
    const dy = y - slot.y;
    const c = Math.cos(slot.angle);
    const s = Math.sin(slot.angle);
    const localX = dx * c + dy * s;
    const localY = -dx * s + dy * c;
    return localX >= 1 && localX < slot.w - 1 && localY >= 1 && localY < slot.h - 1;
  }

  function isCheckerPixel(r, g, b) {
    // The guide's grey/white squares have anti-aliased edges. Keep the cream
    // lace and blue ribbon, but remove the entire neutral checker palette.
    return r >= 195 && g >= r - 1 && b >= g - 1 && g - r <= 12 && b - g <= 14;
  }

  function inDecorationZone(x, y, id) {
    if (id <= 4) {
      return (x >= 135 && x < 470 && y >= 295 && y < 405) ||
        (x >= 635 && x < 715 && y >= 755 && y < 855) ||
        (x >= 790 && x < 975 && y >= 1035 && y < 1155);
    }
    return (x >= 190 && x < 885 && y >= 425 && y < 530) ||
      (x >= 830 && x < 885 && y >= 530 && y < 700);
  }

  function makeDecorationLayer(guide, id) {
    const buffer = document.createElement("canvas");
    buffer.width = W;
    buffer.height = H;
    const bufferCtx = buffer.getContext("2d", { willReadFrequently: true });
    bufferCtx.drawImage(guide, 0, 0, W, H);
    const imageData = bufferCtx.getImageData(0, 0, W, H);
    const rgba = imageData.data;
    const slots = slotsFor(id);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const i = (y * W + x) * 4;
        if (!inDecorationZone(x, y, id) || !slots.some(slot => inSlot(x, y, slot)) ||
            isCheckerPixel(rgba[i], rgba[i + 1], rgba[i + 2])) rgba[i + 3] = 0;
      }
    }
    bufferCtx.putImageData(imageData, 0, 0);
    return buffer;
  }

  async function loadOverlay(id) {
    const image = new Image();
    image.src = `frames/${id}.png?v=${FRAME_VERSION}`;
    await image.decode();
    if (id >= 9) return image;
    const guide = new Image();
    guide.src = `frames/decoration-guides/${id}.png?v=${FRAME_VERSION}`;
    await guide.decode();
    return { background: image, foreground: makeDecorationLayer(guide, id) };
  }

  async function selectFrame(id, scroll = false) {
    if (state.loadingFrame) return;
    if (id === state.frameId && state.overlay) {
      if (scroll) document.getElementById("studio").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (id !== state.frameId && state.shots.some(Boolean) && !window.confirm(t("confirmSwitch"))) return;
    state.loadingFrame = true;
    loading.hidden = false;
    stopCamera();
    state.frameId = id;
    state.shots = Array(slotsFor(id).length).fill(null);
    state.activeIndex = 0;
    finish.hidden = true;
    document.querySelectorAll(".frame-card").forEach(button => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.frame) === id));
    });
    updateFrameText();
    updateShotList();
    try {
      state.overlay = await loadOverlay(id);
      drawComposition();
      setStatus("selected");
    } catch (error) {
      state.overlay = null;
      setStatus("frameError", "error");
    } finally {
      loading.hidden = true;
      state.loadingFrame = false;
    }
    if (scroll) document.getElementById("studio").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function drawCover(source, slot) {
    const sourceW = source.videoWidth || source.naturalWidth || source.width;
    const sourceH = source.videoHeight || source.naturalHeight || source.height;
    if (!sourceW || !sourceH) return;
    const scale = Math.max(slot.w / sourceW, slot.h / sourceH);
    const dw = sourceW * scale;
    const dh = sourceH * scale;
    ctx.save();
    ctx.translate(slot.x, slot.y);
    ctx.rotate(slot.angle);
    ctx.beginPath();
    ctx.rect(0, 0, slot.w, slot.h);
    ctx.clip();
    ctx.drawImage(source, (slot.w - dw) / 2, (slot.h - dh) / 2, dw, dh);
    ctx.restore();
  }

  function drawComposition() {
    const decorated = state.frameId <= 8;
    if (decorated && state.overlay) ctx.drawImage(state.overlay.background, 0, 0, W, H);
    else {
      ctx.fillStyle = "#e4eef5";
      ctx.fillRect(0, 0, W, H);
    }
    const slots = slotsFor(state.frameId);
    slots.forEach((slot, index) => {
      const source = state.shots[index] || (index === state.activeIndex && state.stream && video.readyState >= 2 ? video : null);
      if (source) drawCover(source, slot);
      else if (!decorated) {
        ctx.save();
        ctx.translate(slot.x, slot.y);
        ctx.rotate(slot.angle);
        ctx.fillStyle = "#eff5f8";
        ctx.fillRect(0, 0, slot.w, slot.h);
        ctx.restore();
      }
    });
    if (state.overlay) ctx.drawImage(decorated ? state.overlay.foreground : state.overlay, 0, 0, W, H);
  }

  function renderLoop() {
    if (!state.stream) {
      state.rendering = false;
      return;
    }
    drawComposition();
    requestAnimationFrame(renderLoop);
  }

  function stopCamera() {
    if (state.stream) state.stream.getTracks().forEach(track => track.stop());
    state.stream = null;
    video.srcObject = null;
    captureButton.disabled = true;
    switchCameraButton.hidden = true;
    updateCameraLabel();
  }

  async function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("cameraUnavailable", "error");
      return;
    }
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: state.facingMode }, width: { ideal: 1280 }, height: { ideal: 1920 } } });
      state.stream = stream;
      video.srcObject = stream;
      await video.play();
      captureButton.disabled = false;
      switchCameraButton.hidden = false;
      updateCameraLabel();
      setStatus(state.shots.length === 4 ? "cameraReadyCollage" : "cameraReadySingle", "", { number: state.activeIndex + 1 });
      if (!state.rendering) {
        state.rendering = true;
        requestAnimationFrame(renderLoop);
      }
    } catch (error) {
      stopCamera();
      setStatus("cameraError", "error");
    }
  }

  async function imageFromVideo() {
    const still = document.createElement("canvas");
    still.width = video.videoWidth;
    still.height = video.videoHeight;
    still.getContext("2d").drawImage(video, 0, 0);
    const image = new Image();
    image.src = still.toDataURL("image/jpeg", 0.91);
    await image.decode();
    return image;
  }

  async function imageFromFile(file) {
    if (!file || !file.type.startsWith("image/")) throw new Error("Not an image");
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    } finally {
      // Decoded image pixels remain available after the temporary URL is revoked.
      URL.revokeObjectURL(url);
    }
  }

  function acceptShot(image) {
    state.shots[state.activeIndex] = image;
    const next = state.shots.findIndex(shot => !shot);
    if (next < 0) {
      stopCamera();
      finish.hidden = false;
      setStatus("complete", "success");
      document.getElementById("finish").scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      state.activeIndex = next;
      setStatus("nextShot", "success", { number: next + 1 });
    }
    updateShotList();
    drawComposition();
  }

  function updateShotList() {
    shotList.replaceChildren();
    const count = slotsFor(state.frameId).length;
    for (let i = 0; i < count; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `shot-chip${state.shots[i] ? " is-done" : ""}${i === state.activeIndex && !state.shots[i] ? " is-current" : ""}`;
      button.textContent = `${state.shots[i] ? "✓ " : ""}${t("shotEmpty", { number: i + 1 })}`;
      button.title = t(state.shots[i] ? "retake" : "shotEmpty", { number: i + 1 });
      button.addEventListener("click", () => {
        if (state.shots[i]) state.shots[i] = null;
        state.activeIndex = i;
        finish.hidden = true;
        setStatus("shotDone", "", { number: i + 1 });
        updateShotList();
        drawComposition();
      });
      shotList.append(button);
    }
  }

  function blobFromCanvas(type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Cannot export image")), type, quality);
    });
  }

  async function savePhoto() {
    if (state.shots.some(shot => !shot)) return;
    drawComposition();
    try {
      const blob = await blobFromCanvas("image/jpeg", 0.92);
      const name = `Hana-Fiqri-Photobooth-${String(state.frameId).padStart(2, "0")}-${Date.now()}.jpg`;
      const file = new File([blob], name, { type: "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: t("shareTitle") });
          setStatus("saveShared", "success");
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setStatus("saved", "success");
    } catch (error) {
      setStatus("saveError", "error");
    }
  }

  function readBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function uploadPhoto() {
    if (!uploadReady || state.shots.some(shot => !shot)) return;
    uploadButton.disabled = true;
    updateUploadHelp();
    setStatus("uploading");
    try {
      drawComposition();
      const blob = await blobFromCanvas("image/jpeg", 0.84);
      if (blob.size > 4 * 1024 * 1024) throw new Error("Image too large");
      const requestId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
      const base64 = await readBase64(blob);
      const iframe = document.createElement("iframe");
      iframe.name = `upload_${requestId}`;
      iframe.hidden = true;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = endpoint;
      form.target = iframe.name;
      const fields = {
        requestId,
        imageBase64: base64,
        origin: location.origin,
        fileName: `HF_${Date.now()}_${state.frameId}.jpg`
      };
      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(iframe, form);
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => finishUpload(new Error("Upload timed out")), 60000);
        function onMessage(event) {
          if (!/^https:\/\/(script\.google\.com|[^/]+\.googleusercontent\.com)$/.test(event.origin)) return;
          if (!event.data || event.data.type !== "hf-photo-upload" || event.data.requestId !== requestId) return;
          finishUpload(event.data.ok ? null : new Error(event.data.message || "Upload rejected"));
        }
        function finishUpload(error) {
          clearTimeout(timer);
          window.removeEventListener("message", onMessage);
          iframe.remove();
          form.remove();
          error ? reject(error) : resolve();
        }
        window.addEventListener("message", onMessage);
        form.submit();
      });
      setStatus("uploadSuccess", "success");
    } catch (error) {
      setStatus("uploadError", "error");
    } finally {
      uploadButton.disabled = false;
      updateUploadHelp();
    }
  }

  document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
  openCameraButton.addEventListener("click", openCamera);
  captureButton.addEventListener("click", async () => {
    if (!state.stream || video.readyState < 2) return;
    captureButton.disabled = true;
    try { acceptShot(await imageFromVideo()); }
    catch (error) { setStatus("captureError", "error"); }
    finally { captureButton.disabled = !state.stream; }
  });
  switchCameraButton.addEventListener("click", () => {
    state.facingMode = state.facingMode === "user" ? "environment" : "user";
    openCamera();
  });
  document.getElementById("phoneCamera").addEventListener("click", () => document.getElementById("cameraFile").click());
  document.getElementById("choosePhoto").addEventListener("click", () => document.getElementById("libraryFile").click());
  for (const id of ["cameraFile", "libraryFile"]) {
    const input = document.getElementById(id);
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) return;
      try { acceptShot(await imageFromFile(file)); }
      catch (error) { setStatus("fileError", "error"); }
    });
  }
  document.getElementById("savePhoto").addEventListener("click", savePhoto);
  uploadButton.addEventListener("click", uploadPhoto);
  document.getElementById("startOver").addEventListener("click", () => {
    stopCamera();
    state.shots = Array(slotsFor(state.frameId).length).fill(null);
    state.activeIndex = 0;
    finish.hidden = true;
    updateShotList();
    drawComposition();
    setStatus("newSession");
  });
  window.addEventListener("pagehide", stopCamera);

  try { if (localStorage.getItem("hf-photobooth-language") === "en") state.lang = "en"; } catch (_) { /* storage may be unavailable */ }
  makeGallery();
  if (uploadReady) {
    uploadButton.disabled = false;
  }
  languageToggle.addEventListener("click", switchLanguage);
  applyLanguage();
  selectFrame(9);
})();
