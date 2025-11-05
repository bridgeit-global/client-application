import type { Option } from '../components/ui/multiple-selector';

export const SURCHARGE_OPTIONS: Option[] = [
  {
    label: 'Late Payment Surcharge',
    value: 'lpsc',
  },
  {
    label: 'TOD Surcharge',
    value: 'tod_surcharge',
  },
  {
    label: 'Low PF Surcharge',
    value: 'low_pf_surcharge',
  },
  {
    label: 'Sanctioned Load Penalty',
    value: 'sanctioned_load_penalty',
  },
  {
    label: 'Power Factor Penalty',
    value: 'power_factor_penalty',
  },
  {
    label: 'Capacitor Surcharge',
    value: 'capacitor_surcharge',
  },
  {
    label: 'Misuse Surcharge',
    value: 'misuse_surcharge',
  },

]; 