import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

type Metric = { name: string; value: number; id: string; delta: number };
type ReportHandler = (metric: Metric) => void;

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onINP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
};

export default reportWebVitals;
