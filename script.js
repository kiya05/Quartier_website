// Quartier shared JavaScript

const menu = document.querySelector(".menu");
const nav = document.querySelector(".nav-links");

if (menu) {
  menu.addEventListener("click", () => nav.classList.toggle("open"));
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => nav?.classList.remove("open"));
});

// Reveal sections as the visitor scrolls.
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Scroll-to-explore buttons.
document.querySelectorAll(".scroll-explore").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const selector = btn.getAttribute("href");
    const target = document.querySelector(selector);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// International phone fields + country-specific digit guidance/validation.
// intl-tel-input uses Google's libphonenumber rules, so each selected country
// gets its own number-length validation instead of a single 10-digit rule.
const phoneInputs = document.querySelectorAll(".phone-input");
const phoneInstances = new Map();

function digitsOnly(value) {
  return (value || "").replace(/\D/g, "");
}

function getCountryName(iti) {
  const country = iti?.getSelectedCountry?.();
  return country?.name || "selected country";
}

function getCountryDialCode(iti) {
  const country = iti?.getSelectedCountry?.();
  return country?.dialCode ? `+${country.dialCode}` : "";
}

function getExampleDigitCount(iti) {
  try {
    const country = iti.getSelectedCountry();
    const iso2 = country?.iso2;
    if (!iso2 || !window.intlTelInput?.utils) return null;

    // Prefer a mobile example; fall back to fixed-line when necessary.
    let example = intlTelInput.utils.getExampleNumber(
      iso2,
      "MOBILE",
      "NATIONAL",
    );
    if (!example) {
      example = intlTelInput.utils.getExampleNumber(
        iso2,
        "FIXED_LINE",
        "NATIONAL",
      );
    }

    const count = digitsOnly(example).length;
    return count || null;
  } catch (error) {
    return null;
  }
}

function updatePhoneHelp(input) {
  const field = input.closest(".field");
  const help = field?.querySelector(".phone-help");
  const iti = phoneInstances.get(input);
  if (!help || !iti) return;

  const countryName = getCountryName(iti);
  const dialCode = getCountryDialCode(iti);
  const count = getExampleDigitCount(iti);

  if (count) {
    help.textContent = `${countryName} (${dialCode}) • ${count} digits required`;
  } else {
    help.textContent = `${countryName} (${dialCode}) • Enter a valid local number`;
  }
}

phoneInputs.forEach((input) => {
  if (typeof window.intlTelInput !== "function") return;

  const iti = window.intlTelInput(input, {
    initialCountry: "in",
    separateDialCode: true,
    countrySearch: true,
    nationalMode: true,
    strictMode: true,
    placeholderNumberType: "MOBILE",
    autoPlaceholder: "polite",
    loadUtils: () =>
      import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js"),
  });

  phoneInstances.set(input, iti);

  // Wait until libphonenumber utilities are ready before reading examples.
  iti.promise.then(() => updatePhoneHelp(input));

  input.addEventListener("countrychange", () => {
    clearFieldError(input.closest(".field"));
    iti.promise.then(() => updatePhoneHelp(input));
  });

  input.addEventListener("input", () => {
    const field = input.closest(".field");
    const error = field?.querySelector(".field-error");
    if (error) clearFieldError(field);
  });
});

function showFieldError(field, message) {
  field.classList.add("invalid");
  let error = field.querySelector(".field-error");
  if (!error) {
    error = document.createElement("small");
    error.className = "field-error";
    field.appendChild(error);
  }
  error.textContent = message;
}

function clearFieldError(field) {
  if (!field) return;
  field.classList.remove("invalid");
  field.querySelector(".field-error")?.remove();
}

function getPhoneErrorMessage(iti, input) {
  const countryName = getCountryName(iti);
  const count = getExampleDigitCount(iti);
  const entered = digitsOnly(input.value).length;
  const errorCode = iti.getValidationError();

  if (errorCode === "TOO_SHORT") {
    return count
      ? `${countryName} requires ${count} digits. You entered ${entered}.`
      : `${countryName}: your number is too short.`;
  }

  if (errorCode === "TOO_LONG") {
    return count
      ? `${countryName} requires ${count} digits. You entered ${entered}.`
      : `${countryName}: your number is too long.`;
  }

  if (errorCode === "INVALID_LENGTH") {
    return count
      ? `${countryName} requires ${count} digits. Please check your number.`
      : `${countryName}: please enter the correct number of digits.`;
  }

  return `Please enter a valid phone number for ${countryName}.`;
}

