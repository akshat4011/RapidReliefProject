const state = {
    user: JSON.parse(sessionStorage.getItem("rapidUser") || "null"),
    source: { lat: 28.7041, lng: 77.1025 },
    destination: { lat: 28.6139, lng: 77.2090 },
    map: null,
    sourceMarker: null,
    destinationMarker: null,
    routeLine: null,
    placeMarkers: [],
    editingReportId: null,
    currentReports: []
};

const authPage = document.getElementById("authPage");
const dashboardPage = document.getElementById("dashboardPage");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const topLoginLink = document.getElementById("topLoginLink");
const crisisForm = document.getElementById("crisisForm");
const crisisFormHeading = document.getElementById("crisisFormHeading");
const reportSubmitBtn = document.getElementById("reportSubmitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const chatForm = document.getElementById("chatForm");
const chatLanguage = document.getElementById("chatLanguage");
const doctorStatus = document.getElementById("doctorStatus");
const aiCard = document.getElementById("aiCard");
const refreshReportsBtn = document.getElementById("refreshReportsBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const findHospitalsBtn = document.getElementById("findHospitalsBtn");
const findBloodBtn = document.getElementById("findBloodBtn");
const findPharmacyBtn = document.getElementById("findPharmacyBtn");
const sosAlertBtn = document.getElementById("sosAlertBtn");
const switchToRegisterBtn = document.getElementById("switchToRegisterBtn");
const backToLoginBtn = document.getElementById("backToLoginBtn");
const locateBtn = document.getElementById("locateBtn");
const voiceBtn = document.getElementById("voiceBtn");
const emergencyHelpBtn = document.getElementById("emergencyHelpBtn");
const reportList = document.getElementById("reportList");

const isLocalPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname)
    && !["8080", "8081"].includes(window.location.port);
const API_BASE = window.location.protocol === "file:" || isLocalPreview ? "http://localhost:8080" : "";

let sirenAudioContext = null;
let sirenInterval = null;

function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

async function api(path, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: { "Content-Type": "application/json" },
            ...options
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Something went wrong.");
        }
        return data;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error("Backend is not connected. Run the Java app and open http://localhost:8080");
        }
        throw error;
    }
}

function showMessage(id, text, isError = false) {
    const element = document.getElementById(id);
    element.textContent = text;
    element.classList.toggle("error", isError);
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
        const data = await api("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(formData(registerForm))
        });
        showMessage("registerMsg", `${data.message} You can login now.`);
        registerForm.reset();
        showLoginForm();
    } catch (error) {
        showMessage("registerMsg", error.message, true);
    }
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
        const data = await api("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(formData(loginForm))
        });
        state.user = data.user;
        sessionStorage.setItem("rapidUser", JSON.stringify(data.user));
        showDashboard();
    } catch (error) {
        showMessage("loginMsg", error.message, true);
    }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("rapidUser");
    state.user = null;
    stopSosAlert();
    authPage.classList.remove("hidden");
    dashboardPage.classList.add("hidden");
});

locateBtn.addEventListener("click", useCurrentLocation);
voiceBtn.addEventListener("click", startVoiceInput);
emergencyHelpBtn.addEventListener("click", showEmergencyNumber);
refreshReportsBtn.addEventListener("click", loadReports);
themeToggleBtn.addEventListener("click", toggleTheme);
findHospitalsBtn.addEventListener("click", () => findNearbyPlaces("hospital"));
findBloodBtn.addEventListener("click", () => findNearbyPlaces("blood"));
findPharmacyBtn.addEventListener("click", () => findNearbyPlaces("pharmacy"));
if (sosAlertBtn) sosAlertBtn.addEventListener("click", toggleSosAlert);
if (switchToRegisterBtn) switchToRegisterBtn.addEventListener("click", showRegisterForm);
if (backToLoginBtn) backToLoginBtn.addEventListener("click", showLoginForm);
if (forgotPasswordBtn) forgotPasswordBtn.addEventListener("click", handleForgotPassword);
if (topLoginLink) topLoginLink.addEventListener("click", showLoginForm);
if (cancelEditBtn) cancelEditBtn.addEventListener("click", resetCrisisForm);

crisisForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formData(crisisForm);
    state.destination = {
        lat: Number(data.destinationLat),
        lng: Number(data.destinationLng)
    };
    updateMap();

    const payload = {
        userId: state.user.id,
        crisisType: data.crisisType,
        description: buildReportDescription(data),
        sourceLat: state.source.lat,
        sourceLng: state.source.lng,
        destinationLat: state.destination.lat,
        destinationLng: state.destination.lng
    };

    try {
        if (state.editingReportId) {
            const report = await api(`/api/crisis/${state.editingReportId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            showMessage("crisisMsg", `Alert #${report.id} updated successfully.`);
        } else {
            const report = await api("/api/crisis/report", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            showMessage("crisisMsg", `Saved. Alert #${report.id} created. Estimated distance: ${report.distanceKm} km.`);
        }
        resetCrisisForm();
        loadReports();
    } catch (error) {
        showMessage("crisisMsg", error.message, true);
    }
});

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = chatForm.elements.message;
    await sendChatMessage(input.value);
    input.value = "";
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => sendChatMessage(button.dataset.prompt));
});

reportList.addEventListener("click", async (event) => {
    const button = event.target.closest("button.timeline-action");
    if (!button) return;

    const reportId = Number(button.dataset.reportId);
    const action = button.dataset.action;
    const report = state.currentReports.find((entry) => entry.id === reportId);
    button.disabled = true;

    try {
        if (action === "assign") {
            await api(`/api/crisis/${reportId}/assign`, { method: "POST" });
            showMessage("crisisMsg", `Alert #${reportId} marked assigned.`);
            await loadReports();
        } else if (action === "resolve") {
            await api(`/api/crisis/${reportId}/resolve`, { method: "POST" });
            showMessage("crisisMsg", `Alert #${reportId} marked resolved.`);
            await loadReports();
        } else if (action === "edit" && report) {
            populateReportForEdit(report);
            showMessage("crisisMsg", `Editing alert #${reportId}. Update the information and save.`);
        } else if (action === "delete") {
            await api(`/api/crisis/${reportId}`, {
                method: "DELETE",
                body: JSON.stringify({ userId: state.user.id })
            });
            if (state.editingReportId === reportId) {
                resetCrisisForm();
            }
            showMessage("crisisMsg", `Alert #${reportId} deleted.`);
            await loadReports();
        }
    } catch (error) {
        showMessage("crisisMsg", error.message, true);
        button.disabled = false;
    }
});

function getSavedTheme() {
    return localStorage.getItem("rrTheme") || "dark";
}

function setTheme(theme) {
    if (theme === "dark") {
        dashboardPage.classList.add("dark-dashboard");
        themeToggleBtn.textContent = "Light mode";
    } else {
        dashboardPage.classList.remove("dark-dashboard");
        themeToggleBtn.textContent = "Dark mode";
    }
    localStorage.setItem("rrTheme", theme);
}

function toggleTheme() {
    setTheme(dashboardPage.classList.contains("dark-dashboard") ? "light" : "dark");
}

function showRegisterForm() {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    registerForm.classList.add("active-form");
    loginForm.classList.remove("active-form");
    showMessage("registerMsg", "");
    showMessage("loginMsg", "");
}

function showLoginForm() {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    registerForm.classList.remove("active-form");
    loginForm.classList.add("active-form");
    showMessage("registerMsg", "");
    showMessage("loginMsg", "");
}

function handleForgotPassword() {
    const email = loginForm.elements.email.value.trim();
    if (!email) {
        showMessage("loginMsg", "Enter your email address to reset your password.", true);
        return;
    }
    showMessage("loginMsg", `If ${email} exists, a password reset link has been sent.`);
}

function showDashboard() {
    authPage.classList.add("hidden");
    dashboardPage.classList.remove("hidden");
    document.getElementById("userName").textContent = state.user.fullName;
    document.getElementById("userMeta").textContent = `${state.user.bloodGroup} blood group | ${state.user.phone}`;
    document.getElementById("userInitial").textContent = state.user.fullName.charAt(0).toUpperCase();
    document.getElementById("contact").value = state.user.phone;
    setTheme(getSavedTheme());
    setTimeout(initMap, 50);
    loadReports();
}

function initMap() {
    if (!window.L) {
        document.getElementById("map").innerHTML = "<p class='message error'>Map library needs internet. Connect once or add local Leaflet files.</p>";
        return;
    }
    if (!state.map) {
        state.map = L.map("map").setView([state.source.lat, state.source.lng], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap"
        }).addTo(state.map);
        state.map.on("click", (event) => {
            state.destination = { lat: event.latlng.lat, lng: event.latlng.lng };
            document.getElementById("destinationLat").value = state.destination.lat.toFixed(5);
            document.getElementById("destinationLng").value = state.destination.lng.toFixed(5);
            updateMap();
        });
    }
    updateMap();
}

