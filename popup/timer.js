/* utils */
async function getLocalStorageValue(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(key, function (value) {
        resolve(value);
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

function getTimeMultiplier(unit) {
  const timeUnitValues = {
    seconds: 1000,
    minutes: 1000 * 60,
    hours: 1000 * 60 * 60,
  };

  return timeUnitValues[unit];
}

function stopTimer() {
  chrome.runtime.sendMessage({
    command: "stopTimer",
  });
  chrome.tabs.query({ title: "Time for a break!" }, (tab) => {
    if (Object.keys(tab).length > 0) {
      chrome.tabs.remove(tab[0].id);
    }
  });
}

function setPopup(type) {
  chrome.browserAction.setPopup({ popup: `popup/popup-${type}.html` });
  window.location.href = `popup-${type}.html`;
}
/* utils */

function init() {
  addMessageListeners();
  timer();
}

async function timer(type = "work") {
  const data = await getLocalStorageValue([
    "timerStarted",
    "schedule",
    "timerRunning",
  ]);

  const startTime = new Date(data["timerStarted"]);
  const workValue = parseInt(data["schedule"]["workValue"], 10);
  const workTimeMultiplier = getTimeMultiplier(data["schedule"]["workUnit"]);

  const endWork = new Date(
    startTime.getTime() + workValue * workTimeMultiplier
  );
  const endWorkHours = endWork.getHours();
  const endWorkMins =
    endWork.getMinutes().toString().length > 1
      ? endWork.getMinutes()
      : `0${endWork.getMinutes()}`;

  const endWorkFormatted = `${endWorkHours}:${endWorkMins}`;

  // set the break time
  document.querySelector(".end-time")
    ? (document.querySelector(".end-time").textContent = endWorkFormatted)
    : null;

  if (!data["timerRunning"]) {
    chrome.runtime.sendMessage({
      command: "startTimer",
      endTime: endWork,
      type: type,
    });
  }
}

function addMessageListeners() {
  const stopBtn = document.getElementById("button-stop");
  const delayBtn = document.getElementById("button-delay");
  const extendBtn = document.getElementById("button-extend");
  const skipBtn = document.getElementById("button-skip");

  if (stopBtn) {
    stopBtn.addEventListener("click", handleTimerStop);
  }
  if (delayBtn) {
    delayBtn.addEventListener("click", handleTimerDelay);
  }
  if (extendBtn) {
    extendBtn.addEventListener("click", handleTimerExtend);
  }
  if (skipBtn) {
    skipBtn.addEventListener("click", handleTimerSkip);
  }

  chrome.runtime.onMessage.addListener((request, sendResponse) => {
    if (request.command === "updateTime") {
      document.querySelector(".hours").textContent = request.h;
      document.querySelector(".minutes").textContent = request.m;
      document.querySelector(".seconds").textContent = request.s;

      const remainingPerc = request.remainingPerc;
      const elapsedPerc = 100 - remainingPerc;

      const indicatorRemaining = document.getElementById("indicator-remaining");
      const indicatorElapsed = document.getElementById("indicator-elapsed");

      indicatorRemaining.style.width = `${remainingPerc}%`;
      indicatorElapsed.style.width = `${elapsedPerc}%`;
    }
  });
}

function handleTimerStop() {
  stopTimer();
  chrome.storage.sync.set({ timerRunning: false });
  setPopup("menu");
}

async function handleTimerDelay() {
  const delayTime = 5 * 1000 * 60; // 5 mins
  const data = await getLocalStorageValue(["timerStarted"]);

  const timerStarted = new Date(data["timerStarted"]);
  const newtimerStarted = new Date(timerStarted.getTime() + delayTime);

  chrome.storage.sync.set({
    timerStarted: newtimerStarted.getTime(),
    timerRunning: false,
  });
  stopTimer();
  timer("work");
}

async function handleTimerExtend() {
  const delayTime = 5 * 1000 * 60; // 5 mins
  const data = await getLocalStorageValue(["timerStarted"]);

  const timerStarted = new Date(data["timerStarted"]);
  const newtimerStarted = new Date(timerStarted.getTime() + delayTime);

  chrome.storage.sync.set({
    timerStarted: newtimerStarted.getTime(),
    timerRunning: false,
  });
  chrome.runtime.sendMessage({
    command: "stopTimer",
  });
  timer("break");
}

async function handleTimerSkip() {
  const newtimerStarted = new Date();

  chrome.storage.sync.set({
    timerStarted: newtimerStarted.getTime(),
    timerRunning: false,
  });
  stopTimer();
  setPopup("work");
  timer("work");
}

document.addEventListener("DOMContentLoaded", init);
