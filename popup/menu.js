document.getElementById("startButton").addEventListener("click", startBreaks);

function startBreaks() {
  const now = new Date().getTime();
  const schedule = {
    workValue: document.getElementById("workValue").value,
    workUnit: document.getElementById("workUnit").value,
    breakValue: document.getElementById("breakValue").value,
    breakUnit: document.getElementById("breakUnit").value,
  };
  chrome.storage.sync.set({
    timerStarted: now,
    schedule: schedule,
    timerRunning: false,
  });
  chrome.browserAction.setPopup({ popup: "popup/popup-work.html" });
  window.location.href = "popup-work.html";
}

// limit value between 1-99
document.querySelector("input").addEventListener("keydown", function (e) {
  if (
    parseInt(e.target.value, 10) < 1 ||
    parseInt(e.target.value, 10) > 99 ||
    e.target.value.length > 2
  ) {
    e.target.value = e.target.value.substring(0, 2);
  }
});
document.querySelector("input").addEventListener("keyup", function (e) {
  if (
    parseInt(e.target.value, 10) < 1 ||
    parseInt(e.target.value, 10) > 99 ||
    e.target.value.length > 2
  ) {
    e.target.value = e.target.value.substring(0, 2);
  }
});

// prevent non-numeric characters
document.querySelector("input").addEventListener("keypress", function (e) {
  const allowedChars = "0123456789";
  const invalidKey =
    (e.key.length === 1 && !contains(allowedChars, e.key)) ||
    (e.key === "." && contains(e.target.value, "."));
  invalidKey && e.preventDefault();
});

document.querySelector(".helpText").addEventListener("click", () =>
  chrome.tabs.create({
    url:
      "https://www.ihasco.co.uk/blog/entry/189/it-health-and-safety-how-often-should-i-take-a-break-from-my-computer",
  })
);

function contains(stringValue, charValue) {
  return stringValue.indexOf(charValue) > -1;
}
