import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { enlacesParaRol } from "../../modules/auth/roles";
import { useOrganizacion } from "../../modules/organizacion/OrganizacionContext";
import "./Layout.css";

function BottomNav() {
  const { perfil, rol } = useAuth();
  const { moduloEncendido } = useOrganizacion();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const [masAbierto, setMasAbierto] = useState(false);
  const enlaces = enlacesParaRol(rol, moduloEncendido);
  const tabs = useMemo(() => enlaces.slice(0, 3), [enlaces]);
  const mas = useMemo(() => enlaces.slice(3), [enlaces]);

  useEffect(() => {
    setMasAbierto(false);
  }, [ubicacion.pathname]);

  if (!perfil) return null;

  return (
    <>
      <nav className="bottom-nav" aria-label="Navegación principal">
        {tabs.map((item) => (
          <NavLink
            key={item.ruta}
            to={item.ruta}
            end={item.ruta === "/app"}
            className={({ isActive }) => "bottom-nav__item" + (isActive ? " bottom-nav__item--activo" : "")}
          >
            {item.texto}
          </NavLink>
        ))}
        {mas.length > 0 && (
          <button type="button" className="bottom-nav__item" onClick={() => setMasAbierto(true)}>
            Más
          </button>
        )}
      </nav>
      {masAbierto && (
        <div className="mas-sheet">
          <button type="button" className="mas-sheet__fondo" aria-label="Cerrar" onClick={() => setMasAbierto(false)} />
          <div className="mas-sheet__panel">
            <h2>Más módulos</h2>
            <div className="mas-sheet__grid">
              {mas.map((item) => (
                <button
                  key={item.ruta}
                  type="button"
                  className="mas-sheet__tile"
                  onClick={() => {
                    setMasAbierto(false);
                    navegar(item.ruta);
                  }}
                >
                  {item.texto}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BottomNav;
