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

function init() {
  addMessageListeners();
  timer();
}

async function timer() {
  const data = await getLocalStorageValue([
    "workStarted",
    "schedule",
    "timerRunning",
  ]);

  const startTime = new Date(data["workStarted"]);
  const workValue = parseInt(data["schedule"]["workValue"], 10);
  const breakValue = parseInt(data["schedule"]["breakValue"], 10);
  const workTimeMultiplier = getTimeMultiplier(data["schedule"]["workUnit"]);
  const breakTimeMultiplier = getTimeMultiplier(data["schedule"]["breakUnit"]);

  const endWork = new Date(
    startTime.getTime() + workValue * workTimeMultiplier
  );
  const endWorkHours = endWork.getHours();
  const endWorkMins =
    endWork.getMinutes().toString().length > 1
      ? endWork.getMinutes()
      : `0${endWork.getMinutes()}`;

  const endBreak = new Date(
    endWork.getTime() + breakValue * breakTimeMultiplier
  );

  const endWorkFormatted = `${endWorkHours}:${endWorkMins}`;

  // set the break time
  document.querySelector(".break-time")
    ? (document.querySelector(".break-time").textContent = endWorkFormatted)
    : null;

  if (!data["timerRunning"]) {
    chrome.runtime.sendMessage({
      command: "startTimer",
      endTime: endWork,
    });
  }
}

function addMessageListeners() {
  const stopBtn = document.getElementById("button-stop");
  const delayBtn = document.getElementById("button-delay");

  if (stopBtn) {
    stopBtn.addEventListener("click", handleTimerStop);
  }
  if (delayBtn) {
    delayBtn.addEventListener("click", handleTimerDelay);
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
  chrome.runtime.sendMessage({
    command: "stopTimer",
  });
  chrome.storage.sync.set({ timerRunning: false });
  chrome.browserAction.setPopup({ popup: "popup/menu.html" });
  window.location.href = "menu.html";
}

async function handleTimerDelay() {
  const delayTime = 5 * 1000 * 60; // 5 mins
  const data = await getLocalStorageValue(["workStarted"]);

  const workStarted = new Date(data["workStarted"]);
  const newWorkStarted = new Date(workStarted.getTime() + delayTime);

  chrome.storage.sync.set({ workStarted: newWorkStarted.getTime() });
  chrome.storage.sync.set({ timerRunning: false });
  chrome.runtime.sendMessage({
    command: "stopTimer",
  });
  timer();
}

document.addEventListener("DOMContentLoaded", init);
