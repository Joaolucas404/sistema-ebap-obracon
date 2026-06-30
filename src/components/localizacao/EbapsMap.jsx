import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Crosshair, Layers } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import EbapStatusBadge from './EbapStatusBadge.jsx';

const VILA_VELHA_CENTER = [-20.3417, -40.2875];

const markerColors = {
  OPERANDO: '#3B82F6',
  ATENCAO: '#FACC15',
  CRITICA: '#EF4444'
};

function makeIcon(status) {
  const color = markerColors[status] || markerColors.OPERANDO;
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:22px;height:22px;border-radius:999px;background:${color};border:3px solid #fff;box-shadow:0 10px 24px rgba(0,0,0,.45)"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12]
  });
}

function FitBounds({ ebaps }) {
  const map = useMap();

  useEffect(() => {
    const coords = ebaps
      .filter((ebap) => ebap.latitude && ebap.longitude)
      .map((ebap) => [Number(ebap.latitude), Number(ebap.longitude)]);

    if (coords.length > 1) {
      map.fitBounds(coords, { padding: [36, 36], maxZoom: 15 });
    } else if (coords.length === 1) {
      map.setView(coords[0], 14);
    }
  }, [ebaps, map]);

  return null;
}

function LocateButton({ onLocation }) {
  const map = useMap();

  function locate() {
    map.locate({ setView: true, maxZoom: 15 });
  }

  useEffect(() => {
    function found(event) {
      onLocation(event.latlng);
    }
    map.on('locationfound', found);
    return () => map.off('locationfound', found);
  }, [map, onLocation]);

  return (
    <button className="secondary-button absolute bottom-4 left-4 z-[1000] bg-[#0B2D6B]/90" type="button" onClick={locate}>
      <Crosshair size={17} />
      Minha localizacao
    </button>
  );
}

export default function EbapsMap({ ebaps, onSelect, compact = false, surface = true }) {
  const [layer, setLayer] = useState('mapa');
  const [myLocation, setMyLocation] = useState(null);
  const mapRef = useRef(null);

  const validEbaps = useMemo(() => ebaps.filter((ebap) => ebap.latitude && ebap.longitude), [ebaps]);
  const shellClass = surface
    ? `glass-card relative overflow-hidden rounded-3xl p-2 ${compact ? 'min-h-[260px]' : 'min-h-[520px]'}`
    : `relative overflow-hidden rounded-2xl bg-[#0A1633]/70 ${compact ? 'min-h-[260px]' : 'min-h-[620px]'}`;

  return (
    <section className={shellClass}>
      <div className="absolute right-4 top-4 z-[1000] flex gap-2">
        <button className={layer === 'mapa' ? 'primary-button min-h-10' : 'secondary-button min-h-10 bg-[#0B2D6B]/90'} type="button" onClick={() => setLayer('mapa')}>
          <Layers size={16} />
          Mapa
        </button>
        <button className={layer === 'satelite' ? 'primary-button min-h-10' : 'secondary-button min-h-10 bg-[#0B2D6B]/90'} type="button" onClick={() => setLayer('satelite')}>
          <Circle size={16} />
          Satelite
        </button>
      </div>

      <MapContainer
        center={VILA_VELHA_CENTER}
        zoom={12}
        className={`${compact ? 'h-[260px] min-h-[260px]' : 'h-[68vh] min-h-[620px]'} w-full ${surface ? 'rounded-2xl' : 'rounded-2xl'}`}
        ref={mapRef}
        scrollWheelZoom
      >
        {layer === 'mapa' ? (
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        ) : (
          <TileLayer attribution="Tiles &copy; Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        )}
        <FitBounds ebaps={validEbaps} />
        <LocateButton onLocation={setMyLocation} />
        {myLocation && <Marker position={[myLocation.lat, myLocation.lng]} icon={makeIcon('ATENCAO')} />}
        {validEbaps.map((ebap) => (
          <Marker
            key={ebap.id}
            position={[Number(ebap.latitude), Number(ebap.longitude)]}
            icon={makeIcon(ebap.status_operacional)}
            eventHandlers={{ click: () => onSelect(ebap) }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>{ebap.nome}</strong>
                <div style={{ marginTop: 6 }}>{ebap.status_operacional}</div>
                <div>OS abertas: {ebap.os_abertas || 0}</div>
                <div>RDO pendentes: {ebap.ro_pendentes || 0}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute bottom-4 right-4 z-[1000] hidden rounded-2xl border border-cyan-300/20 bg-[#0B2D6B]/90 p-3 text-xs font-bold text-white shadow-xl md:block">
        <div className="mb-2 font-black uppercase text-slate-300">Legenda</div>
        <div className="grid gap-2">
          <Legend color="#3B82F6" label="Operando" />
          <Legend color="#FACC15" label="Atencao" />
          <Legend color="#EF4444" label="Critica" />
        </div>
      </div>
    </section>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-2">
      <span className="size-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
