import { z } from 'zod';

export const LayerSchema = z.object({
  n: z.string(),
  t: z.string(),
  u: z.number().optional(),
  desc: z.string().optional(),
});

export const ModelSchema = z.object({
  key: z.string(),
  icon: z.string(),
  label: z.string(),
  name: z.string(),
  cat: z.string(),
  sub: z.string(),
  fw: z.array(z.string()),
  params: z.string(),
  year: z.number(),
  desc: z.string(),
  layers: z.array(LayerSchema).optional(),
  use_cases: z.array(z.string()),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  viz: z.string().optional(),
  paper_url: z.string().optional(),
});

export type Model = z.infer<typeof ModelSchema>;
export type Layer = z.infer<typeof LayerSchema>;