function updateMap() {
    if (!state.map) return;
    if (state.sourceMarker) state.sourceMarker.remove();
    clearDestinationRoute();

    state.sourceMarker = L.marker([state.source.lat, state.source.lng]).addTo(state.map).bindPopup("Patient/source").openPopup();

    const distance = haversineKm(state.source, state.destination);
    document.getElementById("distanceValue").textContent = `${distance.toFixed(1)} km`;
    document.getElementById("locationValue").value = `${state.source.lat.toFixed(5)}, ${state.source.lng.toFixed(5)}`;
    state.map.setView([state.source.lat, state.source.lng], 12);
}

function clearDestinationRoute() {
    if (state.destinationMarker) state.destinationMarker.remove();
    if (state.routeLine) state.routeLine.remove();
    state.destinationMarker = null;
    state.routeLine = null;
}

async function findNearbyPlaces(type) {
    if (!state.map) return;

    const status = document.getElementById("placesStatus");
    const radiusMeters = 10000;
    const label = type === "blood" ? "blood banks and hospitals" : type === "pharmacy" ? "pharmacies" : "hospitals";
    status.textContent = `Searching ${label} within 10 km...`;

    clearPlaceMarkers();

    const query = type === "blood"
        ? bloodHelpQuery(radiusMeters)
        : type === "pharmacy"
            ? pharmacyQuery(radiusMeters)
            : hospitalQuery(radiusMeters);
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Map search service is busy. Try again.");
        }
        const data = await response.json();
        const places = data.elements
            .map(toPlace)
            .filter(Boolean)
            .map((place) => ({
                ...place,
                distanceKm: haversineKm(state.source, { lat: place.lat, lng: place.lng })
            }))
            .filter((place) => place.distanceKm <= 10)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 15);

        if (!places.length) {
            status.textContent = `No ${label} found within 10 km. Try a nearby city location.`;
            return;
        }

        places.forEach((place) => addPlaceMarker(place));
        const bounds = L.featureGroup([state.sourceMarker, ...state.placeMarkers]).getBounds();
        state.map.fitBounds(bounds, { padding: [45, 45] });
        status.textContent = `Showing ${places.length} nearest ${label} within 10 km.`;
    } catch (error) {
        status.textContent = `${error.message} Internet is required for live place search.`;
    }
}

function hospitalQuery(radiusMeters) {
    return `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          way["amenity"="hospital"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          relation["amenity"="hospital"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          node["healthcare"="hospital"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          way["healthcare"="hospital"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          relation["healthcare"="hospital"](around:${radiusMeters},${state.source.lat},${state.source.lng});
        );
        out center tags;
    `;
}

function bloodHelpQuery(radiusMeters) {
    return `
        [out:json][timeout:25];
        (
          node["healthcare"="blood_donation"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          way["healthcare"="blood_donation"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          relation["healthcare"="blood_donation"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          node["amenity"="blood_bank"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          way["amenity"="blood_bank"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          relation["amenity"="blood_bank"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          node["amenity"="hospital"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          way["amenity"="hospital"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          relation["amenity"="hospital"](around:${radiusMeters},${state.source.lat},${state.source.lng});
        );
        out center tags;
    `;
}

function pharmacyQuery(radiusMeters) {
    return `
        [out:json][timeout:25];
        (
          node["amenity"="pharmacy"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          way["amenity"="pharmacy"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          relation["amenity"="pharmacy"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          node["healthcare"="pharmacy"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          way["healthcare"="pharmacy"](around:${radiusMeters},${state.source.lat},${state.source.lng});
          relation["healthcare"="pharmacy"](around:${radiusMeters},${state.source.lat},${state.source.lng});
        );
        out center tags;
    `;
}

function toPlace(element) {
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (!lat || !lng) return null;

    const tags = element.tags || {};
    return {
        lat,
        lng,
        name: tags.name || tags["name:en"] || "Medical facility",
        phone: tags.phone || tags["contact:phone"] || "Phone not listed",
        address: [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", "),
        category: tags.healthcare === "blood_donation" || tags.amenity === "blood_bank"
            ? "Blood help"
            : tags.amenity === "pharmacy" || tags.healthcare === "pharmacy"
                ? "Pharmacy"
                : "Hospital"
    };
}