function validateForm(form) {
  let valid = true;
  const requiredFields = form.querySelectorAll(
    "input[required], select[required]",
  );

  form.querySelectorAll(".field").forEach(clearFieldError);

  requiredFields.forEach((input) => {
    const field = input.closest(".field");
    if (!input.value.trim()) {
      showFieldError(field, "This field is required.");
      valid = false;
    }
  });

  const name = form.querySelector('input[name="name"]');
  if (
    name &&
    name.value.trim() &&
    (name.value.trim().length < 2 || name.value.trim().length > 60)
  ) {
    showFieldError(name.closest(".field"), "Please enter 2–60 characters.");
    valid = false;
  }

  const email = form.querySelector('input[type="email"]');
  if (email && email.value && !email.checkValidity()) {
    showFieldError(
      email.closest(".field"),
      "Please enter a valid email address.",
    );
    valid = false;
  }

  const phone = form.querySelector(".phone-input");
  if (phone) {
    const iti = phoneInstances.get(phone);
    if (!phone.value.trim()) {
      showFieldError(
        phone.closest(".field"),
        "Please enter your phone number.",
      );
      valid = false;
    } else if (!iti) {
      showFieldError(
        phone.closest(".field"),
        "Phone validation is unavailable. Please refresh and try again.",
      );
      valid = false;
    } else {
      const phoneField = phone.closest(".field");
      // Do not allow submission until the country-specific libphonenumber rules pass.
      if (!iti.isValidNumber()) {
        showFieldError(phoneField, getPhoneErrorMessage(iti, phone));
        valid = false;
      } else {
        const fullPhone = form.querySelector(".phone-full");
        if (fullPhone) fullPhone.value = iti.getNumber();
      }
    }
  }

  const location = form.querySelector('input[name="location"]');
  if (
    location &&
    location.value.trim() &&
    (location.value.trim().length < 2 || location.value.trim().length > 80)
  ) {
    showFieldError(location.closest(".field"), "Please enter 2–80 characters.");
    valid = false;
  }

  const message = form.querySelector('textarea[name="message"]');
  if (message && message.value.trim() && message.value.trim().length < 10) {
    showFieldError(
      message.closest(".field"),
      "Please enter at least 10 characters.",
    );
    valid = false;
  }

  if (!valid) {
    const firstInvalid = form.querySelector(".invalid");
    firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return valid;
}

// Animated thank-you message after a valid demo submission.
function openThankYou() {
  const modal = document.querySelector("#thankYouModal");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modal.querySelector(".thank-ok")?.focus();
}

function closeThankYou() {
  const modal = document.querySelector("#thankYouModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-demo-form]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    // For a real backend, send the FormData here with fetch() or use
    // <form action="backend/submit-project.php" method="POST">.
    form
      .querySelector('button[type="submit"]')
      ?.setAttribute("disabled", "disabled");
    setTimeout(() => {
      form.reset();
      phoneInstances.forEach((iti) => iti.setCountry("in"));
      form.querySelector('button[type="submit"]')?.removeAttribute("disabled");
      openThankYou();
    }, 350);
  });

  form.querySelectorAll("input, select, textarea").forEach((input) => {
    input.addEventListener("input", () =>
      clearFieldError(input.closest(".field")),
    );
    input.addEventListener("change", () =>
      clearFieldError(input.closest(".field")),
    );
  });
});

document.querySelectorAll(".thank-close, .thank-ok").forEach((button) => {
  button.addEventListener("click", closeThankYou);
});

document.querySelector("#thankYouModal")?.addEventListener("click", (e) => {
  if (e.target.id === "thankYouModal") closeThankYou();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeThankYou();
});

// Footer reveal animation and back-to-top button.
const footerObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        document
          .querySelectorAll(".footer-reveal")
          .forEach((el) => el.classList.add("footer-visible"));
        footerObserver.disconnect();
      }
    });
  },
  { threshold: 0.12 },
);

const footer = document.querySelector(".site-footer");
if (footer) footerObserver.observe(footer);

const backTop = document.querySelector(".back-top");
if (backTop) {
  backTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
}

/* =========================================
   QUARTIER MINIMAL CURSOR
========================================= */

(() => {
  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;

  if (!finePointer) return;

  const dot = document.createElement("div");
  const ring = document.createElement("div");

  dot.className = "q-cursor-dot";
  ring.className = "q-cursor-ring";

  document.body.appendChild(ring);
  document.body.appendChild(dot);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;

    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

    document.body.classList.add("cursor-visible");
    document.body.classList.remove("cursor-hidden");
  });

  // The ring follows slightly behind the pointer for a soft effect.
  function animateRing() {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;

    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

    requestAnimationFrame(animateRing);
  }

  animateRing();

  // Buttons and navigation get the larger "cute" hover ring.
  const interactiveSelector =
    'a, button, select, input[type="submit"], input[type="button"], label';

  document.addEventListener("mouseover", (event) => {
    if (event.target.closest(interactiveSelector)) {
      document.body.classList.add("cursor-hover");
    }
  });

  document.addEventListener("mouseout", (event) => {
    if (event.target.closest(interactiveSelector)) {
      document.body.classList.remove("cursor-hover");
    }
  });

  // Images get a softer, larger lens-like cursor.
  document.addEventListener("mouseover", (event) => {
    if (
      event.target.closest(
        ".card img, .project-card img, .team-card img, .split-image",
      )
    ) {
      document.body.classList.add("cursor-image");
    }
  });

  document.addEventListener("mouseout", (event) => {
    if (
      event.target.closest(
        ".card img, .project-card img, .team-card img, .split-image",
      )
    ) {
      document.body.classList.remove("cursor-image");
    }
  });

  document.addEventListener("mouseleave", () => {
    document.body.classList.add("cursor-hidden");
  });

  document.addEventListener("mouseenter", () => {
    document.body.classList.remove("cursor-hidden");
  });
})();

