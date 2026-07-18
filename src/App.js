import React, { useEffect, useRef, useState } from 'react';

const DEFAULT_FETCH_URL = 'https://api.example.com/sp500';
const POLL_INTERVAL_MS = 60_000;
const STARTING_CAPITAL = 10000;
const TOP_COUNT = 10;

function useIsMounted() {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  return mounted;
}

async function fetchIndexData() {
  try {
    const res = await fetch(DEFAULT_FETCH_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Network response not ok');
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('Invalid data');
    return json;
  } catch (_err) {
    return [
      { symbol: 'AAPL', price: 170.12, changePercent: 0.8, volatility: 0.12, trendStrength: 0.7 },
      { symbol: 'MSFT', price: 320.45, changePercent: 0.5, volatility: 0.10, trendStrength: 0.6 },
      { symbol: 'GOOGL', price: 118.2, changePercent: -0.3, volatility: 0.14, trendStrength: 0.4 },
      { symbol: 'AMZN', price: 98.4, changePercent: 1.2, volatility: 0.16, trendStrength: 0.5 },
      { symbol: 'TSLA', price: 210.3, changePercent: 2.5, volatility: 0.50, trendStrength: 0.8 },
      { symbol: 'NVDA', price: 420.0, changePercent: 1.0, volatility: 0.22, trendStrength: 0.9 },
      { symbol: 'FB', price: 185.0, changePercent: -0.1, volatility: 0.11, trendStrength: 0.45 },
      { symbol: 'NFLX', price: 280.0, changePercent: 0.2, volatility: 0.18, trendStrength: 0.55 },
      { symbol: 'INTC', price: 28.0, changePercent: -0.5, volatility: 0.08, trendStrength: 0.25 },
      { symbol: 'AMD', price: 120.5, changePercent: 0.9, volatility: 0.30, trendStrength: 0.6 },
    ];
  }
}

function rankPredictability(stocks = []) {
  return stocks
    .map((s) => ({ ...s, score: (1 / (s.volatility || 0.0001)) + (s.trendStrength || 0) }))
    .sort((a, b) => b.score - a.score);
}

function allocateCapital(stocks = [], totalCapital = STARTING_CAPITAL, topN = TOP_COUNT) {
  const top = stocks.slice(0, topN);
  if (top.length === 0) return [];
  const perStock = totalCapital / top.length;
  return top.map((s) => ({
    symbol: s.symbol,
    invested: Number(perStock.toFixed(2)),
    lastPrice: s.price,
    shares: Number((perStock / s.price).toFixed(6)),
  }));
}

function GraphComponent({ data = [] }) {
  if (!data || data.length === 0) return <div>No graph data yet</div>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1e-6, max - min);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
      {data.map((v, i) => {
        const height = ((v - min) / range) * 100;
        return (
          <div key={i} title={`${v}`} style={{ width: 8, height: `${Math.max(2, height)}%`, background: '#3b82f6', borderRadius: 2 }} />
        );
      })}
    </div>
  );
}

function TopMovers({ data = [] }) {
  if (!data || data.length === 0) return <div>No data</div>;
  return (
    <div>
      <h3>Top Movers</h3>
      <ul style={{ paddingLeft: 16 }}>
        {data.map((s) => (
          <li key={s.symbol} style={{ marginBottom: 6 }}>
            <strong>{s.symbol}</strong>: ${s.price} ({s.changePercent}%)
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [indexData, setIndexData] = useState([]);
  const [topMovers, setTopMovers] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const isMounted = useIsMounted();
  const runningRef = useRef(true);

  async function runUpdate() {
    const fetched = await fetchIndexData();
    if (!isMounted.current) return;
    setIndexData(fetched);
    const ranked = rankPredictability(fetched);
    setTopMovers(ranked.slice(0, TOP_COUNT));
    const alloc = allocateCapital(ranked, STARTING_CAPITAL, TOP_COUNT);
    setPortfolio(alloc);
    const total = alloc.reduce((sum, a) => sum + (a.shares * (a.lastPrice || 0)), 0);
    setPortfolioHistory((prev) => [...prev.slice(-99), Number(total.toFixed(2))]);
  }

  useEffect(() => {
    runUpdate();
    const id = setInterval(() => { if (!runningRef.current) return; runUpdate(); }, POLL_INTERVAL_MS);
    return () => { runningRef.current = false; clearInterval(id); };
  }, []);

  function handleManualRefresh() { runUpdate(); }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20, maxWidth: 980, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Builder App (clean)</h1>
          <small>Auto-updates every 60s — fallback data if needed</small>
        </div>
        <div>
          <button onClick={handleManualRefresh} style={{ padding: '8px 12px', cursor: 'pointer' }}>
            Refresh now
          </button>
        </div>
      </header>
      <main style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, marginTop: 20 }}>
        <section>
          <h2>Portfolio</h2>
          <div style={{ marginBottom: 12 }}><strong>Starting capital:</strong> ${STARTING_CAPITAL.toLocaleString()}</div>
          <div style={{ marginBottom: 12 }}>
            <strong>Current allocation (top {TOP_COUNT})</strong>
            <ul style={{ paddingLeft: 16 }}>
              {portfolio.map((p) => (
                <li key={p.symbol} style={{ marginBottom: 6 }}>
                  <strong>{p.symbol}</strong> — Invested ${p.invested} • Shares {p.shares} • Last ${p.lastPrice}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: 12 }}>
            <h3>Portfolio value history</h3>
            <GraphComponent data={portfolioHistory} />
            <div style={{ marginTop: 8 }}>Latest: ${portfolioHistory.length ? portfolioHistory[portfolioHistory.length - 1] : '—'}</div>
          </div>
        </section>
        <aside>
          <TopMovers data={topMovers} />
          <div style={{ marginTop: 20 }}>
            <h3>Index snapshot</h3>
            <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', padding: 8 }}>
              {indexData.length === 0 ? <div>No data yet</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ textAlign: 'left' }}><tr><th>Symbol</th><th>Price</th><th>Change</th></tr></thead>
                  <tbody>{indexData.map((s) => <tr key={s.symbol}><td style={{ paddingRight: 8 }}>{s.symbol}</td><td style={{ paddingRight: 8 }}>${s.price}</td><td style={{ paddingRight: 8 }}>{s.changePercent}%</td></tr>)}</tbody>
                </table>
              )}
            </div>
          </div>
        </aside>
      </main>
      <footer style={{ marginTop: 24, color: '#666' }}><small>If you want features from the old repo restored, I can extract them safely later.</small></footer>
    </div>
  );
}
