/* =========================================================
   SERVERPULSE
   Intelligent Server Health & Recovery Monitor
   Demo Mode
   ========================================================= */


/* ================= STATE ================= */

const state = {
    cpu: 32,
    ram: 48,
    disk: 41,

    apacheRunning: true,

    uptimeMinutes: 754,

    mode: "healthy",

    cpuHistory: [28, 31, 29, 34, 37, 33, 32, 35, 31, 32],
    ramHistory: [43, 45, 46, 44, 47, 46, 49, 47, 48, 48],

    activity: []
};


/* ================= DOM ================= */

const elements = {

    cpuValue: document.getElementById("cpuValue"),
    ramValue: document.getElementById("ramValue"),
    diskValue: document.getElementById("diskValue"),

    cpuBar: document.getElementById("cpuBar"),
    ramBar: document.getElementById("ramBar"),
    diskBar: document.getElementById("diskBar"),

    cpuStatus: document.getElementById("cpuStatus"),
    ramStatus: document.getElementById("ramStatus"),
    diskStatus: document.getElementById("diskStatus"),

    healthScore: document.getElementById("healthScore"),
    healthRing: document.getElementById("healthRing"),

    systemStatus: document.getElementById("systemStatus"),
    systemMessage: document.getElementById("systemMessage"),

    apacheService: document.getElementById("apacheService"),

    runningCount: document.getElementById("runningCount"),

    uptimeValue: document.getElementById("uptimeValue"),

    activityList: document.getElementById("activityList"),

    lastUpdated: document.querySelector(".last-updated span")
};


/* ================= ICONS ================= */

function refreshIcons() {

    if (window.lucide) {
        lucide.createIcons();
    }
}

refreshIcons();


/* ================= HELPERS ================= */

function clamp(value, min, max) {

    return Math.min(
        Math.max(value, min),
        max
    );
}


function randomBetween(min, max) {

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}


function getMetricStatus(value) {

    if (value >= 85) {
        return "critical";
    }

    if (value >= 70) {
        return "warning";
    }

    return "healthy";
}


function getStatusText(status) {

    if (status === "critical") {
        return "Critical";
    }

    if (status === "warning") {
        return "Warning";
    }

    return "Normal";
}


/* ================= METRIC UPDATE ================= */

function updateMetric(
    valueElement,
    barElement,
    statusElement,
    value
) {

    valueElement.textContent = value;

    barElement.style.width = `${value}%`;

    const status = getMetricStatus(value);

    statusElement.className =
        `metric-status ${status}`;

    statusElement.textContent =
        getStatusText(status);
}


/* ================= HEALTH SCORE ================= */

function calculateHealthScore() {

    let score = 100;

    if (state.cpu >= 70) {
        score -= 15;
    }

    if (state.cpu >= 85) {
        score -= 25;
    }

    if (state.ram >= 80) {
        score -= 10;
    }

    if (state.disk >= 80) {
        score -= 10;
    }

    if (!state.apacheRunning) {
        score -= 35;
    }

    return clamp(score, 0, 100);
}


function updateHealth() {

    const score = calculateHealthScore();

    elements.healthScore.textContent = score;


    const degrees =
        Math.round((score / 100) * 360);


    elements.healthRing.style.background =
        `conic-gradient(
            var(--lime) 0deg,
            var(--lime) ${degrees}deg,
            rgba(255,255,255,.07) ${degrees}deg
        )`;


    if (score >= 80) {

        elements.systemStatus.textContent =
            "Healthy";

        elements.systemStatus.style.color =
            "var(--lime)";

        elements.systemMessage.textContent =
            "All monitored services are operating normally.";

    } else if (score >= 50) {

        elements.systemStatus.textContent =
            "Warning";

        elements.systemStatus.style.color =
            "var(--amber)";

        elements.systemMessage.textContent =
            "One or more resources require attention.";

    } else {

        elements.systemStatus.textContent =
            "Critical";

        elements.systemStatus.style.color =
            "var(--red)";

        elements.systemMessage.textContent =
            "Infrastructure issue detected. Recovery recommended.";
    }
}


