/* 10 IB Türkçe — veri katmanı + sayfa davranışları
   VERİ KAYNAĞI: şimdilik yerel JSON. İleride Google Sheets'e geçmek için
   asagidaki AYAR.kaynak degerini "sheets" yapip yayinlanmis CSV adresini girin. */

const AYAR = {
  kaynak: "yerel",            // "yerel" | "sheets"
  sheetsCsvUrl: ""            // Sheets > Dosya > Paylaş > Web'de yayınla > CSV bağlantısı
};

const YOL = (dosya) => `data/${dosya}`;

async function jsonGetir(dosya) {
  const y = await fetch(YOL(dosya));
  if (!y.ok) throw new Error(`${dosya} yüklenemedi (${y.status})`);
  return y.json();
}

/* Sheets CSV -> girisler dizisi (ileride kullanılacak) */
async function sheetsGetir(eserSlug) {
  const y = await fetch(AYAR.sheetsCsvUrl);
  const metin = await y.text();
  const satirlar = metin.split(/\r?\n/).filter(Boolean);
  const basliklar = satirlar.shift().split(",").map(s => s.trim().toLowerCase());
  return satirlar
    .map(s => {
      // basit CSV ayrıştırma (tırnaklı alanlar dahil)
      const alanlar = s.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(a => a.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
      const kayit = {};
      basliklar.forEach((b, i) => (kayit[b] = (alanlar[i] || "").trim()));
      return kayit;
    })
    .filter(k => !eserSlug || k.eser === eserSlug);
}

async function analizGetir(slug) {
  if (AYAR.kaynak === "sheets" && AYAR.sheetsCsvUrl) {
    const girisler = await sheetsGetir(slug);
    return { bolumler: [], girisler };
  }
  return jsonGetir(`analiz/${slug}.json`);
}

function e(html) {
  const d = document.createElement("div");
  d.textContent = html ?? "";
  return d.innerHTML;
}

const TIP_AD = { tema: "Tema", teknik: "Anlatım Tekniği", kuresel: "Küresel Sorun" };

function girisHTML(g) {
  return `
  <article class="giris" data-tip="${e(g.tip)}">
    <div class="tip-satir">
      <span class="tip">${TIP_AD[g.tip] || e(g.tip)}</span>
      ${g.alan ? `<span class="alan">${e(g.alan)}</span>` : ""}
    </div>
    <h3>${e(g.baslik)}</h3>
    ${g.yer ? `<div class="yer">${e(g.yer)}</div>` : ""}
    <p>${e(g.aciklama)}</p>
    <span class="durum ${g.durum === "onaylı" ? "onayli" : ""}">${g.durum === "onaylı" ? "✓ öğretmen onaylı" : "AI taslak — doğrulanmadı"}</span>
  </article>`;
}

/* ---------- ANA SAYFA ---------- */
async function anaSayfa() {
  const kartKap = document.getElementById("kartlar");
  const { eserler } = await jsonGetir("eserler.json");

  // kart sayaçları için tüm analizleri çek
  const analizler = {};
  await Promise.all(
    eserler.map(async (es) => {
      try { analizler[es.slug] = (await analizGetir(es.slug)).girisler || []; }
      catch { analizler[es.slug] = []; }
    })
  );

  kartKap.innerHTML = eserler
    .map((es) => {
      const g = analizler[es.slug];
      const say = (t) => g.filter((x) => x.tip === t).length;
      return `
      <a class="kart" style="--k-renk:${e(es.renk)}" href="eser.html?e=${e(es.slug)}">
        <h3>${e(es.ad)}</h3>
        <span class="yazar">${e(es.yazar)} · ${e(es.dil)}</span>
        <p>${e(es.ozet).slice(0, 150)}…</p>
        <span class="say">${say("tema")} tema · ${say("teknik")} teknik · ${say("kuresel")} küresel sorun</span>
      </a>`;
    })
    .join("");

  // genel arama
  const girisTum = eserler.flatMap((es) =>
    (analizler[es.slug] || []).map((g) => ({ ...g, eserAd: es.ad, eserSlug: es.slug }))
  );
  const arama = document.getElementById("arama");
  const sonucKap = document.getElementById("arama-sonuc");
  arama.addEventListener("input", () => {
    const s = arama.value.trim().toLocaleLowerCase("tr");
    if (s.length < 2) { sonucKap.innerHTML = ""; return; }
    const bulunan = girisTum.filter((g) =>
      [g.baslik, g.aciklama, g.yer, g.alan].join(" ").toLocaleLowerCase("tr").includes(s)
    ).slice(0, 12);
    sonucKap.innerHTML = bulunan.length
      ? bulunan.map((g) => `
        <a class="kart" style="--k-renk:#999" href="eser.html?e=${e(g.eserSlug)}">
          <h3 style="font-size:1rem">${e(g.baslik)}</h3>
          <span class="yazar">${e(g.eserAd)} · ${TIP_AD[g.tip] || ""}</span>
        </a>`).join("")
      : `<div class="bos">"${e(arama.value)}" için sonuç yok — farklı bir sözcük dene.</div>`;
  });
}

/* ---------- ESER SAYFASI ---------- */
async function eserSayfa() {
  const slug = new URLSearchParams(location.search).get("e");
  const { eserler } = await jsonGetir("eserler.json");
  const es = eserler.find((x) => x.slug === slug) || eserler[0];
  document.documentElement.style.setProperty("--eser-renk", es.renk);
  document.title = `${es.ad} — 10 IB Türkçe`;

  document.getElementById("eser-baslik").innerHTML = `
    <span class="tur">${e(es.tur)} · ${e(es.dil)} · ${e(es.yil)}</span>
    <h1><span class="fosfor fosfor--eser">${e(es.ad)}</span></h1>
    <div class="yazar">${e(es.yazar)}</div>
    <p class="ozet">${e(es.ozet)}</p>
    <div class="eser-arac">
      ${es.notebooklm && !es.notebooklm.includes("DEGISTIR")
        ? `<a class="dugme" href="${e(es.notebooklm)}" target="_blank" rel="noopener">🔎 NotebookLM'de derinleş</a>`
        : `<span class="dugme dugme--sade" title="config: data/eserler.json → notebooklm">NotebookLM linki eklenecek</span>`}
      <a class="dugme dugme--sade" href="index.html">← Tüm eserler</a>
    </div>`;

  let veri;
  try { veri = await analizGetir(es.slug); }
  catch { veri = { bolumler: [], girisler: [] }; }

  const bolKap = document.getElementById("bolumler");
  if (veri.bolumler?.length) {
    bolKap.innerHTML = `
      <details class="bolumler">
        <summary>Bölüm / yapı özeti</summary>
        <div>${veri.bolumler.map((b) => `<p><b>${e(b.ad)}</b> — ${e(b.not)}</p>`).join("")}</div>
      </details>`;
  }

  const girisler = veri.girisler || [];
  const listeKap = document.getElementById("girisler");
  const filtreKap = document.getElementById("filtreler");
  const aramaKutu = document.getElementById("eser-arama");

  let aktifTip = "hepsi";
  const ciz = () => {
    const s = (aramaKutu.value || "").trim().toLocaleLowerCase("tr");
    const secili = girisler.filter((g) => {
      const tipUyar = aktifTip === "hepsi" || g.tip === aktifTip;
      const aramaUyar = !s || [g.baslik, g.aciklama, g.yer, g.alan].join(" ").toLocaleLowerCase("tr").includes(s);
      return tipUyar && aramaUyar;
    });
    listeKap.innerHTML = secili.length
      ? secili.map(girisHTML).join("")
      : `<div class="bos">Bu filtreyle eşleşen giriş yok. Yeni girişler <b>data/analiz/${e(es.slug)}.json</b> dosyasına eklenir.</div>`;
  };

  const tipler = [["hepsi", "Hepsi"], ["tema", "Temalar"], ["teknik", "Teknikler"], ["kuresel", "Küresel Sorunlar"]];
  filtreKap.innerHTML = tipler
    .map(([v, ad]) => `<button class="cip ${v === "hepsi" ? "aktif" : ""}" data-v="${v}">${ad}</button>`)
    .join("");
  filtreKap.addEventListener("click", (ev) => {
    const b = ev.target.closest(".cip");
    if (!b) return;
    aktifTip = b.dataset.v;
    filtreKap.querySelectorAll(".cip").forEach((c) => c.classList.toggle("aktif", c === b));
    ciz();
  });
  aramaKutu.addEventListener("input", ciz);
  ciz();
}

/* ---------- TEKNİKLER ---------- */
async function teknikSayfa() {
  const veri = await jsonGetir("teknikler.json");
  document.getElementById("bicimler").innerHTML = veri.bicimler
    .map((t) => `<tr><td><b>${e(t.ad)}</b></td><td>${e(t.aciklama)}</td></tr>`).join("");
  const kap = document.getElementById("teknik-liste");
  const kutu = document.getElementById("teknik-arama");
  const ciz = () => {
    const s = (kutu.value || "").trim().toLocaleLowerCase("tr");
    const secili = veri.teknikler.filter((t) => !s || (t.ad + " " + t.aciklama).toLocaleLowerCase("tr").includes(s));
    kap.innerHTML = secili.map((t) => `<tr><td><b>${e(t.ad)}</b></td><td>${e(t.aciklama)}</td></tr>`).join("");
  };
  kutu.addEventListener("input", ciz);
  ciz();
}

/* ---------- DÜZELTMELER ---------- */
async function duzeltmeSayfa() {
  const veri = await jsonGetir("duzeltmeler.json");
  document.getElementById("duzeltme-liste").innerHTML = veri.duzeltmeler
    .map((d) => `<tr><td>${e(d.hata)}</td><td>${e(d.dogru)}</td><td>${e(d.kaynak || "")}</td></tr>`).join("");
}

/* sayfa yönlendirici */
document.addEventListener("DOMContentLoaded", () => {
  const sayfa = document.body.dataset.sayfa;
  ({ ana: anaSayfa, eser: eserSayfa, teknik: teknikSayfa, duzeltme: duzeltmeSayfa }[sayfa] || (() => {}))()
    .catch?.((h) => console.error(h));
});
