const map = L.map("map").setView([-7.8014, 110.3647], 13);

const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// Definisikan LayerGroups untuk semua data
const batasSlemanLayer = L.layerGroup();
const batasKecamatanLayer = L.layerGroup();
const batasDesaLayer = L.layerGroup();
const kesesuaianLahanDesaLayer = L.layerGroup();
const lahanBelumTerjangkauLayer = L.layerGroup();
const kesesuaianLahanRSLayer = L.layerGroup();
const rumahSakitLayer = L.layerGroup();

// ----- DEFINISI SEMUA LAYER & LEGENDANYA -----
const layerDefinitions = [
    {
        name: "Rumah Sakit",
        layerGroup: rumahSakitLayer,
        legend: { type: "point", imageUrl: "https://png.pngtree.com/png-clipart/20200701/original/pngtree-hospital-icon-design-illustration-png-image_5345011.jpg" }
    },
    {
        name: "Kesesuaian Lahan Rumah Sakit",
        layerGroup: kesesuaianLahanRSLayer,
        legend: {
            type: "polygon",
            grades: ['Sesuai', 'Tidak Sesuai'],
            colors: ['#31a354', '#de2d26']
        }
    },
    { name: "Batas Kabupaten Sleman", layerGroup: batasSlemanLayer, legend: { type: "line", color: "#000000" } },
    { name: "Batas Kecamatan", layerGroup: batasKecamatanLayer, legend: { type: "line", color: "#FF0000" } },
    { name: "Batas Desa", layerGroup: batasDesaLayer, legend: { type: "line", color: "#FF6600" } },
    { name: "Kesesuaian Lahan per Desa", layerGroup: kesesuaianLahanDesaLayer, legend: { type: "line", color: "#008000" } },
    { name: "Lahan Desa Belum Terjangkau RS", layerGroup: lahanBelumTerjangkauLayer, legend: { type: "line", color: "#00CC66" } }
];

// ----- FUNGSI PEWARNAAN -----
function getColor(kelas) {
  return kelas === 'Sesuai' ? '#31a354' :
         kelas === 'Tidak Sesuai' ? '#de2d26' :
         '#cccccc';
}

// ----- KONTROL LAYER & LEGENDA DINAMIS -----
const baseMaps = { "OpenStreetMap": tileLayer };
const overlayMaps = {};
layerDefinitions.forEach(def => {
    overlayMaps[def.name] = def.layerGroup;
});

L.control.layers(baseMaps, overlayMaps).addTo(map);

const legend = L.control({ position: 'bottomright' });
const legendContainer = L.DomUtil.create('div', 'info legend');

function updateLegend() {
    legendContainer.innerHTML = '<h4>Legenda</h4>';
    let legendHasContent = false;

    layerDefinitions.forEach(def => {
        if (map.hasLayer(def.layerGroup)) {
            legendHasContent = true;
            let itemHtml = '';
            if (def.legend.type === 'polygon') {
                itemHtml += `<div><span class="legend-label"><strong>${def.name}</strong></span>`;
                itemHtml += `<div class="legend-sub-item">`;
                def.legend.grades.forEach((grade, index) => {
                    itemHtml += `<div class="legend-item"><i style="background:${def.legend.colors[index]}"></i><span class="legend-label">${grade}</span></div>`;
                });
                itemHtml += `</div></div>`;
            } else if (def.legend.type === 'point') {
                itemHtml = `<div class="legend-item"><img src="${def.legend.imageUrl}"><span class="legend-label">${def.name}</span></div>`;
            } else { // line
                itemHtml = `<div class="legend-item"><i style="background:${def.legend.color}"></i><span class="legend-label">${def.name}</span></div>`;
            }
            legendContainer.innerHTML += itemHtml;
        }
    });

    if (legendHasContent) {
        legend.addTo(map);
    } else {
        legend.remove();
    }
}

legend.onAdd = function (map) {
    return legendContainer;
};

map.on('overlayadd overlayremove', updateLegend);

