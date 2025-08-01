// src/pages/Dashboard.tsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  listarCasos,
  crearCaso,
  agregarInforme,
  listarFiscales,
  reasignarCaso,
} from "../services/casoService";
import type { Fiscal } from "../models/Fiscal";
import type { Caso } from "../models/Caso";
import type { Informe } from "../models/Informe";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { fiscal: Fiscal } | undefined;
  const user = state?.fiscal;

  const [showForm, setShowForm] = React.useState(false);
  const [descripcion, setDescripcion] = React.useState("");
  const [casos, setCasos] = React.useState<Caso[]>([]);
  const [loadingCasos, setLoadingCasos] = React.useState<boolean>(true);
  const [errorCasos, setErrorCasos] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const [errorCreate, setErrorCreate] = React.useState<string | null>(null);

  const [showModal, setShowModal] = React.useState<boolean>(false);
  const [selectedCasoID, setSelectedCasoID] = React.useState<number | null>(null);
  const [informeData, setInformeData] = React.useState<Omit<Informe, 'correoElectronico' | 'casoID'>>({
    TipoInforme: "",
    DescripcionBreve: "",
    Estado: "",
    Progreso: "",
  });
  const [errorInforme, setErrorInforme] = React.useState<string | null>(null);
  const [isSubmittingInforme, setIsSubmittingInforme] = React.useState<boolean>(false);

  const [showAssignModal, setShowAssignModal] = React.useState<boolean>(false);
  const [fiscales, setFiscales] = React.useState<Fiscal[]>([]);
  const [loadingFiscales, setLoadingFiscales] = React.useState<boolean>(false);
  const [errorFiscales, setErrorFiscales] = React.useState<string | null>(null);
  const [selectedFiscalID, setSelectedFiscalID] = React.useState<number | null>(null);
  const [isSubmittingAssign, setIsSubmittingAssign] = React.useState<boolean>(false);
  const [errorAssign, setErrorAssign] = React.useState<string | null>(null);

  const handleOpenModal = (casoID: number) => {
    setSelectedCasoID(casoID);
    setInformeData({
      TipoInforme: "",
      DescripcionBreve: "",
      Estado: "",
      Progreso: "",
    });
    setErrorInforme(null);
    setShowModal(true);
  };

  const handleOpenAssignModal = (casoID: number) => {
    setSelectedCasoID(casoID);
    setShowAssignModal(true);
    setLoadingFiscales(true);
    setErrorFiscales(null);
    listarFiscales()
      .then((data) => {
        setFiscales(data);
      })
      .catch((err) => setErrorFiscales(err.message || "Error al cargar fiscales"))
      .finally(() => setLoadingFiscales(false));
  };

  // Cargar casos al montar
  React.useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    setLoadingCasos(true);
    setErrorCasos(null);
    listarCasos(user.CorreoElectronico)
      .then((data) => setCasos(data))
      .catch((err) => setErrorCasos(err.message ?? "Error al cargar casos"))
      .finally(() => setLoadingCasos(false));
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const filteredCasos = casos.filter((caso) =>
    caso.Descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Bienvenido {user.Usuario}</h1>
          <button
            className="logout-button"
            onClick={() => navigate("/")}
          >
            Logout
          </button>
        </div>
        <div className="dashboard-card">
          <p>
            <strong>{user.Rol}:</strong> {user.Nombre}
          </p>
          {typeof user.Permisos === "string" && user.Permisos.includes("CREAR_CASO") && !showForm && (
            <button className="dashboard-button" onClick={() => setShowForm(true)} disabled={isCreating}>
              Crear Caso
            </button>
          )}
        </div>
        {showForm && (
          <form
            className="dashboard-form"
            onSubmit={(e) => {
              e.preventDefault();
              setErrorCreate(null);
              setIsCreating(true);
              const nuevoCasoPayload = {
                correoElectronico: user.CorreoElectronico,
                descripcion: descripcion,
              };
              crearCaso(nuevoCasoPayload)
                .then(() => {
                  setShowForm(false);
                  setDescripcion("");
                  setLoadingCasos(true);
                  return listarCasos(user.CorreoElectronico);
                })
                .then((data) => {
                  setCasos(data);
                })
                .catch((err) => {
                  setErrorCreate(err.message ?? "Error al crear caso");
                })
                .finally(() => {
                  setIsCreating(false);
                  setLoadingCasos(false);
                });
            }}
          >
            <div className="dashboard-form-field">
              <label>
                Descripción:
                <br />
                <textarea
                  className="dashboard-textarea"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  required
                  disabled={isCreating}
                />
              </label>
              {errorCreate && <p style={{ color: "#dc2626", marginTop: "0.5rem" }}>{errorCreate}</p>}
            </div>
            <button type="submit" className="dashboard-form-button" disabled={isCreating}>
              {isCreating ? "Creando..." : "Enviar Caso"}
            </button>
          </form>
        )}
        <div className="dashboard-casos">
          {loadingCasos && <p>Cargando casos...</p>}
          {errorCasos && <p style={{ color: "#dc2626" }}>{errorCasos}</p>}
          {!loadingCasos && !errorCasos && (
            <>
              <div className="dashboard-search">
                <input
                  type="text"
                  placeholder="Buscar caso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="dashboard-search-input"
                />
              </div>
              <div className="dashboard-table-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th>Progreso</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCasos.map((caso) => (
                      <tr key={caso.CasoID}>
                        <td>{caso.Descripcion}</td>
                        <td className={`case-status status-${caso.Estado.toLowerCase()}`}>
                          {caso.Estado}
                        </td>
                        <td>{caso.Progreso}</td>
                        <td>
                          <button
                            onClick={() => handleOpenModal(caso.CasoID)}
                            className="case-button modify-button"
                            disabled={caso.Estado === "CERRADO"}
                          >
                            Modificar
                          </button>
                          {user.Rol === "SUPERVISOR" && (
                            <button
                              className="case-button assign-button"
                              onClick={() => handleOpenAssignModal(caso.CasoID)}
                            >
                              Asignar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal para agregar informe */}
      {showModal && selectedCasoID !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Agregar Informe para Caso {selectedCasoID}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedCasoID) return;
                setErrorInforme(null);
                setIsSubmittingInforme(true);
                agregarInforme(informeData, user.CorreoElectronico, selectedCasoID)
                  .then(() => {
                    setShowModal(false);
                  })
                  .catch((err) => {
                    setErrorInforme(err.message || "Error al agregar informe");
                  })
                  .finally(() => {
                    setIsSubmittingInforme(false);
                  });
              }}
            >
              <label>
                Tipo Informe:
                <input
                  type="text"
                  value={informeData.TipoInforme}
                  onChange={(e) =>
                    setInformeData({ ...informeData, TipoInforme: e.target.value })
                  }
                  required
                  disabled={isSubmittingInforme}
                />
              </label>
              <label>
                Descripción Breve:
                <textarea
                  value={informeData.DescripcionBreve}
                  onChange={(e) =>
                    setInformeData({ ...informeData, DescripcionBreve: e.target.value })
                  }
                  rows={3}
                  required
                  disabled={isSubmittingInforme}
                />
              </label>
              <label>
                Estado:
                <select
                  value={informeData.Estado}
                  onChange={(e) =>
                    setInformeData({ ...informeData, Estado: e.target.value })
                  }
                  required
                  disabled={isSubmittingInforme}
                >
                  <option value="">Seleccione</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN_PROGRESO">EN_PROGRESO</option>
                  <option value="CERRADO">CERRADO</option>
                </select>
              </label>
              <label>
                Progreso:
                <input
                  type="text"
                  value={informeData.Progreso}
                  onChange={(e) =>
                    setInformeData({ ...informeData, Progreso: e.target.value })
                  }
                  required
                  disabled={isSubmittingInforme}
                />
              </label>
              {errorInforme && <p className="modal-error">{errorInforme}</p>}
              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmittingInforme}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmittingInforme}>
                  {isSubmittingInforme ? "Guardando..." : "Guardar Informe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para reasignar caso */}
      {showAssignModal && selectedCasoID !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Reasignar Caso {selectedCasoID}</h2>
            {loadingFiscales ? (
              <p>Cargando fiscales...</p>
            ) : errorFiscales ? (
              <p style={{ color: "#dc2626" }}>{errorFiscales}</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedCasoID || !selectedFiscalID) return;
                  setErrorAssign(null);
                  setIsSubmittingAssign(true);
                  reasignarCaso(selectedCasoID, selectedFiscalID)
                    .then((res) => {
                      alert(res.mensaje);
                      setShowAssignModal(false);
                    })
                    .catch((err) => {
                      setErrorAssign(err.message || "Error al reasignar caso");
                    })
                    .finally(() => {
                      setIsSubmittingAssign(false);
                    });
                }}
              >
                <label>
                  Selecciona Fiscal:
                  <select
                    value={selectedFiscalID ?? ""}
                    onChange={(e) => setSelectedFiscalID(Number(e.target.value))}
                    required
                    disabled={isSubmittingAssign}
                  >
                    <option value="">--Seleccione--</option>
                    {fiscales.map((fiscal) => (
                      <option key={fiscal.FiscalID} value={fiscal.FiscalID}>
                        {fiscal.Nombre} ({fiscal.Usuario})
                      </option>
                    ))}
                  </select>
                </label>
                {errorAssign && <p className="modal-error">{errorAssign}</p>}
                <div className="modal-buttons">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    disabled={isSubmittingAssign}
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmittingAssign}>
                    {isSubmittingAssign ? "Asignando..." : "Asignar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}