import type { Equipo, Vehiculo } from "./types";
import type { Contrato } from "./contratos";
import { optimizarTransporte, generarFactura } from "./optimizacion";
import { agregarEquipoAContrato } from "./contratos";

// 1. BASES DE DATOS EN MEMORIA
let equiposDisponibles: Equipo[] = [
  {
    IdEquipo: "1",
    Nombre: "Generador A",
    Tipo: "Generador",
    PesoKg: 1200,
    VolumenM3: 3.5,
    PotenciaKW: 80,
    CostoAlquilerDiario: 100,
    Estado: "Disponible",
  },
  {
    IdEquipo: "2",
    Nombre: "UPS B",
    Tipo: "UPS",
    PesoKg: 500,
    VolumenM3: 1.2,
    PotenciaKW: 40,
    CostoAlquilerDiario: 50,
    Estado: "Disponible",
  },
  {
    IdEquipo: "3",
    Nombre: "Transformador C",
    Tipo: "Transformador",
    PesoKg: 900,
    VolumenM3: 2.8,
    PotenciaKW: 65,
    CostoAlquilerDiario: 80,
    Estado: "Disponible",
  },
  {
    IdEquipo: "4",
    Nombre: "Banco Baterías D",
    Tipo: "Banco de baterías",
    PesoKg: 400,
    VolumenM3: 1.0,
    PotenciaKW: 35,
    CostoAlquilerDiario: 40,
    Estado: "Disponible",
  },
  {
    IdEquipo: "5",
    Nombre: "Generador E",
    Tipo: "Generador",
    PesoKg: 700,
    VolumenM3: 2.0,
    PotenciaKW: 55,
    CostoAlquilerDiario: 70,
    Estado: "Disponible",
  },
];

let vehiculosFlota: Vehiculo[] = [
  {
    IdVehiculo: "V1",
    Placa: "CUA-1020",
    CapacidadMaximaKg: 2500,
    CapacidadVolumenM3: 6.0,
    TipoVehiculo: "Camión",
    Estado: "Disponible",
  },
  {
    IdVehiculo: "V2",
    Placa: "CUB-9080",
    CapacidadMaximaKg: 5000,
    CapacidadVolumenM3: 12.0,
    TipoVehiculo: "Plataforma",
    Estado: "Disponible",
  },
];

// Arreglo global para almacenar el historial de eventos
let historialLogs: { hora: string; evento: string; color: string }[] = [];

// 2. INYECCIÓN DE LA INTERFAZ (Tema Claro)
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div style="font-family: Arial, sans-serif; padding: 20px; display: flex; flex-direction: column; gap: 20px; background-color: #f8fafc; color: #334155; min-height: 100vh;">
    
    <div style="display: flex; gap: 20px;">
      
      <div style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
        
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h3 style="color: #059669; margin-top: 0;">Crear Contrato Manual (Req03)</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <input type="text" id="cliente" placeholder="Nombre Cliente" value="Empresa Industrial S.A." style="padding: 10px; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b;" />
            <select id="vehiculo-select" style="padding: 10px; border-radius: 4px; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b;">
              ${vehiculosFlota.map((v) => `<option value="${v.IdVehiculo}">${v.TipoVehiculo} - ${v.CapacidadMaximaKg}KG / ${v.CapacidadVolumenM3}m³</option>`).join("")}
            </select>
            <button id="btn-crear-manual" style="padding: 12px; background: #10b981; color: white; border: none; font-weight: bold; cursor: pointer; border-radius: 4px; margin-top: 5px; transition: background 0.2s;">
              Crear Contrato con Selección
            </button>
          </div>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h3 style="color: #d97706; margin-top: 0;">Optimización Automática (Req04)</h3>
          <button id="btn-optimizar" style="width: 100%; padding: 12px; background: #f59e0b; color: #fff; border: none; font-weight: bold; cursor: pointer; border-radius: 4px; transition: background 0.2s;">
            Ejecutar Algoritmo (Knapsack)
          </button>
        </div>

      </div>

      <div style="flex: 2; display: flex; flex-direction: column; gap: 20px;">
        
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h3 style="color: #0284c7; margin-top: 0;">Catálogo de Equipos</h3>
          <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #cbd5e1; color: #64748b;">
                <th style="padding-bottom: 10px;">✔</th>
                <th style="padding-bottom: 10px;">Nombre</th>
                <th style="padding-bottom: 10px;">Tipo</th>
                <th style="padding-bottom: 10px;">Peso (kg)</th>
                <th style="padding-bottom: 10px;">Vol (m³)</th>
                <th style="padding-bottom: 10px;">Potencia (KW)</th>
                <th style="padding-bottom: 10px;">Estado</th>
              </tr>
            </thead>
            <tbody id="tabla-cuerpo"></tbody>
          </table>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 8px; flex-grow: 1; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h3 style="color: #1e293b; margin-top: 0;">Resultados y Facturación</h3>
          <div id="panel-resultados" style="background: #f1f5f9; padding: 15px; border-radius: 5px; min-height: 150px; font-family: monospace; border: 1px solid #cbd5e1; color: #475569;">
            Esperando la creación de un contrato...
          </div>
        </div>

      </div>
    </div>

    <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h3 style="color: #7e22ce; margin-top: 0;">Historial de Operaciones del Sistema</h3>
      <div id="panel-historial" style="background: #f1f5f9; padding: 12px; border-radius: 5px; height: 180px; overflow-y: auto; font-family: monospace; font-size: 0.9em; display: flex; flex-direction: column; gap: 6px; border: 1px solid #cbd5e1;">
        <div style="color: #64748b;">[Sistema Iniciado] Esperando eventos...</div>
      </div>
    </div>

  </div>
