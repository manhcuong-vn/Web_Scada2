
/* =====================================================
   BIẾN LƯU TRẠNG THÁI CŨ (CHỐNG NHẤP NHÁY)
===================================================== */
const lastState = {};

/* =====================================================
   ĐỌC DỮ LIỆU PLC (Node-RED / API)
===================================================== */
function readPLC() {
  fetch("http://localhost:1880/factory/status")
    .then(res => res.json())
    .then(data => updateFromPLC(data))
    .catch(err => console.error("Fetch error:", err));
}

/* =====================================================
   BƠM (RUN / STOP / ALARM)
===================================================== */
function updatePump(id, pump) {
  const el = document.getElementById(id);
  if (!el || !pump) return;

  let newState = "stop";
  if (pump.alarm) newState = "alarm";
  else if (pump.run) newState = "run";

  if (lastState[id] === newState) return;
  lastState[id] = newState;

  el.classList.remove("state-run", "state-stop", "state-alarm");
  el.classList.add("state-" + newState);
}

/* =====================================================
   VAN (FULL OPEN / FULL CLOSE / MOVING + CMD)
===================================================== */
function updateValve(id, valve) {
  const el = document.getElementById(id);
  if (!el || !valve) return;

  let posState = "moving";
  if (valve.fbOpen) posState = "full-open";
  else if (valve.fbClose) posState = "full-close";

  let cmdState = valve.cmdOpen ? "cmd-open" : "cmd-close";
  const stateKey = posState + "|" + cmdState;

  if (lastState[id] === stateKey) return;
  lastState[id] = stateKey;

  el.classList.remove(
    "pos-full-open",
    "pos-full-close",
    "pos-moving",
    "cmd-open",
    "cmd-close"
  );

  el.classList.add("pos-" + posState);
  el.classList.add(cmdState);
}

/* =====================================================
   SENSOR (HIỂN THỊ GIÁ TRỊ ANALOG)
===================================================== */
const scale10Sensors = ["CIS151", "CIS180"];

function updateSensor(id, value, fixed = 2) {
  const el = document.getElementById(id);
  if (!el || value === undefined || value === null) return;

  if (lastState[id] === value) return;
  lastState[id] = value;
  const v = Number(value);
  const displayValue = scale10Sensors.includes(id)
    ? v
    : v / 10;

  el.textContent = displayValue.toFixed(fixed);
}

/* =====================================================
   SETUP – READ ONLY (MIN / MAX / OFFSET / LIMIT…)
===================================================== */
function updateSetupReadOnly(id, value, formatter) {
  const box = document.getElementById(id);
  if (!box || value === undefined) return;

  const el = box.querySelector(".value");
  if (!el) return;

  if (lastState[id] === value) return;
  lastState[id] = value;

  el.textContent = formatter ? formatter(value) : value;

  /* highlight khi giá trị thay đổi */
  el.classList.add("changed");
  clearTimeout(el._changedTimer);
  el._changedTimer = setTimeout(() => {
    el.classList.remove("changed");
  }, 1500);
}

/* =====================================================
   LEVEL SWITCH / PHAO (ON / OFF)
===================================================== */
function updateLevelSwitch(id, state) {
  const el = document.getElementById(id);
  if (!el || state === undefined) return;

  const newState = state ? "on" : "off";
  if (lastState[id] === newState) return;
  lastState[id] = newState;

  el.classList.remove("level-on", "level-off");
  el.classList.add("level-" + newState);
}

/* =====================================================
   MAP THIẾT BỊ
===================================================== */
const pumpMap = [
  "PK011","PK012","SP021","SP022",
  "MCT01","MCT02",
  "DP011","DP012","DP021","DP022",
  "PK121","PK131","PK1601","PK1602","PK191",
  "DP121","DP122","DP151","DP152"
];

const valveMap = [
  "VE111","VE1211","VE1212",
  "VE1310","VE1311","VE1312",
  "VE1321","VE1322",
  "VE1711","VE1712",
  "VE1801","VE1601",
  "VS1601","VS171"
];

const sensorMap = {
  "pHS011": { fixed: 2 },
  "pHS131": { fixed: 2 },
  "PT131":  { fixed: 2 },
  "PT151":  { fixed: 2 },
  "FT151":  { fixed: 1 },
  "CIS151": { fixed: 0 },
  "PT1601": { fixed: 2 },
  "PT162":  { fixed: 2 },
  "PT1602": { fixed: 2 },
  "CIS180": { fixed: 0 },
  "FT180":  { fixed: 1 },
  "PK1601-Hz": { fixed: 1 },
  "PK1602-Hz": { fixed: 1 },
  "VS1601-%": { fixed: 0 },
  "VS171-%":  { fixed: 0 }
};

const levelSwitchMap = [
  "LS011","LS121","LS131","LS111","LS181","LS182"
];

/* =====================================================
   UPDATE TOÀN BỘ DỮ LIỆU TỪ PLC
===================================================== */
function updateFromPLC(data) {

  pumpMap.forEach(id => {
    updatePump(id, data.pumps?.[id]);
  });

  valveMap.forEach(id => {
    updateValve(id, data.valves?.[id]);
  });

  Object.entries(sensorMap).forEach(([id, cfg]) => {
    updateSensor(id, data.sensors?.[id], cfg.fixed);
  });

  levelSwitchMap.forEach(id => {
    updateLevelSwitch(id, data.levels?.[id]);
  });

  /* ví dụ setup read-only */
  if (data.setups) {
    updateSetupReadOnly("PT131_MIN", data.setups.PT131?.min);
    updateSetupReadOnly("PT131_MAX", data.setups.PT131?.max);
    updateSetupReadOnly("PT131_OFFSET", data.setups.PT131?.offset);
  }
}

/* =====================================================
   CHU KỲ QUÉT
===================================================== */
readPLC();
setInterval(readPLC, 1000); // 1s – đúng chất SCADA 😄

/* =====================================================
   TOOL LẤY TỌA ĐỘ CLICK (LAYOUT)
===================================================== */
const scada = document.getElementById("scada");
if (scada) {
  scada.addEventListener("click", function (e) {
    const rect = scada.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    console.log(`left: ${x}px; top: ${y}px;`);
  });
}

