// ===== 初期データ =====
let joinDate = localStorage.getItem("joinDate")
  ? new Date(localStorage.getItem("joinDate"))
  : null;

let history = JSON.parse(localStorage.getItem("history")) || [];
let selectedDate = null;

// ===== カレンダー =====
flatpickr("#datePicker", {
  locale: flatpickr.l10ns.ja,
  dateFormat: "Y-m-d",
  disableMobile: true,
  onChange: function(selectedDates, dateStr) {
    selectedDate = dateStr;
  }
});

// ===== 入社日保存 =====
window.onload = () => {
  const saved = localStorage.getItem("joinDate");
  if (saved) {
    document.getElementById("joinDateInput").value = saved;
    joinDate = new Date(saved);
  }
  function update() {
  if (!joinDate) {
    document.getElementById("remain").textContent = "-";
    document.getElementById("nextGrant").textContent = "入社日を設定してください";
    return;
  }
  update();
};

// ===== 有給付与 =====
function getGrantedDays(months) {
  if (months < 6) return 0;
  if (months < 18) return 10;
  if (months < 30) return 11;
  if (months < 42) return 12;
  if (months < 54) return 14;
  if (months < 66) return 16;
  if (months < 78) return 18;
  return 20;
}

// ===== 月数計算 =====
function getMonthsDiff(start, end) {
  return (end.getFullYear() - start.getFullYear()) * 12 +
         (end.getMonth() - start.getMonth());
}

// ===== 使用合計 =====
function getUsed() {
  return history.reduce((sum, h) => sum + h.value, 0);
}

// ===== 次の付与日 =====
function getNextGrantDate() {
  if (!joinDate) return "-";

  let months = getMonthsDiff(joinDate, now);
  let nextMonths = [6,18,30,42,54,66,78].find(m => m > months);

  if (!nextMonths) return "最大付与済";

  let next = new Date(joinDate);
  next.setMonth(joinDate.getMonth() + nextMonths);

  return next.toISOString().split("T")[0];
}

// ===== 更新 =====
  let now = new Date();
  let months = getMonthsDiff(joinDate, now);

  let total = getGrantedDays(months);
  let used = getUsed();

  let remain = total - used;
　if (remain < 0) remain = 0;

  document.getElementById("remain").textContent = (total - used).toFixed(1);

  document.getElementById("nextGrant").textContent =
    "次の付与日: " + getNextGrantDate();

  renderHistory();
  renderStats();
  renderChart();
　renderYearly();
}

// ===== 追加 =====
function addLeave(day) {
  if (history.some(h => h.date === selectedDate)) {
  alert("この日は既に登録されています");
  return;
}

  history.push({
    date: selectedDate,
    value: day
  });

  localStorage.setItem("history", JSON.stringify(history));
  history.sort((a, b) => a.date.localeCompare(b.date));
  update();
}

// ===== 削除 =====
function deleteItem(index) {
  history.splice(index, 1);
  localStorage.setItem("history", JSON.stringify(history));
  update();
}

// ===== 履歴 =====
function renderHistory() {
  const div = document.getElementById("history");
  div.innerHTML = "";

  history.slice().reverse().forEach((item, i) => {
    const el = document.createElement("div");
    el.className = "history-item";
    el.innerHTML = `
      ${item.date} - ${item.value}日
      <button onclick="deleteItem(${history.length - 1 - i})">削除</button>
    `;
    div.appendChild(el);
  });
}

// ===== 集計 =====
function renderStats() {
  
  function parseDate(str) {
  const [y, m, d] = str.split("-");
  return new Date(y, m - 1, d);
}
  
  let thisMonth = now.toISOString().slice(0,7);
  let monthly = history
    .filter(h => h.date.startsWith(thisMonth))
    .reduce((sum, h) => sum + h.value, 0);

  document.getElementById("stats").textContent =
    `今月使用: ${monthly}日 / 合計: ${getUsed()}日`;
}

// ===== 一括登録 =====
function importData() {
  const text = document.getElementById("bulkInput").value;
  const lines = text.split("\n");

  lines.forEach(line => {
    const [date, value] = line.split(",");
    if (!date || isNaN(value)) return;

    history.push({
      date: date.trim(),
      value: parseFloat(value)
    });
  });

  localStorage.setItem("history", JSON.stringify(history));
  update();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

function getRemainWithCarry() {
  let now = new Date();
  let months = getMonthsDiff(joinDate, now);

  let total = getGrantedDays(months);
  let used = getUsed();

  let remain = total - used;

  //  簡易繰越
  if (remain > 40) remain = 40;
  if (remain < 0) remain = 0;

  return remain;
}

function getYearlyStats() {
  const result = {};

  history.forEach(h => {
    const year = h.date.slice(0, 4);

    if (!result[year]) result[year] = 0;

    result[year] += h.value;
  });

  return result;
}

function renderYearly() {
  const data = getYearlyStats();
  let text = "";

  for (let y in data) {
    text += `${y}年: ${data[y]}日\n`;
  }

  document.getElementById("yearly").textContent = text;
}

function renderChart() {
  const data = getYearlyStats();

  const labels = Object.keys(data);
  const values = Object.values(data);

  new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "有給使用日数",
        data: values
      }]
    }
  });
}

update();
