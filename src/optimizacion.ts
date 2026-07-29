// optimizacion.ts
import type { Equipo} from './types';
import type{ Contrato } from './contratos';
export interface Factura {
  IdFactura: string;
  IdContrato: string;
  FechaEmision: Date;
  TotalEquipos: number;
  TotalPotencia: number;
  TotalPagar: number;
}

export const optimizarTransporte = (
  equiposDisponibles: Equipo[],
  pesoMaximo: number,
  volumenMaximo: number
): Equipo[] => {
  // Escala para manejar decimales en el volumen (ej. 3.5m3 -> 35)
  const factorEscala = 10; 
  const W = Math.floor(pesoMaximo);
  const V = Math.floor(volumenMaximo * factorEscala);
  const n = equiposDisponibles.length;

  // Caché de memoización para optimizar el procesamiento
  const memo: Record<string, { maxPotencia: number; seleccionados: Equipo[] }> = {};

  const knapsack = (index: number, pesoActual: number, volumenActual: number): { maxPotencia: number; seleccionados: Equipo[] } => {
    if (index === n) return { maxPotencia: 0, seleccionados: [] };
    
    const key = `${index}-${pesoActual}-${volumenActual}`;
    if (memo[key]) return memo[key];

    const equipo = equiposDisponibles[index];
    const volumenItem = Math.round(equipo.VolumenM3 * factorEscala);
    
    // Ruta A: Excluir el equipo actual
    const sinIncluir = knapsack(index + 1, pesoActual, volumenActual);

    // Ruta B: Incluir el equipo actual (si las restricciones de transporte lo permiten)
    let conIncluir = { maxPotencia: -1, seleccionados: [] as Equipo[] };
    
    if (pesoActual + equipo.PesoKg <= W && volumenActual + volumenItem <= V) {
      const res = knapsack(index + 1, pesoActual + equipo.PesoKg, volumenActual + volumenItem);
      conIncluir = {
        maxPotencia: res.maxPotencia + equipo.PotenciaKW,
        seleccionados: [equipo, ...res.seleccionados]
      };
    }

    // Almacenamos la decisión que brinde mayor potencia en la caché
    memo[key] = sinIncluir.maxPotencia > conIncluir.maxPotencia ? sinIncluir : conIncluir;
    return memo[key];
  };

  return knapsack(0, 0, 0).seleccionados;
};

export const generarFactura = (contrato: Contrato, equiposOptimizados: Equipo[], diasAlquiler: number): Factura => {
  const totalPotencia = equiposOptimizados.reduce((sum, eq) => sum + eq.PotenciaKW, 0);
  const totalPagar = equiposOptimizados.reduce((sum, eq) => sum + (eq.CostoAlquilerDiario * diasAlquiler), 0);

  return {
    IdFactura: `FAC-${Math.floor(Math.random() * 10000)}`,
    IdContrato: contrato.IdContrato,
    FechaEmision: new Date(),
    TotalEquipos: equiposOptimizados.length,
    TotalPotencia: totalPotencia,
    TotalPagar: totalPagar
  };
};