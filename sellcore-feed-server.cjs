const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4300;
const FEED_FILE = path.join(__dirname, "sellcore-feed.json");

app.use(cors());
app.use(express.json());

const defaultFeed = [
  { name: "Used iPhone Case", price: "$8", status: "Available", tag: "Quick Sale" },
  { name: "Bluetooth Speaker", price: "$15", status: "Available", tag: "Local Pickup" },
  { name: "Cleaning Service", price: "$25+", status: "Service", tag: "Bookable" },
  { name: "Code Red", price: "Play", status: "Forge Game", tag: "Beta Test" }
];

function readFeed() {
  if (!fs.existsSync(FEED_FILE)) {
    fs.writeFileSync(FEED_FILE, JSON.stringify(defaultFeed, null, 2));
  }
  return JSON.parse(fs.readFileSync(FEED_FILE, "utf8"));
}

function writeFeed(feed) {
  fs.writeFileSync(FEED_FILE, JSON.stringify(feed, null, 2));
}

app.get("/api/feed", (req, res) => {
  res.json(readFeed());
});

app.post("/api/feed", (req, res) => {
  const feed = readFeed();
  const item = req.body;

  const nextItem = {
    name: item.name || "Untitled Listing",
    price: item.price || "Offer",
    status: item.status || "Available",
    tag: item.tag || "User Created"
  };

  const nextFeed = [nextItem, ...feed];
  writeFeed(nextFeed);
  res.json(nextFeed);
});

app.post("/api/feed/reset", (req, res) => {
  writeFeed(defaultFeed);
  res.json(defaultFeed);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SellCore feed server running on http://localhost:${PORT}`);
  console.log(`Network feed server running on http://192.168.12.128:${PORT}`);
});
