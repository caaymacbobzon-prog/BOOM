// JavaScript is used ONLY for the interactive parts:
// submit form, search/filter, claim, delete, and saving in the browser.

let items = JSON.parse(localStorage.getItem("lostAndFound")) || [];

const form = document.getElementById("itemForm");
const formError = document.getElementById("formError");
const itemList = document.getElementById("itemList");
const emptyMsg = document.getElementById("emptyMsg");
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filterType");
const filterStatus = document.getElementById("filterStatus");
const template = document.getElementById("cardTemplate");
const typeInput = document.getElementById("type");
const dateInput = document.getElementById("date");

function save() {
  localStorage.setItem("lostAndFound", JSON.stringify(items));
}

// Date cannot be later than today
dateInput.max = new Date().toLocaleDateString("en-CA");

// Labels change to "Lost" or "Found" depending on the report type
function updateLabels() {
  const word = typeInput.value; // "Lost" or "Found"
  document.getElementById("areaLabel").textContent = "Location " + word + ": Area / Building";
  document.getElementById("locationLabel").textContent = "Location " + word + ": Specific Spot";
  document.getElementById("dateLabel").textContent = "Date " + word;
  document.getElementById("timeLabel").textContent = "Time " + word;
}
typeInput.addEventListener("change", updateLabels);

// Turn "14:30" into "2:30 PM"
function formatTime(time) {
  if (!time) return "Not specified";
  return new Date("1970-01-01T" + time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Add a report
form.addEventListener("submit", function (event) {
  event.preventDefault();

  // Item name has no length limit, it just can't be blank spaces
  const name = document.getElementById("name").value.trim();
  if (name === "") {
    formError.textContent = "Please enter the item name.";
    return;
  }

  // Date and time cannot be in the future
  const when = new Date(dateInput.value + "T" + document.getElementById("time").value);
  if (when > new Date()) {
    formError.textContent = "Date and time cannot be in the future.";
    return;
  }

  // Area + specific spot, e.g. "Library - 2nd floor, near the printers"
  const location = document.getElementById("area").value + " - " +
                   document.getElementById("location").value.trim();

  items.unshift({
    id: Date.now(),
    type: typeInput.value,
    name: name,
    category: document.getElementById("category").value,
    location: location,
    date: dateInput.value,
    time: document.getElementById("time").value,
    contact: document.getElementById("contact").value.trim(),
    description: document.getElementById("description").value.trim() || "None",
    claimed: false
  });

  save();
  formError.textContent = "";
  form.reset();
  updateLabels();
  render();
});

// Search and filter
searchInput.addEventListener("input", render);
filterType.addEventListener("change", render);
filterStatus.addEventListener("change", render);

// Claim and delete buttons (one listener for all cards)
itemList.addEventListener("click", function (event) {
  const card = event.target.closest(".item");
  if (!card) return;
  const id = Number(card.dataset.id);

  if (event.target.classList.contains("claim-btn")) {
    const item = items.find(function (i) { return i.id === id; });
    item.claimed = !item.claimed;
  } else if (event.target.classList.contains("delete-btn")) {
    if (!confirm("Delete this report?")) return;
    items = items.filter(function (i) { return i.id !== id; });
  } else {
    return;
  }

  save();
  render();
});

// Show the items that match the search and filters
function render() {
  const keyword = searchInput.value.toLowerCase().trim();
  itemList.innerHTML = "";
  let shown = 0;

  items.forEach(function (item) {
    const text = (item.name + item.location + item.description + item.category).toLowerCase();
    if (!text.includes(keyword)) return;
    if (filterType.value !== "All" && item.type !== filterType.value) return;
    if (filterStatus.value === "Open" && item.claimed) return;
    if (filterStatus.value === "Claimed" && !item.claimed) return;

    const card = template.content.cloneNode(true).querySelector(".item");
    card.dataset.id = item.id;
    card.classList.add(item.type);
    if (item.claimed) card.classList.add("claimed");

    // Values shown on the card (labels follow the report type)
    const values = Object.assign({}, item, {
      locationLabel: "Location " + item.type,
      dateLabel: "Date " + item.type,
      timeLabel: "Time " + item.type,
      time: formatTime(item.time)
    });

    card.querySelectorAll("[data-field]").forEach(function (el) {
      el.textContent = values[el.dataset.field];
    });

    itemList.appendChild(card);
    shown++;
  });

  emptyMsg.style.display = shown === 0 ? "block" : "none";
}

updateLabels();
render();
