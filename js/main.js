// js/main.js

// Form submit handler moved from index.html
(function () {
  // server endpoint for the EmailRequest POST
  // NOTE: include a scheme. If a domain-only value is used (no http/https)
  // this code will prepend https:// so fetch doesn't treat it as a file-relative path.

  async function handleFormSubmit(e) {
    e.preventDefault();

    let endpoint = "ab-svatba.bojo1195.workers.dev";
    if (!/^https?:\/\//i.test(endpoint)) {
      endpoint = "https://" + endpoint;
    }

    // Basic form values
    const name = document.querySelector('input[name="name"]').value.trim();

    const attendance =
      document.querySelector('input[name="attendance"]:checked')?.value ===
      "yes"
        ? "Да"
        : "Не" || "Не";

    const chosenMenu =
      document.querySelector('input[name="menu-choice"]:checked')?.value ===
      "vegetarian"
        ? "Вегетарианско"
        : "Месно" || "Месно";

    const guestInputs = Array.from(
      document.querySelectorAll('#groupsContainer input[name^="name_guest_"]')
    );
    const guests = guestInputs.map((el) => el.value.trim()).filter(Boolean);

    const guestMenus = guests.map((_, index) => {
      const name = `menu_choice_${index + 1}`;
      return document.querySelector(`input[name="${name}"]:checked`)?.value ===
        "vegetarian"
        ? "Вегетарианско"
        : "Месно" || null;
    });

    const kidsInputs = Array.from(
      document.querySelectorAll('#groupsContainerKids input[name^="name_kid_"]')
    );
    const kids = kidsInputs.map((el) => el.value.trim()).filter(Boolean);

    const alergens = document
      .querySelector('input[name="alergens"]')
      .value.trim();

    const subject = `Отговор: ${name || "(no name)"} — ${attendance}`;

    let text = `Име: ${name}\nОтговор:  ${attendance}`;
    if (attendance === "Да" && chosenMenu)
      text += `\nИзбрано меню: ${chosenMenu}`;

    if (guests.length) {
      text += `\n\nГости (${guests.length}):`;
      guests.forEach((guestName, i) => {
        const menu = guestMenus[i] || "(не избрано)";
        text += `\n- ${guestName} — меню: ${menu}`;
      });
    }

    if (kids.length) {
      text += `\n\nДеца (${kids.length}):`;
      kids.forEach((kidName) => {
        text += `\n- ${kidName} — детско меню`;
      });
    }

    if (alergens) {
      text += `\n\nАлергии/Специални изисквания: ${alergens}`;
    }

    const submitButton =
      e.submitter || document.querySelector('#menuForm button[type="submit"]');
    const originalText = submitButton?.textContent;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "ИЗПРАЩАНЕ...";
    }

    const messageEl = document.getElementById("formMessage");
    function showMessage(type, msg) {
      if (!messageEl) {
        return alert(msg);
      }
      messageEl.classList.remove("hidden");
      messageEl.classList.remove("success", "error");
      messageEl.classList.add(type === "success" ? "success" : "error");
      messageEl.textContent = msg;
    }

    try {
      const body = { subject, text };

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => resp.statusText);
        throw new Error(errText || `HTTP ${resp.status}`);
      }

      // success (show inline message)
      showMessage("success", "Благодарим — отговорът ви е изпратен.");

      // Find the form and keep only its header and the existing #formMessage element
      const formEl = document.getElementById("menuForm");
      if (formEl) {
        const header = formEl.querySelector("h3");
        const msgEl =
          formEl.querySelector("#formMessage") ||
          document.getElementById("formMessage");
        // Clear everything and re-append header + message element (preserve msgEl)
        formEl.innerHTML = "";
        if (header) formEl.appendChild(header);
        if (msgEl) formEl.appendChild(msgEl);
      }
    } catch (err) {
      console.error("Failed to send RSVP", err);
      showMessage("error", "Възникна грешка при изпращане — опитайте отново.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText || "ОТГОВОРИ СЕГА";
      }
    }
  }

  // Attach the submit handler when the DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("menuForm");
    if (form) form.addEventListener("submit", handleFormSubmit);

    const targetDate = new Date("2026-06-14T00:00:00").getTime();

    function updateClock() {
      const now = new Date().getTime();
      let diff = targetDate - now;

      diff = diff - 1000;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * (1000 * 60 * 60 * 24);

      let hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * (1000 * 60 * 60);

      const minutes = Math.floor(diff / (1000 * 60));
      diff -= minutes * (1000 * 60);

      const seconds = Math.floor(diff / 1000);

      if (new Date().getTime() < new Date("2026-03-29T00:00:00").getTime()) {
        hours = hours + 1;
      }

      const daysEl = document.getElementById("days");
      const hoursEl = document.getElementById("hours");
      const minutesEl = document.getElementById("minutes");
      const secondsEl = document.getElementById("seconds");

      if (daysEl) daysEl.textContent = days;
      if (hoursEl) hoursEl.textContent = hours;
      if (minutesEl) minutesEl.textContent = minutes;
      if (secondsEl) secondsEl.textContent = seconds;
    }

    updateClock();
    setInterval(updateClock, 1000);

    // --- SLIDER / GUESTS ---
    function slider(
      countRangeId,
      rangeValueId,
      groupsContainerId,
      guestType,
      menuChoice
    ) {
      const range = document.getElementById(countRangeId);
      const rangeValue = document.getElementById(rangeValueId);
      const container = document.getElementById(groupsContainerId);

      if (!range || !rangeValue || !container) return;

      // initial render
      renderGroups(range.value);

      range.addEventListener("input", () => {
        rangeValue.textContent = range.value;
        renderGroups(range.value);
      });

      function renderGroups(count) {
        container.innerHTML = "";

        for (let i = 1; i <= count; i++) {
          const group = document.createElement("div");
          group.className = "group";

          // use different name prefixes so kids and adult guests don't conflict
          const nameInput =
            guestType === "Гост" ? `name_guest_${i}` : `name_kid_${i}`;

          group.innerHTML = `\n            <label class="form-label">${guestType} ${i}: <input type="text" name="${nameInput}" placeholder="Имена" required class="text-field"></label>\n\n            <div class="quest-question">\n              ${menuChoice(
            i
          )}\n            </div>\n          `;

          container.appendChild(group);
        }
      }
    }

    const menuChoiceGuest = (i) => `
      <p>Какъв тип меню предпочитате?</p>
      <div class="radio-choice">
        <label>
          <input
            class="radio-input"
            type="radio" name="menu_choice_${i}" value="vegetarian" required>
          Вегетарианско
        </label>
        <label>
          <input
            class="radio-input"
            type="radio" name="menu_choice_${i}" value="meat" required>
          Месно
        </label>
      </div>
    `;

    const menuNonChoiceKid = (i) => `
      <p>Детско меню</p>
    `;

    slider(
      "countRange",
      "rangeValue",
      "groupsContainer",
      "Гост",
      menuChoiceGuest
    );
    slider(
      "countRangeKids",
      "rangeValueKids",
      "groupsContainerKids",
      "Дете",
      menuNonChoiceKid
    );

    const radios = document.querySelectorAll('input[name="attendance"]');

    radios.forEach((radio) => {
      radio.addEventListener("change", () => {
        const value = radio.value;

        // hide everything first
        const elements = document.querySelectorAll(".hide-me");

        const submitButton = document.querySelector(
          '#menuForm button[type="submit"]'
        );

        // show the selected block
        if (value === "no") {
          elements.forEach((el) => {
            el.classList.add("hidden");
          });
          submitButton.disabled = false;
        } else if (value === "yes") {
          elements.forEach((el) => {
            el.classList.remove("hidden");
          });
          submitButton.disabled = false;
        } else if (value === "wait") {
          submitButton.disabled = true;
        }
      });
    });
  });
})();
