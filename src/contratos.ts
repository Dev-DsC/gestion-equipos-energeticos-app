// contratos.ts
import  type { Equipo } from './types';

export interface Contrato {
  IdContrato: string;
  Cliente: string;
  UbicacionProyecto: string;
  FechaInicio: Date;
  FechaFin: Date;
  Equipos: Equipo[];
}

export const agregarEquipoAContrato = (contrato: Contrato, equipo: Equipo): boolean => {
  if (equipo.Estado === 'Alquilado') {
    console.warn(`Operación denegada, señor. El equipo ${equipo.Nombre} ya se encuentra alquilado.`);
    return false;
  }
  
  // Regla de negocio: Pasa a Reservado
  equipo.Estado = 'Reservado';
  contrato.Equipos.push(equipo);
  
  return true;
};