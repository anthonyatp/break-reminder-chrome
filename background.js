chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.command == "startTimer") {
    startTimer(request.endTime, request.type);
  }
});

function getTimeMultiplier(unit) {
  const timeUnitValues = {
    seconds: 1000,
    minutes: 1000 * 60,
    hours: 1000 * 60 * 60,
  };

  return timeUnitValues[unit];
}

function startTimer(endTime, type) {
  chrome.runtime.onMessage.addListener((request) => {
    if (request.command == "stopTimer") {
      clearInterval(timer);
    }
  });

  chrome.storage.sync.set({ timerRunning: true });
  const initDiff = new Date(endTime) - new Date();
  const diffHours = Math.floor(initDiff / 1000 / 60 / 60);
  const diffMinutes = Math.floor(initDiff / 1000 / 60) % 60;
  const diffSeconds = new Date(initDiff).getSeconds();

  updateTime(initDiff, initDiff, diffHours, diffMinutes, diffSeconds);

  const timer = setInterval(() => {
    const diff = new Date(endTime) - new Date();

    if (diff > 0) {
      const diffHours = Math.floor(diff / 1000 / 60 / 60);
      const diffMinutes = Math.floor(diff / 1000 / 60) % 60;
      const diffSeconds = new Date(diff).getSeconds();

      updateTime(initDiff, diff, diffHours, diffMinutes, diffSeconds);
    } else {
      const chime = new Audio(chrome.runtime.getURL("audio/chime.mp3"));
      if (type === "work") {
        clearInterval(timer);
        chrome.tabs.create({ url: "popup/break.html" });
        chrome.storage.sync.get(["schedule"], (result) => {
          const breakValue = parseInt(result["schedule"]["breakValue"], 10);
          const breakTimeMultiplier = getTimeMultiplier(
            result["schedule"]["breakUnit"]
          );
          const newEndTime = new Date(
            new Date(endTime).getTime() + breakValue * breakTimeMultiplier
          );

          chrome.storage.sync.set({ timerStarted: newEndTime.getTime() });

          setPopup("break");
          startTimer(newEndTime, "break");
          chime.play();
        });
      } else if (type === "break") {
        clearInterval(timer);
        chrome.tabs.query({ title: "Time for a break" }, (tab) => {
          if (Object.keys(tab).length > 0) {
            chrome.tabs.remove(tab[0].id);
          }
        });
        chrome.storage.sync.get(["schedule"], (result) => {
          const workValue = parseInt(result["schedule"]["workValue"], 10);
          const workTimeMultiplier = getTimeMultiplier(
            result["schedule"]["workUnit"]
          );
          const newEndTime = new Date(
            new Date(endTime).getTime() + workValue * workTimeMultiplier
          );

          chrome.storage.sync.set({ timerStarted: newEndTime.getTime() });

          setPopup("work");
          startTimer(newEndTime, "work");
          chime.play();
        });
      }
    }
  }, 1000);
}

function updateTime(initDiff, currentDiff, h, m, s) {
  const percFactor = 100 / initDiff;
  const remainingPerc = currentDiff * percFactor;

  chrome.runtime.sendMessage({
    command: "updateTime",
    remainingPerc: remainingPerc,
    h: h,
    m: m,
    s: s,
  });
}

function setPopup(type) {
  chrome.browserAction.setPopup({ popup: `popup/popup-${type}.html` });
  window.location.href = `popup-${type}.html`;
}