/* ================= SERVER METRICS ================= */

function updateMetrics() {

    updateMetric(
        elements.cpuValue,
        elements.cpuBar,
        elements.cpuStatus,
        state.cpu
    );


    updateMetric(
        elements.ramValue,
        elements.ramBar,
        elements.ramStatus,
        state.ram
    );


    updateMetric(
        elements.diskValue,
        elements.diskBar,
        elements.diskStatus,
        state.disk
    );


    updateHealth();
}


/* ================= CHART ================= */

function generatePoints(values) {

    const width = 800;
    const height = 260;

    const horizontalGap =
        width / (values.length - 1);


    return values.map((value, index) => {

        const x =
            index * horizontalGap;

        const y =
            height - ((value / 100) * height);

        return `${x},${y}`;
    }).join(" ");
}


function generateArea(values) {

    const width = 800;
    const height = 260;

    const horizontalGap =
        width / (values.length - 1);


    const points =
        values.map((value, index) => {

            const x =
                index * horizontalGap;

            const y =
                height - ((value / 100) * height);

            return `${x},${y}`;
        });


    return `
        M 0 ${height}
        L ${points.join(" L ")}
        L ${width} ${height}
        Z
    `;
}


function updateChart() {

    document
        .getElementById("cpuLine")
        .setAttribute(
            "points",
            generatePoints(state.cpuHistory)
        );


    document
        .getElementById("ramLine")
        .setAttribute(
            "points",
            generatePoints(state.ramHistory)
        );


    document
        .getElementById("cpuArea")
        .setAttribute(
            "d",
            generateArea(state.cpuHistory)
        );


    document
        .getElementById("ramArea")
        .setAttribute(
            "d",
            generateArea(state.ramHistory)
        );
}


/* ================= UPTIME ================= */

function updateUptime() {

    state.uptimeMinutes++;

    const hours =
        Math.floor(state.uptimeMinutes / 60);

    const minutes =
        state.uptimeMinutes % 60;

    elements.uptimeValue.textContent =
        `${hours}h ${String(minutes).padStart(2, "0")}m`;
}


/* ================= ACTIVITY ================= */

function addActivity(
    title,
    description,
    type = "info"
) {

    const item = document.createElement("div");

    item.className = "activity-item";

    const iconMap = {

        success: "check",
        info: "refresh-cw",
        warning: "triangle-alert",
        danger: "circle-x"
    };


    item.innerHTML = `
        <div class="activity-icon ${type}">
            <i data-lucide="${iconMap[type]}"></i>
        </div>

        <div class="activity-details">
            <strong>${title}</strong>
            <span>${description}</span>
        </div>

        <time>Just now</time>
    `;


    elements.activityList.prepend(item);

    refreshIcons();


    const items =
        elements.activityList.querySelectorAll(
            ".activity-item"
        );


    if (items.length > 6) {

        items[items.length - 1].remove();
    }
}


/* ================= SERVICE UI ================= */

function updateApacheService() {

    const serviceStatus =
        elements.apacheService.querySelector(
            ".service-status"
        );


    if (state.apacheRunning) {

        serviceStatus.className =
            "service-status running";

        serviceStatus.innerHTML = `
            <i data-lucide="circle-check"></i>
            <span>Running</span>
        `;

    } else {

        serviceStatus.className =
            "service-status stopped";

        serviceStatus.innerHTML = `
            <i data-lucide="circle-x"></i>
            <span>Stopped</span>
        `;
    }


    elements.runningCount.textContent =
        state.apacheRunning ? "3" : "2";


    refreshIcons();
}


/* ================= NORMAL MONITORING ================= */

function normalMonitoring() {

    if (state.mode !== "healthy") {
        return;
    }


    state.cpu =
        clamp(
            state.cpu + randomBetween(-5, 5),
            20,
            58
        );


    state.ram =
        clamp(
            state.ram + randomBetween(-2, 2),
            40,
            60
        );


    state.disk =
        clamp(
            state.disk + randomBetween(0, 1),
            41,
            48
        );


    state.cpuHistory.push(state.cpu);
    state.ramHistory.push(state.ram);


    if (state.cpuHistory.length > 10) {
        state.cpuHistory.shift();
    }

    if (state.ramHistory.length > 10) {
        state.ramHistory.shift();
    }


    updateMetrics();
    updateChart();

    elements.lastUpdated.textContent =
        "Updated just now";
}


