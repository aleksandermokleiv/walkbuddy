export interface Gym {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  disciplines: string[]
  website?: string
}

export const GYMS: Gym[] = [
  {
    id: 'klatreverket-nydalen',
    name: 'Klatreverket Nydalen',
    address: 'Nydalsveien 33, 0484 Oslo',
    lat: 59.9455,
    lng: 10.7578,
    disciplines: ['sport', 'bouldering', 'top-rope'],
    website: 'https://klatreverket.no',
  },
  {
    id: 'klatreverket-sorenga',
    name: 'Klatreverket Sørenga',
    address: 'Sørengutstikkeren 4, 0194 Oslo',
    lat: 59.9025,
    lng: 10.7563,
    disciplines: ['sport', 'bouldering', 'top-rope'],
    website: 'https://klatreverket.no',
  },
  {
    id: 'oslo-klatresenter',
    name: 'Oslo Klatresenter',
    address: 'Sandakerveien 74, 0484 Oslo',
    lat: 59.9380,
    lng: 10.7520,
    disciplines: ['sport', 'bouldering', 'top-rope', 'trad'],
    website: 'https://klatresenter.no',
  },
  {
    id: 'klatreverket-grorud',
    name: 'Klatreverket Grorud',
    address: 'Rodroveien 3, 0953 Oslo',
    lat: 59.9620,
    lng: 10.8530,
    disciplines: ['bouldering', 'sport'],
    website: 'https://klatreverket.no',
  },
  {
    id: 'bergsprekken',
    name: 'Bergsprekken',
    address: 'Thereses gate 32, 0354 Oslo',
    lat: 59.9255,
    lng: 10.7240,
    disciplines: ['bouldering'],
    website: 'https://bergsprekken.no',
  },
  {
    id: 'klatrehuset-stavanger',
    name: 'Klatrehuset Stavanger',
    address: 'Lagårdsveien 78, 4010 Stavanger',
    lat: 58.9700,
    lng: 5.7331,
    disciplines: ['sport', 'bouldering', 'top-rope'],
  },
  {
    id: 'bratte-rogaland',
    name: 'Bratte Rogaland',
    address: 'Tjensvollveien 1, 4021 Stavanger',
    lat: 58.9588,
    lng: 5.7220,
    disciplines: ['bouldering', 'sport'],
  },
]
