(() => {
  "use strict";

  const W = 1080;
  const H = 1920;
  const MAX_VIDEO_BYTES = 24 * 1024 * 1024;
  const VIDEO_CHUNK_BYTES = 1024 * 1024;
  const FRAME_VERSION = "2026-10-18";
  const frameGrid = document.getElementById("frameGrid");
  const canvas = document.getElementById("composition");
  const ctx = canvas.getContext("2d", { alpha: false });
  const videoPreview = document.getElementById("videoPreview");
  const cameraButton = document.getElementById("phoneCamera");
  const cameraChoices = document.getElementById("cameraChoices");
  const loading = document.getElementById("stageLoading");
  const status = document.getElementById("status");
  const caption = document.getElementById("stageCaption");
  const hint = document.getElementById("studioHint");
  const progressText = document.getElementById("progressText");
  const shotList = document.getElementById("shotList");
  const finish = document.getElementById("finish");
  const saveButton = document.getElementById("savePhoto");
  const saveHelp = document.getElementById("saveHelp");
  const albumUploads = document.getElementById("albumUploads");
  const albumList = document.getElementById("albumList");
  const languageToggle = document.getElementById("languageToggle");
  const languageLabel = document.getElementById("languageLabel");
  const config = window.PHOTOBOOTH_CONFIG || {};
  const endpoint = config.uploadEndpoint || "";
  const uploadReady = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)
    && location.origin === config.siteOrigin;

  const translations = {
    ms: {
      chooseFrame: "Pilih bingkai", all: "Semua", collageShort: "4 foto", portraitShort: "1 foto", fullShort: "Foto penuh",
      takePhoto: "Ambil foto", loading: "Memuatkan…", phoneCamera: "Camera", photoChoice: "Foto", videoChoice: "Video",
      choosePhoto: "Pilih foto", save: "Simpan", myUploads: "Album saya", delete: "Padam",
      switchLanguage: "Switch to English", frameAria: "Bingkai {id}, {type}", frameCaption: "Bingkai {id} · {type}",
      hintCollage: "4 foto, satu demi satu.", hintSingle: "1 foto sahaja.", progressCollage: "4 foto", progressSingle: "1 foto",
      shotEmpty: "Foto {number}", shotDone: "Foto {number} dipilih.",
      initial: "Pilih bingkai.", selected: "Bingkai dipilih.",
      complete: "Sedia untuk simpan.", nextShot: "Seterusnya: foto {number}/4.", retake: "Ambil semula foto {number}", frameError: "Bingkai gagal dimuatkan.",
      fileError: "Foto gagal dibaca. Cuba JPG atau PNG.", newSession: "Sesi baharu.",
      saving: "Menyimpan…", savedBoth: "Album disimpan. Semak foto di telefon.", savedAlbum: "Album disimpan; simpanan telefon belum selesai.",
      savedPhone: "Album gagal. Tekan Simpan lagi.", savedPhoneOnly: "Album belum tersedia. Simpan ke telefon sahaja.", saveError: "Gagal simpan. Cuba lagi.",
      saveHelpActive: "Telefon + album", saveHelpPreview: "Telefon sahaja dalam pratonton", saveHelpInactive: "Telefon sahaja",
      deleteConfirm: "Padam daripada album?", deleting: "Memadam…", deleted: "Dipadam daripada album.", deleteError: "Gagal padam. Cuba lagi.",
      albumItem: "Tersimpan dalam album", albumPreview: "Pratonton foto anda yang dimuat naik ke album", deleteUnavailable: "Padam belum tersedia untuk foto ini.",
      videoCaption: "Video · tanpa bingkai", videoProgress: "1 video", videoSelected: "Video sedia untuk disimpan.",
      videoTooLarge: "Video terlalu besar (maksimum 24 MB). Rakam video lebih pendek.", videoTypeError: "Format video tidak disokong. Cuba MP4, MOV atau WebM.",
      videoUploading: "Muat naik video {number}/{total}…", videoAlbumItem: "Video dalam album",
      confirmSwitch: "Tukar bingkai dan kosongkan foto sesi ini?",
      filterAria: "Jenis bingkai", previewAria: "Pratonton foto", progressAria: "Kemajuan foto", shareTitle: "Kenangan Hana & Fiqri"
    },
    en: {
      chooseFrame: "Choose a frame", all: "All", collageShort: "4 photos", portraitShort: "1 photo", fullShort: "Full photo",
      takePhoto: "Take a photo", loading: "Loading…", phoneCamera: "Camera", photoChoice: "Photo", videoChoice: "Video",
      choosePhoto: "Choose photo", save: "Save", myUploads: "My album", delete: "Delete",
      switchLanguage: "Tukar ke Bahasa Melayu", frameAria: "Frame {id}, {type}", frameCaption: "Frame {id} · {type}",
      hintCollage: "4 photos, one at a time.", hintSingle: "Just 1 photo.", progressCollage: "4 photos", progressSingle: "1 photo",
      shotEmpty: "Photo {number}", shotDone: "Photo {number} selected.",
      initial: "Choose a frame.", selected: "Frame selected.",
      complete: "Ready to save.", nextShot: "Next: photo {number}/4.", retake: "Retake photo {number}", frameError: "Could not load frame.",
      fileError: "Could not read photo. Try JPG or PNG.", newSession: "New session.",
      saving: "Saving…", savedBoth: "Album saved. Check your phone copy.", savedAlbum: "Album saved; phone save not completed.",
      savedPhone: "Album failed. Tap Save again.", savedPhoneOnly: "Album unavailable. Phone copy only.", saveError: "Could not save. Try again.",
      saveHelpActive: "Phone + album", saveHelpPreview: "Phone only in preview", saveHelpInactive: "Phone only",
      deleteConfirm: "Delete from album?", deleting: "Deleting…", deleted: "Deleted from album.", deleteError: "Could not delete. Try again.",
      albumItem: "Saved in album", albumPreview: "Preview of your photo uploaded to the album", deleteUnavailable: "Delete is not available for this photo yet.",
      videoCaption: "Video · no frame", videoProgress: "1 video", videoSelected: "Video ready to save.",
      videoTooLarge: "Video is too large (24 MB maximum). Record a shorter clip.", videoTypeError: "Unsupported video. Try MP4, MOV or WebM.",
      videoUploading: "Uploading video {number}/{total}…", videoAlbumItem: "Video in album",
      confirmSwitch: "Change frame and clear this session's photos?",
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
    videoFile: null,
    videoUrl: "",
    videoMimeType: "",
    activeIndex: 0,
    loadingFrame: false,
    saving: false,
    compositionVersion: 0,
    uploadedVersion: -1,
    uploadedFileId: "",
    phoneSavedVersion: -1,
    ownedUploads: []
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
    caption.textContent = state.videoFile ? t("videoCaption") :
      t("frameCaption", { id: String(id).padStart(2, "0"), type: labelFor(id) });
    hint.textContent = state.videoFile ? t("videoCaption") : t(id <= 4 ? "hintCollage" : "hintSingle");
    progressText.textContent = state.videoFile ? t("videoProgress") : t(id <= 4 ? "progressCollage" : "progressSingle");
  }

  function updateSaveHelp() {
    saveHelp.textContent = t(!endpoint ? "saveHelpInactive" : uploadReady ? "saveHelpActive" : "saveHelpPreview");
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
    updateSaveHelp();
    updateShotList();
    renderOwnedUploads();
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
    if (state.loadingFrame || state.saving) return;
    if (id === state.frameId && state.overlay) {
      if (scroll) document.getElementById("studio").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (id !== state.frameId && (state.shots.some(Boolean) || state.videoFile) && !window.confirm(t("confirmSwitch"))) return;
    state.loadingFrame = true;
    loading.hidden = false;
    clearVideo();
    state.frameId = id;
    state.shots = Array(slotsFor(id).length).fill(null);
    state.activeIndex = 0;
    state.compositionVersion += 1;
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
      const source = state.shots[index];
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

  function clearVideo() {
    videoPreview.pause();
    videoPreview.removeAttribute("src");
    videoPreview.load();
    videoPreview.hidden = true;
    canvas.hidden = false;
    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
    state.videoFile = null;
    state.videoUrl = "";
    state.videoMimeType = "";
  }

  function videoMimeType(file) {
    const declared = String(file.type || "").toLowerCase();
    if (["video/mp4", "video/quicktime", "video/webm"].includes(declared)) return declared;
    if (declared) return "";
    const extension = String(file.name || "").toLowerCase().match(/\.(mp4|mov|webm)$/);
    return extension ? { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" }[extension[1]] : "";
  }

  function acceptVideo(file) {
    const mimeType = videoMimeType(file);
    if (!mimeType) return setStatus("videoTypeError", "error");
    if (file.size > MAX_VIDEO_BYTES) return setStatus("videoTooLarge", "error");
    clearVideo();
    state.videoFile = file;
    state.videoMimeType = mimeType;
    state.videoUrl = URL.createObjectURL(file);
    videoPreview.src = state.videoUrl;
    videoPreview.hidden = false;
    canvas.hidden = true;
    state.compositionVersion += 1;
    finish.hidden = false;
    updateFrameText();
    updateShotList();
    setStatus("videoSelected", "success");
    document.getElementById("finish").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function acceptShot(image) {
    if (state.saving) return;
    if (state.videoFile) {
      clearVideo();
      updateFrameText();
    }
    state.shots[state.activeIndex] = image;
    state.compositionVersion += 1;
    const next = state.shots.findIndex(shot => !shot);
    if (next < 0) {
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
    if (state.videoFile) {
      const chip = document.createElement("span");
      chip.className = "shot-chip is-done";
      chip.textContent = `✓ ${t("videoChoice")}`;
      shotList.append(chip);
      return;
    }
    const count = slotsFor(state.frameId).length;
    for (let i = 0; i < count; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `shot-chip${state.shots[i] ? " is-done" : ""}${i === state.activeIndex && !state.shots[i] ? " is-current" : ""}`;
      button.textContent = `${state.shots[i] ? "✓ " : ""}${t("shotEmpty", { number: i + 1 })}`;
      button.title = t(state.shots[i] ? "retake" : "shotEmpty", { number: i + 1 });
      button.addEventListener("click", () => {
        if (state.saving) return;
        if (state.shots[i]) state.shots[i] = null;
        state.activeIndex = i;
        state.compositionVersion += 1;
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

  function readBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function requestId() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }

  function newDeleteToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function thumbnailFromCanvas() {
    const thumbnail = document.createElement("canvas");
    thumbnail.width = 180;
    thumbnail.height = 320;
    thumbnail.getContext("2d").drawImage(canvas, 0, 0, 180, 320);
    return thumbnail.toDataURL("image/jpeg", 0.7);
  }

  function postToAlbum(fields, expectedType, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe");
      iframe.name = `album_${fields.requestId}`;
      iframe.hidden = true;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = endpoint;
      form.target = iframe.name;
      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(iframe, form);
      let settled = false;
      const timer = setTimeout(() => finish(new Error("Album timed out")), timeoutMs);
      function onMessage(event) {
        if (!/^https:\/\/(script\.google\.com|[^/]+\.googleusercontent\.com)$/.test(event.origin)) return;
        if (!event.data || event.data.type !== expectedType || event.data.requestId !== fields.requestId) return;
        finish(event.data.ok ? null : new Error(event.data.message || "Album rejected"), event.data);
      }
      function finish(error, data) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        iframe.remove();
        form.remove();
        error ? reject(error) : resolve(data);
      }
      window.addEventListener("message", onMessage);
      try { form.submit(); } catch (error) { finish(error); }
    });
  }

  async function uploadPhoto(blob, preview) {
    if (blob.size > 4 * 1024 * 1024) throw new Error("Image too large");
    const deleteToken = newDeleteToken();
    const reply = await postToAlbum({
      action: "upload",
      requestId: requestId(),
      origin: location.origin,
      deleteToken,
      imageBase64: await readBase64(blob)
    }, "hf-photo-upload");
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(String(reply.fileId || ""))) throw new Error("Invalid album receipt");
    return {
      fileId: reply.fileId,
      deleteToken: reply.deletable === true ? deleteToken : "",
      preview,
      kind: "photo"
    };
  }

  function videoPoster() {
    const poster = document.createElement("canvas");
    poster.width = 180;
    poster.height = 320;
    const pen = poster.getContext("2d");
    pen.fillStyle = "#d8eaf6";
    pen.fillRect(0, 0, 180, 320);
    pen.fillStyle = "#42698b";
    pen.beginPath();
    pen.arc(90, 160, 36, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#fff";
    pen.beginPath();
    pen.moveTo(81, 141);
    pen.lineTo(81, 179);
    pen.lineTo(111, 160);
    pen.closePath();
    pen.fill();
    return poster.toDataURL("image/jpeg", 0.7);
  }

  async function uploadVideo(file, mimeType) {
    if (file.size > MAX_VIDEO_BYTES) throw new Error("Video too large");
    const deleteToken = newDeleteToken();
    const chunkCount = Math.ceil(file.size / VIDEO_CHUNK_BYTES);
    const shared = {
      origin: location.origin,
      deleteToken,
      mimeType,
      size: String(file.size),
      chunkCount: String(chunkCount)
    };
    const started = await postToAlbum({
      ...shared, action: "video-start", requestId: requestId()
    }, "hf-video-start", 90000);
    const tempId = String(started.tempId || "");
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(tempId)) throw new Error("Invalid video session");
    for (let index = 0; index < chunkCount; index += 1) {
      setStatus("videoUploading", "", { number: index + 1, total: chunkCount });
      const start = index * VIDEO_CHUNK_BYTES;
      await postToAlbum({
        ...shared,
        action: "video-chunk",
        requestId: requestId(),
        tempId,
        index: String(index),
        chunkBase64: await readBase64(file.slice(start, start + VIDEO_CHUNK_BYTES))
      }, "hf-video-chunk", 90000);
    }
    const reply = await postToAlbum({
      ...shared, action: "video-finish", requestId: requestId(), tempId
    }, "hf-video-upload", 120000);
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(String(reply.fileId || ""))) throw new Error("Invalid video receipt");
    return {
      fileId: reply.fileId,
      deleteToken: reply.deletable === true ? deleteToken : "",
      preview: videoPoster(),
      objectUrl: URL.createObjectURL(file),
      kind: "video"
    };
  }

  async function saveToPhone(blob, name, mimeType) {
    const file = new File([blob], name, { type: mimeType });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: t("shareTitle") });
        return true;
      } catch (error) {
        if (error.name === "AbortError") return false;
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
    return true;
  }

  function persistOwnedUploads() {
    const portable = state.ownedUploads.map(({ objectUrl, deleting, ...item }) => item);
    try { sessionStorage.setItem("hf-photobooth-uploads", JSON.stringify(portable)); }
    catch (_) { /* session storage can be unavailable */ }
  }

  function restoreOwnedUploads() {
    try {
      const stored = JSON.parse(sessionStorage.getItem("hf-photobooth-uploads") || "[]");
      if (Array.isArray(stored)) state.ownedUploads = stored.filter(item =>
        /^[A-Za-z0-9_-]{10,200}$/.test(String(item.fileId || "")) &&
        (!item.deleteToken || /^[a-f0-9]{64}$/.test(item.deleteToken)) &&
        (!item.kind || item.kind === "photo" || item.kind === "video") &&
        /^data:image\/jpeg;base64,[A-Za-z0-9+/=]{100,200000}$/.test(String(item.preview || ""))
      );
    } catch (_) { /* ignore invalid or inaccessible session data */ }
  }

  function renderOwnedUploads() {
    albumUploads.hidden = state.ownedUploads.length === 0;
    albumList.replaceChildren();
    for (const item of [...state.ownedUploads].reverse()) {
      const card = document.createElement("div");
      card.className = "album-card";
      const image = item.kind === "video" && item.objectUrl ? document.createElement("video") : document.createElement("img");
      if (image.tagName === "VIDEO") {
        image.src = item.objectUrl;
        image.controls = true;
        image.playsInline = true;
        image.setAttribute("aria-label", t("videoAlbumItem"));
      } else {
        image.src = item.preview;
        image.alt = item.kind === "video" ? t("videoAlbumItem") : t("albumPreview");
      }
      const actions = document.createElement("div");
      actions.className = "album-card-actions";
      const label = document.createElement("strong");
      label.textContent = t(item.kind === "video" ? "videoAlbumItem" : "albumItem");
      actions.append(label);
      if (item.deleteToken) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "text-button";
        button.textContent = `⌫ ${t("delete")}`;
        button.disabled = Boolean(item.deleting || state.saving);
        button.addEventListener("click", () => deleteOwnedPhoto(item));
        actions.append(button);
      } else {
        const note = document.createElement("small");
        note.textContent = t("deleteUnavailable");
        actions.append(note);
      }
      card.append(image, actions);
      albumList.append(card);
    }
  }

  async function deleteOwnedPhoto(item) {
    if (!item.deleteToken || item.deleting || state.saving || !window.confirm(t("deleteConfirm"))) return;
    item.deleting = true;
    renderOwnedUploads();
    setStatus("deleting");
    try {
      await postToAlbum({
        action: "delete",
        requestId: requestId(),
        origin: location.origin,
        fileId: item.fileId,
        deleteToken: item.deleteToken
      }, "hf-photo-delete");
      state.ownedUploads = state.ownedUploads.filter(record => record !== item);
      if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
      if (state.uploadedFileId === item.fileId) {
        state.uploadedVersion = -1;
        state.uploadedFileId = "";
      }
      persistOwnedUploads();
      setStatus("deleted", "success");
    } catch (error) {
      setStatus("deleteError", "error");
    } finally {
      item.deleting = false;
      renderOwnedUploads();
    }
  }

  async function saveCurrent() {
    if (state.saving || (!state.videoFile && state.shots.some(shot => !shot))) return;
    state.saving = true;
    saveButton.disabled = true;
    cameraButton.disabled = true;
    document.getElementById("takePhoto").disabled = true;
    document.getElementById("takeVideo").disabled = true;
    document.getElementById("choosePhoto").disabled = true;
    cameraChoices.hidden = true;
    cameraButton.setAttribute("aria-expanded", "false");
    setStatus("saving");
    try {
      const isVideo = Boolean(state.videoFile);
      if (!isVideo) drawComposition();
      const version = state.compositionVersion;
      const blob = isVideo ? state.videoFile : await blobFromCanvas("image/jpeg", 0.84);
      const preview = isVideo ? "" : thumbnailFromCanvas();
      const mimeType = isVideo ? state.videoMimeType : "image/jpeg";
      const suffix = isVideo ? { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" }[mimeType] : "jpg";
      const name = `Hana-Fiqri-${isVideo ? "Video" : `Photobooth-${String(state.frameId).padStart(2, "0")}`}-${Date.now()}.${suffix}`;
      const needsAlbum = uploadReady && state.uploadedVersion !== version;
      const needsPhone = state.phoneSavedVersion !== version || !needsAlbum;
      const albumPromise = needsAlbum ? isVideo ? uploadVideo(blob, mimeType) : uploadPhoto(blob, preview) : Promise.resolve(null);
      const phonePromise = needsPhone ? saveToPhone(blob, name, mimeType) : Promise.resolve(true);
      const [albumResult, phoneResult] = await Promise.allSettled([albumPromise, phonePromise]);
      const albumSaved = !needsAlbum || albumResult.status === "fulfilled";
      const phoneSaved = phoneResult.status === "fulfilled" && phoneResult.value === true;
      if (needsAlbum && albumSaved) {
        state.uploadedVersion = version;
        state.uploadedFileId = albumResult.value.fileId;
        state.ownedUploads.push(albumResult.value);
        persistOwnedUploads();
        renderOwnedUploads();
      }
      if (phoneSaved) state.phoneSavedVersion = version;
      if (uploadReady) setStatus(albumSaved ? phoneSaved ? "savedBoth" : "savedAlbum" : phoneSaved ? "savedPhone" : "saveError", albumSaved ? "success" : "error");
      else setStatus(phoneSaved ? "savedPhoneOnly" : "saveError", phoneSaved ? "success" : "error");
    } catch (error) {
      setStatus("saveError", "error");
    } finally {
      state.saving = false;
      saveButton.disabled = false;
      cameraButton.disabled = false;
      document.getElementById("takePhoto").disabled = false;
      document.getElementById("takeVideo").disabled = false;
      document.getElementById("choosePhoto").disabled = false;
      renderOwnedUploads();
    }
  }

  document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
  cameraButton.addEventListener("click", () => {
    cameraChoices.hidden = !cameraChoices.hidden;
    cameraButton.setAttribute("aria-expanded", String(!cameraChoices.hidden));
  });
  document.getElementById("takePhoto").addEventListener("click", () => {
    cameraChoices.hidden = true;
    cameraButton.setAttribute("aria-expanded", "false");
    document.getElementById("cameraFile").click();
  });
  document.getElementById("takeVideo").addEventListener("click", () => {
    cameraChoices.hidden = true;
    cameraButton.setAttribute("aria-expanded", "false");
    document.getElementById("videoFile").click();
  });
  document.getElementById("choosePhoto").addEventListener("click", () => {
    cameraChoices.hidden = true;
    cameraButton.setAttribute("aria-expanded", "false");
    document.getElementById("libraryFile").click();
  });
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
  document.getElementById("videoFile").addEventListener("change", event => {
    const input = event.currentTarget;
    const file = input.files && input.files[0];
    input.value = "";
    if (file) acceptVideo(file);
  });
  document.getElementById("savePhoto").addEventListener("click", saveCurrent);
  document.getElementById("startOver").addEventListener("click", () => {
    if (state.saving) return;
    clearVideo();
    state.shots = Array(slotsFor(state.frameId).length).fill(null);
    state.activeIndex = 0;
    state.compositionVersion += 1;
    finish.hidden = true;
    updateFrameText();
    updateShotList();
    drawComposition();
    setStatus("newSession");
  });
  try { if (localStorage.getItem("hf-photobooth-language") === "en") state.lang = "en"; } catch (_) { /* storage may be unavailable */ }
  restoreOwnedUploads();
  makeGallery();
  languageToggle.addEventListener("click", switchLanguage);
  applyLanguage();
  selectFrame(9);
})();