function addPlaceMarker(place) {
    const color = place.category === "Blood help"
        ? "#e11d48"
        : place.category === "Pharmacy"
            ? "#f59e0b"
            : "#22c55e";
    const marker = L.circleMarker([place.lat, place.lng], {
        radius: 9,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2
    }).addTo(state.map);

    marker.bindPopup(`
        <strong>${place.name}</strong><br>
        ${place.category}<br>
        Distance: ${place.distanceKm.toFixed(1)} km<br>
        ${place.phone}<br>
        ${place.address || "Address not listed"}
    `);
    state.placeMarkers.push(marker);
}

function clearPlaceMarkers() {
    state.placeMarkers.forEach((marker) => marker.remove());
    state.placeMarkers = [];
}

function useCurrentLocation() {
    if (!navigator.geolocation) {
        showMessage("crisisMsg", "Geolocation is not supported in this browser.", true);
        return;
    }
    navigator.geolocation.watchPosition((position) => {
        state.source = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        updateMap();
        showMessage("crisisMsg", "Live location updated.");
    }, () => {
        showMessage("crisisMsg", "Location permission denied. Using sample Delhi location.", true);
    }, { enableHighAccuracy: true });
}

function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showMessage("crisisMsg", "Voice input works in Chrome and Edge browsers.", true);
        return;
    }
    const recognition = new SpeechRecognition();
    const language = chatLanguage ? chatLanguage.value : "english";
    recognition.lang = language === "hindi" ? "hi-IN" : language === "french" ? "fr-FR" : "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
        document.getElementById("description").value = event.results[0][0].transcript;
    };
    recognition.start();
}

function showEmergencyNumber() {
    const emergencyInfo = document.getElementById("emergencyInfo");
    emergencyInfo.textContent = "Medical emergency number: 108";
    emergencyInfo.classList.remove("hidden");
}

function toggleSosAlert() {
    if (sirenInterval) {
        stopSosAlert();
    } else {
        startSosAlert();
    }
}

function startSosAlert() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
        showMessage("crisisMsg", "SOS siren is not supported in this browser.", true);
        return;
    }

    if (!sirenAudioContext) {
        sirenAudioContext = new AudioContextCtor();
    }

    const frequencies = [740, 920];
    let index = 0;
    sirenInterval = window.setInterval(() => {
        const oscillator = sirenAudioContext.createOscillator();
        const gainNode = sirenAudioContext.createGain();
        oscillator.type = "sawtooth";
        oscillator.frequency.value = frequencies[index % frequencies.length];
        gainNode.gain.value = 0.06;
        oscillator.connect(gainNode);
        gainNode.connect(sirenAudioContext.destination);
        oscillator.start();
        oscillator.stop(sirenAudioContext.currentTime + 0.35);
        index += 1;
    }, 380);

    speakSosMessage();
    sosAlertBtn.textContent = "Stop SOS";
    }

function stopSosAlert() {
    if (sirenInterval) {
        window.clearInterval(sirenInterval);
        sirenInterval = null;
    }
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
    sosAlertBtn.textContent = "SOS Alert";
    }

