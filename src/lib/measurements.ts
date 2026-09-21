export type MetricGroup =
  | "Superiores e Tronco"
  | "Região Central"
  | "Membros Inferiores"
  | "Composição Corporal";

export type Metric = {
  id: string;
  label: string;
  unit: string;
  group: MetricGroup;
  hint: string;
  decimals: number;
};

export const METRICS: Metric[] = [
  {
    id: "pescoco",
    label: "Pescoço",
    unit: "cm",
    group: "Superiores e Tronco",
    hint: "Fita logo abaixo do pomo de Adão (gogó).",
    decimals: 1,
  },
  {
    id: "ombros",
    label: "Ombros",
    unit: "cm",
    group: "Superiores e Tronco",
    hint: "Parte mais larga dos ombros, braços relaxados ao lado do corpo.",
    decimals: 1,
  },
  {
    id: "torax",
    label: "Tórax",
    unit: "cm",
    group: "Superiores e Tronco",
    hint: "Altura dos mamilos (ou logo abaixo das axilas), respiração normal.",
    decimals: 1,
  },
  {
    id: "braco_relaxado",
    label: "Braço relaxado",
    unit: "cm",
    group: "Superiores e Tronco",
    hint: "Meio do bíceps, braço solto e estendido ao longo do corpo.",
    decimals: 1,
  },
  {
    id: "braco_contraido",
    label: "Braço contraído",
    unit: "cm",
    group: "Superiores e Tronco",
    hint: "Cotovelo a 90°, força no músculo, ponto mais alto.",
    decimals: 1,
  },
  {
    id: "antebraco",
    label: "Antebraço",
    unit: "cm",
    group: "Superiores e Tronco",
    hint: "Maior circunferência abaixo do cotovelo, mão aberta.",
    decimals: 1,
  },
  {
    id: "cintura",
    label: "Cintura",
    unit: "cm",
    group: "Região Central",
    hint: "Menor circunferência do tronco, 2 a 3 dedos acima do umbigo.",
    decimals: 1,
  },
  {
    id: "abdomen",
    label: "Abdômen",
    unit: "cm",
    group: "Região Central",
    hint: "Exatamente sobre a linha do umbigo.",
    decimals: 1,
  },
  {
    id: "quadril",
    label: "Quadril",
    unit: "cm",
    group: "Região Central",
    hint: "Pés juntos, maior contorno dos glúteos.",
    decimals: 1,
  },
  {
    id: "coxa_proximal",
    label: "Coxa proximal",
    unit: "cm",
    group: "Membros Inferiores",
    hint: "Topo da coxa, logo abaixo da linha do glúteo.",
    decimals: 1,
  },
  {
    id: "coxa_medial",
    label: "Coxa medial",
    unit: "cm",
    group: "Membros Inferiores",
    hint: "Metade da distância entre a virilha e o joelho.",
    decimals: 1,
  },
  {
    id: "panturrilha",
    label: "Panturrilha",
    unit: "cm",
    group: "Membros Inferiores",
    hint: "Parte mais volumosa da batata da perna.",
    decimals: 1,
  },
  {
    id: "peso",
    label: "Peso",
    unit: "kg",
    group: "Composição Corporal",
    hint: "Peso corporal total.",
    decimals: 2,
  },
  {
    id: "gordura_pct",
    label: "Gordura corporal",
    unit: "%",
    group: "Composição Corporal",
    hint: "Percentual de gordura corporal.",
    decimals: 1,
  },
  {
    id: "imc",
    label: "IMC",
    unit: "",
    group: "Composição Corporal",
    hint: "Índice de massa corporal.",
    decimals: 1,
  },
  {
    id: "peso_gordura",
    label: "Peso da gordura",
    unit: "kg",
    group: "Composição Corporal",
    hint: "Massa de gordura em quilos.",
    decimals: 2,
  },
  {
    id: "massa_muscular_pct",
    label: "Massa muscular esquelética",
    unit: "%",
    group: "Composição Corporal",
    hint: "Percentual de massa muscular esquelética.",
    decimals: 1,
  },
  {
    id: "gordura_visceral",
    label: "Gordura visceral",
    unit: "nível",
    group: "Composição Corporal",
    hint: "Nível de gordura visceral.",
    decimals: 0,
  },
];

export const METRIC_GROUPS: MetricGroup[] = [
  "Superiores e Tronco",
  "Região Central",
  "Membros Inferiores",
  "Composição Corporal",
];

export const getMetric = (id: string): Metric | undefined =>
  METRICS.find((m) => m.id === id);

export function formatValue(value: number | undefined, metric: Metric) {
  if (value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: metric.decimals,
    maximumFractionDigits: metric.decimals,
  });
}

export function formatDelta(delta: number, metric: Metric) {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${Math.abs(delta).toLocaleString("pt-BR", {
    minimumFractionDigits: metric.decimals,
    maximumFractionDigits: metric.decimals,
  })}`;
}

export const MEASURING_RULES = [
  {
    title: "Tensão da fita",
    text: "A fita deve abraçar a pele sem folgas, mas nunca apertar ou afundar na gordura ou músculo.",
  },
  {
    title: "Alinhamento",
    text: "Mantenha a fita reta e paralela ao chão em toda a volta. Um espelho ajuda a conferir as costas.",
  },
  {
    title: "Postura",
    text: "Fique ereto, pés afastados na largura dos ombros e peso distribuído igualmente nas duas pernas.",
  },
];
