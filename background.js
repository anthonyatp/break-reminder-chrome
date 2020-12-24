chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.command == "startTimer") {
    startTimer(request.endTime);
  }
});

function startTimer(endTime) {
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
      // TODO: implement breaks (new tab? replace other tabs?)
      chrome.tabs.create({ url: "popup/break.html" });
      clearInterval(timer);
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