function speakSosMessage() {
    if (!("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance("This is a medical emergency. Please send immediate help.");
    utterance.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

async function loadReports() {
    if (!state.user) return;
    reportList.innerHTML = "<li>Loading reports...</li>";
    try {
        const reports = await api(`/api/crisis/reports/${state.user.id}`);
        state.currentReports = reports;
        reportList.innerHTML = reports.length ? "" : "<li>No reports yet.</li>";
        reports.forEach((report) => {
            const item = document.createElement("li");
            const createdAt = new Date(report.createdAt);
            const assignedAt = report.assignedAt ? new Date(report.assignedAt) : null;
            const resolvedAt = report.resolvedAt ? new Date(report.resolvedAt) : null;
            const responseMinutes = resolvedAt ? Math.round((resolvedAt - createdAt) / 60000) : null;
            const actionButtons = [
                `<button class="timeline-action" data-report-id="${report.id}" data-action="edit">Edit</button>`,
                `<button class="timeline-action delete-action" data-report-id="${report.id}" data-action="delete">Delete</button>`
            ];
            if (!assignedAt) {
                actionButtons.unshift(`<button class="timeline-action" data-report-id="${report.id}" data-action="assign">Mark assigned</button>`);
            }
            if (assignedAt && !resolvedAt) {
                actionButtons.unshift(`<button class="timeline-action" data-report-id="${report.id}" data-action="resolve">Mark resolved</button>`);
            }
            item.innerHTML = `
                <span class="report-id-badge">Alert ID #${report.id}</span>
                <strong>${report.crisisType}</strong>
                <div class="report-meta">${report.distanceKm} km | ${createdAt.toLocaleDateString()}</div>
                <p>${report.description || "No description"}</p>
                <div class="report-timeline">
                    <div>Reported at ${formatTime(createdAt)}</div>
                    <div>Responder assigned at ${assignedAt ? formatTime(assignedAt) : "Pending assignment"}</div>
                    <div>Resolved at ${resolvedAt ? formatTime(resolvedAt) : "Pending resolution"}</div>
                    ${responseMinutes !== null ? `<div class="response-summary">Total response time: ${responseMinutes} minutes</div>` : ""}
                </div>
                <div class="report-actions">${actionButtons.join("")}</div>`;
            reportList.appendChild(item);
        });
    } catch {
        reportList.innerHTML = "<li>Could not load reports.</li>";
    }
}

function populateReportForEdit(report) {
    const parsed = parseReportDescription(report.description);
    state.editingReportId = report.id;
    crisisForm.elements.crisisType.value = report.crisisType || "Medical Emergency";
    document.getElementById("title").value = parsed.title;
    document.getElementById("severity").value = parsed.severity || "Medium";
    document.getElementById("contact").value = parsed.contact || state.user.phone || "";
    document.getElementById("affected").value = parsed.affected;
    document.getElementById("description").value = parsed.description;
    document.getElementById("destinationLat").value = Number(report.destinationLat).toFixed(4);
    document.getElementById("destinationLng").value = Number(report.destinationLng).toFixed(4);
    state.destination = { lat: report.destinationLat, lng: report.destinationLng };
    updateMap();
    crisisFormHeading.textContent = `Edit Medical Crisis Alert #${report.id}`;
    reportSubmitBtn.textContent = "Save Changes";
    cancelEditBtn.classList.remove("hidden");
    crisisForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetCrisisForm() {
    state.editingReportId = null;
    crisisForm.reset();
    if (state.user) {
        document.getElementById("contact").value = state.user.phone || "";
    }
    document.getElementById("severity").value = "Medium";
    document.getElementById("locationValue").value = `${state.source.lat.toFixed(5)}, ${state.source.lng.toFixed(5)}`;
    document.getElementById("destinationLat").value = Number(state.destination.lat).toFixed(4);
    document.getElementById("destinationLng").value = Number(state.destination.lng).toFixed(4);
    crisisFormHeading.textContent = "Report Medical Crisis";
    reportSubmitBtn.textContent = "Report Emergency Now";
    cancelEditBtn.classList.add("hidden");
}

function parseReportDescription(text) {
    const lines = (text || "").split("\n");
    const parsed = {
        title: "",
        severity: "Medium",
        contact: "",
        affected: "",
        description: ""
    };
    const descriptionLines = [];

    lines.forEach((line) => {
        if (line.startsWith("Title: ")) parsed.title = line.slice(7).trim();
        else if (line.startsWith("Severity: ")) parsed.severity = line.slice(10).trim();
        else if (line.startsWith("Contact: ")) parsed.contact = line.slice(9).trim();
        else if (line.startsWith("Affected: ")) parsed.affected = line.slice(10).trim();
        else if (line.trim()) descriptionLines.push(line);
    });

    parsed.description = descriptionLines.join("\n").trim();
    return parsed;
}

async function suggestNearbyDoctors(problemText) {
    if (!doctorStatus) return;
    doctorStatus.textContent = "Checking your location and nearby available doctors...";

    try {
        const location = await ensureCurrentLocation();
        const problemTag = inferDoctorNeed(problemText);
        const doctors = await fetchNearbyDoctors(location, problemTag);

        if (!doctors.length) {
            doctorStatus.textContent = "Nearby doctor list is not available right now. Try SOS Location or a nearby city area.";
            addChat("I could not find a listed nearby doctor right now, but you can still use the map buttons for hospitals and blood help.", "bot");
            return;
        }

        doctorStatus.textContent = `Found ${doctors.length} nearby doctors for ${problemTag}.`;
        addDoctorListToChat(doctors, problemTag);
    } catch (error) {
        doctorStatus.textContent = error.message;
        addChat("I could not detect your location for doctor search. Please allow location access and try again.", "bot");
    }
}

function inferDoctorNeed(problemText) {
    const text = problemText.toLowerCase();
    if (text.includes("heart") || text.includes("chest") || text.includes("breath")) return "heart and breathing support";
    if (text.includes("burn") || text.includes("jala")) return "burn care";
    if (text.includes("accident") || text.includes("bleed") || text.includes("injury")) return "trauma support";
    if (text.includes("fever") || text.includes("infection")) return "general physician support";
    return "emergency medical support";
}

function ensureCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                state.source = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                updateMap();
                resolve(state.source);
            }, () => {
                if (state.source) resolve(state.source);
                else reject(new Error("Location permission denied."));
            }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
        } else if (state.source) {
            resolve(state.source);
        } else {
            reject(new Error("Geolocation is not supported in this browser."));
        }
    });
}

