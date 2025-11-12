document.addEventListener("DOMContentLoaded", () => {
  // ---------- THEME TOGGLE ----------
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const dark = document.body.classList.contains("dark");
      localStorage.setItem("theme", dark ? "dark" : "light");
      themeToggle.textContent = dark ? "☀️" : "🌙";
    });
  }

  // ---------- UTILITIES ----------
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ---------- ADMIN ----------
  const routeForm = document.getElementById("routeForm");
  const routeList = document.getElementById("routeList");
  const adminMessage = document.getElementById("message");

  async function renderAdminRoutes() {
    if (!routeList) return;
    const routes = await api.getRoutes();
    routeList.innerHTML = routes.length
      ? routes.map(r => `
        <div class="card" data-id="${r.id}">
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.desc)}</p>
          <p><strong>Times:</strong> ${Array.isArray(r.times) ? r.times.join(", ") : r.times}</p>
          <p><strong>Seats:</strong> ${r.seats} (booked: ${r.booked || 0})</p>
          <button class="delete-route" data-id="${r.id}" style="background:#e63946;">🗑 Delete</button>
        </div>`).join('')
      : "<p>No routes added yet.</p>";

    document.querySelectorAll(".delete-route").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (!confirm("Delete this route?")) return;
        await api.deleteRoute(id);
        renderAdminRoutes();
        populateRouteDropdowns();
      });
    });
  }

  if (routeForm) {
    routeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("routeTitle").value.trim();
      const desc = document.getElementById("routeDescription").value.trim();
      const timeInput = document.getElementById("routeTime").value.trim();
      const seats = parseInt(document.getElementById("routeSeats").value);

      if (!title || !timeInput || !seats) {
        adminMessage.style.color = "red";
        adminMessage.textContent = "Please fill in all fields.";
        return;
      }

      const times = timeInput.split(",").map(t => t.trim()).filter(Boolean);
      const newRoute = { id: Date.now().toString(), title, desc, times, seats, booked: 0 };
      await api.addRoute(newRoute);

      adminMessage.style.color = "green";
      adminMessage.textContent = "Route added successfully!";
      routeForm.reset();
      renderAdminRoutes();
      populateRouteDropdowns();
    });

    renderAdminRoutes();
  }

  // ---------- USER BOOKING ----------
  const routeSelect = document.getElementById("routeSelect");
  const timeSelect = document.getElementById("timeSelect");
  const bookBtn = document.getElementById("bookBtn");
  const bookMsg = document.getElementById("bookMsg");

  async function populateRouteDropdowns() {
    const routes = await api.getRoutes();
    if (routeSelect) {
      routeSelect.innerHTML = `<option value="">-- Choose a route --</option>`;
      routes.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = r.title;
        routeSelect.appendChild(opt);
      });
    }
    if (timeSelect) timeSelect.innerHTML = `<option value="">-- Choose time --</option>`;
  }

  if (routeSelect) {
    populateRouteDropdowns();
    routeSelect.addEventListener("change", async () => {
      timeSelect.innerHTML = `<option value="">-- Choose time --</option>`;
      const routes = await api.getRoutes();
      const selected = routes.find(r => r.id === routeSelect.value);
      if (!selected) return;
      selected.times.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        timeSelect.appendChild(opt);
      });
    });
  }

  if (bookBtn) {
    bookBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const name = document.getElementById("userName").value.trim();
      const email = document.getElementById("userEmail").value.trim();
      const routeId = routeSelect.value;
      const time = timeSelect.value;

      if (!name || !email || !routeId || !time) {
        bookMsg.style.color = "red";
        bookMsg.textContent = "Please fill in all fields.";
        return;
      }

      const routes = await api.getRoutes();
      const route = routes.find(r => r.id === routeId);
      if (!route) {
        bookMsg.style.color = "red";
        bookMsg.textContent = "Selected route not found.";
        return;
      }

      if (route.booked >= route.seats) {
        bookMsg.style.color = "red";
        bookMsg.textContent = "No seats left for this route/time.";
        return;
      }

      const booking = {
        id: Date.now().toString(),
        name, email, routeId: route.id, routeTitle: route.title, time,
        date: new Date().toLocaleString()
      };
      await api.addBooking(booking);
      await api.incrementBooking(route.id);

      bookMsg.style.color = "green";
      bookMsg.textContent = `Booking successful — ${route.title} at ${time}.`;

      document.getElementById("userName").value = "";
      document.getElementById("userEmail").value = "";
      routeSelect.value = "";
      timeSelect.innerHTML = `<option value="">-- Choose time --</option>`;

      renderAdminRoutes();
      renderReport();
      renderFeedbackReport();
    });
  }

  // ---------- REPORT ----------
  const reportContainer = document.getElementById("reportContainer");

  async function renderReport() {
    if (!reportContainer) return;
    const routes = await api.getRoutes();
    const bookings = await api.getBookings();

    if (routes.length === 0) {
      reportContainer.innerHTML = "<p>No routes created yet.</p>";
      return;
    }

    let html = "";
    const routeCounts = [];

    routes.forEach(r => {
      const rBookings = bookings.filter(b => b.routeId === r.id);
      html += `<div class="card">
        <h3>${escapeHtml(r.title)}</h3>
        <p><b>Description:</b> ${escapeHtml(r.desc)}</p>
        <p><b>Times:</b> ${Array.isArray(r.times) ? r.times.join(", ") : r.times}</p>
        <p><b>Total seats:</b> ${r.seats}</p>
        <p><b>Booked:</b> ${rBookings.length}</p>`;

      if (rBookings.length > 0) {
        html += "<ul>";
        rBookings.forEach(b => {
          html += `<li><b>${escapeHtml(b.name)}</b> (${escapeHtml(b.email)}) — ${escapeHtml(b.time)} — ${escapeHtml(b.date)}</li>`;
        });
        html += "</ul>";
      } else {
        html += `<p style="color:gray;">No bookings yet.</p>`;
      }

      html += "</div>";
      routeCounts.push({ title: r.title, count: rBookings.length });
    });

    reportContainer.innerHTML = html;

    // ---------- VISUAL SUMMARY ----------
    const canvas = document.getElementById("aggChart");
    if (canvas && routeCounts.length > 0) {
      const ctx = canvas.getContext("2d");
      const labels = routeCounts.map(r => r.title);
      const data = routeCounts.map(r => r.count);
      if (window._aggChart) window._aggChart.destroy();

      window._aggChart = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets: [{ label: "Tickets Booked", data, backgroundColor: labels.map(() => "#2563eb") }] },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, precision: 0 } }
        }
      });
    }
  }

  // ---------- FEEDBACK REPORT ----------
  async function renderFeedbackReport() {
    const container = document.getElementById("feedbackReportContainer");
    if (!container) return;

    const feedbacks = JSON.parse(localStorage.getItem("feedbacks") || "[]");

    if (feedbacks.length === 0) {
      container.innerHTML = "<p>No feedback submitted yet.</p>";
      return;
    }

    container.innerHTML = "";
    feedbacks.forEach(fb => {
      const div = document.createElement("div");
      div.style.borderBottom = "1px solid #ccc";
      div.style.padding = "8px 0";
      div.innerHTML = `${escapeHtml(fb.feedback)}<br>
                       <small style="color:gray;">${escapeHtml(fb.date)}</small>`;
      container.appendChild(div);
    });
  }

  // ---------- USER FEEDBACK ----------
  const feedbackText = document.getElementById("feedbackText");
  const submitFeedbackBtn = document.getElementById("submitFeedbackBtn");
  const feedbackMsg = document.getElementById("feedbackMsg");

  if (submitFeedbackBtn) {
    submitFeedbackBtn.addEventListener("click", async () => {
      const feedback = feedbackText.value.trim();
      if (!feedback) {
        feedbackMsg.style.color = "red";
        feedbackMsg.textContent = "Please enter your feedback before submitting.";
        return;
      }
      const feedbacks = JSON.parse(localStorage.getItem("feedbacks") || "[]");
      feedbacks.push({
        id: Date.now().toString(),
        name: document.getElementById("userName").value.trim(),
        email: document.getElementById("userEmail").value.trim(),
        feedback,
        date: new Date().toLocaleString()
      });
      localStorage.setItem("feedbacks", JSON.stringify(feedbacks));

      feedbackMsg.style.color = "green";
      feedbackMsg.textContent = "Thank you for your feedback!";
      feedbackText.value = "";

      renderFeedbackReport();
    });
  }

  populateRouteDropdowns();
  renderAdminRoutes();
  renderReport();
  renderFeedbackReport();
});
