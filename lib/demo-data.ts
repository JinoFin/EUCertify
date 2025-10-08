export const demoProducts = [
  {
    id: 'prod-demo-1',
    name: 'Bluetooth Speaker X',
    model: 'SPK-100',
    status: 'REVIEW',
    acts: ['RED_2014_53_EU', 'ROHS_2011_65_EU', 'WEEE_2012_19_EU', 'BATTERY_2023_1542', 'GPSR_2023_988'],
    updatedAt: '2024-03-01'
  },
  {
    id: 'prod-demo-2',
    name: 'LED Work Lamp',
    model: 'LMP-220',
    status: 'DRAFT',
    acts: ['LVD_2014_35_EU', 'EMC_2014_30_EU', 'ROHS_2011_65_EU', 'WEEE_2012_19_EU', 'GPSR_2023_988'],
    updatedAt: '2024-02-14'
  }
];

export type DemoProduct = (typeof demoProducts)[number];
