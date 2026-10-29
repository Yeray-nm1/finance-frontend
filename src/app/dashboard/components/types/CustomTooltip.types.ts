export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percentage: number } }>;
}
