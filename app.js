(() => {
  "use strict";

  const config = window.WEDDING_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  const requestedSide = params.get("side");
  const requestedInvite = params.get("invite");
  const guestName = (params.get("to") || "").trim().slice(0, 80);
  const validSides = ["bride", "groom"];
  const validInvites = ["family", "reception"];
  const lockedSide = validSides.includes(requestedSide) ? requestedSide : "";
  const invitationType = validInvites.includes(requestedInvite) ? requestedInvite : "reception";
  const familySideNames = {
    bride: "Pengantin Perempuan",
    groom: "Pengantin Lelaki",
  };
  const openedAt = Date.now();

  const openingScreen = document.getElementById("openingScreen");
  const openButton = document.getElementById("openInvitation");
  const musicControl = document.getElementById("musicControl");
  const musicLabel = document.getElementById("musicLabel");
  const musicIcon = document.getElementById("musicIcon");
  const backgroundMusic = document.getElementById("backgroundMusic");
  const inviteBadge = document.getElementById("inviteBadge");
  const invitationTypeInput = document.getElementById("invitationType");
  const familySideInput = document.getElementById("familySide");
  const sidePickerLabel = document.getElementById("sidePickerLabel");
  const sidePicker = document.getElementById("sidePicker");
  const rsvpForm = document.getElementById("rsvpForm");
  const formStatus = document.getElementById("formStatus");
  const guestCount = document.getElementById("guestCount");
  const guestCountLabel = document.getElementById("guestCountLabel");
  const solemnisationTheme = document.getElementById("solemnisationTheme");
  const solemnisationThemeRow = document.getElementById("solemnisationThemeRow");
  const submitButton = rsvpForm.querySelector('button[type="submit"]');
  const submitButtonText = document.getElementById("submitButtonText");
  const nameInput = rsvpForm.querySelector('input[name="name"]');
  const phoneInput = rsvpForm.querySelector('input[name="phone"]');
  const consentInput = rsvpForm.querySelector('input[name="consent"]');
  const rsvpSuccess = document.getElementById("rsvpSuccess");
  const closeRsvpSuccess = document.getElementById("closeRsvpSuccess");

  // Both family invitations share the approved painted visual language.
  // The groom route uses a separate champagne palette while `invitationType`
  // and `lockedSide` continue to control the correct family-only content.
  const usesPaintedFamilyDesign = invitationType === "family" && ["bride", "groom"].includes(lockedSide);
  const usesChampagnePaintedDesign = lockedSide === "groom";
  const visualInvitationType = usesPaintedFamilyDesign
    ? "reception"
    : invitationType;
  const visualSide = usesPaintedFamilyDesign || usesChampagnePaintedDesign ? "bride" : (lockedSide || "public");
  document.body.dataset.invite = visualInvitationType;
  document.body.dataset.contentInvite = invitationType;
  document.body.dataset.side = visualSide;
  document.body.dataset.contentSide = lockedSide || "public";
  if (usesChampagnePaintedDesign) {
    document.body.dataset.palette = "champagne";
  }
  const themeColor = usesChampagnePaintedDesign
    ? "#795b3a"
    : visualInvitationType === "reception" && lockedSide === "bride"
    ? "#18283f"
    : visualInvitationType === "reception" && lockedSide === "groom"
      ? "#71806f"
    : invitationType === "family" && lockedSide === "bride"
      ? "#718da4"
      : invitationType === "family" && lockedSide === "groom"
      ? "#b49766"
      : "#8b806d";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);

  if (lockedSide === "groom") {
    openButton.setAttribute("aria-label", "Buka undangan Fiqri dan Hana");
    document.querySelector(".card-names").textContent = "Fiqri & Hana";
    document.querySelector(".hero h1").innerHTML = "<span>Muhammad Fiqri</span><small>&amp;</small><span>Hana Syuhada</span>";
    document.querySelector("footer strong").textContent = "Fiqri & Hana";
  }

  if (guestName) {
    document.getElementById("guestGreeting").textContent = `Istimewa buat ${guestName}`;
  }

  invitationTypeInput.value = invitationType === "family"
    ? "Keluarga (Akad Nikah + Resepsi)"
    : "Resepsi";

  if (lockedSide) {
    familySideInput.value = familySideNames[lockedSide];
    const sideTheme = lockedSide === "bride" ? "Dusty blue / biru muda" : "Champagne";
    solemnisationTheme.textContent = sideTheme;
  } else {
    sidePickerLabel.hidden = false;
    sidePicker.required = true;
    solemnisationThemeRow.hidden = true;
  }

  if (invitationType === "family") {
    document.querySelectorAll("[data-family-only]").forEach((element) => {
      element.hidden = false;
    });
    document.getElementById("receptionNumber").textContent = "02";
    inviteBadge.textContent = "Jemputan Akad Nikah & Majlis Resepsi";
  }

  document.getElementById("mapsButton").href = config.mapsUrl || "#";

  if (config.musicUrl) {
    backgroundMusic.src = config.musicUrl;
    musicControl.setAttribute("aria-disabled", "false");
    musicControl.setAttribute("aria-label", "Mainkan muzik latar");
    musicLabel.textContent = "Muzik";
  }

  const tryPlayMusic = async () => {
    if (!config.musicUrl) return;
    try {
      await backgroundMusic.play();
      musicControl.dataset.state = "playing";
      musicIcon.textContent = "♫";
      musicLabel.textContent = "Hentikan muzik";
      musicControl.setAttribute("aria-label", "Hentikan muzik latar");
    } catch {
      musicLabel.textContent = "Mainkan muzik";
      musicControl.setAttribute("aria-label", "Mainkan muzik latar");
    }
  };

  openButton.addEventListener("click", () => {
    openingScreen.classList.add("is-opening");
    tryPlayMusic();
    window.setTimeout(() => {
      openingScreen.classList.add("is-open");
      document.body.classList.remove("is-locked");
      document.querySelector(".hero h1").focus?.();
    }, 1450);
  }, { once: true });

  musicControl.addEventListener("click", async () => {
    if (!config.musicUrl) return;
    if (backgroundMusic.paused) {
      await tryPlayMusic();
    } else {
      backgroundMusic.pause();
      musicControl.dataset.state = "paused";
      musicIcon.textContent = "♪";
      musicLabel.textContent = "Mainkan muzik";
      musicControl.setAttribute("aria-label", "Mainkan muzik latar");
    }
  });

  const updateCountdown = () => {
    const target = new Date(config.weddingDateTime || "2026-11-14T09:00:00+08:00").getTime();
    const remaining = Math.max(0, target - Date.now());
    const day = 86400000;
    const hour = 3600000;
    const minute = 60000;
    document.getElementById("days").textContent = Math.floor(remaining / day);
    document.getElementById("hours").textContent = Math.floor((remaining % day) / hour);
    document.getElementById("minutes").textContent = Math.floor((remaining % hour) / minute);
    document.getElementById("seconds").textContent = Math.floor((remaining % minute) / 1000);
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  const quickNavLinks = [...document.querySelectorAll(".quick-nav a[data-nav-target]")];
  const setActiveNav = (targetId) => {
    quickNavLinks.forEach((link) => {
      const isActive = link.dataset.navTarget === targetId;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  quickNavLinks.forEach((link) => {
    link.addEventListener("click", () => setActiveNav(link.dataset.navTarget));
  });

  if ("IntersectionObserver" in window) {
    const navigationObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveNav(visible.target.id);
    }, { rootMargin: "-24% 0px -58%", threshold: [0.05, 0.25, 0.55] });

    quickNavLinks.forEach((link) => {
      const section = document.getElementById(link.dataset.navTarget);
      if (section) navigationObserver.observe(section);
    });
  }

  const attendanceInputs = [...rsvpForm.querySelectorAll('input[name="attendance"]')];
  attendanceInputs.forEach((input) => input.addEventListener("change", () => {
    attendanceInputs.forEach((option) => option.setCustomValidity(""));
    input.closest("fieldset")?.classList.remove("is-invalid");
    const attending = input.value === "Hadir";
    guestCount.disabled = !attending;
    guestCount.required = attending;
    guestCount.value = attending ? guestCount.value : "0";
    guestCountLabel.style.opacity = attending ? "1" : ".55";
  }));

  const fieldContainer = (field) => field.type === "radio"
    ? field.closest("fieldset")
    : field.closest("label");

  const clearFieldError = (field) => {
    field.setCustomValidity("");
    fieldContainer(field)?.classList.remove("is-invalid");
  };

  [...rsvpForm.querySelectorAll("input, select")].forEach((field) => {
    if (field.classList.contains("honeypot") || field.type === "hidden") return;
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
    field.addEventListener("invalid", () => fieldContainer(field)?.classList.add("is-invalid"));
  });

  const validateRsvp = () => {
    const trimmedName = nameInput.value.trim();
    nameInput.setCustomValidity(trimmedName.length >= 3
      ? ""
      : "Sila masukkan nama penuh anda, sekurang-kurangnya tiga aksara.");

    const phoneDigits = phoneInput.value.replace(/\D/g, "");
    const validPhone = /^01\d{8,9}$/.test(phoneDigits) || /^601\d{8,9}$/.test(phoneDigits);
    phoneInput.setCustomValidity(validPhone
      ? ""
      : "Sila masukkan nombor telefon Malaysia yang sah, contohnya 0123456789.");

    const attendanceSelected = attendanceInputs.some((input) => input.checked);
    attendanceInputs[0].setCustomValidity(attendanceSelected
      ? ""
      : "Sila pilih sama ada anda akan hadir atau tidak.");

    guestCount.setCustomValidity(guestCount.disabled || guestCount.value
      ? ""
      : "Sila pilih jumlah tetamu termasuk anda.");

    sidePicker.setCustomValidity(!sidePicker.required || sidePicker.value
      ? ""
      : "Sila pilih pihak keluarga yang menjemput anda.");

    consentInput.setCustomValidity(consentInput.checked
      ? ""
      : "Sila tandakan persetujuan penggunaan maklumat RSVP.");

    const valid = rsvpForm.checkValidity();
    if (!valid) {
      [...rsvpForm.elements].forEach((field) => {
        if (field instanceof HTMLElement && typeof field.checkValidity === "function" && !field.checkValidity()) {
          fieldContainer(field)?.classList.add("is-invalid");
        }
      });
    }
    return valid;
  };

  const setStatus = (message, isError = false) => {
    formStatus.textContent = message;
    formStatus.style.color = isError ? "#ffe3dc" : "#fff8e9";
    formStatus.classList.toggle("is-error", isError);
  };

  const showRsvpSuccess = () => {
    rsvpSuccess.hidden = false;
    requestAnimationFrame(() => rsvpSuccess.classList.add("is-visible"));
    closeRsvpSuccess.focus();
  };

  const hideRsvpSuccess = () => {
    rsvpSuccess.classList.remove("is-visible");
    window.setTimeout(() => {
      rsvpSuccess.hidden = true;
      submitButton.focus();
    }, 250);
  };

  closeRsvpSuccess.addEventListener("click", hideRsvpSuccess);
  rsvpSuccess.addEventListener("click", (event) => {
    if (event.target === rsvpSuccess) hideRsvpSuccess();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !rsvpSuccess.hidden) hideRsvpSuccess();
  });

  rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    if (!validateRsvp()) {
      setStatus("Sila lengkapkan semua medan bertanda * sebelum menghantar.", true);
      rsvpForm.reportValidity();
      rsvpForm.querySelector(":invalid")?.focus();
      return;
    }
    if (Date.now() > new Date(config.rsvpDeadline).getTime()) {
      setStatus("Tempoh pengesahan RSVP telah berakhir. Sila hubungi pihak keluarga.", true);
      return;
    }
    if (Date.now() - openedAt < 2500) {
      setStatus("Sila semak maklumat anda sebelum menghantar.", true);
      return;
    }
    if (!lockedSide) {
      if (!sidePicker.value) {
        sidePicker.focus();
        setStatus("Sila pilih pihak keluarga yang menjemput anda.", true);
        return;
      }
      familySideInput.value = familySideNames[sidePicker.value];
    }
    if (!config.rsvpEndpoint) {
      setStatus("Borang ini belum disambungkan ke Google Sheets. Ikuti panduan persediaan sebelum menerbitkan laman.", true);
      return;
    }

    submitButton.disabled = true;
    submitButton.classList.add("is-loading");
    submitButtonText.textContent = "Sedang dihantar…";
    rsvpForm.setAttribute("aria-busy", "true");
    setStatus("Jawapan anda sedang dihantar…");

    const formData = new FormData(rsvpForm);
    formData.set("submittedAt", new Date().toISOString());
    formData.set("sourceUrl", window.location.href.slice(0, 500));

    try {
      await fetch(config.rsvpEndpoint, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams([...formData.entries()]),
      });
      rsvpForm.reset();
      invitationTypeInput.value = invitationType === "family"
        ? "Keluarga (Akad Nikah + Resepsi)"
        : "Resepsi";
      familySideInput.value = lockedSide ? familySideNames[lockedSide] : "";
      guestCount.disabled = false;
      guestCount.required = true;
      guestCountLabel.style.opacity = "1";
      setStatus("Jawapan RSVP berjaya dihantar.");
      showRsvpSuccess();
    } catch {
      setStatus("Maaf, jawapan tidak dapat dihantar. Sila cuba lagi atau hubungi pihak keluarga.", true);
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove("is-loading");
      submitButtonText.textContent = "Hantar RSVP";
      rsvpForm.removeAttribute("aria-busy");
    }
  });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
})();