// ----- MEMUAT DATA GEOJSON -----
function fetchData() {
    fetch("GeoJSON Pakai/Bata Kabupaten Sleman.geojson").then(res => res.json()).then(data => L.geoJSON(data, { style: { color: "#000000", weight: 2 }}).bindPopup("Batas Kabupaten Sleman").addTo(batasSlemanLayer));
    fetch("GeoJSON Pakai/Batas Kecamatan Kabupaten Sleman.geojson").then(res => res.json()).then(data => L.geoJSON(data, { style: { color: "#FF0000", weight: 2 }}).bindPopup("Batas Kecamatan").addTo(batasKecamatanLayer));
    fetch("GeoJSON Pakai/Batas_Desa_Kabupaten_Sleman.geojson").then(res => res.json()).then(data => L.geoJSON(data, { style: { color: "#FF6600", weight: 2 }}).bindPopup("Batas Desa").addTo(batasDesaLayer));
    fetch("GeoJSON Pakai/Kesesuaian Lahan Per Desa Di Sleman.geojson").then(res => res.json()).then(data => L.geoJSON(data, { style: { color: "#008000", weight: 2 }}).bindPopup("Kesesuaian Lahan per Desa").addTo(kesesuaianLahanDesaLayer));
    
    // PERBAIKAN FINAL: Menggunakan nama kolom "Luas" dan menampilkannya sebagai teks
    fetch("GeoJSON Pakai/Kesesuaian Lahan Per Desa Yang Belum Terjangkau Rumah Sakit.geojson").then(res => res.json()).then(data => {
        L.geoJSON(data, {
            style: { color: "#00CC66", weight: 2 },
            onEachFeature: (feature, layer) => {
                const { DESA, KECAMATAN, KAB_KOTA, Luas } = feature.properties;
                const popupContent = `
                    <b>Desa:</b> ${DESA || 'N/A'}<br>
                    <b>Kecamatan:</b> ${KECAMATAN || 'N/A'}<br>
                    <b>Kabupaten/Kota:</b> ${KAB_KOTA || 'N/A'}<br>
                    <b>Luas:</b> ${Luas || 'N/A'}
                `;
                layer.bindPopup(popupContent);
            }
        }).addTo(lahanBelumTerjangkauLayer);
    });
    
    fetch("rumahsakit.geojson").then(res => res.json()).then(data => {
        L.geoJSON(data, {
            onEachFeature: (feature, layer) => {
                const { Nama, Kategori, Kelas, Alamat } = feature.properties;
                const popupContent = `
                  <b>${Nama}</b><br>
                  <b>Kategori:</b> ${Kategori}<br>
                  <b>Kelas:</b> ${Kelas}<br>
                  <b>Alamat:</b> ${Alamat}
                `;
                layer.bindPopup(popupContent);
            },
            pointToLayer: (feature, latlng) => {
                return L.marker(latlng, {
                    icon: L.icon({
                        iconUrl: 'https://png.pngtree.com/png-clipart/20200701/original/pngtree-hospital-icon-design-illustration-png-image_5345011.jpg',
                        iconSize: [25, 25]
                    })
                });
            }
        }).addTo(rumahSakitLayer);
    });

    fetch("GeoJSON Pakai/Kesesuaian Lahan Rumah Sakit.geojson").then(res => res.json()).then(data => L.geoJSON(data, { style: f => ({ fillColor: getColor(f.properties.Kelas2), weight: 1, opacity: 1, color: 'white', fillOpacity: 0.7 }), onEachFeature: (f, l) => l.bindPopup(`<strong>Kelas: ${f.properties.Kelas2}</strong>`) }).addTo(kesesuaianLahanRSLayer));
}

// ----- FUNGSI-FUNGSI LAINNYA (TIDAK BERUBAH) -----
let bufferActive = false, measureActive = false, markerActive = false;
let bufferLayer = L.layerGroup().addTo(map);
let markerLayer = L.layerGroup().addTo(map);
let tempLine; // dideklarasikan di sini agar bisa diakses oleh toggleMeasure dan map.on('click')

function toggleEditMenu() {
  const menu = document.getElementById("editMenu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}

function toggleBuffer() {
  bufferActive = !bufferActive;
  measureActive = markerActive = false;
  updateStatus();
}

function toggleMeasure() {
  measureActive = !measureActive;
  bufferActive = markerActive = false;
  if (tempLine) { 
      measureLayer.removeLayer(tempLine); 
      tempLine = null; 
  }
  updateStatus();
}

function toggleMarker() {
  markerActive = !markerActive;
  bufferActive = measureActive = false;
  updateStatus();
}

function updateStatus() {
  document.getElementById("bStatus").innerText = bufferActive ? "ON" : "OFF";
  document.getElementById("mStatus").innerText = measureActive ? "ON" : "OFF";
  document.getElementById("tStatus").innerText = markerActive ? "ON" : "OFF";
}

function locateUser() {
  if (!navigator.geolocation) return alert("Browser tidak mendukung geolokasi.");
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    L.marker([latitude, longitude]).addTo(map)
      .bindPopup("📍 Lokasi Anda").openPopup();
    map.setView([latitude, longitude], 16);
  });
}
// Panggil semua fungsi inisialisasi
fetchData();

// Atur layer awal yang aktif dan perbarui legenda
rumahSakitLayer.addTo(map);
kesesuaianLahanRSLayer.addTo(map);
updateLegend();
