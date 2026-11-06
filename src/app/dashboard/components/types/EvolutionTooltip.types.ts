export interface EvolutionTooltipEntry {
  name?: string;
  value?: number;
  color?: string;
}

export interface EvolutionTooltipProps {
  active?: boolean;
  label?: string;
  payload?: EvolutionTooltipEntry[];
}