async function fetchNearbyDoctors(location, problemTag) {
    const radiusMeters = 10000;
    const query = doctorQuery(radiusMeters, location);
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Doctor search service is busy right now.");
    }
    const data = await response.json();
    return data.elements
        .map(toDoctorPlace)
        .filter(Boolean)
        .map((doctor) => ({
            ...doctor,
            problemTag,
            distanceKm: haversineKm(location, { lat: doctor.lat, lng: doctor.lng })
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 5);
}

function doctorQuery(radiusMeters, location) {
    return `
        [out:json][timeout:25];
        (
          node["amenity"="doctors"](around:${radiusMeters},${location.lat},${location.lng});
          way["amenity"="doctors"](around:${radiusMeters},${location.lat},${location.lng});
          relation["amenity"="doctors"](around:${radiusMeters},${location.lat},${location.lng});
          node["healthcare"="doctor"](around:${radiusMeters},${location.lat},${location.lng});
          way["healthcare"="doctor"](around:${radiusMeters},${location.lat},${location.lng});
          relation["healthcare"="doctor"](around:${radiusMeters},${location.lat},${location.lng});
          node["healthcare"="clinic"](around:${radiusMeters},${location.lat},${location.lng});
          way["healthcare"="clinic"](around:${radiusMeters},${location.lat},${location.lng});
          relation["healthcare"="clinic"](around:${radiusMeters},${location.lat},${location.lng});
        );
        out center tags;
    `;
}

function toDoctorPlace(element) {
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (!lat || !lng) return null;
    const tags = element.tags || {};
    return {
        lat,
        lng,
        name: tags.name || tags["name:en"] || "Nearby doctor",
        phone: tags.phone || tags["contact:phone"] || "Phone not listed",
        address: [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") || "Address not listed",
        specialty: tags.healthcare_speciality || tags["healthcare:speciality"] || "General care"
    };
}

function addDoctorListToChat(doctors, problemTag) {
    const log = document.getElementById("chatLog");
    const wrap = document.createElement("div");
    wrap.className = "chat-bubble bot doctor-results-bubble";
    const cards = doctors.map((doctor) => `
        <div class="doctor-card">
            <strong>${doctor.name}</strong>
            <span>Best for: ${problemTag}</span>
            <span>Phone: ${doctor.phone}</span>
            <span>Distance: ${doctor.distanceKm.toFixed(1)} km</span>
            <span>${doctor.address}</span>
        </div>`).join("");
    wrap.innerHTML = `I found these nearby doctors for you:<div class="doctor-list">${cards}</div>`;
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
}
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

async function sendChatMessage(message) {
    const trimmed = message.trim();
    if (!trimmed) return;

    addChat(trimmed, "user");
    try {
        const data = await api("/api/chat", {
            method: "POST",
            body: JSON.stringify({
                message: trimmed,
                language: chatLanguage ? chatLanguage.value : "english"
            })
        });
        addChat(data.reply, "bot");
        await suggestNearbyDoctors(trimmed);
    } catch (error) {
        addChat(`${error.message}\n\nFor now: call emergency services, move to a safe place if possible, and share your location with a trusted person.`, "bot");
    }
}

function buildReportDescription(data) {
    const parts = [
        data.title ? `Title: ${data.title}` : "",
        data.severity ? `Severity: ${data.severity}` : "",
        data.contact ? `Contact: ${data.contact}` : "",
        data.affected ? `Affected: ${data.affected}` : "",
        data.description || ""
    ].filter(Boolean);
    return parts.join("\n");
}

function addChat(text, type) {
    const log = document.getElementById("chatLog");
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${type}`;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
}

function haversineKm(a, b) {
    const radius = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const startLat = toRad(a.lat);
    const endLat = toRad(b.lat);
    const value = Math.sin(dLat / 2) ** 2
        + Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLng / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toRad(value) {
    return value * Math.PI / 180;
}

if (state.user) {
    showDashboard();
} else {
    showLoginForm();
}



