/* =========================================
   QUARTIER STATISTICS COUNTERS
   Add data-target to each number, e.g.
   <strong data-target="120" data-suffix="+">0</strong>
========================================= */

(() => {
  const counters = document.querySelectorAll(".stats .stat strong");
  if (!counters.length) return;

  const animateCounter = (element) => {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";

    const target = Number(
      element.dataset.target || element.textContent.replace(/[^\d]/g, ""),
    );
    const suffix =
      element.dataset.suffix ?? (element.textContent.includes("+") ? "+" : "");
    const duration = 1600;
    const start = performance.now();

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(easeOut(progress) * target);
      element.textContent = value.toLocaleString("en-IN") + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.textContent = target.toLocaleString("en-IN") + suffix;
        element.closest(".stat")?.classList.add("counted");
      }
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counters.forEach((counter, index) => {
            setTimeout(() => animateCounter(counter), index * 140);
          });
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 },
  );

  const statsSection = document.querySelector(".stats");
  if (statsSection) counterObserver.observe(statsSection);
})();

/* =========================================
   QUARTIER — INCREASING NUMBER ANIMATION
   The numbers visibly increase from 0 to the
   final value when the stats section appears.
========================================= */

(() => {
  const stats = document.querySelector(".stats");
  const counters = document.querySelectorAll(".stats .stat strong");

  if (!stats || !counters.length) return;

  function countUp(el, index) {
    if (el.dataset.counted === "true") return;
    el.dataset.counted = "true";

    const target = parseInt(el.dataset.target || "0", 10);
    const suffix = el.dataset.suffix || "";
    const duration = 1900;
    const delay = index * 180;
    const startTime = performance.now() + delay;

    function update(now) {
      if (now < startTime) {
        requestAnimationFrame(update);
        return;
      }

      const progress = Math.min((now - startTime) / duration, 1);

      // Smooth acceleration at the beginning and a gentle finish.
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(target * eased);

      el.textContent = current.toLocaleString("en-IN") + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString("en-IN") + suffix;
        el.closest(".stat")?.classList.add("counted");
      }
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        counters.forEach((counter, index) => countUp(counter, index));
        obs.disconnect();
      }
    },
    { threshold: 0.25 },
  );

  observer.observe(stats);
})();

// --------------testimonial ----------------------------------

const qsReviews =
  document.querySelectorAll(".qs-review");

const qsNext =
  document.getElementById("qsNext");

const qsPrev =
  document.getElementById("qsPrev");

const qsCurrent =
  document.getElementById("qsCurrent");

const qsProgress =
  document.getElementById("qsProgressBar");

let qsIndex = 0;

let qsTimer;


function showQSReview(index) {

  qsReviews.forEach(review => {

    review.classList.remove("active");

  });


  qsReviews[index]
    .classList.add("active");


  qsCurrent.textContent =
    String(index + 1).padStart(2,"0");


  qsProgress.style.width =
    ((index + 1) / qsReviews.length * 100) + "%";
}


function nextQSReview() {

  qsIndex++;

  if(qsIndex >= qsReviews.length){

    qsIndex = 0;

  }

  showQSReview(qsIndex);

}


function previousQSReview() {

  qsIndex--;

  if(qsIndex < 0){

    qsIndex =
      qsReviews.length - 1;

  }

  showQSReview(qsIndex);

}


qsNext.addEventListener(
  "click",
  () => {

    nextQSReview();

    restartQSTimer();

  }
);


qsPrev.addEventListener(
  "click",
  () => {

    previousQSReview();

    restartQSTimer();

  }
);


/* Auto slide */

function startQSTimer(){

  qsTimer = setInterval(
    nextQSReview,
    6000
  );

}


function restartQSTimer(){

  clearInterval(qsTimer);

  startQSTimer();

}


/* Start */

showQSReview(0);

startQSTimer();


/* Pause when mouse is over */

const qsSlider =
  document.querySelector(
    ".qs-testimonial-slider"
  );


qsSlider.addEventListener(
  "mouseenter",
  () => clearInterval(qsTimer)
);


qsSlider.addEventListener(
  "mouseleave",
  startQSTimer
);

