import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = `http://${window.location.hostname}:4300`;
const profileStats = [
  { label: "Zone", value: "Local" },
  { label: "Style", value: "Fast Deals" },
  { label: "Deal Type", value: "Buy / Sell / Trade" },
];

export default function App() {
  const [feed, setFeed] = useState([]);
  const [screen, setScreen] = useState("feed");

  async function loadFeed() {
    const res = await fetch(`${API_BASE}/api/feed`);
    const data = await res.json();
    setFeed(data);
  }

  useEffect(() => {
  loadFeed();

  const interval = setInterval(loadFeed, 3000);

  return () => clearInterval(interval);
}, []);
  async function createListing() {
    const name = prompt("Listing name?");
    if (!name) return;

    const price = prompt("Price?");
    if (!price) return;

    const res = await fetch(`${API_BASE}/api/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price, status: "Available", tag: "User Created" }),
    });

    const data = await res.json();
    setFeed(data);
    setScreen("feed");
  }

  async function resetFeed() {
    const ok = confirm("Reset shared SellCore feed?");
    if (!ok) return;

    const res = await fetch(`${API_BASE}/api/feed/reset`, { method: "POST" });
    const data = await res.json();
    setFeed(data);
    setScreen("feed");
  }

  function openCodeRed() {
    window.open("file:///C:/Users/owner/Desktop/code-red-current.html", "_blank");
  }

  return (
    <main className="appShell">
      <section className="heroCard">
        <header className="topBar">
          <div>
            <p className="eyebrow">SELLCORE</p>
            <h1>Social Marketplace</h1>
          </div>
          <div className="cellLogo">◎</div>
        </header>

        <div className="verifiedBadge">Core Verified Prototype</div>

        <p className="heroText">
          Buy, sell, trade, and organize daily goods through one backend-connected SellCore feed.
        </p>

        <button className="primaryLaunch" onClick={createListing}>
          <span>＋</span> Create Listing
        </button>

        <div className="pipelineStrip">
          {profileStats.map((stat) => (
            <div key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </section>

      {screen === "feed" && (
        <section className="sectionBlock">
          <div className="sectionHead">
            <p className="eyebrow">SHARED SELLCORE FEED</p>
            <h2>Listings + Playable Products</h2>
          </div>

          <div className="moduleList">
            {feed.map((item, index) => (
              <article className="moduleCard" key={`${item.name}-${index}`}>
                <div className="moduleIcon">{item.name === "Code Red" ? "🎮" : "🛍️"}</div>
                <div className="moduleText">
                  <h3>{item.name}</h3>
                  <p>{item.status} • {item.tag}</p>
                </div>
                <button onClick={item.name === "Code Red" ? openCodeRed : undefined}>
                  {item.price}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {screen === "market" && (
        <section className="sectionBlock">
          <div className="sectionHead">
            <p className="eyebrow">MARKET TOOLS</p>
            <h2>Control</h2>
          </div>
          <button className="secondaryButton" onClick={resetFeed}>Reset Shared Feed</button>
          <button className="secondaryButton" onClick={loadFeed}>Refresh Feed</button>
        </section>
      )}

      {screen === "profiles" && (
        <section className="sectionBlock profileCard">
          <div className="sectionHead">
            <p className="eyebrow">CORE PROFILES</p>
            <h2>Seller Persona</h2>
          </div>

          <div className="personaRow">
            <div className="personaIcon">🛒</div>
            <div>
              <h3>Daily Goods Builder</h3>
              <p>Trusted local seller profile for items, services, trades, and fast offers.</p>
            </div>
          </div>

          <button className="secondaryButton" onClick={() => alert("Profile system coming next.")}>
            Open Core Profile
          </button>
        </section>
      )}

      <button className="coreControl" onClick={() => alert("Core Control connected.")}>
        Core Control
      </button>

      <nav className="bottomDock">
        <button onClick={() => setScreen("feed")}>◎ Feed</button>
        <button onClick={createListing}>＋ Create</button>
        <button onClick={() => setScreen("market")}>🛒 Market</button>
        <button onClick={() => setScreen("profiles")}>👤 Profiles</button>
      </nav>
    </main>
  );
}