`;

// Función para agregar logs al historial
const registrarLog = (
  evento: string,
  tipo: "info" | "success" | "warning" | "error",
) => {
  const colores = {
    info: "#0284c7",
    success: "#059669",
    warning: "#d97706",
    error: "#dc2626",
  };
  const hora = new Date().toLocaleTimeString();
  historialLogs.unshift({ hora, evento, color: colores[tipo] });

  const panel = document.getElementById("panel-historial")!;
  panel.innerHTML = historialLogs
    .map(
      (log) =>
        `<div style="border-bottom: 1px solid #e2e8f0; padding: 4px 0;">
      <span style="color: #94a3b8;">[${log.hora}]</span> 
      <span style="color: ${log.color}; font-weight: 500;">${log.evento}</span>
    </div>`,
    )
    .join("");
};

// 3. LÓGICA DE LISTADO CON CHECKBOXES
const renderizarTabla = () => {
  const tbody = document.getElementById("tabla-cuerpo")!;
  tbody.innerHTML = "";
  equiposDisponibles.forEach((eq) => {
    const isDisponible = eq.Estado === "Disponible";
    const colorEstado = isDisponible ? "#059669" : "#d97706";

    tbody.innerHTML += `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${isDisponible ? "transparent" : "#f8fafc"};">
        <td style="padding: 12px 0;">
          <input type="checkbox" class="chk-equipo" value="${eq.IdEquipo}" ${!isDisponible ? "disabled" : ""} style="cursor: pointer; width: 16px; height: 16px;" />
        </td>
        <td style="color: #1e293b; font-weight: 500;">${eq.Nombre}</td>
        <td style="color: #475569;">${eq.Tipo}</td>
        <td style="color: #475569;">${eq.PesoKg}</td>
        <td style="color: #475569;">${eq.VolumenM3}</td>
        <td style="font-weight: bold; color: #0284c7;">${eq.PotenciaKW}</td>
        <td style="color: ${colorEstado}; font-weight: 500;">${eq.Estado}</td>
      </tr>
    `;
  });
};

// 4. LÓGICA: CREACIÓN MANUAL DE CONTRATO (REQ03)
document.getElementById("btn-crear-manual")!.addEventListener("click", () => {
  const checkboxes = document.querySelectorAll(".chk-equipo:checked");
  if (checkboxes.length === 0) {
    registrarLog(
      "Intento fallido de creación manual: Ningún equipo seleccionado.",
      "warning",
    );
    alert(
      "⚠️ Por favor, selecciona al menos un equipo disponible de la tabla.",
    );
    return;
  }

  const idsSeleccionados = Array.from(checkboxes).map(
    (chk) => (chk as HTMLInputElement).value,
  );
  const equiposSeleccionados = equiposDisponibles.filter((eq) =>
    idsSeleccionados.includes(eq.IdEquipo),
  );
  const vehiculoSeleccionado = vehiculosFlota.find(
    (v) =>
      v.IdVehiculo ===
      (document.getElementById("vehiculo-select") as HTMLSelectElement).value,
  )!;
  const cliente = (document.getElementById("cliente") as HTMLInputElement)
    .value;

  const pesoTotal = equiposSeleccionados.reduce(
    (sum, eq) => sum + eq.PesoKg,
    0,
  );
  const volTotal = equiposSeleccionados.reduce(
    (sum, eq) => sum + eq.VolumenM3,
    0,
  );

  if (
    pesoTotal > vehiculoSeleccionado.CapacidadMaximaKg ||
    volTotal > vehiculoSeleccionado.CapacidadVolumenM3
  ) {
    registrarLog(
      `Error de capacidad: Selección manual excede límites del vehículo ${vehiculoSeleccionado.Placa}.`,
      "error",
    );
    alert(
      `❌ Los equipos exceden la capacidad del vehículo.\nPeso: ${pesoTotal} / ${vehiculoSeleccionado.CapacidadMaximaKg}kg\nVolumen: ${volTotal} / ${vehiculoSeleccionado.CapacidadVolumenM3}m³`,
    );
    return;
  }

  const nuevoContrato: Contrato = {
    IdContrato: `CTR-${Math.floor(Math.random() * 1000)}`,
    Cliente: cliente,
    UbicacionProyecto: "Cuenca",
    FechaInicio: new Date(),
    FechaFin: new Date(new Date().setDate(new Date().getDate() + 3)),
    Equipos: [],
  };

  equiposSeleccionados.forEach((eq) =>
    agregarEquipoAContrato(nuevoContrato, eq),
  );
  renderizarTabla();

  registrarLog(
    `Contrato ${nuevoContrato.IdContrato} creado MANUALMENTE para ${cliente}. Equipos: ${equiposSeleccionados.length}`,
    "success",
  );

  const factura = generarFactura(nuevoContrato, equiposSeleccionados, 3);
  mostrarFacturaEnPanel(
    factura,
    cliente,
    vehiculoSeleccionado,
    "Manual",
    equiposSeleccionados,
  );
  registrarLog(
    `Factura ${factura.IdFactura} generada por un total de $${factura.TotalPagar}.`,
    "info",
  );
});

// 5. LÓGICA: OPTIMIZACIÓN AUTOMÁTICA Y FACTURACIÓN (REQ04)
document.getElementById("btn-optimizar")!.addEventListener("click", () => {
  const vehiculoSeleccionado = vehiculosFlota.find(
    (v) =>
      v.IdVehiculo ===
      (document.getElementById("vehiculo-select") as HTMLSelectElement).value,
  )!;
  const cliente = (document.getElementById("cliente") as HTMLInputElement)
    .value;

  const equiposValidos = equiposDisponibles.filter(
    (eq) => eq.Estado !== "Alquilado" && eq.Estado !== "Reservado",
  );

  if (equiposValidos.length === 0) {
    registrarLog(
      "Intento de optimización fallido: No hay equipos disponibles en el catálogo.",
      "warning",
    );
    alert("No hay equipos disponibles para optimizar.");
    return;
  }

  registrarLog(
    `Iniciando Algoritmo de Optimización (Mochila) para vehículo ${vehiculoSeleccionado.Placa}...`,
    "info",
  );
  const optimizados = optimizarTransporte(
    equiposValidos,
    vehiculoSeleccionado.CapacidadMaximaKg,
    vehiculoSeleccionado.CapacidadVolumenM3,
  );

  if (optimizados.length === 0) {
    registrarLog(
      "El algoritmo no encontró ninguna combinación que quepa en el vehículo.",
      "warning",
    );
    alert("Ningún equipo cabe en el vehículo seleccionado.");
    return;
  }

  const nuevoContrato: Contrato = {
    IdContrato: `CTR-${Math.floor(Math.random() * 1000)}`,
    Cliente: cliente,
    UbicacionProyecto: "Cuenca",
    FechaInicio: new Date(),
    FechaFin: new Date(new Date().setDate(new Date().getDate() + 3)),
    Equipos: [],
  };

  optimizados.forEach((eq) => agregarEquipoAContrato(nuevoContrato, eq));
  renderizarTabla();

  registrarLog(
    `Contrato ${nuevoContrato.IdContrato} creado vía ALGORITMO para ${cliente}. Potencia Maximizada: ${optimizados.reduce((a, b) => a + b.PotenciaKW, 0)}KW.`,
    "success",
  );

  const factura = generarFactura(nuevoContrato, optimizados, 3);
  mostrarFacturaEnPanel(
    factura,
    cliente,
    vehiculoSeleccionado,
    "Optimizada (Knapsack)",
    optimizados,
  );
  registrarLog(
    `Factura ${factura.IdFactura} generada por un total de $${factura.TotalPagar}.`,
    "info",
  );
});

// 6. FUNCIÓN MEJORADA: TARJETA DE CARGA + FACTURA (Tema Claro)
function mostrarFacturaEnPanel(
  factura: any,
  cliente: string,
  vehiculo: Vehiculo,
  tipo: string,
  equipos: Equipo[],
) {
  const pesoTotal = equipos.reduce((sum, eq) => sum + eq.PesoKg, 0);
  const volTotal = equipos.reduce((sum, eq) => sum + eq.VolumenM3, 0);

  const pctPeso = Math.min(
    (pesoTotal / vehiculo.CapacidadMaximaKg) * 100,
    100,
  ).toFixed(1);
  const pctVol = Math.min(
    (volTotal / vehiculo.CapacidadVolumenM3) * 100,
    100,
  ).toFixed(1);

  const detalleEquiposHTML = equipos
    .map(
      (eq) => `
    <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #cbd5e1; padding: 6px 0; font-size: 0.9em; color: #475569;">
      <span>- ${eq.Nombre} <span style="font-size: 0.8em; color: #94a3b8;">(${eq.Tipo})</span></span>
      <span style="font-weight: 500;">${eq.PotenciaKW} KW | $${eq.CostoAlquilerDiario}/día</span>
    </div>
  `,
    )
    .join("");

  const colorTipo = tipo === "Manual" ? "#059669" : "#0284c7";

  document.getElementById("panel-resultados")!.innerHTML = `
    <div style="background: #ffffff; border: 1px solid #93c5fd; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <h4 style="color: #2563eb; margin-top: 0; margin-bottom: 15px;">🚛 Características del Vehículo Cargado</h4>
      <div style="display: flex; gap: 15px; justify-content: space-between;">
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; flex: 1; text-align: center;">
          <div style="color: #64748b; font-size: 0.8em; text-transform: uppercase;">Peso Acumulado</div>
          <div style="font-size: 1.2em; font-weight: bold; color: #1e293b;">${pesoTotal} <span style="font-size: 0.7em; color: #94a3b8; font-weight: normal;">/ ${vehiculo.CapacidadMaximaKg} kg</span></div>
          <div style="width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px; margin-top: 8px;">
            <div style="width: ${pctPeso}%; background: #3b82f6; height: 100%; border-radius: 3px;"></div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; flex: 1; text-align: center;">
          <div style="color: #64748b; font-size: 0.8em; text-transform: uppercase;">Volumen Ocupado</div>
          <div style="font-size: 1.2em; font-weight: bold; color: #1e293b;">${volTotal.toFixed(1)} <span style="font-size: 0.7em; color: #94a3b8; font-weight: normal;">/ ${vehiculo.CapacidadVolumenM3} m³</span></div>
          <div style="width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px; margin-top: 8px;">
            <div style="width: ${pctVol}%; background: #3b82f6; height: 100%; border-radius: 3px;"></div>
          </div>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #34d399; padding: 12px; border-radius: 6px; flex: 1; text-align: center;">
          <div style="color: #059669; font-size: 0.8em; text-transform: uppercase;">Potencia Suministrada</div>
          <div style="font-size: 1.3em; font-weight: bold; color: #059669;">${factura.TotalPotencia} <span style="font-size: 0.7em;">KW</span></div>
          <div style="margin-top: 5px; font-size: 0.75em; color: #10b981;">Máxima capacidad</div>
        </div>

      </div>
    </div>

    <div style="border: 1px dashed ${colorTipo}; padding: 20px; background: #ffffff; border-radius: 6px;">
      <h3 style="color: ${colorTipo}; margin: 0 0 15px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
        🧾 FACTURA: ${factura.IdFactura} <span style="font-size: 0.6em; color: #64748b; float: right; margin-top: 5px;">[${tipo}]</span>
      </h3>
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; color: #334155;">
        <div>
          <div style="margin-bottom: 4px;"><strong>Contrato:</strong> ${factura.IdContrato}</div>
          <div><strong>Cliente:</strong> ${cliente}</div>
        </div>
        <div style="text-align: right;">
          <div style="margin-bottom: 4px;"><strong>Fecha:</strong> ${factura.FechaEmision.toLocaleDateString()}</div>
          <div><strong>Vehículo:</strong> ${vehiculo.Placa} (${vehiculo.TipoVehiculo})</div>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 12px; border-radius: 4px; margin: 15px 0; border: 1px solid #e2e8f0;">
        <strong style="color: #1e293b; display: block; margin-bottom: 8px;">Detalle de Equipos Alquilados (${factura.TotalEquipos} en total):</strong>
        ${detalleEquiposHTML}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
        <div>
          <div style="color: #64748b; font-size: 0.9em;">Período: 3 días de alquiler</div>
        </div>
        <div style="font-size: 1.3em; color: #1e293b;">
          <strong>TOTAL A PAGAR: <span style="color: #d97706;">$${factura.TotalPagar}</span></strong>
        </div>
      </div>
    </div>
  `;
}

// Arranque inicial
registrarLog(
  "Sistema de facturación y control de inventario inicializado.",
  "info",
);
renderizarTabla();
