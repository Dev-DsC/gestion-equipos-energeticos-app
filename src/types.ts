// types.ts

export type EstadoVehiculo = 'Disponible' | 'En uso';
export type TipoVehiculo = 'Camión' | 'Furgón' | 'Plataforma';

export interface Vehiculo {
  IdVehiculo: string;
  Placa: string;
  CapacidadMaximaKg: number;
  CapacidadVolumenM3: number;
  TipoVehiculo: TipoVehiculo;
  Estado: EstadoVehiculo;
}

export type TipoEquipo = 'Generador' | 'UPS' | 'Transformador' | 'Banco de baterías';
export type EstadoEquipo = 'Disponible' | 'Reservado' | 'Alquilado';

export interface Equipo {
  IdEquipo: string;
  Nombre: string;
  Tipo: TipoEquipo;
  PesoKg: number;
  VolumenM3: number;
  PotenciaKW: number;
  CostoAlquilerDiario: number;
  Estado: EstadoEquipo;
}