/* ================= SIMULATE HIGH CPU ================= */

function simulateHighCPU() {

    state.mode = "high-cpu";

    state.cpu = randomBetween(88, 96);

    state.ram = randomBetween(60, 68);

    state.cpuHistory.push(state.cpu);
    state.ramHistory.push(state.ram);


    if (state.cpuHistory.length > 10) {
        state.cpuHistory.shift();
    }

    if (state.ramHistory.length > 10) {
        state.ramHistory.shift();
    }


    updateMetrics();
    updateChart();


    addActivity(
        "High CPU detected",
        `CPU usage reached ${state.cpu}%. Warning threshold exceeded.`,
        "warning"
    );
}


/* ================= SIMULATE SERVICE FAILURE ================= */

function simulateServiceFailure() {

    state.mode = "service-failure";

    state.apacheRunning = false;

    state.cpu = randomBetween(70, 78);

    updateMetrics();

    updateApacheService();


    addActivity(
        "Apache service stopped",
        "Critical service failure detected on the monitored server.",
        "danger"
    );
}


/* ================= RECOVERY ================= */

function runRecovery() {

    const recoveryButton =
        document.getElementById(
            "recoveryButton"
        );


    recoveryButton.disabled = true;

    recoveryButton.innerHTML = `
        <i data-lucide="loader-circle"></i>

        <div>
            <strong>Recovering...</strong>
            <small>Executing recovery</small>
        </div>
    `;


    refreshIcons();


    addActivity(
        "Recovery initiated",
        "ServerPulse is executing the recovery workflow.",
        "info"
    );


    setTimeout(() => {

        state.mode = "healthy";

        state.apacheRunning = true;

        state.cpu = randomBetween(28, 38);

        state.ram = randomBetween(44, 51);

        state.disk = 41;


        updateMetrics();

        updateApacheService();


        addActivity(
            "Recovery completed",
            "Services restored and server health returned to normal.",
            "success"
        );


        recoveryButton.disabled = false;

        recoveryButton.innerHTML = `
            <i data-lucide="shield-check"></i>

            <div>
                <strong>Run Recovery</strong>
                <small>Restore server health</small>
            </div>
        `;


        refreshIcons();

    }, 1800);
}


/* ================= REFRESH ================= */

function refreshDashboard() {

    const button =
        document.getElementById(
            "refreshButton"
        );


    button.classList.add("rotating");


    setTimeout(() => {

        button.classList.remove(
            "rotating"
        );

    }, 600);


    normalMonitoring();


    addActivity(
        "Health check completed",
        "Server metrics were refreshed successfully.",
        "success"
    );
}


/* ================= CLEAR ACTIVITY ================= */

function clearActivity() {

    elements.activityList.innerHTML = "";

    addActivity(
        "Activity log cleared",
        "Previous activity entries were removed.",
        "info"
    );
}


/* ================= EVENT LISTENERS ================= */

document
    .getElementById("highCpuButton")
    .addEventListener(
        "click",
        simulateHighCPU
    );


document
    .getElementById("serviceFailureButton")
    .addEventListener(
        "click",
        simulateServiceFailure
    );


document
    .getElementById("recoveryButton")
    .addEventListener(
        "click",
        runRecovery
    );


document
    .getElementById("refreshButton")
    .addEventListener(
        "click",
        refreshDashboard
    );


document
    .getElementById("clearActivity")
    .addEventListener(
        "click",
        clearActivity
    );


/* ================= AUTO MONITORING ================= */

setInterval(() => {

    normalMonitoring();

}, 5000);


setInterval(() => {

    updateUptime();

}, 60000);


/* ================= INITIALIZE ================= */

updateMetrics();

updateChart();

updateApacheService();

refreshIcons();